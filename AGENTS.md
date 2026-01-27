# AGENTS.md - Operational Rules for AI

## 1. THE SINGLE BACKEND LAW

- **Scope:** ALL database operations must occur within `apps/2h_web_solutions_google_ads_asssitant_v1/`.
- **Prohibition:** NEVER write to the root of Firestore.
- **Auth:** Use Firebase Client SDK only. No Admin SDKs in client code.

## 2. UI/UX STANDARDS

- **Framework:** Tailwind CSS.
- **Colors:** Use `bg-brand-black` for sidebar, `bg-brand-gray` for main content, `text-brand-primary` for accents.
- **Typography:** Use `font-heading` for titles, `font-sans` for body text.

## 3. DEPLOYMENT

- **Platform:** Vercel.
- **Trigger:** Push to `main` branch.
