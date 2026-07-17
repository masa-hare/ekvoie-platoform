import { describe, expect, it } from "vitest";
import { checkContent } from "./contentFilter";

// The pre-submission filter is the first line of privacy protection: it must
// block contact details and explicit personal names, and it must NOT block
// ordinary campus complaints (over-blocking silences legitimate voices).
describe("PII detection", () => {
  it.each([
    "連絡は test@example.com まで",
    "user.name@domain.co.jp です",
    "電話は 090-1234-5678 に",
    "09012345678にかけて",
    "LINEは @my_line_id です",
  ])("blocks contact information: %s", text => {
    expect(checkContent(text)).toEqual({ ok: false, type: "pii" });
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

describe("abusive-language detection", () => {
  it.each([
    "あいつは馬鹿だ",
    "死ね",
    "し★ね", // symbol evasion
    "シ　ネ", // katakana + full-width space evasion
    "住所調べて晒すぞ",
  ])("blocks clearly abusive or threatening language: %s", text => {
    expect(checkContent(text)).toEqual({ ok: false, type: "harmful" });
  });
});

describe("legitimate opinions pass through", () => {
  it.each([
    "図書館の自習席が試験期間中ずっと満席で使えない。",
    "食堂の人気メニューが早い時間に売り切れてしまう。",
    "履修登録の締切が急に変わって困った。",
    "The cafeteria is crowded during lunch hours.",
  ])("does not over-block ordinary campus opinions: %s", text => {
    expect(checkContent(text)).toEqual({ ok: true });
  });

  it("checks multiple fields combined", () => {
    expect(checkContent("問題文です", "test@example.com")).toEqual({ ok: false, type: "pii" });
  });
});
