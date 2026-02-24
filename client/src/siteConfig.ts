/**
 * Site Configuration
 * ==================
 * このファイルを編集して、あなたの機関向けにプラットフォームをカスタマイズしてください。
 * Edit this file to customize the platform for your institution.
 *
 * すべての機関固有の値はここに集約されています。
 * All institution-specific values are centralized here.
 */

export const siteConfig = {
  /**
   * 機関名 / Name of the institution or organization running this platform
   * 例 / e.g., "〇〇大学" / "XX University"
   */
  orgName: {
    ja: "叡啓大学",
    en: "Eikei University",
  },

  /**
   * メンバーの呼称 / Term used to refer to members (students, staff, etc.)
   * 例 / e.g., "学生" / "students"
   */
  memberTerm: {
    ja: "叡啓生",
    en: "Eikei students",
  },

  /**
   * プラットフォーム名 / Name of this platform
   */
  siteName: {
    ja: "叡啓ボイス",
    en: "Eikei Voice",
  },

  /**
   * お問い合わせ用メールアドレス / Contact email for site inquiries
   */
  contactEmail: "ekvoice0@gmail.com",

  /**
   * GitHubリポジトリURL / GitHub repository URL
   */
  githubUrl: "https://github.com/masa-hare/ekvoie-platoform",
} as const;
