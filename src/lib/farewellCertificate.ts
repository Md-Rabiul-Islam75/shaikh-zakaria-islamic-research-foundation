"use client";

import jsPDF from "jspdf";
import {
  renderBanglaWithZwnj,
  registerBanglaFont,
  BANGLA_FONT_NAME,
} from "@/lib/banglaPdf";

export interface CertificateStudent {
  studentNameEn: string;
  studentNameBn?: string | null;
  fatherName: string;
  roll: number;
  classNameEn: string;
  classNameBn: string;
  session: number;
}

export interface CertificateOptions {
  schoolNameEn?: string;
  schoolNameBn?: string;
  addressLine?: string;
  contactLine?: string;
  filename?: string;
}

const DEFAULT_SCHOOL_EN = "Shaikh Zakaria Islamic Research Center";
const DEFAULT_SCHOOL_BN = "শায়খ যাকারিয়া ইসলামিক রিসার্চ সেন্টার";
const DEFAULT_ADDRESS = "Madhya Badda, Dhaka-1212, Bangladesh";
const DEFAULT_CONTACT = "Mobile: +880 1XXX-XXXXXX";

// Palette — inspired by the classic green madrasa certificate style
const GREEN = { r: 21, g: 128, b: 61 }; // green-700
const GREEN_LIGHT = { r: 187, g: 222, b: 197 }; // soft green
const MAROON = { r: 153, g: 27, b: 27 }; // red-800 (madrasa name)
const INK = { r: 30, g: 41, b: 59 }; // slate-800
const MUTED = { r: 100, g: 116, b: 139 }; // slate-500

/** Ornamental double border with small corner diamonds. */
function drawBorder(doc: jsPDF, w: number, h: number): void {
  // Outer thick green frame
  doc.setDrawColor(GREEN.r, GREEN.g, GREEN.b);
  doc.setLineWidth(3);
  doc.rect(18, 18, w - 36, h - 36);
  // Inner thin frame
  doc.setLineWidth(0.8);
  doc.rect(28, 28, w - 56, h - 56);

  // Corner diamonds
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  const corners: [number, number][] = [
    [28, 28],
    [w - 28, 28],
    [28, h - 28],
    [w - 28, h - 28],
  ];
  const s = 5;
  for (const [cxp, cyp] of corners) {
    doc.triangle(cxp - s, cyp, cxp, cyp - s, cxp + s, cyp, "F");
    doc.triangle(cxp - s, cyp, cxp, cyp + s, cxp + s, cyp, "F");
  }
}

/** A dotted fill line (like the "awarded to" underscores in the template). */
function dottedLine(doc: jsPDF, x1: number, x2: number, y: number): void {
  doc.setDrawColor(GREEN.r, GREEN.g, GREEN.b);
  doc.setLineWidth(0.6);
  doc.setLineDashPattern([1.5, 2], 0);
  doc.line(x1, y, x2, y);
  doc.setLineDashPattern([], 0);
}

