# kotoriplan-lab

Lightweight management accounting lab for CVP-focused scenario analysis (new Kotoriplan MVP).

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Recharts
- React Hook Form + Zod
- Supabase JS SDK (PostgreSQL backend)
- Firebase Hosting (primary hosting option)

## Setup
1. Install dependencies
   ```bash
   npm install
   ```
2. Create env file
   ```bash
   cp .env.example .env
   ```
3. Fill env values in `.env`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run dev server
   ```bash
   npm run dev
   ```

## Auth (Supabase)
- Email/Password auth is enabled in app (`/auth`).
- Protected routes: `/scenarios`, `/scenarios/new`, `/scenarios/:id`, `/compare`, `/tags`.
- Non-authenticated users are redirected to `/auth`.
- New scenarios are saved with `owner_user_id = auth user.id`.
- Scenario list/detail queries also filter by `owner_user_id` on app side.

## Project structure
```text
src/
  app/
  pages/
  features/
    auth/
    scenario/
    tag/
  domain/
    cvp/
  shared/
  infra/
    supabase/
```

## Supabase migration
MVP migration SQL is in:
- `supabase/migrations/20260527000000_create_mvp_tables.sql`
- `supabase/migrations/20260527010000_enable_rls_for_scenarios.sql`

Apply with Supabase CLI (example):
```bash
supabase db push
```

This migration creates/enforces:
- `scenarios` table with owner-based row access control
- `tags`
- `scenario_tags`

### RLS design notes (important)
- `scenarios` has RLS enabled with owner-only policies (select/insert/update/delete).
- With RLS enabled, unauthenticated requests via anon key are blocked by default.
- `tags` / `scenario_tags` are intentionally not fully locked down in this MVP step.
- If you later join `scenario_tags` with `scenarios`, ensure policies do not expose cross-user links.
- Add explicit RLS policies for `tags` / `scenario_tags` before production usage.

Design policy:
- CVP calculation results are **not persisted** in DB.
- Calculations are executed in app layer (`src/domain/cvp/formulas.ts`).

## Firebase Hosting policy
`firebase.json` is configured for SPA hosting:
- `public: dist`
- rewrite all routes to `/index.html`

Basic deploy flow:
```bash
npm run build
firebase deploy --only hosting
```

## GitHub Actions での Firebase Hosting 自動デプロイ

`main` ブランチへの push をトリガーに、GitHub Actions で以下を実行します。

1. `npm ci`
2. `npm run build`（Supabase の公開用環境変数を注入）
3. Firebase Hosting へ deploy（`projectId: kotoriplan-lab`）

ワークフロー定義ファイル:
- `.github/workflows/deploy-hosting.yml`

### 必要な GitHub Secrets

以下を **GitHub Repository Secrets** に設定してください。

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KOTORIPLAN_LAB`

> ⚠️ セキュリティ注意
> - `.env` はコミットしない
> - Firebase Service Account JSON はリポジトリにコミットしない
> - Supabase の `service_role` key は絶対に使わず、`anon` key のみ利用する

### Firebase 側の前提設定（手動）

- Firebase プロジェクト `kotoriplan-lab` で Hosting を有効化済みであること
- GitHub Secrets に設定するための Service Account キー（JSON）を発行済みであること
- （必要に応じて）Service Account に Hosting デプロイ権限を付与していること

### hosting 設定

`firebase.json` は SPA 配信向けに以下を前提としています。

- `public: dist`
- すべてのルートを `/index.html` に rewrite

## Next UI backlog
- Driver View (separate from PL View)
- Unit Price / Quantity / Variable Cost per Unit by Product / Scenario
