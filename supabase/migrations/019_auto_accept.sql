ALTER TABLE public.inbound_emails
  ADD COLUMN auto_applied_at timestamptz,
  ADD COLUMN auto_applied_items jsonb;
