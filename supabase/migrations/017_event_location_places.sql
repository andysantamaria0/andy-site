ALTER TABLE public.events
  ADD COLUMN place_id text,
  ADD COLUMN place_address text,
  ADD COLUMN place_lat numeric(10,7),
  ADD COLUMN place_lng numeric(10,7);
