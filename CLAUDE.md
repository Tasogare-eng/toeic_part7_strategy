# CLAUDE.md - TOEIC Part7 トレーニングWebサービス

## プロジェクト概要

TOEIC Part7で90%の正解率を目指す中上級者（600-800点）向けの学習Webサービス。
文法・単語・長文をバランスよく学習できるトレーニングプラットフォーム。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui |
| バックエンド | Next.js Server Actions |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Email + Google OAuth) |
| 決済 | Stripe (SDK v20.1.2 / API 2025-12-15.clover) |
| AI | OpenAI GPT-4 API |
| PWA | next-pwa |
| デプロイ | Vercel |

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run lint     # リント
npx tsc --noEmit # 型チェック
npx playwright test # E2Eテスト
```

## Node.js パス

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH" && npm
export PATH="/opt/homebrew/opt/node@20/bin:$PATH" && npx
```

## 開発フェーズ

- Phase 1: MVP（完了） - 認証、長文読解、ダッシュボード
- Phase 2: AI統合（完了） - GPT-4による問題生成
- Phase 3: 学習管理（完了） - Google OAuth、進捗グラフ、弱点分析
- Phase 4: 単語・文法・復習（完了） - フラッシュカード、文法練習、復習機能
- Phase 5: 模試・PWA・最適化（完了） - 模試機能、PWA対応、キャッシュ最適化
- Phase 6: Stripe決済（完了） - サブスクリプション、利用制限、請求管理

## 詳細ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [docs/requirements.md](docs/requirements.md) | 機能要件定義書 |
| [docs/mvp-design.md](docs/mvp-design.md) | MVP設計書（DB設計、画面設計、API設計） |
| [docs/development-guide.md](docs/development-guide.md) | 開発ガイド（ディレクトリ構成、DB設計、コーディング規約） |
| [docs/api-reference.md](docs/api-reference.md) | Server Actions リファレンス |
| [docs/stripe-billing-requirements.md](docs/stripe-billing-requirements.md) | Stripe決済要件定義書 |
| [docs/stripe-testing-guide.md](docs/stripe-testing-guide.md) | Stripeテスト・デプロイガイド |

## 環境変数
.env.local