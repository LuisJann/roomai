-- Esegui questo script in Supabase per risolvere il problema di sicurezza (RLS) che bloccava il tuo accesso:

-- 1. Creiamo una funzione speciale che bypassa le regole per controllare chi è admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users_roles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminiamo le vecchie regole difettose che causavano il blocco
DROP POLICY IF EXISTS "Admins can view all users" ON public.users_roles;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users_roles;
DROP POLICY IF EXISTS "Admins can do everything on projects" ON public.projects;

-- 3. Ricreiamo le regole usando la nuova funzione sicura
CREATE POLICY "Admins can view all users" ON public.users_roles FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users_roles FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can do everything on projects" ON public.projects FOR ALL
USING (public.is_admin());
