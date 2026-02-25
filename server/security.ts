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
