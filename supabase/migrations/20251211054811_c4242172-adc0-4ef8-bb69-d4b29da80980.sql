-- Add invoice reference to delivery notes
ALTER TABLE public.delivery_notes 
ADD COLUMN sales_invoice_id UUID REFERENCES public.sales_invoices(id);

-- Create index for performance
CREATE INDEX idx_delivery_notes_invoice ON public.delivery_notes(sales_invoice_id);
CREATE INDEX idx_delivery_notes_customer ON public.delivery_notes(customer_id);
CREATE INDEX idx_delivery_notes_date ON public.delivery_notes(delivery_note_date);
CREATE INDEX idx_delivery_notes_status ON public.delivery_notes(status);