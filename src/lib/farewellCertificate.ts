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
  // Madrasa name — Bangla (prominent, maroon)
  doc.setFont(BANGLA_FONT_NAME, "normal");
  doc.setFontSize(24);
  doc.setTextColor(MAROON.r, MAROON.g, MAROON.b);
  renderBanglaWithZwnj(doc, o.schoolNameBn, cx, 66);

  // Madrasa name — English
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(o.schoolNameEn, cx, 84, { align: "center" });

  // Address + contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(o.addressLine, cx, 99, { align: "center" });
  doc.text(o.contactLine, cx, 112, { align: "center" });

  // Header divider
  doc.setDrawColor(GREEN_LIGHT.r, GREEN_LIGHT.g, GREEN_LIGHT.b);
  doc.setLineWidth(1);
  doc.line(70, 122, w - 70, 122);

  // === Title ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  doc.text("CERTIFICATE", cx, 168, { align: "center" });
  // Small flourish under title
  doc.setDrawColor(GREEN.r, GREEN.g, GREEN.b);
  doc.setLineWidth(1.2);
  doc.line(cx - 70, 178, cx + 70, 178);

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
  doc.text(
    `for successfully completing the final class ${student.classNameEn} (Roll ${student.roll})`,
    cx,
    y,
    { align: "center" }
  );
  y += 20;
  doc.text(
    `in the session ${student.session} with the highest marks.`,
    cx,
    y,
    { align: "center" }
  );

  // Class name — Bangla accent
  y += 22;
  doc.setFont(BANGLA_FONT_NAME, "normal");
  doc.setFontSize(13);
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  renderBanglaWithZwnj(doc, `সমাপ্ত শ্রেণি: ${student.classNameBn}`, cx, y);

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
