# Student Voice Platform / 学生ボイスプラットフォーム

A bilingual (Japanese/English) anonymous student opinion platform with voting, moderation, and analytics — built for universities and educational institutions.

匿名で学生の意見を投稿・集計・可視化できる、日本語/英語対応のプラットフォームです。

---

## Features / 機能

- **Anonymous posting** — students post problems and proposed solutions without accounts
- **Agree / Disagree / Pass voting** — vote on both opinions and solution proposals
- **Admin moderation** — approve, hide, or reject posts via a password-protected admin panel
- **Analytics dashboard** — real-time vote stats, category breakdown, top opinions, submission trends
- **Bilingual UI** — Japanese / English toggle, persisted in localStorage
- **Solution proposals** — community members can propose solutions; best solution is highlighted
- **Rate limiting & XSS protection** — built-in security on all endpoints
- **CSV export** — export all opinions from the admin panel
- **Mobile-friendly** — responsive layout for all screen sizes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Routing | Wouter |
| State / Data | tRPC, TanStack Query |
| Backend | Node.js, Express |
| Database | MySQL (Drizzle ORM) |
| Auth | JWT (HTTP-only cookie) |
| Deployment | Railway (recommended) |

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- MySQL database (local or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/masa-hare/ekvoie-platoform.git
cd ekvoie-platoform
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=mysql://user:password@localhost:3306/student_voice
JWT_SECRET=your-random-secret-at-least-64-chars
ADMIN_PASSWORD=your-admin-password
NODE_ENV=development
```

### 4. Run database migrations

```bash
pnpm db:push
```

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:5000](http://localhost:5000)

---

## Customization / カスタマイズ

All institution-specific values are in one file:

**`client/src/siteConfig.ts`**

```typescript
export const siteConfig = {
  orgName: {
    ja: "叡啓大学",       // ← Change to your institution name (Japanese)
    en: "Eikei University", // ← Change to your institution name (English)
  },
  memberTerm: {
    ja: "叡啓生",         // ← Term for your students (Japanese)
    en: "Eikei students", // ← Term for your students (English)
  },
  siteName: {
    ja: "叡啓ボイス",     // ← Platform name (Japanese)
    en: "Eikei Voice",    // ← Platform name (English)
  },
  contactEmail: "your@email.com",        // ← Your contact email
  githubUrl: "https://github.com/...",   // ← Your GitHub repo URL
};
```

Edit this file and rebuild — everything else updates automatically.

---

## Deployment (Railway)

### 1. Create a new Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your forked repository

### 2. Add a MySQL database

In your project: **+ New** → **Database** → **Add MySQL**
The `DATABASE_URL` variable is set automatically.

### 3. Set environment variables

| Variable | Value |
|----------|-------|
| `ADMIN_PASSWORD` | Password for the admin panel |
| `JWT_SECRET` | Random secret string (64+ chars) |

Generate a secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Run migrations

In Railway Shell (or temporarily change Start Command):
```bash
pnpm db:push
```

### 5. Done

Railway auto-deploys on every push to `main`.

---

## Admin Panel

Access the admin panel at `/admin-login`.

From the admin panel you can:
- Approve / reject / hide opinions
- Approve / reject solution proposals
- Export all data as CSV

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing session tokens |
| `ADMIN_PASSWORD` | ✅ | Password for admin panel login |
| `NODE_ENV` | auto | Set to `production` by Railway |
| `PORT` | auto | Set automatically by Railway |

---

## Project Structure

```
student-voice-platform/
├── client/src/
│   ├── siteConfig.ts        # ← Edit this to customize for your institution
│   ├── pages/               # React pages
│   ├── components/          # Shared UI components
│   ├── contexts/            # Language context (i18n)
│   └── hooks/               # Custom hooks
├── server/
│   ├── _core/               # Express app, tRPC setup, auth
│   ├── routers.ts           # All API endpoints
│   ├── db.ts                # Database queries
│   └── security.ts          # Input sanitization
├── drizzle/
│   └── schema.ts            # Database schema
├── .env.example             # Environment variable template
└── railway.toml             # Railway deployment config
```

---

## Contributing

Pull requests and issues are welcome. If you're using this for your institution and want to share improvements, feel free to open a PR.

---

## License

MIT — see [LICENSE](./LICENSE)
