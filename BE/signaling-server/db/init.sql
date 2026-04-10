CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  tenant TEXT NOT NULL,
  status TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, user_name, password, display_name, phone, tenant, status, is_active)
VALUES
  ('1', 'user1', 'pass', 'Manager 01', '101', 'tenantA', 'active', TRUE)
ON CONFLICT (id) DO UPDATE SET
  user_name = EXCLUDED.user_name,
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  tenant = EXCLUDED.tenant,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
