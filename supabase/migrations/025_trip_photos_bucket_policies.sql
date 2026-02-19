-- Create trip-photos storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-photos', 'trip-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for trip-photos bucket
CREATE POLICY "Authenticated users can upload trip photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trip-photos');

CREATE POLICY "Authenticated users can update trip photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'trip-photos');

CREATE POLICY "Anyone can view trip photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'trip-photos');
