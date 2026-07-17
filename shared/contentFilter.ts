/**
 * Rule-based pre-submission filter shared by browser and server.
 * It deliberately makes no network request and uses no AI/LLM.
 */
export type ContentViolation = "pii" | "personal_name" | "harmful";
export type ContentCheckResult = { ok: true } | { ok: false; type: ContentViolation };

// Formatted contact info — checked on the RAW text only. The landline pattern
// requires both separators to be present: making them optional would turn it
// into "any 0 followed by five digits", swallowing dates (2026-07-16) and
// plain figures (1000000円). Separator-less numbers are caught by the strict
// 10–11 digit rule below instead.
const PII_RAW: RegExp[] = [
  /(\+81[-\s]?|0[5-9]0[-\s]?\d{4}[-\s]?\d{4}|0\d{1,4}[-\s]\d{1,4}[-\s]\d{3,4})/,
];

// Checked on BOTH the raw text and the normalized text, so full-width digits
// and separator tricks (０９０−１２３４−５６７８) are caught too.
const PII_BLOCK: RegExp[] = [
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  /(?<!\d)\d{10,11}(?!\d)/,
  /@[a-zA-Z0-9_.]{3,}/,
  // Postal codes (the 〒 mark makes the intent unambiguous)
  /〒\s*[0-9０-９]{3}[-‐−ー\s]?[0-9０-９]{4}/,
  // Street-level addresses. A bare place name ("福山市内から通学している") stays
  // allowed — students legitimately talk about locations. What gets blocked is
  // prefecture+municipality followed by a digit (a block number), or an
  // explicit 丁目/番地/号室 — the level of detail that identifies a household.
  /[一-龠々]{2,4}[都道府県][一-龠々ぁ-んァ-ヶ]{1,8}[市区町村郡][一-龠々ぁ-んァ-ヶ0-9０-９]{0,12}[0-9０-９]/,
  /[0-9０-９]{1,4}\s*丁目|[0-9０-９]{1,4}\s*番地|[0-9０-９]{1,4}\s*号室/,
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
  value = value.replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
  value = value.replace(/[\s　ー＊*・\-_～〜★☆◯○×✕−‐–—]/g, "");
  return value.toLowerCase();
}

const HARMFUL_DIRECT: RegExp[] = [
  /死[にね]|殺[すし]|ぶっ殺|強姦|無能|馬鹿|バカ|あほ|アホ|クズ|ごみ|ゴミ|最低|詐欺師|犯罪者/,
  // Kanji-form insults the kana-only normalized list misses. カス/クソ only
  // match with an attacking suffix so カスタマー/クソ真面目 stay unblocked.
  /消えろ|失せろ|カス(?:だ|が|すぎ|野郎|かよ)|クソ(?:野郎|すぎ)/,
  // Doxxing threats written in kanji (the normalized list only covers kana)
  /晒(す|すぞ|し|せ)|住所を?(調べ|特定)/,
  // English abuse — insults aimed at people. Word boundaries keep ordinary
  // sentences ("the schedule is tight") from matching.
  /\b(fuck(?:er|ing)?|sh[i1]t(?:head)?|b[i1]tch|asshole|bastard|cunt|d[i1]ckhead|whore|slut|moron|idiot|stupid|dumbass|retard(?:ed)?|scum(?:bag)?|loser|pathetic)\b/i,
  // English threats and self-harm goading
  /\b(?:kill\s+(?:your|you)\s*self|kys|go\s+(?:and\s+)?die|drop\s+dead|deserves?\s+to\s+die|(?:i(?:'|’)?ll|gonna|will)\s+kill\s+you|rapes?|hang\s+yourself)\b/i,
];
const HARMFUL_NORMALIZED: RegExp[] = [
  /しね|うせろ|きえろ|きえな|ころす|ぶっころ|ぶっとばす|くたばれ|のろわれろ|いきるかちない|そんざいするな/,
  /さらしてやる|さらすぞ|とくていした|とくていするぞ|じゅうしょしらべ|れいぷ|ごうかん/,
  /きちがい|きもくてしぬ|ごみくず|しゃかいのごみ|きもい/,
  // Clearly abusive/defamatory wording. This is stricter by design for a
  // student community; a human moderator remains the fallback for context.
  /ばか|あほ|むのう|くず|ごみ|さいてい|さぎし|はんざいしゃ/,
  // English phrases reassembled after space/symbol stripping ("k i l l …",
  // full-width ＦＵＣＫ). Long phrases only: short tokens like "kys" would
  // false-positive as substrings once spaces are gone (e.g. "skyscraper").
  /killyou?rself|goanddie|godie|dropdead|deserves?todie|hangyourself|fuckyou/,
];

export function checkContent(...texts: string[]): ContentCheckResult {
  const combined = texts.filter(Boolean).join(" ");
  const normalized = normalizeForFilter(combined);

  for (const pattern of PII_RAW) if (pattern.test(combined)) return { ok: false, type: "pii" };
  for (const pattern of PII_BLOCK) {
    if (pattern.test(combined) || pattern.test(normalized)) return { ok: false, type: "pii" };
  }
  for (const pattern of PERSONAL_NAME_BLOCK) if (pattern.test(combined)) return { ok: false, type: "personal_name" };
  for (const pattern of HARMFUL_DIRECT) if (pattern.test(combined)) return { ok: false, type: "harmful" };
  for (const pattern of HARMFUL_NORMALIZED) if (pattern.test(normalized)) return { ok: false, type: "harmful" };
  return { ok: true };
}
