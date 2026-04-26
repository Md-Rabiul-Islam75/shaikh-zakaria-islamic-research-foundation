"use client";

// In-memory cache so we only fetch + convert the font once per page load
let banglaFontCache: string | null = null;

/**
 * Fetch the Noto Sans Bengali TTF font and convert it to a base64 string
 * suitable for jsPDF's `addFileToVFS()`.
 */
export async function loadBanglaFontBase64(): Promise<string> {
  if (banglaFontCache) return banglaFontCache;

  const res = await fetch("/fonts/NotoSansBengali.ttf");
  if (!res.ok) {
    throw new Error(`Failed to load Bangla font: ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Convert to binary string in chunks (avoid call stack overflow on big files)
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize))
    );
  }

  banglaFontCache = btoa(binary);
  return banglaFontCache;
}

export const BANGLA_FONT_NAME = "NotoSansBengali";
export const BANGLA_FONT_FILE = "NotoSansBengali.ttf";
