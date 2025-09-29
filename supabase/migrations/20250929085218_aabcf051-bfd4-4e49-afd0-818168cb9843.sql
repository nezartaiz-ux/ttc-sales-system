-- Create comprehensive product database for CAT and MF equipment
-- Need to use a UUID function for created_by field

-- Add sample user ID for demo data (using a valid UUID format)
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Add Caterpillar categories
    INSERT INTO public.product_categories (name, description) VALUES
    ('CAT Diesel Gensets', 'Caterpillar diesel generator sets (50 Hz only)'),
    ('CAT Gas Gensets', 'Caterpillar gas generator sets (1MW and higher)'),
    ('CAT Mobile Gensets', 'Caterpillar mobile generator sets'),
    ('CAT Battery Energy Storage', 'Caterpillar battery energy storage systems'),
    ('CAT Electric Power Controls', 'Caterpillar electric power controls and switchgear'),
    ('CAT Articulated Trucks', 'Caterpillar articulated trucks'),
    ('CAT Asphalt Pavers', 'Caterpillar asphalt pavers'),
    ('CAT Backhoe Loaders', 'Caterpillar backhoe loaders'),
    ('CAT Cold Planers', 'Caterpillar cold planers'),
    ('CAT Compactors', 'Caterpillar compactors'),
    ('CAT Dozers', 'Caterpillar dozers'),
    ('CAT Excavators', 'Caterpillar excavators'),
    ('CAT Motor Graders', 'Caterpillar motor graders'),
    ('CAT Off-Highway Trucks', 'Caterpillar off-highway trucks'),
    ('CAT Wheel Loaders', 'Caterpillar wheel loaders'),
    ('MF Tractors', 'Massey Ferguson agricultural tractors'),
    ('MF Combine Harvesters', 'Massey Ferguson combine harvesters'),
    ('MF Hay Tools', 'Massey Ferguson hay and forage equipment'),
    ('MF Implements', 'Massey Ferguson agricultural implements');

    -- Add CAT and MF suppliers with created_by field
    INSERT INTO public.suppliers (name, email, phone, address, contact_person, created_by) VALUES
    ('Caterpillar Inc.', 'dealer@cat.com', '+1-309-675-1000', '510 Lake Cook Road, Deerfield, IL 60015, USA', 'Regional Sales Manager', demo_user_id),
    ('CAT Power Systems', 'powersystems@cat.com', '+1-309-675-2000', 'Caterpillar Power Systems Division', 'Power Systems Manager', demo_user_id),
    ('Massey Ferguson AGCO', 'sales@masseyferguson.com', '+1-770-813-9200', '4205 River Green Parkway, Duluth, GA 30096, USA', 'Agricultural Sales Manager', demo_user_id);

END $$;