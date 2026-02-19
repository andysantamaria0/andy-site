-- Add "concierge" feature flag for the unified Concierge tab
-- Visible to all roles so every trip member can see contact info

INSERT INTO features (id, label, description, category)
VALUES ('concierge', 'Concierge', 'Unified concierge tab with contact info, smart paste, and inbox', 'core')
ON CONFLICT (id) DO NOTHING;

-- Enable for all roles
INSERT INTO feature_role_permissions (feature_id, role, enabled)
VALUES
  ('concierge', 'user', true),
  ('concierge', 'super_admin', true)
ON CONFLICT (feature_id, role) DO NOTHING;
