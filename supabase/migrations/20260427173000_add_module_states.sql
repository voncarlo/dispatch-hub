CREATE TABLE public.module_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dsp_id UUID REFERENCES public.dsps(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  state_key TEXT NOT NULL,
  state_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dsp_id, module_code, state_key)
);

ALTER TABLE public.module_states ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER module_states_updated_at
BEFORE UPDATE ON public.module_states
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "module_states_self_all"
ON public.module_states
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "module_states_admin_select"
ON public.module_states
FOR SELECT
USING (public.is_admin(auth.uid()));
