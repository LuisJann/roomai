-- Esegui questa query nell'SQL Editor di Supabase per forzare la tua utenza a diventare Admin
UPDATE public.users_roles SET role = 'admin' WHERE email = 'giannoneluigi10@gmail.com';
