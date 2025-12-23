-- Add new values to system_module enum
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'delivery_notes';
ALTER TYPE system_module ADD VALUE IF NOT EXISTS 'image_gallery';