-- Fix: set super_admin on the correct profile
UPDATE profiles SET role = 'super_admin' WHERE email = 'andyjsantamaria@gmail.com';
