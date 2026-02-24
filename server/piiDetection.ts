/**
 * Personal Identifiable Information (PII) Detection Utility
 * Detects email addresses, phone numbers, student IDs, SNS IDs, and addresses in user input
 */

// Email pattern: simple but effective (removed 'g' flag to avoid lastIndex issues)
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Phone number patterns (Japanese and international) - removed 'g' flag
const PHONE_PATTERNS = [
  /0\d{1,4}-\d{1,4}-\d{4}/, // Japanese format: 03-1234-5678, 090-1234-5678
  /0\d{9,10}/, // Japanese format without hyphens: 0312345678, 09012345678
  /\+\d{1,3}[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4}/, // International format: +81-90-1234-5678
];

// Student ID patterns (common formats) - removed 'g' flag
const STUDENT_ID_PATTERNS = [
  /[A-Z]\d{7,10}/, // Format: A1234567, B12345678
  /\d{7,10}[A-Z]/, // Format: 1234567A, 12345678B
  /学籍番号[:：]?\s*[A-Z0-9]{7,10}/i, // Format: 学籍番号: A1234567, 学籍番号：12345678
  /学生番号[:：]?\s*[A-Z0-9]{7,10}/i, // Format: 学生番号: A1234567
  /(?<![0-9])\d{8,12}(?![0-9])/, // Pure numeric student ID: 8-12 digits
];

// SNS/Contact ID patterns - removed 'g' flag
const SNS_ID_PATTERNS = [
  /LINE\s*ID[:：]?\s*[@]?[a-zA-Z0-9._-]{3,20}/i, // LINE ID: line.me/ti/p/xxxxx or LINE ID: @xxxxx
  /Instagram[:：]?\s*[@][a-zA-Z0-9._]{1,30}/i, // Instagram: @username
  /(?:Twitter|X)[:：]?\s*[@][a-zA-Z0-9_]{1,15}/i, // X/Twitter: @username
  /Discord[:：]?\s*[a-zA-Z0-9._#]{2,32}/i, // Discord: username#1234 or username
  /[@][a-zA-Z0-9._]{3,30}/, // Generic @username format
  /(?:ID|id)[:：]?\s*[a-zA-Z0-9._-]{4,20}/, // Generic ID: xxxxx
];

// Address patterns (Japanese) - removed 'g' flag
const ADDRESS_PATTERNS = [
  // Prefecture + City/Ward/Town
  /(?:北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)[^\s]{2,10}(?:市|区|町|村)/,
  // Street address with numbers
  /[0-9０-９]{1,4}[-－ー][0-9０-９]{1,4}[-－ー][0-9０-９]{1,4}/,
  // Apartment/Mansion with room number
  /(?:マンション|アパート|ハイツ|コーポ|ビル|棟)[^\s]{0,20}[0-9０-９]{1,4}(?:号室|号|室)/,
  // 番地 (banchi - lot number)
  /[0-9０-９]{1,4}番地/,
  // 丁目 (chome - district)
  /[0-9０-９]{1,2}丁目/,
];

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  maskedText: string;
}

/**
 * Detect PII in text and return detection result
 * @param text Text to check for PII
 * @returns Detection result with masked text
 */
export function detectPII(text: string): PIIDetectionResult {
  const detectedTypes: string[] = [];
  let maskedText = text;

  // Check for email addresses
  if (EMAIL_PATTERN.test(text)) {
    detectedTypes.push("email");
    maskedText = maskedText.replace(new RegExp(EMAIL_PATTERN.source, 'g'), "[メールアドレス]");
  }

  // Check for phone numbers
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) {
      detectedTypes.push("phone");
      maskedText = maskedText.replace(new RegExp(pattern.source, 'g'), "[電話番号]");
      break; // Only add once
    }
  }

  // Check for SNS IDs
  for (const pattern of SNS_ID_PATTERNS) {
    if (pattern.test(text)) {
      detectedTypes.push("snsId");
      maskedText = maskedText.replace(new RegExp(pattern.source, 'gi'), "[SNS ID]");
      break; // Only add once
    }
  }

  // Check for addresses
  for (const pattern of ADDRESS_PATTERNS) {
    if (pattern.test(text)) {
      detectedTypes.push("address");
      maskedText = maskedText.replace(new RegExp(pattern.source, 'g'), "[住所]");
      break; // Only add once
    }
  }

  // Check for student IDs (check last to avoid false positives with addresses)
  for (const pattern of STUDENT_ID_PATTERNS) {
    if (pattern.test(text)) {
      detectedTypes.push("studentId");
      maskedText = maskedText.replace(new RegExp(pattern.source, 'gi'), "[学籍番号]");
      break; // Only add once
    }
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    maskedText,
  };
}

/**
 * Check if text contains PII (simple boolean check)
 * @param text Text to check for PII
 * @returns True if PII is detected
 */
export function containsPII(text: string): boolean {
  return detectPII(text).hasPII;
}
