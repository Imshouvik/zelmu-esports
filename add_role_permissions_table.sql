-- Role-based permissions table for sidebar options and page access
CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    permission_key text NOT NULL, -- e.g., 'dashboard', 'clubs', 'adminPanel', 'tournaments', 'settings'
    type text NOT NULL,           -- 'sidebar' or 'page'
    allowed boolean NOT NULL DEFAULT true,
    UNIQUE(role, permission_key, type)
);

-- Index for fast lookup by role and type
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_type ON role_permissions(role, type); 