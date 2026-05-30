-- Esegui questo script in Supabase per aggiungere il nuovo permesso "Modifica AI"

-- 1. Impostiamo il default corretto per tutti i FUTURI utenti (Modifica AI = false)
ALTER TABLE public.users_roles 
ALTER COLUMN permissions SET DEFAULT '{"canAccessLanding": true, "canAccess3DEditor": true, "canAccessIspirazione": true, "canAccessStorico": true, "canAccessModificaAI": false}'::jsonb;

-- 2. Aggiungiamo il campo (impostato a false) anche a chi si è GIA' registrato (incluso il tuo utente test) senza rompere gli altri permessi
UPDATE public.users_roles
SET permissions = permissions || '{"canAccessModificaAI": false}'::jsonb;
