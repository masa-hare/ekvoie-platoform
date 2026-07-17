import { describe, expect, it } from "vitest";
import { checkContent } from "./contentFilter";

// The pre-submission filter is the first line of privacy protection: it must
// block contact details, addresses, and explicit personal names, and it must
// NOT block ordinary campus complaints (over-blocking silences real voices).
describe("PII detection — contact information", () => {
  it.each([
    "連絡は test@example.com まで",
    "user.name@domain.co.jp です",
    "電話は 090-1234-5678 に",
    "09012345678にかけて",
    "LINEは @my_line_id です",
    "０９０１２３４５６７８に電話して", // full-width digits
    "０９０−１２３４−５６７８です", // full-width digits + full-width hyphens
  ])("blocks contact information: %s", text => {
    expect(checkContent(text)).toEqual({ ok: false, type: "pii" });
  });
});

describe("PII detection — street-level addresses", () => {
  it.each([
    "〒720-0001 に送って",
    "広島県福山市東町1-2-3に住んでいます",
    "住まいは3丁目のアパート",
    "5番地の家です",
    "コーポの203号室にいる",
  ])("blocks household-identifying addresses: %s", text => {
    expect(checkContent(text)).toEqual({ ok: false, type: "pii" });
  });

  it.each([
    "福山市内から通学している学生には不便だ。",
    "広島県福山市の大学として魅力を高めてほしい。",
    "東京都内でのインターン先を増やしてほしい。",
  ])("still allows place names as ordinary context: %s", text => {
    expect(checkContent(text)).toEqual({ ok: true });
  });
});

describe("personal-name detection (conservative, explicit presentation only)", () => {
  it.each([
    "担当の 山田太郎さん の対応が遅い",
    "名前は田中一郎です",
    "Taro Yamada is responsible",
  ])("blocks explicitly presented names: %s", text => {
    expect(checkContent(text).ok).toBe(false);
  });
});

describe("abusive-language detection — Japanese", () => {
  it.each([
    "あいつは馬鹿だ",
    "死ね",
    "し★ね", // symbol evasion
    "シ　ネ", // katakana + full-width space evasion
    "住所調べて晒すぞ",
    "消えろ",
    "あの職員はカス野郎だ",
    "対応がキモい",
  ])("blocks clearly abusive or threatening language: %s", text => {
    expect(checkContent(text)).toEqual({ ok: false, type: "harmful" });
  });
});

describe("abusive-language detection — English", () => {
  it.each([
    "You are an idiot",
    "the staff is stupid",
    "kill yourself",
    "just go die",
    "Fuck you",
    "ＦＵＣＫ ＹＯＵ", // full-width evasion
    "k i l l y o u r s e l f", // spacing evasion
  ])("blocks English abuse and threats: %s", text => {
    expect(checkContent(text)).toEqual({ ok: false, type: "harmful" });
  });

  it.each([
    "The cafeteria is crowded during lunch hours.",
    "The deadline is too tight for students.",
    "I want more skyscraper photos in the brochure.", // "kys" as substring must not match
  ])("does not over-block ordinary English sentences: %s", text => {
    expect(checkContent(text)).toEqual({ ok: true });
  });
});

describe("legitimate opinions pass through", () => {
  it.each([
    "図書館の自習席が試験期間中ずっと満席で使えない。",
    "食堂の人気メニューが早い時間に売り切れてしまう。",
    "履修登録の締切が急に変わって困った。",
    "説明会の日程が2026-07-16の9:00から18:00までで長すぎる。", // dates/times are not phone numbers
    "予算は1000000円と聞いた。", // 7-digit figure is not a phone number
    "カスタマーサービスの対応が遅い。", // カス as substring must not match
    "授業のスケジュールがスカスカな日と詰まりすぎな日がある。",
  ])("does not over-block ordinary campus opinions: %s", text => {
    expect(checkContent(text)).toEqual({ ok: true });
  });

  it("checks multiple fields combined", () => {
    expect(checkContent("問題文です", "test@example.com")).toEqual({ ok: false, type: "pii" });
  });
});
