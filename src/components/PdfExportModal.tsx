"use client";

import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "@/lib/toast";
import {
  loadBanglaFontBase64,
  BANGLA_FONT_NAME,
  BANGLA_FONT_FILE,
} from "@/lib/pdfFonts";

export interface PdfColumn {
  key: string;
  label: string;
  /** Optional formatter — receives the row, returns string */
  format?: (row: Record<string, unknown>) => string;
}

/**
 * Manual Bangla pre-shaper for jsPDF (which doesn't do Indic script shaping).
 *
 * Browsers apply OpenType GSUB rules to reorder vowel signs around
 * consonants; jsPDF doesn't. We pre-shape the source so jsPDF emits glyphs
 * in visual order. The active jsPDF font must already be set.
 *
 * Steps:
 *   1. Normalize decomposed nukta forms to precomposed
 *        য + ় (U+09AF U+09BC) → য় (U+09DF)
 *        ড + ় (U+09A1 U+09BC) → ড় (U+09DC)
 *        ঢ + ় (U+09A2 U+09BC) → ঢ় (U+09DD)
 *   2. Split combined vowels (parts on both sides of consonant):
 *        ো (U+09CB) → ে + cluster + া
 *        ৌ (U+09CC) → ে + cluster + ৗ (U+09D7)
 *   3. Move left-side vowel signs (ি, ে, ৈ) BEFORE the consonant cluster
 *
 * Conjunct-aware: matches (consonant + virama)* + consonant + vowel.
 */
function shapeBangla(text: string): string {
  // Step 1: precompose nuktas
  let result = text
    .replace(/য়/g, "য়")
    .replace(/ড়/g, "ড়")
    .replace(/ঢ়/g, "ঢ়");

  // Step 2: split ো and ৌ into their visual parts
  result = result.replace(
    /((?:[ক-হড়-য়]্)*[ক-হড়-য়])ো/g,
    "ে$1া"
  );
  result = result.replace(
    /((?:[ক-হড়-য়]্)*[ক-হড়-য়])ৌ/g,
    "ে$1ৗ"
  );

  // Step 3: move left-side vowel signs before the cluster
  result = result.replace(
    /((?:[ক-হড়-য়]্)*[ক-হড়-য়])([িেৈ])/g,
    "$2$1"
  );

  return result;
}

/**
 * jsPDF + Noto Sans Bengali ignores Zero-Width Non-Joiner (ZWNJ, U+200C)
 * during text shaping, so "মাদ্‌রাসা" renders as the conjunct "মাদ্রাসা".
 * Workaround: split at ZWNJ, render each segment with a tiny gap.
 * Also pre-shapes each segment for left-side vowel signs.
 */
