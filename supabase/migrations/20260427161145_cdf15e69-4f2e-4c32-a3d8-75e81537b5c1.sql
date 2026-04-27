-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'dispatch_manager', 'dispatch_supervisor', 'dispatch_lead', 'dispatcher');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  position TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- DSPs
CREATE TABLE public.dsps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dsps ENABLE ROW LEVEL SECURITY;

-- Modules (groups + submodules)
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dsp_id UUID NOT NULL REFERENCES public.dsps(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dsp_id, code)
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- DSP access per user
CREATE TABLE public.user_dsp_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dsp_id UUID NOT NULL REFERENCES public.dsps(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, dsp_id)
);
ALTER TABLE public.user_dsp_access ENABLE ROW LEVEL SECURITY;

-- Module access per user
CREATE TABLE public.user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Saved reports
CREATE TABLE public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dsp_id UUID REFERENCES public.dsps(id) ON DELETE SET NULL,
  module_code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- Submitted requests
CREATE TABLE public.submitted_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dsp_id UUID REFERENCES public.dsps(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  details TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.submitted_requests ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====
-- Profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- DSPs (any signed-in)
CREATE POLICY "dsps_authed_select" ON public.dsps FOR SELECT TO authenticated USING (true);
CREATE POLICY "dsps_admin_all" ON public.dsps FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Modules (any signed-in)
CREATE POLICY "modules_authed_select" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "modules_admin_all" ON public.modules FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- User DSP access
CREATE POLICY "user_dsp_self_select" ON public.user_dsp_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_dsp_admin_all" ON public.user_dsp_access FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- User module access
CREATE POLICY "user_module_self_select" ON public.user_module_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_module_admin_all" ON public.user_module_access FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Saved reports
CREATE POLICY "reports_self_all" ON public.saved_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_admin_select" ON public.saved_reports FOR SELECT USING (public.is_admin(auth.uid()));

-- Requests
CREATE POLICY "requests_self_all" ON public.submitted_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "requests_admin_all" ON public.submitted_requests FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON public.submitted_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + auto-promote bootstrap admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dsp RECORD;
  v_module RECORD;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  IF lower(NEW.email) = 'von.asinas@tgocorp.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    -- Grant access to all DSPs
    FOR v_dsp IN SELECT id FROM public.dsps LOOP
      INSERT INTO public.user_dsp_access (user_id, dsp_id) VALUES (NEW.id, v_dsp.id) ON CONFLICT DO NOTHING;
    END LOOP;
    -- Grant access to all modules
    FOR v_module IN SELECT id FROM public.modules LOOP
      INSERT INTO public.user_module_access (user_id, module_id) VALUES (NEW.id, v_module.id) ON CONFLICT DO NOTHING;
    END LOOP;
    UPDATE public.profiles SET position = 'Admin' WHERE id = NEW.id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dispatcher') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== SEED DSPs =====
INSERT INTO public.dsps (code, name, sort_order) VALUES
  ('ARMM', 'ARMM Logistics', 1),
  ('TLC', 'TLC Logistics', 2),
  ('PORTKEY', 'PortKey Delivery', 3),
  ('MSTAR', 'MSTAR Shipping', 4),
  ('AOPZ', 'AOPZ', 5),
  ('HRT', 'HR Transport', 6);

-- ===== SEED MODULES =====
DO $$
DECLARE
  d_armm UUID; d_tlc UUID; d_portkey UUID; d_mstar UUID; d_aopz UUID; d_hrt UUID;
  g_route UUID; g_reports UUID; g_other UUID; g_weekly UUID; g_daily UUID;
  std_dsp_ids UUID[];
  d UUID;
BEGIN
  SELECT id INTO d_armm FROM public.dsps WHERE code = 'ARMM';
  SELECT id INTO d_tlc FROM public.dsps WHERE code = 'TLC';
  SELECT id INTO d_portkey FROM public.dsps WHERE code = 'PORTKEY';
  SELECT id INTO d_mstar FROM public.dsps WHERE code = 'MSTAR';
  SELECT id INTO d_aopz FROM public.dsps WHERE code = 'AOPZ';
  SELECT id INTO d_hrt FROM public.dsps WHERE code = 'HRT';

  std_dsp_ids := ARRAY[d_armm, d_tlc, d_mstar, d_aopz];

  -- Standard DSPs
  FOREACH d IN ARRAY std_dsp_ids LOOP
    INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d, 'route_sheet', 'Route Sheet', 'Route', 1) RETURNING id INTO g_route;
    INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
      (d, g_route, 'driver_data_extractor', 'Driver Data Extractor', 'Database', 1),
      (d, g_route, 'phone_list', 'Phone List', 'Phone', 2);

    INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d, 'dispatch_reports', 'Dispatch Reports', 'FileBarChart', 2) RETURNING id INTO g_reports;
    INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
      (d, g_reports, 'package_status', 'Package Status', 'Package', 1),
      (d, g_reports, 'adp_punches', 'ADP Punches', 'Clock', 2),
      (d, g_reports, 'dvic', 'DVIC', 'ClipboardCheck', 3),
      (d, g_reports, 'paper_inspection', 'Paper Inspection', 'FileSearch', 4),
      (d, g_reports, 'lunch_audit', 'Lunch Audit', 'Utensils', 5);

    INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d, 'other_tools', 'Other Tools', 'Wrench', 3) RETURNING id INTO g_other;
    INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
      (d, g_other, 'pdf_editor', 'PDF Editor', 'FileEdit', 1);
  END LOOP;

  -- PortKey
  INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d_portkey, 'route_sheet', 'Route Sheet', 'Route', 1) RETURNING id INTO g_route;
  INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
    (d_portkey, g_route, 'driver_data_extractor', 'Driver Data Extractor', 'Database', 1),
    (d_portkey, g_route, 'phone_list', 'Phone List', 'Phone', 2),
    (d_portkey, g_route, 'vans_phones_assignment', 'Vans & Phones Assignment', 'Truck', 3);

  INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d_portkey, 'dispatch_reports', 'Dispatch Reports', 'FileBarChart', 2) RETURNING id INTO g_reports;
  INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
    (d_portkey, g_reports, 'package_status', 'Package Status', 'Package', 1),
    (d_portkey, g_reports, 'adp_punches', 'ADP Punches', 'Clock', 2),
    (d_portkey, g_reports, 'ten_hour_shift', '10-Hour Shift Indicator', 'Timer', 3),
    (d_portkey, g_reports, 'dvic', 'DVIC', 'ClipboardCheck', 4),
    (d_portkey, g_reports, 'paper_inspection', 'Paper Inspection', 'FileSearch', 5),
    (d_portkey, g_reports, 'attendance', 'Attendance', 'UserCheck', 6);

  INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d_portkey, 'other_tools', 'Other Tools', 'Wrench', 3) RETURNING id INTO g_other;
  INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
    (d_portkey, g_other, 'pdf_editor', 'PDF Editor', 'FileEdit', 1);

  -- HR Transport
  INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d_hrt, 'weekly_report', 'Weekly Report', 'CalendarDays', 1) RETURNING id INTO g_weekly;
  INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
    (d_hrt, g_weekly, 'merge_files', 'Merge Files', 'FilePlus', 1),
    (d_hrt, g_weekly, 'order_number_checker', 'Order Number Checker', 'Hash', 2);

  INSERT INTO public.modules (dsp_id, code, name, icon, sort_order) VALUES (d_hrt, 'daily_reports', 'Daily Reports', 'CalendarClock', 2) RETURNING id INTO g_daily;
  INSERT INTO public.modules (dsp_id, parent_id, code, name, icon, sort_order) VALUES
    (d_hrt, g_daily, 'gallons', 'Gallons', 'Fuel', 1),
    (d_hrt, g_daily, 'load_board', 'Load Board', 'LayoutGrid', 2),
    (d_hrt, g_daily, 'on_time_delivery', 'On-Time Delivery', 'Timer', 3);
END $$;