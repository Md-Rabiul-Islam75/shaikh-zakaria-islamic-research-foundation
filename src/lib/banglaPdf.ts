"use client";

import type jsPDF from "jspdf";
import {
  loadBanglaFontBase64,
  BANGLA_FONT_NAME,
  BANGLA_FONT_FILE,
} from "@/lib/pdfFonts";

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
export function shapeBangla(text: string): string {
  // Bengali consonant class (includes precomposed nukta letters ড়/ঢ়/য়) and
  // the virama. Written with \u escapes so the source can't be normalized into
  // decomposed nukta sequences (which would break the character ranges).
  const C = "[\\u0995-\\u09B9\\u09DC\\u09DD\\u09DF]"; // consonants
  const V = "\\u09CD"; // virama (hasant)
  const cluster = `(?:${C}${V})*${C}`;

  // Step 1: precompose decomposed nuktas → single code points
  //   য + ় → য় (U+09DF), ড + ় → ড় (U+09DC), ঢ + ় → ঢ় (U+09DD)
  let result = text
    .replace(/য়/g, "য়")
    .replace(/ড়/g, "ড়")
    .replace(/ঢ়/g, "ঢ়");

  // Step 2: split ো (U+09CB) and ৌ (U+09CC) into their visual parts
  //   ো → ে + cluster + া (U+09BE)
  //   ৌ → ে + cluster + ৗ (U+09D7)
  result = result.replace(
    new RegExp(`(${cluster})\\u09CB`, "g"),
    "ে$1া"
  );
  result = result.replace(
    new RegExp(`(${cluster})\\u09CC`, "g"),
    "ে$1ৗ"
  );

  // Step 3: move left-side vowel signs (ি ে ৈ) before the consonant cluster
  result = result.replace(
    new RegExp(`(${cluster})([\\u09BF\\u09C7\\u09C8])`, "g"),
    "$2$1"
  );

  return result;
}

/**
 * Render a Bangla string centered at (centerX, y).
 *
 * jsPDF + Noto Sans Bengali ignores Zero-Width Non-Joiner (ZWNJ, U+200C)
 * during text shaping, so "মাদ্‌রাসা" renders as the conjunct "মাদ্রাসা".
 * Workaround: split at ZWNJ, render each segment with a tiny gap.
 * Strings with no ZWNJ are rendered as a single centered run.
 */
export function renderBanglaWithZwnj(
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

/**
 * Register the bundled Noto Sans Bengali font on a jsPDF document so Bangla
 * text can be drawn. Call once per document before setting the Bangla font.
 */
export async function registerBanglaFont(doc: jsPDF): Promise<void> {
  const fontBase64 = await loadBanglaFontBase64();
  doc.addFileToVFS(BANGLA_FONT_FILE, fontBase64);
  doc.addFont(BANGLA_FONT_FILE, BANGLA_FONT_NAME, "normal");
}

export { BANGLA_FONT_NAME, BANGLA_FONT_FILE };
