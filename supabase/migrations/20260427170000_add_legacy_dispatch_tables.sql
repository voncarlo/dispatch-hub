CREATE OR REPLACE FUNCTION public.user_has_dsp_access(_user_id UUID, _dsp_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_dsp_access
      WHERE user_id = _user_id AND dsp_id = _dsp_id
    )
$$;

CREATE TABLE public.legacy_phone_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dsp_id UUID NOT NULL REFERENCES public.dsps(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  work_phone TEXT NOT NULL DEFAULT '',
  home_phone TEXT NOT NULL DEFAULT '',
  mobile_phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.legacy_phone_list_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.legacy_dsp_payloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dsp_id UUID NOT NULL REFERENCES public.dsps(id) ON DELETE CASCADE,
  payload_key TEXT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dsp_id, payload_key)
);
ALTER TABLE public.legacy_dsp_payloads ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_legacy_phone_list_entries_dsp_id
  ON public.legacy_phone_list_entries (dsp_id, sort_order, label);

CREATE INDEX idx_legacy_dsp_payloads_dsp_id
  ON public.legacy_dsp_payloads (dsp_id, payload_key);

CREATE TRIGGER legacy_phone_list_entries_updated_at
BEFORE UPDATE ON public.legacy_phone_list_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER legacy_dsp_payloads_updated_at
BEFORE UPDATE ON public.legacy_dsp_payloads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "legacy_phone_list_entries_access"
ON public.legacy_phone_list_entries
FOR ALL
USING (public.user_has_dsp_access(auth.uid(), dsp_id))
WITH CHECK (public.user_has_dsp_access(auth.uid(), dsp_id));

CREATE POLICY "legacy_dsp_payloads_access"
ON public.legacy_dsp_payloads
FOR ALL
USING (public.user_has_dsp_access(auth.uid(), dsp_id))
WITH CHECK (public.user_has_dsp_access(auth.uid(), dsp_id));

REVOKE EXECUTE ON FUNCTION public.user_has_dsp_access(UUID, UUID) FROM PUBLIC, anon;
