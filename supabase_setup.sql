-- 1. Create a custom enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create the users_roles table to store permissions and roles
CREATE TABLE public.users_roles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
  -- We store permissions in a JSONB column. Defaults to false for normal users.
  permissions JSONB DEFAULT '{"canAccessLanding": false, "canAccess3DEditor": false, "canAccessIspirazione": false, "canAccessStorico": false}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users_roles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for users_roles
-- Admins can read and update all users
CREATE POLICY "Admins can view all users" ON public.users_roles FOR SELECT 
USING ((SELECT role FROM public.users_roles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update all users" ON public.users_roles FOR UPDATE 
USING ((SELECT role FROM public.users_roles WHERE id = auth.uid()) = 'admin');

-- Users can read their own role
CREATE POLICY "Users can view own role" ON public.users_roles FOR SELECT 
USING (auth.uid() = id);

-- 6. RLS Policies for projects
-- Admins can do everything on projects
CREATE POLICY "Admins can do everything on projects" ON public.projects FOR ALL
USING ((SELECT role FROM public.users_roles WHERE id = auth.uid()) = 'admin');

-- Users can manage their own projects
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE
USING (auth.uid() = user_id);

-- 7. Trigger to automatically create a users_roles entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_roles (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    -- If the email is the admin email, set role to admin
    CASE WHEN NEW.email = 'giannoneluigi10@gmail.com' THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- We also need to allow inserting into users_roles from the trigger (which uses SECURITY DEFINER, so it bypasses RLS)
