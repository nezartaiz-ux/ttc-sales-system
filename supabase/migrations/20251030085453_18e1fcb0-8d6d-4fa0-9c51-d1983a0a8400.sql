-- Drop the old check constraints first
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_customs_duty_status_check;

ALTER TABLE sales_invoices 
DROP CONSTRAINT IF EXISTS sales_invoices_customs_duty_status_check;

-- Now update existing data in quotations table to match new values
UPDATE quotations 
SET customs_duty_status = 'CIF Aden Freezone'
WHERE customs_duty_status = 'CIF';

UPDATE quotations 
SET customs_duty_status = 'DDP Aden'
WHERE customs_duty_status = 'DDP';

-- Update existing data in sales_invoices table to match new values
UPDATE sales_invoices 
SET customs_duty_status = 'CIF Aden Freezone'
WHERE customs_duty_status = 'CIF';

UPDATE sales_invoices 
SET customs_duty_status = 'DDP Aden'
WHERE customs_duty_status = 'DDP';

-- Add the new check constraints with updated values
ALTER TABLE quotations 
ADD CONSTRAINT quotations_customs_duty_status_check 
CHECK (customs_duty_status IS NULL OR customs_duty_status IN ('CIF Aden Freezone', 'DDP Aden', 'DDP Sana''a'));

ALTER TABLE sales_invoices 
ADD CONSTRAINT sales_invoices_customs_duty_status_check 
CHECK (customs_duty_status IS NULL OR customs_duty_status IN ('CIF Aden Freezone', 'DDP Aden', 'DDP Sana''a'));