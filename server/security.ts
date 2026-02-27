/**
 * Sanitize user input: strips all HTML tags to prevent stored XSS.
 * Applied on server before persisting any user-submitted text.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

/**
 * Scrub PII patterns from text before storing in deletion logs.
 * Replaces email addresses, phone numbers, SNS handles, and numeric IDs with placeholders.
 * Not a guarantee — intended as a best-effort reduction of sensitive data at rest.
 */
const PII_PATTERNS: Array<[RegExp, string]> = [
  // Email addresses
  [/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[EMAIL]"],
  // Japanese/international phone numbers (with or without separators)
  [/(\+81[-\s]?|0\d{1,4}[-\s]?)\d{1,4}[-\s]?\d{3,4}/g, "[PHONE]"],
  // 10-11 digit continuous numbers (携帯・固定電話 without separators)
  [/(?<!\d)\d{10,11}(?!\d)/g, "[PHONE]"],
  // SNS handles (e.g. @username, LINE ID)
  [/@[a-zA-Z0-9_.]{3,}/g, "[SNS]"],
  // Numeric IDs (7–12 digits not adjacent to other digits or decimal points)
  [/(?<![.\d])\d{7,12}(?![.\d])/g, "[ID]"],
];

export function scrubPII(text: string): string {
  if (!text) return "";
  let result = text;
  for (const [pattern, replacement] of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Pre-submission content check: blocks PII and clearly harmful language.
 * Returns { ok: true } if content passes, or { ok: false, type } if blocked.
 */
const PII_BLOCK: RegExp[] = [
  // Email addresses
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // Japanese mobile/landline phone numbers
  /(\+81[-\s]?|0[5-9]0[-\s]?\d{4}[-\s]?\d{4}|0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/,
  // 10-11 continuous digits (phone without separator)
  /(?<!\d)\d{10,11}(?!\d)/,
  // SNS handles
  /@[a-zA-Z0-9_.]{3,}/,
];

/**
 * Normalize text to neutralize common SNS filter-evasion techniques:
 * - Full-width characters (Ａ→A, ！→!)
 * - Katakana → hiragana (シネ→しね)
 * - Long vowel mark removal (しーねー→しね)
 * - Space/symbol/emoji insertion (し★ね, し ね, し*ね → しね)
 */
function normalizeForFilter(text: string): string {
  let s = text;
  // Full-width ASCII → half-width
  s = s.replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  // Katakana → hiragana
  s = s.replace(/[\u30A1-\u30F6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  // Remove long vowel marks, spaces, and common evasion characters
  s = s.replace(/[\s\u3000ー\u30FC＊*・\-_～〜★☆◯○×✕]/g, "");
  // Remove harmful-context emoji
  s = s.replace(/[💀🔪☠️⚰️🖕]/g, "kill");
  return s.toLowerCase();
}

// Patterns checked against ORIGINAL text (kanji-based)
const HARMFUL_DIRECT: RegExp[] = [
  /死[にね]|殺[すし]|ぶっ殺|強姦/,
];

// Patterns checked against NORMALIZED text (catches evasion via katakana/spaces/symbols)
const HARMFUL_NORMALIZED: RegExp[] = [
  // 死ね系: しね、シネ、し★ね、し ね、氏ね、しねしね など
  /しね/,
  // 失せろ・消えろ系
  /うせろ|きえろ|きえな/,
  // 殺す系: ころす、ぶっころ
  /ころす|ぶっころ|ぶっとばす/,
  // 存在否定系
  /しにさらせ|しにやがれ|しにかけ|くたばれ|のろわれろ|いきるかちない|そんざいするな/,
  // ドクシング（個人特定・晒し）脅迫
  /さらしてやる|さらすぞ|とくていした|とくていするぞ|じゅうしょしらべ/,
  // 性的暴力
  /れいぷ|ごうかん/,
  // 重度の侮辱表現
  /きちがい|きもくてしぬ|ごみくず|しゃかいのごみ/,
];

export type ContentCheckResult =
  | { ok: true }
  | { ok: false; type: "pii" | "harmful" };

export function checkContent(...texts: string[]): ContentCheckResult {
  const combined = texts.filter(Boolean).join(" ");

  // PII check (on original text)
  for (const pattern of PII_BLOCK) {
    if (pattern.test(combined)) return { ok: false, type: "pii" };
  }

  // Direct harmful check (kanji patterns on original text)
  for (const pattern of HARMFUL_DIRECT) {
    if (pattern.test(combined)) return { ok: false, type: "harmful" };
  }

  // Evasion-resistant check (on normalized text)
  const normalized = normalizeForFilter(combined);
  for (const pattern of HARMFUL_NORMALIZED) {
    if (pattern.test(normalized)) return { ok: false, type: "harmful" };
  }

  return { ok: true };
}
