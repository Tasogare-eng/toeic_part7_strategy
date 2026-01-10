# Stripe テスト・デプロイガイド

## 1. 概要

このドキュメントでは、TOEIC Part7 トレーニングWebサービスのStripe決済機能のテスト方法と本番環境へのデプロイ手順を説明します。

---

## 2. 環境変数設定

### 2.1 テスト環境（開発用）

```env
# Stripe テストモード
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx

# アプリケーション
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 本番環境

```env
# Stripe 本番モード
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx

# アプリケーション
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 3. Stripe CLI を使用したWebhookテスト

### 3.1 Stripe CLI インストール

```bash
# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# または公式サイトからダウンロード
# https://stripe.com/docs/stripe-cli
```

### 3.2 ログイン

```bash
stripe login
```

ブラウザが開き、Stripeアカウントへの認証を行います。

### 3.3 ローカルWebhookフォワーディング

開発サーバーを起動した状態で、別ターミナルで実行：

```bash
# 基本的な使用方法
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 出力されるWebhook Secretをメモ
# > Ready! Your webhook signing secret is whsec_xxx
```

**重要**: 表示された `whsec_xxx` を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定してください。

### 3.4 テストイベント送信

```bash
# Checkout セッション完了
stripe trigger checkout.session.completed

# サブスクリプション作成
stripe trigger customer.subscription.created

# サブスクリプション更新
stripe trigger customer.subscription.updated

# サブスクリプション削除（解約）
stripe trigger customer.subscription.deleted

# 請求書支払い完了
stripe trigger invoice.paid

# 請求書支払い失敗
stripe trigger invoice.payment_failed
```

---

## 4. テストカード番号

Stripeテストモードで使用できるカード番号：

| カード番号 | シナリオ |
|-----------|---------|
| 4242 4242 4242 4242 | 成功 |
| 4000 0000 0000 0002 | カード拒否 |
| 4000 0000 0000 9995 | 残高不足 |
| 4000 0000 0000 0341 | 3Dセキュア認証失敗 |
| 4000 0027 6000 3184 | 3Dセキュア認証成功 |

**共通設定**:
- 有効期限: 任意の将来の日付（例: 12/34）
- CVC: 任意の3桁（例: 123）
- 郵便番号: 任意（例: 1000001）

---

## 5. 手動テストシナリオ

### 5.1 新規サブスクリプション作成フロー

1. Free ユーザーでログイン
2. `/pricing` にアクセス
3. 「Pro にアップグレード」をクリック
4. Stripe Checkout 画面でテストカードを入力
5. 決済完了後、`/payment/success` にリダイレクト
6. ダッシュボードで Pro バッジが表示されることを確認
7. 模試・詳細分析機能が利用可能になることを確認

### 5.2 Customer Portal でのカード変更

1. Pro ユーザーでログイン
2. `/settings/subscription` にアクセス
3. 「Stripeで管理」をクリック
4. Customer Portal でカード情報を更新
5. 戻って変更が反映されていることを確認

### 5.3 サブスクリプション解約フロー

1. Pro ユーザーでログイン
2. `/settings/subscription` にアクセス
3. 「解約する」をクリック
4. 確認ダイアログで「解約を確定」
5. 「解約予定」ステータスが表示されることを確認
6. 期間終了日まで Pro 機能が利用可能なことを確認

### 5.4 解約キャンセルフロー

1. 解約予定の Pro ユーザーでログイン
2. `/settings/subscription` にアクセス
3. 「解約をキャンセル」をクリック
4. Pro ステータスに戻ることを確認

### 5.5 支払い失敗シミュレーション

1. Stripe Dashboard でテスト用サブスクリプションの支払い方法を拒否カードに変更
2. 次回請求日をシミュレート（Stripe Dashboard から）
3. Webhook で `invoice.payment_failed` が受信されることを確認
4. サブスクリプションステータスが `past_due` になることを確認

---

## 6. E2Eテスト実行

### 6.1 環境変数設定

```bash
export TEST_USER_EMAIL=your-test-email@example.com
export TEST_USER_PASSWORD=your-password
```

### 6.2 テスト実行

```bash
# 全テスト実行
npx playwright test

# Phase 6-E テストのみ
npx playwright test tests/phase6e.spec.ts tests/phase6e.authenticated.spec.ts

# 認証済みテストのみ
npx playwright test --project=authenticated

# 未認証テストのみ
npx playwright test --project=unauthenticated

# 特定のテストファイル
npx playwright test tests/phase6e.authenticated.spec.ts --project=authenticated
```

### 6.3 テストレポート確認

```bash
npx playwright show-report
```

---

## 7. 本番環境デプロイ準備

### 7.1 Stripe Dashboard 設定チェックリスト

#### 商品・価格の作成
- [ ] 商品「Pro Monthly」を作成
- [ ] 価格 ¥480/月 を設定
- [ ] Price ID をメモ（`price_xxx`）

#### Customer Portal 設定
- [ ] Customer Portal を有効化
- [ ] 解約許可を設定
- [ ] 請求履歴表示を有効化
- [ ] 支払い方法更新を許可

#### Webhook Endpoints 設定
- [ ] エンドポイント URL を登録: `https://your-domain.com/api/webhooks/stripe`
- [ ] 以下のイベントを選択:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- [ ] Webhook Secret をメモ（`whsec_xxx`）

### 7.2 環境変数設定チェックリスト

Vercel（または使用するホスティングサービス）に以下を設定：

- [ ] `STRIPE_SECRET_KEY` (本番用 `sk_live_xxx`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (本番用 `pk_live_xxx`)
- [ ] `STRIPE_WEBHOOK_SECRET` (本番用 `whsec_xxx`)
- [ ] `STRIPE_PRICE_PRO_MONTHLY` (本番用 `price_xxx`)
- [ ] `NEXT_PUBLIC_APP_URL` (本番URL)

### 7.3 デプロイ前確認事項

```bash
# ビルド成功確認
npm run build

# 型チェック成功
npx tsc --noEmit

# リント成功
npm run lint

# E2Eテスト成功
npx playwright test
```

### 7.4 デプロイ後確認

1. [ ] ログインが正常に動作する
2. [ ] ダッシュボードが表示される
3. [ ] 料金ページが表示される
4. [ ] Checkout への遷移が動作する
5. [ ] テスト決済が成功する（本番で少額テスト）
6. [ ] Webhook が正常に受信される
7. [ ] サブスクリプションステータスが更新される
8. [ ] Customer Portal が動作する

---

## 8. トラブルシューティング

### 8.1 Webhook が受信されない

1. Stripe Dashboard で Webhook のイベント履歴を確認
2. エンドポイント URL が正しいか確認
3. HTTPS が有効か確認（本番環境）
4. `STRIPE_WEBHOOK_SECRET` が正しいか確認

### 8.2 Checkout セッションが作成されない

1. `STRIPE_SECRET_KEY` が正しいか確認
2. `STRIPE_PRICE_PRO_MONTHLY` が存在するか確認
3. サーバーログでエラーを確認

### 8.3 Customer Portal が開かない

1. Customer Portal が Stripe Dashboard で有効化されているか確認
2. ユーザーに `stripe_customer_id` が設定されているか確認

### 8.4 サブスクリプションステータスが更新されない

1. Webhook イベントが正常に処理されているか確認
2. データベースの RLS ポリシーを確認
3. Service Role Key が正しく設定されているか確認

---

## 9. 参考リンク

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Billing](https://stripe.com/docs/billing)
- [Stripe Customer Portal](https://stripe.com/docs/customer-management/portal-configuration)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
