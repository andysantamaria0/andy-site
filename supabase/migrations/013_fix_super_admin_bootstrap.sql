-- Fix: bootstrap super_admin with correct email
UPDATE profiles SET role = 'super_admin' WHERE email = 'andy@fractalbootcamp.com';
