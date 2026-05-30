-- Run this query to update the default permissions for new users so they can access the sections by default:

ALTER TABLE public.users_roles 
ALTER COLUMN permissions SET DEFAULT '{"canAccessLanding": true, "canAccess3DEditor": true, "canAccessIspirazione": true, "canAccessStorico": true}'::jsonb;

-- Also update any existing non-admin users to have these permissions turned on:
UPDATE public.users_roles
SET permissions = '{"canAccessLanding": true, "canAccess3DEditor": true, "canAccessIspirazione": true, "canAccessStorico": true}'::jsonb
WHERE role = 'user';
