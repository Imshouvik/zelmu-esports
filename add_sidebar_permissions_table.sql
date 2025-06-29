-- Sidebar permissions table for role-based sidebar option control
CREATE TABLE IF NOT EXISTS sidebar_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    option_key text NOT NULL,
    allowed boolean NOT NULL DEFAULT true,
    UNIQUE(role, option_key)
);
-- Index for fast lookup by role
CREATE INDEX IF NOT EXISTS idx_sidebar_permissions_role ON sidebar_permissions(role); 