function renderBanglaWithZwnj(
  doc: jsPDF,
  text: string,
  centerX: number,
  y: number
): void {
  const ZWNJ = "‌";
  const shaped = shapeBangla(text);
  if (!shaped.includes(ZWNJ)) {
    doc.text(shaped, centerX, y, { align: "center" });
    return;
  }
  const parts = shaped.split(ZWNJ);
  const gap = 0.4;
  const widths = parts.map((p) => doc.getTextWidth(p));
  const totalWidth = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  let x = centerX - totalWidth / 2;
  for (let i = 0; i < parts.length; i++) {
    doc.text(parts[i], x, y, { align: "left" });
    x += widths[i] + gap;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** English title shown in the PDF header */
  title: string;
  /** Optional Bangla version of the title — rendered above the English one */
  titleBn?: string;
  subtitle?: string;
  schoolNameEn?: string;
  schoolNameBn?: string;
  data: Record<string, unknown>[];
  columns: PdfColumn[];
  defaultSelected: string[];
  maxColumns?: number;
  minColumns?: number;
  filename: string;
}

export default function PdfExportModal({
  open,
  onClose,
  title,
  titleBn,
  subtitle,
  schoolNameEn = "Jamiya Darul Ulum Nuria Madrasa & Atimkhana",
  // Bangla notes for PDF rendering:
  //   - Use precomposed য় (U+09DF) instead of য + ় (U+09AF + U+09BC)
  //     because jsPDF/Noto Sans Bengali doesn't always combine the nukta.
  //   - ‌ between দ্ and র is ZWNJ (U+200C) — handled by renderBanglaWithZwnj().
  schoolNameBn = "জামিয়া দারুল উলুম নুরিয়া মাদ্‌রাসা ও এতিমখানা",
  data,
  columns,
  defaultSelected,
  maxColumns = 8,
  minColumns = 1,
  filename,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelected)
  );
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) setSelected(new Set(defaultSelected));
  }, [open, defaultSelected]);

  const totalSelected = selected.size;
  const reachedLimit = totalSelected >= maxColumns;

  const finalColumns = useMemo(
    () => columns.filter((c) => selected.has(c.key)),
    [columns, selected]
  );

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < maxColumns) next.add(key);
      return next;
    });
  };

  const valueOf = (row: Record<string, unknown>, col: PdfColumn) => {
    let raw: string;
    if (col.format) raw = col.format(row);
    else {
      const v = row[col.key];
      if (v === null || v === undefined) raw = "—";
      else if (v instanceof Date) raw = v.toLocaleDateString("en-GB");
      else raw = String(v);
    }
    // Pre-shape any Bangla content for jsPDF
    return shapeBangla(raw);
  };

  const generatePdf = async () => {
    if (data.length === 0) {
      toast.warning("No data", "There is nothing to export.");
      return;
    }
    if (finalColumns.length < minColumns) {
      toast.warning(
        "Pick at least one column",
        `Select at least ${minColumns} column to generate a PDF.`
      );
      return;
    }

    setGenerating(true);

    try {
      const orientation = finalColumns.length > 5 ? "landscape" : "portrait";
      const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

      // Register Bangla font once per document
      const fontBase64 = await loadBanglaFontBase64();
      doc.addFileToVFS(BANGLA_FONT_FILE, fontBase64);
      doc.addFont(BANGLA_FONT_FILE, BANGLA_FONT_NAME, "normal");

      const pageWidth = doc.internal.pageSize.getWidth();

      // === PROFESSIONAL HEADER ===

      // Top decorative bar
      doc.setFillColor(37, 99, 235); // blue-600
      doc.rect(0, 0, pageWidth, 6, "F");

      // Generated date — top-right with proper padding
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(
        `Generated: ${new Date().toLocaleString("en-GB")}`,
        pageWidth - 40,
        30,
        { align: "right" }
      );

      // Madrasa name (Bangla — top, prominent)
      // Workaround: jsPDF/Noto Sans Bengali ignores ZWNJ during shaping,
      // so we split the string at the ZWNJ char and render two centered runs
      // to force the visual split between দ্ and র.
      doc.setFont(BANGLA_FONT_NAME, "normal");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      renderBanglaWithZwnj(doc, schoolNameBn, pageWidth / 2, 50);

      // Madrasa name (English transliteration — smaller)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(schoolNameEn, pageWidth / 2, 68, { align: "center" });

      // Decorative divider line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.7);
      doc.line(80, 80, pageWidth - 80, 80);

      // Page title — English
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(title, pageWidth / 2, 100, { align: "center" });

      // Page title — Bangla (optional)
      let nextY = 100;
      if (titleBn) {
        doc.setFont(BANGLA_FONT_NAME, "normal");
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(shapeBangla(titleBn), pageWidth / 2, nextY + 16, { align: "center" });
        nextY += 16;
      }

      // Subtitle
      if (subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 130, 145);
        doc.text(subtitle, pageWidth / 2, nextY + 14, { align: "center" });
        nextY += 14;
      }

      // === TABLE ===
      autoTable(doc, {
        startY: nextY + 22,
        head: [finalColumns.map((c) => c.label)],
        body: data.map((row) => finalColumns.map((c) => valueOf(row, c))),
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [220, 220, 220],
          lineWidth: 0.3,
          font: BANGLA_FONT_NAME, // use Bangla-capable font (also handles Latin)
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "normal",
          fontSize: 10,
          font: BANGLA_FONT_NAME,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { top: 130, right: 30, bottom: 40, left: 30 },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          const currentPage = data.pageNumber;
          const pageHeight = doc.internal.pageSize.getHeight();

          // Footer divider
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.4);
          doc.line(30, pageHeight - 28, pageWidth - 30, pageHeight - 28);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(140);
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth - 30,
            pageHeight - 16,
            { align: "right" }
          );
          doc.text(
            `Total rows: ${data.table.body.length}`,
            30,
            pageHeight - 16
          );
          doc.text(
            schoolNameEn,
            pageWidth / 2,
            pageHeight - 16,
            { align: "center" }
          );
        },
      });

      doc.save(`${filename}.pdf`);
      toast.success("PDF generated", `${data.length} rows exported.`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        "PDF generation failed",
        "Could not generate the PDF. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const resetToDefaults = () => {
    setSelected(new Set(defaultSelected));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4a4 4 0 014 4v2M7 7h10M7 11h4m6 6v-2m0 2h2m-2 0h-2M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export to PDF
            </h2>
            <p className="text-blue-100 text-sm mt-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Choose Columns
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click to add · Click X to remove
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">
                  <span
                    className={`font-bold ${reachedLimit ? "text-amber-600" : "text-slate-700"}`}
                  >
                    {totalSelected}
                  </span>{" "}
                  / {maxColumns} selected
                </p>
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset to defaults
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {columns.map((c) => {
                const isChecked = selected.has(c.key);
                const disabled = !isChecked && reachedLimit;
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => !disabled && toggle(c.key)}
                    disabled={disabled}
                    className={`relative group flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all text-left ${
                      isChecked
                        ? "bg-blue-50 border-blue-400 text-blue-800 shadow-sm"
                        : disabled
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 cursor-pointer"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? "bg-blue-600 text-white"
                          : disabled
                            ? "border border-slate-300"
                            : "border border-slate-300 group-hover:border-blue-400"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="font-medium truncate flex-1">{c.label}</span>

                    {isChecked && (
                      <span
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-200 hover:bg-red-500 hover:text-white text-blue-700 flex items-center justify-center transition-colors"
                        title="Remove this column"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {reachedLimit && (
              <p className="text-xs text-amber-600 mt-2">
                Maximum {maxColumns} columns reached. Remove one to pick another.
              </p>
            )}
          </div>

          {/* Preview info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Preview
                </p>
                <p className="text-slate-700 mt-0.5">
                  <span className="font-bold">{finalColumns.length}</span>{" "}
                  column{finalColumns.length !== 1 ? "s" : ""} ·{" "}
                  <span className="font-bold">{data.length}</span> row
                  {data.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-500">
                {finalColumns.length > 5 ? "Landscape" : "Portrait"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generatePdf}
            disabled={
              data.length === 0 ||
              finalColumns.length < minColumns ||
              generating
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
