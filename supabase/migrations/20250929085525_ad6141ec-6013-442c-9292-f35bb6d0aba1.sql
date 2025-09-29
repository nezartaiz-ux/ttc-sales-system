-- Add only suppliers and inventory items (categories may already exist)
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Add only missing CAT and MF suppliers
    INSERT INTO public.suppliers (name, email, phone, address, contact_person, created_by) 
    SELECT name, email, phone, address, contact_person, demo_user_id 
    FROM (VALUES
        ('Caterpillar Inc.', 'dealer@cat.com', '+1-309-675-1000', '510 Lake Cook Road, Deerfield, IL 60015, USA', 'Regional Sales Manager'),
        ('CAT Power Systems', 'powersystems@cat.com', '+1-309-675-2000', 'Caterpillar Power Systems Division', 'Power Systems Manager'),
        ('Massey Ferguson AGCO', 'sales@masseyferguson.com', '+1-770-813-9200', '4205 River Green Parkway, Duluth, GA 30096, USA', 'Agricultural Sales Manager')
    ) AS new_suppliers(name, email, phone, address, contact_person)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.suppliers WHERE suppliers.name = new_suppliers.name
    );

    -- Add sample inventory items with actual category and supplier IDs
    -- CAT Diesel Gensets
    INSERT INTO public.inventory_items (name, category_id, quantity, unit_price, selling_price, min_stock_level, sku, description, supplier_id, created_by) 
    SELECT 
        item_data.name,
        cat.id,
        item_data.quantity,
        item_data.unit_price,
        item_data.selling_price,
        item_data.min_stock_level,
        item_data.sku,
        item_data.description,
        sup.id,
        demo_user_id
    FROM (VALUES
        ('CAT C1.5 Diesel Generator Set', 2, 45000.00, 52000.00, 1, 'CAT-C1.5-DG', '16.5 kVA prime power diesel generator set, 50 Hz, 400V'),
        ('CAT C2.2 Diesel Generator Set', 3, 65000.00, 75000.00, 1, 'CAT-C2.2-DG', '25 kVA prime power diesel generator set, 50 Hz, 400V'),
        ('CAT C3.3 Diesel Generator Set', 2, 85000.00, 98000.00, 1, 'CAT-C3.3-DG', '38 kVA prime power diesel generator set, 50 Hz, 400V'),
        ('CAT C4.4 Diesel Generator Set', 1, 125000.00, 145000.00, 1, 'CAT-C4.4-DG', '63 kVA prime power diesel generator set, 50 Hz, 400V'),
        ('CAT C7.1 Diesel Generator Set', 2, 185000.00, 215000.00, 1, 'CAT-C7.1-DG', '125 kVA prime power diesel generator set, 50 Hz, 400V')
    ) AS item_data(name, quantity, unit_price, selling_price, min_stock_level, sku, description)
    CROSS JOIN public.product_categories cat
    CROSS JOIN public.suppliers sup
    WHERE cat.name LIKE '%Diesel%' AND sup.name = 'Caterpillar Inc.'
    AND NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE inventory_items.sku = item_data.sku);

    -- CAT Heavy Equipment
    INSERT INTO public.inventory_items (name, category_id, quantity, unit_price, selling_price, min_stock_level, sku, description, supplier_id, created_by) 
    SELECT 
        item_data.name,
        cat.id,
        item_data.quantity,
        item_data.unit_price,
        item_data.selling_price,
        item_data.min_stock_level,
        item_data.sku,
        item_data.description,
        sup.id,
        demo_user_id
    FROM (VALUES
        ('CAT 320 Excavator', 3, 285000.00, 325000.00, 1, 'CAT-320-EX', '20-ton hydraulic excavator with advanced hydraulics'),
        ('CAT 336 Excavator', 2, 385000.00, 445000.00, 1, 'CAT-336-EX', '36-ton hydraulic excavator for heavy construction'),
        ('CAT 950M Wheel Loader', 2, 485000.00, 565000.00, 1, 'CAT-950M-WL', 'Medium wheel loader with high performance'),
        ('CAT D6T Dozer', 2, 485000.00, 565000.00, 1, 'CAT-D6T-DZ', 'Medium dozer with advanced blade control'),
        ('CAT 140M Motor Grader', 2, 585000.00, 675000.00, 1, 'CAT-140M-MG', 'Motor grader with precision blade control')
    ) AS item_data(name, quantity, unit_price, selling_price, min_stock_level, sku, description)
    CROSS JOIN public.product_categories cat
    CROSS JOIN public.suppliers sup
    WHERE cat.name LIKE '%Excavator%' AND sup.name = 'Caterpillar Inc.'
    AND NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE inventory_items.sku = item_data.sku)
    LIMIT 1;

    -- MF Tractors  
    INSERT INTO public.inventory_items (name, category_id, quantity, unit_price, selling_price, min_stock_level, sku, description, supplier_id, created_by) 
    SELECT 
        item_data.name,
        cat.id,
        item_data.quantity,
        item_data.unit_price,
        item_data.selling_price,
        item_data.min_stock_level,
        item_data.sku,
        item_data.description,
        sup.id,
        demo_user_id
    FROM (VALUES
        ('MF 1M Series Compact Tractor', 5, 35000.00, 42000.00, 2, 'MF-1M-CT', 'Compact tractor 25-45 HP, reliable performance'),
        ('MF 5M Series Utility Tractor', 4, 85000.00, 98000.00, 2, 'MF-5M-UT', 'Utility tractor 95-130 HP, affordable efficiency'),
        ('MF 8S Xtra High-Power Tractor', 2, 285000.00, 325000.00, 1, 'MF-8S-XHP', 'High-power tractor 225-400 HP, exceed expectations'),
        ('MF IDEAL 8 Combine Harvester', 1, 685000.00, 795000.00, 1, 'MF-IDEAL8-CH', 'Premium combine harvester, the harvest game changer')
    ) AS item_data(name, quantity, unit_price, selling_price, min_stock_level, sku, description)
    CROSS JOIN public.product_categories cat
    CROSS JOIN public.suppliers sup
    WHERE cat.name LIKE '%MF%' AND sup.name = 'Massey Ferguson AGCO'
    AND NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE inventory_items.sku = item_data.sku)
    LIMIT 2;

END $$;