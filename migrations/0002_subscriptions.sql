-- Aivanta subscription records
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,

  plan TEXT NOT NULL
    CHECK (plan IN ('pro', 'ultimate')),

  status TEXT NOT NULL
    CHECK (status IN (
      'trialing',
      'active',
      'past_due',
      'cancelled',
      'expired'
    )),

  provider TEXT NOT NULL DEFAULT 'paypal'
    CHECK (provider IN ('paypal')),

  provider_subscription_id TEXT UNIQUE,

  trial_start_at TEXT,
  trial_end_at TEXT,

  current_period_start_at TEXT,
  current_period_end_at TEXT,

  cancel_at_period_end INTEGER NOT NULL DEFAULT 0
    CHECK (cancel_at_period_end IN (0, 1)),

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
ON subscriptions(status);

-- Monthly AI and image usage
CREATE TABLE IF NOT EXISTS monthly_usage (
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  period_start TEXT NOT NULL,

  messages_used INTEGER NOT NULL DEFAULT 0
    CHECK (messages_used >= 0),

  images_used INTEGER NOT NULL DEFAULT 0
    CHECK (images_used >= 0),

  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, period_start)
);

-- PayPal webhook event IDs for duplicate-event protection
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
