-- Add comprehensive inventory items for CAT and MF equipment
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    cat_id UUID;
    cat_power_id UUID;
    mf_id UUID;
    cat_diesel_cat_id UUID;
    cat_gas_cat_id UUID;
    cat_excavator_cat_id UUID;
    cat_wheel_loader_cat_id UUID;
    cat_dozer_cat_id UUID;
    cat_motor_grader_cat_id UUID;
    cat_articulated_cat_id UUID;
    mf_tractor_cat_id UUID;
    mf_combine_cat_id UUID;
BEGIN
    -- Get supplier IDs
    SELECT id INTO cat_id FROM public.suppliers WHERE name = 'Caterpillar Inc.';
    SELECT id INTO cat_power_id FROM public.suppliers WHERE name = 'CAT Power Systems';
    SELECT id INTO mf_id FROM public.suppliers WHERE name = 'Massey Ferguson AGCO';
    
    -- Get category IDs
    SELECT id INTO cat_diesel_cat_id FROM public.product_categories WHERE name = 'CAT Diesel Gensets';
    SELECT id INTO cat_gas_cat_id FROM public.product_categories WHERE name = 'CAT Gas Gensets';
    SELECT id INTO cat_excavator_cat_id FROM public.product_categories WHERE name = 'CAT Excavators';
    SELECT id INTO cat_wheel_loader_cat_id FROM public.product_categories WHERE name = 'CAT Wheel Loaders';
    SELECT id INTO cat_dozer_cat_id FROM public.product_categories WHERE name = 'CAT Dozers';
    SELECT id INTO cat_motor_grader_cat_id FROM public.product_categories WHERE name = 'CAT Motor Graders';
    SELECT id INTO cat_articulated_cat_id FROM public.product_categories WHERE name = 'CAT Articulated Trucks';
    SELECT id INTO mf_tractor_cat_id FROM public.product_categories WHERE name = 'MF Tractors';
    SELECT id INTO mf_combine_cat_id FROM public.product_categories WHERE name = 'MF Combine Harvesters';

    -- Sample CAT Diesel Gensets
    INSERT INTO public.inventory_items (name, category_id, quantity, unit_price, selling_price, min_stock_level, sku, description, supplier_id, created_by) VALUES
    ('CAT C1.5 Diesel Generator Set', cat_diesel_cat_id, 2, 45000.00, 52000.00, 1, 'CAT-C1.5-DG', '16.5 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C2.2 Diesel Generator Set', cat_diesel_cat_id, 3, 65000.00, 75000.00, 1, 'CAT-C2.2-DG', '25 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C3.3 Diesel Generator Set', cat_diesel_cat_id, 2, 85000.00, 98000.00, 1, 'CAT-C3.3-DG', '38 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C4.4 Diesel Generator Set', cat_diesel_cat_id, 1, 125000.00, 145000.00, 1, 'CAT-C4.4-DG', '63 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C7.1 Diesel Generator Set', cat_diesel_cat_id, 2, 185000.00, 215000.00, 1, 'CAT-C7.1-DG', '125 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C9 Diesel Generator Set', cat_diesel_cat_id, 1, 285000.00, 325000.00, 1, 'CAT-C9-DG', '200 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C13 Diesel Generator Set', cat_diesel_cat_id, 1, 385000.00, 445000.00, 1, 'CAT-C13-DG', '350 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C15 Diesel Generator Set', cat_diesel_cat_id, 1, 485000.00, 565000.00, 1, 'CAT-C15-DG', '500 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C18 Diesel Generator Set', cat_diesel_cat_id, 1, 685000.00, 795000.00, 1, 'CAT-C18-DG', '750 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id),
    ('CAT C32 Diesel Generator Set', cat_diesel_cat_id, 1, 985000.00, 1145000.00, 1, 'CAT-C32-DG', '1250 kVA prime power diesel generator set, 50 Hz, 400V', cat_id, demo_user_id);

    -- Sample CAT Gas Gensets (1MW+)
    INSERT INTO public.inventory_items (name, category_id, quantity, unit_price, selling_price, min_stock_level, sku, description, supplier_id, created_by) VALUES
    ('CAT G3412 Gas Generator Set', cat_gas_cat_id, 1, 1250000.00, 1450000.00, 1, 'CAT-G3412-GG', '1 MW natural gas generator set for oil & gas applications', cat_power_id, demo_user_id),
    ('CAT G3516 Gas Generator Set', cat_gas_cat_id, 1, 1850000.00, 2150000.00, 1, 'CAT-G3516-GG', '1.5 MW natural gas generator set for industrial applications', cat_power_id, demo_user_id),
    ('CAT G3520C Gas Generator Set', cat_gas_cat_id, 1, 2450000.00, 2850000.00, 1, 'CAT-G3520C-GG', '2 MW natural gas generator set for utility applications', cat_power_id, demo_user_id),
    ('CAT CG132 Gas Generator Set', cat_gas_cat_id, 1, 3250000.00, 3750000.00, 1, 'CAT-CG132-GG', '3.3 MW natural gas generator set for power generation', cat_power_id, demo_user_id),
    ('CAT CG170 Gas Generator Set', cat_gas_cat_id, 1, 4850000.00, 5650000.00, 1, 'CAT-CG170-GG', '4.5 MW natural gas generator set for utility scale', cat_power_id, demo_user_id);

    -- Sample CAT Heavy Equipment
    INSERT INTO public.inventory_items (name, category_id, quantity, unit_price, selling_price, min_stock_level, sku, description, supplier_id, created_by) VALUES
    ('CAT 320 Excavator', cat_excavator_cat_id, 3, 285000.00, 325000.00, 1, 'CAT-320-EX', '20-ton hydraulic excavator with advanced hydraulics', cat_id, demo_user_id),
    ('CAT 336 Excavator', cat_excavator_cat_id, 2, 385000.00, 445000.00, 1, 'CAT-336-EX', '36-ton hydraulic excavator for heavy construction', cat_id, demo_user_id),
    ('CAT 950M Wheel Loader', cat_wheel_loader_cat_id, 2, 485000.00, 565000.00, 1, 'CAT-950M-WL', 'Medium wheel loader with high performance', cat_id, demo_user_id),
    ('CAT 980M Wheel Loader', cat_wheel_loader_cat_id, 1, 685000.00, 795000.00, 1, 'CAT-980M-WL', 'Large wheel loader for heavy material handling', cat_id, demo_user_id),
    ('CAT D6T Dozer', cat_dozer_cat_id, 2, 485000.00, 565000.00, 1, 'CAT-D6T-DZ', 'Medium dozer with advanced blade control', cat_id, demo_user_id),
    ('CAT D8T Dozer', cat_dozer_cat_id, 1, 685000.00, 795000.00, 1, 'CAT-D8T-DZ', 'Large dozer for heavy earthmoving', cat_id, demo_user_id),
    ('CAT 140M Motor Grader', cat_motor_grader_cat_id, 2, 585000.00, 675000.00, 1, 'CAT-140M-MG', 'Motor grader with precision blade control', cat_id, demo_user_id),
    ('CAT 725C Articulated Truck', cat_articulated_cat_id, 3, 385000.00, 445000.00, 1, 'CAT-725C-AT', '25-ton articulated dump truck', cat_id, demo_user_id),
    ('CAT 740B Articulated Truck', cat_articulated_cat_id, 2, 485000.00, 565000.00, 1, 'CAT-740B-AT', '40-ton articulated dump truck', cat_id, demo_user_id);

    -- Sample Massey Ferguson Tractors
    INSERT INTO public.inventory_items (name, category_id, quantity, unit_price, selling_price, min_stock_level, sku, description, supplier_id, created_by) VALUES
    ('MF 1M Series Compact Tractor', mf_tractor_cat_id, 5, 35000.00, 42000.00, 2, 'MF-1M-CT', 'Compact tractor 25-45 HP, reliable performance', mf_id, demo_user_id),
    ('MF 5M Series Utility Tractor', mf_tractor_cat_id, 4, 85000.00, 98000.00, 2, 'MF-5M-UT', 'Utility tractor 95-130 HP, affordable efficiency', mf_id, demo_user_id),
    ('MF 6M Series Mid-Range Tractor', mf_tractor_cat_id, 3, 145000.00, 168000.00, 1, 'MF-6M-MR', 'Mid-range tractor 145-175 HP, versatile performance', mf_id, demo_user_id),
    ('MF 7M Series High-Power Tractor', mf_tractor_cat_id, 2, 185000.00, 215000.00, 1, 'MF-7M-HP', 'High-power tractor 180-200 HP, advanced technology', mf_id, demo_user_id),
    ('MF 8S Xtra High-Power Tractor', mf_tractor_cat_id, 2, 285000.00, 325000.00, 1, 'MF-8S-XHP', 'High-power tractor 225-400 HP, exceed expectations', mf_id, demo_user_id),
    ('MF IDEAL 8 Combine Harvester', mf_combine_cat_id, 1, 685000.00, 795000.00, 1, 'MF-IDEAL8-CH', 'Premium combine harvester, the harvest game changer', mf_id, demo_user_id),
    ('MF IDEAL 9 Combine Harvester', mf_combine_cat_id, 1, 785000.00, 915000.00, 1, 'MF-IDEAL9-CH', 'High-capacity combine harvester for large operations', mf_id, demo_user_id);

END $$;