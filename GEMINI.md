# GEMINI.md - Project Context & Rules

## 1. PROJECT IDENTITY

- **APP_ID:** `2h_web_solutions_google_ads_asssitant_v1`
- **NAME:** Google Ads Asssitant
- **CLIENT:** 2H Web Solutions
- **TYPE:** Central Hub

## 2. TECH STACK (STRICT)

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Firebase (Firestore, Auth)
- **Automation:** n8n (Webhooks)
- **Hosting:** Vercel

## 3. BRANDING (STRICT)

- **Primary Color:** `#B7EF02`
- **Background:** `#F0F0F3`
- **Sidebar:** `#101010`
- **Fonts:** Headings='Federo', Body='Barlow'

## 4. DATA ARCHITECTURE (LAW)

- **Root:** `apps/2h_web_solutions_google_ads_asssitant_v1/`
- **Rule:** NEVER write to Firestore root. Always use the App ID scope.
