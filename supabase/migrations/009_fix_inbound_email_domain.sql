-- Change inbound email addresses from @inbound.andysantamaria.com to @andysantamaria.com
-- Cloudflare Email Routing works on the root domain, not subdomains

-- Update the trigger function
CREATE OR REPLACE FUNCTION generate_inbound_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.inbound_email IS NULL THEN
    NEW.inbound_email := 'trip-' || SUBSTRING(NEW.id::text, 1, 8) || '@andysantamaria.com';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing trips
UPDATE public.trips
SET inbound_email = REPLACE(inbound_email, '@inbound.andysantamaria.com', '@andysantamaria.com')
WHERE inbound_email LIKE '%@inbound.andysantamaria.com';
