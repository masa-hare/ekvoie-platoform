/**
 * Rule-based pre-submission filter shared by browser and server.
 * It deliberately makes no network request and uses no AI/LLM.
 */
export type ContentViolation = "pii" | "personal_name" | "harmful";
export type ContentCheckResult = { ok: true } | { ok: false; type: ContentViolation };

const PII_BLOCK: RegExp[] = [
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  /(\+81[-\s]?|0[5-9]0[-\s]?\d{4}[-\s]?\d{4}|0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/,
  /(?<!\d)\d{10,11}(?!\d)/,
  /@[a-zA-Z0-9_.]{3,}/,
];

// This is intentionally conservative: a name is blocked when it is explicitly
// presented as a person (honorific, "name is", etc.), rather than guessing from
// every Kanji sequence and blocking ordinary Japanese phrases.
const PERSONAL_NAME_BLOCK: RegExp[] = [
  /(?:^|[\s、。,.「『（(])[一-龠々]{2,4}[一-龠々]{2,4}(?:さん|氏|先生|くん|君|ちゃん)(?=$|[\s、。,.」』）)]|[はがをにのでと])/,
  /(?:氏名|名前)\s*(?:は|:|：)\s*[一-龠々ぁ-んァ-ヶ]{2,12}/,
  /\b[A-Z][a-z]{1,30}\s+[A-Z][a-z]{1,30}\b/,
];

function normalizeForFilter(text: string): string {
  let value = text;
  value = value.replace(/[！-～]/g, character => String.fromCharCode(character.charCodeAt(0) - 0xFEE0));
  value = value.replace(/[\u30A1-\u30F6]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
  value = value.replace(/[\s\u3000ー\u30FC＊*・\-_～〜★☆◯○×✕]/g, "");
  return value.toLowerCase();
}

const HARMFUL_DIRECT: RegExp[] = [
  /死[にね]|殺[すし]|ぶっ殺|強姦|無能|馬鹿|バカ|あほ|アホ|クズ|ごみ|ゴミ|最低|詐欺師|犯罪者/,
  // Doxxing threats written in kanji (the normalized list only covers kana)
  /晒(す|すぞ|し|せ)|住所を?(調べ|特定)/,
];
const HARMFUL_NORMALIZED: RegExp[] = [
  /しね|うせろ|きえろ|きえな|ころす|ぶっころ|ぶっとばす|くたばれ|のろわれろ|いきるかちない|そんざいするな/,
  /さらしてやる|さらすぞ|とくていした|とくていするぞ|じゅうしょしらべ|れいぷ|ごうかん/,
  /きちがい|きもくてしぬ|ごみくず|しゃかいのごみ/,
  // Clearly abusive/defamatory wording. This is stricter by design for a
  // student community; a human moderator remains the fallback for context.
  /ばか|あほ|むのう|くず|ごみ|さいてい|さぎし|はんざいしゃ/,
];

export function checkContent(...texts: string[]): ContentCheckResult {
  const combined = texts.filter(Boolean).join(" ");
  for (const pattern of PII_BLOCK) if (pattern.test(combined)) return { ok: false, type: "pii" };
  for (const pattern of PERSONAL_NAME_BLOCK) if (pattern.test(combined)) return { ok: false, type: "personal_name" };
  for (const pattern of HARMFUL_DIRECT) if (pattern.test(combined)) return { ok: false, type: "harmful" };
  const normalized = normalizeForFilter(combined);
  for (const pattern of HARMFUL_NORMALIZED) if (pattern.test(normalized)) return { ok: false, type: "harmful" };
  return { ok: true };
}
