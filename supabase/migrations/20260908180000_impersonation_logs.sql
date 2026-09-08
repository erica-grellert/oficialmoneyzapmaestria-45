-- Audit log for admin "view as user" sessions. Service role only.
CREATE TABLE IF NOT EXISTS public.moneyzap_impersonation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  target_email text,
  started_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moneyzap_impersonation_logs_admin_idx
  ON public.moneyzap_impersonation_logs (admin_id, started_at DESC);

ALTER TABLE public.moneyzap_impersonation_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.moneyzap_impersonation_logs FROM anon, authenticated;
GRANT ALL ON TABLE public.moneyzap_impersonation_logs TO service_role;
