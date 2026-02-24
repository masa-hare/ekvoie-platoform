import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user input: strips all HTML tags to prevent stored XSS.
 * Applied on server before persisting any user-submitted text.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}
