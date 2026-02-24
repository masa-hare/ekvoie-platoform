import { describe, it, expect } from "vitest";
import { detectPII, containsPII } from "./piiDetection";

describe("PII Detection", () => {
  describe("Email Detection", () => {
    it("should detect email addresses", () => {
      const result = detectPII("連絡先: test@example.com です");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("email");
      expect(result.maskedText).toContain("[メールアドレス]");
    });

    it("should detect multiple email formats", () => {
      const texts = [
        "user.name@domain.co.jp",
        "test+tag@example.com",
        "info@sub.domain.org",
      ];
      texts.forEach(text => {
        expect(containsPII(text)).toBe(true);
      });
    });
  });

  describe("Phone Number Detection", () => {
    it("should detect Japanese phone numbers with hyphens", () => {
      const result = detectPII("電話番号は 090-1234-5678 です");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("phone");
      expect(result.maskedText).toContain("[電話番号]");
    });

    it("should detect Japanese phone numbers without hyphens", () => {
      const result = detectPII("連絡先: 09012345678");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("phone");
    });

    it("should detect landline numbers", () => {
      const texts = [
        "03-1234-5678",
        "0312345678",
        "06-9876-5432",
      ];
      texts.forEach(text => {
        expect(containsPII(text)).toBe(true);
      });
    });
  });

  describe("SNS ID Detection", () => {
    it("should detect LINE ID", () => {
      const result = detectPII("LINE ID: @mylineid で連絡ください");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("snsId");
      expect(result.maskedText).toContain("[SNS ID]");
    });

    it("should detect Instagram username", () => {
      const result = detectPII("Instagram: @myusername をフォローしてね");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("snsId");
    });

    it("should detect X/Twitter username", () => {
      const texts = [
        "Twitter: @username",
        "X: @myhandle",
      ];
      texts.forEach(text => {
        expect(containsPII(text)).toBe(true);
      });
    });

    it("should detect Discord username", () => {
      const result = detectPII("Discord: username#1234");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("snsId");
    });

    it("should detect generic @username format", () => {
      const result = detectPII("@myusername で連絡してください");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("snsId");
    });
  });

  describe("Address Detection", () => {
    it("should detect prefecture + city address", () => {
      const result = detectPII("住所は東京都渋谷区です");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("address");
      expect(result.maskedText).toContain("[住所]");
    });

    it("should detect street address with numbers", () => {
      const result = detectPII("1-2-3にあります");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("address");
    });

    it("should detect apartment/mansion with room number", () => {
      const texts = [
        "〇〇マンション101号室",
        "△△アパート205号",
        "□□ビル3階304号室",
      ];
      texts.forEach(text => {
        expect(containsPII(text)).toBe(true);
      });
    });

    it("should detect 番地 (lot number)", () => {
      const result = detectPII("123番地にあります");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("address");
    });

    it("should detect 丁目 (district)", () => {
      const result = detectPII("3丁目のお店");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain("address");
    });
  });

  describe("Student ID Detection", () => {
    it("should detect alphanumeric student IDs", () => {
      const texts = [
        "学籍番号: A1234567",
        "学生番号：B12345678",
        "S20230001",
      ];
      texts.forEach(text => {
        expect(containsPII(text)).toBe(true);
      });
    });

    it("should detect numeric student IDs (8-12 digits)", () => {
      const texts = [
        "学籍番号は 12345678 です",
        "番号: 202301234",
        "ID: 20230001234",
      ];
      texts.forEach(text => {
        const result = detectPII(text);
        expect(result.hasPII).toBe(true);
      });
    });
  });

  describe("Normal Text (No PII)", () => {
    it("should not detect PII in normal sentences", () => {
      const texts = [
        "学食のカレーが美味しい",
        "図書館の開館時間を延長してほしい",
        "授業の内容が難しすぎる",
        "サークル活動を充実させてほしい",
        "Wi-Fiの速度を改善してください",
      ];
      texts.forEach(text => {
        expect(containsPII(text)).toBe(false);
      });
    });

    it("should not detect short numbers as student IDs", () => {
      const texts = [
        "3年生です",
        "5人のグループ",
        "100点満点",
        "2024年度",
      ];
      texts.forEach(text => {
        expect(containsPII(text)).toBe(false);
      });
    });
  });

  describe("Consistency Test (lastIndex bug fix)", () => {
    it("should return consistent results on repeated calls", () => {
      const text = "test@example.com と 090-1234-5678";
      
      // Call detectPII multiple times with the same input
      const result1 = detectPII(text);
      const result2 = detectPII(text);
      const result3 = detectPII(text);
      
      // All results should be identical
      expect(result1.hasPII).toBe(result2.hasPII);
      expect(result1.hasPII).toBe(result3.hasPII);
      expect(result1.detectedTypes).toEqual(result2.detectedTypes);
      expect(result1.detectedTypes).toEqual(result3.detectedTypes);
      expect(result1.maskedText).toBe(result2.maskedText);
      expect(result1.maskedText).toBe(result3.maskedText);
    });

    it("should return consistent results with containsPII", () => {
      const text = "LINE ID: @myid";
      
      // Call containsPII multiple times
      const check1 = containsPII(text);
      const check2 = containsPII(text);
      const check3 = containsPII(text);
      
      // All results should be identical
      expect(check1).toBe(check2);
      expect(check1).toBe(check3);
      expect(check1).toBe(true);
    });
  });

  describe("Multiple PII Types", () => {
    it("should detect multiple PII types in one text", () => {
      const result = detectPII("連絡先: test@example.com または 090-1234-5678");
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes.length).toBeGreaterThanOrEqual(2);
      expect(result.detectedTypes).toContain("email");
      expect(result.detectedTypes).toContain("phone");
    });
  });
});