/** Draw a single farewell certificate onto the current page of `doc`. */
function drawCertificatePage(
  doc: jsPDF,
  student: CertificateStudent,
  o: Required<Pick<CertificateOptions, "schoolNameEn" | "schoolNameBn" | "addressLine" | "contactLine">>
): void {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  drawBorder(doc, w, h);

  // === Header ===
  // Madrasa name — English only. jsPDF + Noto Sans Bengali can't reliably
  // shape the conjuncts in the Bangla org name (রিসার্চ / সেন্টার), so the
  // heading uses the English name to avoid broken glyphs.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(MAROON.r, MAROON.g, MAROON.b);
  doc.text(o.schoolNameEn, cx, 74, { align: "center" });

  // Address + contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(o.addressLine, cx, 96, { align: "center" });
  doc.text(o.contactLine, cx, 109, { align: "center" });

  // Header divider
  doc.setDrawColor(GREEN_LIGHT.r, GREEN_LIGHT.g, GREEN_LIGHT.b);
  doc.setLineWidth(1);
  doc.line(70, 122, w - 70, 122);

  // === Title ===
  // Elegant serif bold-italic (jsPDF has no script font). Green + bold kept,
  // with a soft shadow for depth so it reads as a gorgeous formal title.
  doc.setFont("times", "bolditalic");
  doc.setFontSize(46);
  doc.setTextColor(198, 220, 205); // faint green shadow
  doc.text("Certificate", cx + 1.4, 171.4, { align: "center" });
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  doc.text("Certificate", cx, 170, { align: "center" });

  // Decorative flourish under the title: line — diamond — line
  doc.setDrawColor(GREEN.r, GREEN.g, GREEN.b);
  doc.setLineWidth(1);
  doc.line(cx - 95, 184, cx - 12, 184);
  doc.line(cx + 12, 184, cx + 95, 184);
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.triangle(cx - 6, 184, cx, 179.5, cx + 6, 184, "F");
  doc.triangle(cx - 6, 184, cx, 188.5, cx + 6, 184, "F");
  // Small end dots on the flourish
  doc.circle(cx - 95, 184, 1.6, "F");
  doc.circle(cx + 95, 184, 1.6, "F");

  // Subtitle — Bangla
  doc.setFont(BANGLA_FONT_NAME, "normal");
  doc.setFontSize(13);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  renderBanglaWithZwnj(doc, "বিদায় সনদ", cx, 198);

  // === Body ===
  doc.setFont("helvetica", "italic");
  doc.setFontSize(12.5);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text("This certificate is proudly awarded to", cx, 232, {
    align: "center",
  });

  // Awarded name — Bangla (if any) then English, over a dotted line
  let y = 262;
  if (student.studentNameBn) {
    doc.setFont(BANGLA_FONT_NAME, "normal");
    doc.setFontSize(20);
    doc.setTextColor(MAROON.r, MAROON.g, MAROON.b);
    renderBanglaWithZwnj(doc, student.studentNameBn, cx, y);
    y += 26;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(student.studentNameEn, cx, y, { align: "center" });
  dottedLine(doc, cx - 200, cx + 200, y + 8);
  y += 34;

  // Citation
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(
    `son / daughter of ${student.fatherName},`,
    cx,
    y,
    { align: "center" }
  );
  y += 20;
  // Class name + roll rendered in bold (rest of the line normal), kept
  // centered by measuring each segment and drawing them left-to-right.
  const prefix = "for successfully completing the final class ";
  const highlight = `${student.classNameEn} (Roll ${student.roll})`;
  doc.setFont("helvetica", "normal");
  const wPrefix = doc.getTextWidth(prefix);
  doc.setFont("helvetica", "bold");
  const wHighlight = doc.getTextWidth(highlight);
  let lx = cx - (wPrefix + wHighlight) / 2;
  doc.setFont("helvetica", "normal");
  doc.text(prefix, lx, y);
  lx += wPrefix;
  doc.setFont("helvetica", "bold");
  doc.text(highlight, lx, y);
  y += 20;
  // Reset to normal so only the class + roll stay bold.
  doc.setFont("helvetica", "normal");
  doc.text(
    `of this institution in the session ${student.session}.`,
    cx,
    y,
    { align: "center" }
  );

  // Well-wishing line
  y += 26;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(12);
  doc.setTextColor(MAROON.r, MAROON.g, MAROON.b);
  doc.text(
    "May your future life be filled with beauty and success.",
    cx,
    y,
    { align: "center" }
  );

  // === Footer: seal (left) + signature (right) ===
  const baseY = h - 70;

  // Seal — concentric circles with a star
  const sealX = 110;
  const sealY = baseY - 6;
  doc.setDrawColor(GREEN.r, GREEN.g, GREEN.b);
  doc.setLineWidth(1.4);
  doc.circle(sealX, sealY, 26);
  doc.setLineWidth(0.7);
  doc.circle(sealX, sealY, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  doc.text("OFFICIAL", sealX, sealY - 2, { align: "center" });
  doc.text("SEAL", sealX, sealY + 7, { align: "center" });

  // Signature line
  const sigRight = w - 80;
  const sigLeft = w - 240;
  doc.setDrawColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setLineWidth(0.6);
  doc.line(sigLeft, baseY, sigRight, baseY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Signature", (sigLeft + sigRight) / 2, baseY + 15, {
    align: "center",
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text("Principal / Muhtamim", (sigLeft + sigRight) / 2, baseY + 29, {
    align: "center",
  });
}

/**
 * Generate farewell certificates (one page per student) and trigger a
 * download. Text-only, styled after the classic green madrasa certificate.
 */
export async function generateFarewellCertificates(
  students: CertificateStudent[],
  options: CertificateOptions = {}
): Promise<void> {
  if (students.length === 0) return;

  const resolved = {
    schoolNameEn: options.schoolNameEn ?? DEFAULT_SCHOOL_EN,
    schoolNameBn: options.schoolNameBn ?? DEFAULT_SCHOOL_BN,
    addressLine: options.addressLine ?? DEFAULT_ADDRESS,
    contactLine: options.contactLine ?? DEFAULT_CONTACT,
  };

  // Landscape A4 to match the wide certificate layout
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  await registerBanglaFont(doc);

  students.forEach((student, i) => {
    if (i > 0) doc.addPage();
    drawCertificatePage(doc, student, resolved);
  });

  const filename =
    options.filename ??
    (students.length === 1
      ? `farewell_${students[0].studentNameEn.replace(/\s+/g, "_")}`
      : "farewell_certificates");
  doc.save(`${filename}.pdf`);
}
