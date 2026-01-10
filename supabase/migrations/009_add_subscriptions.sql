-- ============================================
-- 009_add_subscriptions.sql
-- Stripe決済・サブスクリプション管理テーブル
-- ============================================

-- 1. subscriptions（サブスクリプション）
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (plan_type IN ('free', 'pro')),
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 2. invoices（請求履歴）
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount_paid INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'jpy',
  status VARCHAR(30) NOT NULL,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);

-- 3. subscription_logs（変更履歴）
CREATE TABLE subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  previous_plan VARCHAR(20),
  new_plan VARCHAR(20),
  stripe_event_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_logs_user ON subscription_logs(user_id);
CREATE INDEX idx_subscription_logs_event ON subscription_logs(event_type);
CREATE INDEX idx_subscription_logs_created ON subscription_logs(created_at);

-- 4. usage_limits（利用制限追跡）
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  reading_count INTEGER DEFAULT 0,
  grammar_count INTEGER DEFAULT 0,
  vocabulary_count INTEGER DEFAULT 0,
  ai_passage_count INTEGER DEFAULT 0,
  ai_grammar_count INTEGER DEFAULT 0,
  ai_vocabulary_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

CREATE INDEX idx_usage_limits_user_date ON usage_limits(user_id, usage_date);

-- 5. profilesテーブル拡張
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- subscription_logs
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription logs" ON subscription_logs
  FOR SELECT USING (auth.uid() = user_id);

-- usage_limits
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage limits" ON usage_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage limits" ON usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage limits" ON usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- updated_at自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_limits_updated_at
    BEFORE UPDATE ON usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
