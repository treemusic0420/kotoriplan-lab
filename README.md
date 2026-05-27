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

## Project structure
```text
src/
  app/
  pages/
  features/
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

Apply with Supabase CLI (example):
```bash
supabase db push
```

This migration creates:
- `scenarios` (includes nullable `owner_user_id` for future auth)
- `tags`
- `scenario_tags`

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

## Not in scope (current phase)
- Auth screens / Supabase Auth
- RLS
- Account / Organization / Version / Actual / Budget
- PL/BS/CF and other advanced modules

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
