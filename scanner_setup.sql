-- Update existing users_roles permissions to include canAccessScanner: false
UPDATE users_roles
SET permissions = permissions || '{"canAccessScanner": false}'::jsonb
WHERE permissions IS NOT NULL;

-- Make sure admin has access
UPDATE users_roles
SET permissions = permissions || '{"canAccessScanner": true}'::jsonb
WHERE role = 'admin';
