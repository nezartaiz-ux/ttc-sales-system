import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, TrendingUp, PieChart, FileText, Truck, Zap, Tractor, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/utils/csvExport";
import { 
  generateReportPDF, 
  generateDetailedQuotationReport, 
  generateDetailedInventoryReport,
  generateDetailedSalesReport,
  generateDetailedPOReport,
  generateDetailedCustomersReport,
  generateDetailedSuppliersReport,
  generateDetailedDeliveryNotesReport,
  printDetailedQuotationReport,
  printDetailedInventoryReport,
  printDetailedSalesReport,
  printDetailedPOReport,
  printDetailedCustomersReport,
  printDetailedSuppliersReport,
  printDetailedDeliveryNotesReport
} from "@/utils/reportPdfExport";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCategories } from "@/hooks/useUserCategories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Reports = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [customReportType, setCustomReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string>('');
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [totalDeliveryNotes, setTotalDeliveryNotes] = useState(0);
  
  // Category-specific stats
  const [categoryStats, setCategoryStats] = useState<{[key: string]: {items: number, quotations: number, invoices: number}}>({});
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Delivery notes report filters
  const [dnStartDate, setDnStartDate] = useState<string>('');
  const [dnEndDate, setDnEndDate] = useState<string>('');
  const [dnCustomerId, setDnCustomerId] = useState<string>('');
  const [dnStatus, setDnStatus] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingDeliveryNotes, setLoadingDeliveryNotes] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { userCategories, hasRestrictions, isAdmin, getCategoryIds } = useUserCategories();

  // Fetch user's full name
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setUserFullName(data.full_name);
      }
    };
    fetchUserInfo();
  }, [user]);

  // Fetch summary data with category filtering
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const categoryIds = getCategoryIds();
        
        // Fetch categories
        const { data: cats } = await supabase
          .from('product_categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
        setCategories(cats || []);

        // Get all inventory items with categories
        let inventoryQuery = supabase.from('inventory_items').select('id, category_id');
        if (hasRestrictions && categoryIds.length > 0) {
          inventoryQuery = inventoryQuery.in('category_id', categoryIds);
        }
        const { data: inventoryItems } = await inventoryQuery;
        const validItemIds = inventoryItems?.map(i => i.id) || [];

        // Fetch invoices
        const { data: invoicesData } = await supabase
          .from('sales_invoices')
          .select('id, grand_total, status');
        
        // Fetch invoice items to filter by category
        const { data: invoiceItems } = await supabase
          .from('sales_invoice_items')
          .select('sales_invoice_id, inventory_item_id');
        
        let filteredInvoices = invoicesData || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const validInvoiceIds = new Set(
            invoiceItems?.filter(ii => validItemIds.includes(ii.inventory_item_id))
              .map(ii => ii.sales_invoice_id) || []
          );
          filteredInvoices = filteredInvoices.filter(inv => validInvoiceIds.has(inv.id));
        }
        
        setTotalInvoices(filteredInvoices.length);
        const paidRevenue = filteredInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
        setTotalRevenue(paidRevenue);

        // Fetch quotations with category filtering
        const { data: quotationsData } = await supabase.from('quotations').select('id');
        const { data: quotationItems } = await supabase
          .from('quotation_items')
          .select('quotation_id, inventory_item_id');
        
        let filteredQuotations = quotationsData || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const validQuotationIds = new Set(
            quotationItems?.filter(qi => validItemIds.includes(qi.inventory_item_id))
              .map(qi => qi.quotation_id) || []
          );
          filteredQuotations = filteredQuotations.filter(q => validQuotationIds.has(q.id));
        }
        setTotalQuotations(filteredQuotations.length);

        // Fetch delivery notes
        const { data: deliveryNotesData } = await supabase.from('delivery_notes').select('id');
        const { data: deliveryNoteItems } = await supabase
          .from('delivery_note_items')
          .select('delivery_note_id, inventory_item_id');
        
        let filteredDN = deliveryNotesData || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const validDNIds = new Set(
            deliveryNoteItems?.filter(dni => validItemIds.includes(dni.inventory_item_id || ''))
              .map(dni => dni.delivery_note_id) || []
          );
          filteredDN = filteredDN.filter(dn => validDNIds.has(dn.id));
        }
        setTotalDeliveryNotes(filteredDN.length);

        // Fetch customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
        setCustomers(customersData || []);

        // Calculate category-specific stats
        const stats: {[key: string]: {items: number, quotations: number, invoices: number}} = {};
        for (const cat of (cats || [])) {
          const catItems = inventoryItems?.filter(i => i.category_id === cat.id) || [];
          const catItemIds = catItems.map(i => i.id);
          
          const catQuotationIds = new Set(
            quotationItems?.filter(qi => catItemIds.includes(qi.inventory_item_id))
              .map(qi => qi.quotation_id) || []
          );
          
          const catInvoiceIds = new Set(
            invoiceItems?.filter(ii => catItemIds.includes(ii.inventory_item_id))
              .map(ii => ii.sales_invoice_id) || []
          );
          
          stats[cat.id] = {
            items: catItems.length,
            quotations: catQuotationIds.size,
            invoices: catInvoiceIds.size
          };
        }
        setCategoryStats(stats);
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };
    fetchSummaryData();
  }, [hasRestrictions]);

  // Fetch delivery notes with filters and category restrictions
  const fetchDeliveryNotes = async () => {
    setLoadingDeliveryNotes(true);
    try {
      const categoryIds = getCategoryIds();

      let query = supabase
        .from('delivery_notes')
        .select(`
          *,
          customer:customers(name),
          sales_invoice:sales_invoices(invoice_number)
        `)
        .order('delivery_note_date', { ascending: false });
      
      if (dnStartDate) {
        query = query.gte('delivery_note_date', dnStartDate);
      }
      if (dnEndDate) {
        query = query.lte('delivery_note_date', dnEndDate);
      }
      if (dnCustomerId && dnCustomerId !== 'all') {
        query = query.eq('customer_id', dnCustomerId);
      }
      if (dnStatus && dnStatus !== 'all') {
        query = query.eq('status', dnStatus as 'draft' | 'sent' | 'delivered' | 'cancelled');
      }
      
      const { data, error } = await query;
      if (error) throw error;

      // Filter by category if user has restrictions
      let filteredData = data || [];
      if (hasRestrictions && categoryIds.length > 0) {
        // Get inventory items in user's categories
        const { data: inventoryItems } = await supabase
          .from('inventory_items')
          .select('id')
          .in('category_id', categoryIds);
        const validItemIds = inventoryItems?.map(i => i.id) || [];

        // Get delivery note items
        const { data: dnItems } = await supabase
          .from('delivery_note_items')
          .select('delivery_note_id, inventory_item_id');

        const validDNIds = new Set(
          dnItems?.filter(dni => validItemIds.includes(dni.inventory_item_id || ''))
            .map(dni => dni.delivery_note_id) || []
        );

        filteredData = filteredData.filter(dn => validDNIds.has(dn.id));
      }

      setDeliveryNotes(filteredData);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingDeliveryNotes(false);
    }
  };

  const handleExportDeliveryNotesCSV = () => {
    if (deliveryNotes.length === 0) {
      toast({ title: 'Info', description: 'No data to export' });
      return;
    }
    const exportData = deliveryNotes.map(dn => ({
      delivery_note_number: dn.delivery_note_number,
      date: dn.delivery_note_date,
      customer: dn.customer?.name,
      status: dn.status,
      invoice_ref: dn.sales_invoice?.invoice_number || '-',
      warranty_type: dn.warranty_type,
      driver_name: dn.driver_name,
    }));
    exportToCSV(exportData, `delivery-notes-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: 'Success', description: 'Report exported' });
  };

  const handleExportDeliveryNotesPDF = () => {
    if (deliveryNotes.length === 0) {
      toast({ title: 'Info', description: 'No data to export' });
      return;
    }
    const dnData = deliveryNotes.map(dn => ({
      delivery_note_number: dn.delivery_note_number,
      delivery_note_date: dn.delivery_note_date,
      customer_name: dn.customer?.name || '-',
      invoice_number: dn.sales_invoice?.invoice_number || '-',
      warranty_type: dn.warranty_type || '-',
      driver_name: dn.driver_name || '-',
      status: dn.status
    }));
    
    generateDetailedDeliveryNotesReport({
      title: 'DELIVERY NOTES Report',
      dateRange: dnStartDate && dnEndDate ? `${dnStartDate} to ${dnEndDate}` : undefined,
      deliveryNotes: dnData,
      created_by_name: userFullName || 'N/A'
    });
    toast({ title: 'Success', description: 'PDF report generated' });
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const categoryIds = getCategoryIds();
      
      // Get filtered inventory items first
      let inventoryQuery = supabase.from('inventory_items').select('*');
      if (hasRestrictions && categoryIds.length > 0) {
        inventoryQuery = inventoryQuery.in('category_id', categoryIds);
      }
      const { data: inventoryData } = await inventoryQuery;
      const validItemIds = inventoryData?.map(i => i.id) || [];

      const [customers, suppliers, quotations, quotationItems, pos, poItems, invoices, invoiceItems] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('quotations').select('*'),
        supabase.from('quotation_items').select('quotation_id, inventory_item_id'),
        supabase.from('purchase_orders').select('*'),
        supabase.from('purchase_order_items').select('purchase_order_id, inventory_item_id'),
        supabase.from('sales_invoices').select('*'),
        supabase.from('sales_invoice_items').select('sales_invoice_id, inventory_item_id')
      ]);

      // Filter quotations by category
      let filteredQuotations = quotations.data || [];
      if (hasRestrictions && categoryIds.length > 0) {
        const validQuotationIds = new Set(
          quotationItems.data?.filter(qi => validItemIds.includes(qi.inventory_item_id))
            .map(qi => qi.quotation_id) || []
        );
        filteredQuotations = filteredQuotations.filter(q => validQuotationIds.has(q.id));
      }

      // Filter purchase orders by category
      let filteredPOs = pos.data || [];
      if (hasRestrictions && categoryIds.length > 0) {
        const validPOIds = new Set(
          poItems.data?.filter(pi => validItemIds.includes(pi.inventory_item_id))
            .map(pi => pi.purchase_order_id) || []
        );
        filteredPOs = filteredPOs.filter(p => validPOIds.has(p.id));
      }

      // Filter invoices by category
      let filteredInvoices = invoices.data || [];
      if (hasRestrictions && categoryIds.length > 0) {
        const validInvoiceIds = new Set(
          invoiceItems.data?.filter(ii => validItemIds.includes(ii.inventory_item_id))
            .map(ii => ii.sales_invoice_id) || []
        );
        filteredInvoices = filteredInvoices.filter(inv => validInvoiceIds.has(inv.id));
      }

      if (customers.data) exportToCSV(customers.data, `customers-${new Date().toISOString().split('T')[0]}.csv`);
      if (suppliers.data) exportToCSV(suppliers.data, `suppliers-${new Date().toISOString().split('T')[0]}.csv`);
      if (inventoryData && inventoryData.length > 0) exportToCSV(inventoryData, `inventory-${new Date().toISOString().split('T')[0]}.csv`);
      if (filteredQuotations.length > 0) exportToCSV(filteredQuotations, `quotations-${new Date().toISOString().split('T')[0]}.csv`);
      if (filteredPOs.length > 0) exportToCSV(filteredPOs, `purchase-orders-${new Date().toISOString().split('T')[0]}.csv`);
      if (filteredInvoices.length > 0) exportToCSV(filteredInvoices, `sales-invoices-${new Date().toISOString().split('T')[0]}.csv`);

      toast({ title: 'Success', description: 'All reports exported successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export reports', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSpecificReport = async (reportType: string) => {
    try {
      let data, filename;
      const date = new Date().toISOString().split('T')[0];
      const categoryIds = getCategoryIds();

      // Get filtered inventory items for category restrictions
      let inventoryQuery = supabase.from('inventory_items').select('id, category_id');
      if (hasRestrictions && categoryIds.length > 0) {
        inventoryQuery = inventoryQuery.in('category_id', categoryIds);
      }
      const { data: inventoryItems } = await inventoryQuery;
      const validItemIds = inventoryItems?.map(i => i.id) || [];

      switch (reportType) {
        case 'monthly-sales':
          const { data: salesData } = await supabase
            .from('sales_invoices')
            .select('id, invoice_number, customer_id, grand_total, created_at, status')
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
          
          let filteredSales = salesData || [];
          if (hasRestrictions && categoryIds.length > 0) {
            const { data: invoiceItems } = await supabase
              .from('sales_invoice_items')
              .select('sales_invoice_id, inventory_item_id');
            const validInvoiceIds = new Set(
              invoiceItems?.filter(ii => validItemIds.includes(ii.inventory_item_id))
                .map(ii => ii.sales_invoice_id) || []
            );
            filteredSales = filteredSales.filter(inv => validInvoiceIds.has(inv.id));
          }
          data = filteredSales;
          filename = `monthly-sales-${date}.csv`;
          break;
        case 'customer-performance':
          const { data: customerData } = await supabase
            .from('customers')
            .select('name, email, credit_limit, is_active, created_at');
          data = customerData;
          filename = `customer-performance-${date}.csv`;
          break;
        case 'category-analysis':
          let categoryQuery = supabase
            .from('product_categories')
            .select('name, description, is_active, created_at');
          if (hasRestrictions && categoryIds.length > 0) {
            categoryQuery = categoryQuery.in('id', categoryIds);
          }
          const { data: categoryData } = await categoryQuery;
          data = categoryData;
          filename = `category-analysis-${date}.csv`;
          break;
        case 'stock-levels':
          let stockQuery = supabase
            .from('inventory_items')
            .select('name, quantity, min_stock_level, unit_price, selling_price, location');
          if (hasRestrictions && categoryIds.length > 0) {
            stockQuery = stockQuery.in('category_id', categoryIds);
          }
          const { data: stockData } = await stockQuery;
          data = stockData;
          filename = `stock-levels-${date}.csv`;
          break;
        case 'supplier-performance':
          const { data: supplierData } = await supabase
            .from('suppliers')
            .select('name, email, phone, contact_person, is_active, created_at');
          data = supplierData;
          filename = `supplier-performance-${date}.csv`;
          break;
        case 'po-analysis':
          const { data: poData } = await supabase
            .from('purchase_orders')
            .select('id, order_number, supplier_id, grand_total, status, expected_delivery_date, created_at');
          
          let filteredPOs = poData || [];
          if (hasRestrictions && categoryIds.length > 0) {
            const { data: poItems } = await supabase
              .from('purchase_order_items')
              .select('purchase_order_id, inventory_item_id');
            const validPOIds = new Set(
              poItems?.filter(pi => validItemIds.includes(pi.inventory_item_id))
                .map(pi => pi.purchase_order_id) || []
            );
            filteredPOs = filteredPOs.filter(p => validPOIds.has(p.id));
          }
          data = filteredPOs;
          filename = `purchase-order-analysis-${date}.csv`;
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (data && data.length > 0) {
        exportToCSV(data, filename);
        toast({ title: 'Success', description: 'Report exported successfully' });
      } else {
        toast({ title: 'Info', description: 'No data available for this report' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export report', variant: 'destructive' });
    }
  };

  const handleGenerateCustomReportPDF = async () => {
    if (!customReportType) return;
    setIsExporting(true);
    try {
      const categoryIds = getCategoryIds();

      // Get filtered inventory items for category restrictions
      let inventoryQuery = supabase.from('inventory_items').select('id, category_id');
      if (hasRestrictions && categoryIds.length > 0) {
        inventoryQuery = inventoryQuery.in('category_id', categoryIds);
      }
      const { data: inventoryItems } = await inventoryQuery;
      const validItemIds = inventoryItems?.map(i => i.id) || [];

      // Special handling for detailed quotations report
      if (customReportType === 'quotations') {
        let query = supabase
          .from('quotations')
          .select('*, customers(name), quotation_items(*, inventory_items(name, category_id))')
          .order('created_at', { ascending: true });
        
        if (startDate && endDate) {
          const start = new Date(`${startDate}T00:00:00.000Z`).toISOString();
          const end = new Date(`${endDate}T23:59:59.999Z`).toISOString();
          query = query
            .gte('created_at', start)
            .lte('created_at', end);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Filter quotations by category
        let filteredData = data || [];
        if (hasRestrictions && categoryIds.length > 0) {
          filteredData = filteredData.filter((q: any) => 
            q.quotation_items?.some((item: any) => 
              categoryIds.includes(item.inventory_items?.category_id)
            )
          );
        }
        
        if (filteredData.length > 0) {
          const quotationsData = filteredData.map((q: any) => ({
            quotation_number: q.quotation_number,
            created_at: q.created_at,
            customer_name: q.customers?.name || 'N/A',
            total_amount: q.total_amount,
            discount_type: q.discount_type,
            discount_value: q.discount_value,
            tax_amount: q.tax_amount,
            grand_total: q.grand_total,
            items: q.quotation_items?.filter((item: any) => 
              !hasRestrictions || categoryIds.includes(item.inventory_items?.category_id)
            ).map((item: any) => ({
              name: item.inventory_items?.name || 'N/A',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            })) || []
          }));
          
          generateDetailedQuotationReport({
            title: 'Quotations Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            quotations: quotationsData,
            created_by_name: userFullName || 'N/A'
          });
          
          toast({ title: 'Success', description: 'PDF report generated' });
        } else {
          toast({ title: 'Info', description: 'No quotations found for the selected period' });
        }
      } else if (customReportType === 'inventory') {
        // Special handling for detailed inventory report with category filter
        let query = supabase
          .from('inventory_items')
          .select('*, product_categories(name), suppliers(name)')
          .order('name', { ascending: true });
        
        if (hasRestrictions && categoryIds.length > 0) {
          query = query.in('category_id', categoryIds);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data && data.length > 0) {
          generateDetailedInventoryReport({
            title: 'INVENTORY Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            items: data,
            created_by_name: userFullName || 'N/A'
          });
          
          toast({ title: 'Success', description: 'PDF report generated' });
        } else {
          toast({ title: 'Info', description: 'No inventory items found' });
        }
      } else if (customReportType === 'sales') {
        // Sales invoices with category filter - fetch with customer details
        const { data: invoices } = await supabase
          .from('sales_invoices')
          .select('*, customers(name)');
        
        let filteredData = invoices || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const { data: invoiceItems } = await supabase
            .from('sales_invoice_items')
            .select('sales_invoice_id, inventory_item_id');
          const validInvoiceIds = new Set(
            invoiceItems?.filter(ii => validItemIds.includes(ii.inventory_item_id))
              .map(ii => ii.sales_invoice_id) || []
          );
          filteredData = filteredData.filter(inv => validInvoiceIds.has(inv.id));
        }
        
        if (filteredData.length > 0) {
          const salesData = filteredData.map((inv: any) => ({
            invoice_number: inv.invoice_number,
            created_at: inv.created_at,
            customer_name: inv.customers?.name || 'N/A',
            invoice_type: inv.invoice_type,
            total_amount: inv.total_amount,
            discount_type: inv.discount_type,
            discount_value: inv.discount_value,
            grand_total: inv.grand_total,
            status: inv.status
          }));
          
          generateDetailedSalesReport({
            title: 'SALES Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            invoices: salesData,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'PDF report generated' });
        } else {
          toast({ title: 'Info', description: 'No data available for this report' });
        }
      } else if (customReportType === 'purchase-orders') {
        // Purchase orders with category filter - fetch with supplier details
        const { data: pos } = await supabase
          .from('purchase_orders')
          .select('*, suppliers(name)');
        
        let filteredData = pos || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const { data: poItems } = await supabase
            .from('purchase_order_items')
            .select('purchase_order_id, inventory_item_id');
          const validPOIds = new Set(
            poItems?.filter(pi => validItemIds.includes(pi.inventory_item_id))
              .map(pi => pi.purchase_order_id) || []
          );
          filteredData = filteredData.filter(p => validPOIds.has(p.id));
        }
        
        if (filteredData.length > 0) {
          const poData = filteredData.map((po: any) => ({
            order_number: po.order_number,
            created_at: po.created_at,
            supplier_name: po.suppliers?.name || 'N/A',
            expected_delivery_date: po.expected_delivery_date,
            total_amount: po.total_amount,
            tax_amount: po.tax_amount,
            grand_total: po.grand_total,
            status: po.status
          }));
          
          generateDetailedPOReport({
            title: 'PURCHASE ORDERS Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            orders: poData,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'PDF report generated' });
        } else {
          toast({ title: 'Info', description: 'No data available for this report' });
        }
      } else if (customReportType === 'customers') {
        // Customers report
        const { data, error } = await supabase.from('customers').select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          generateDetailedCustomersReport({
            title: 'CUSTOMERS Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            customers: data,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'PDF report generated' });
        } else {
          toast({ title: 'Info', description: 'No data available for this report' });
        }
      } else if (customReportType === 'suppliers') {
        // Suppliers report
        const { data, error } = await supabase.from('suppliers').select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          generateDetailedSuppliersReport({
            title: 'SUPPLIERS Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            suppliers: data,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'PDF report generated' });
        } else {
          toast({ title: 'Info', description: 'No data available for this report' });
        }
      } else {
        // Default report generation for any other types
        const tableName = customReportType as any;
        const { data, error } = await supabase.from(tableName).select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map(row => headers.map(h => String((row as any)[h] || '')));
          
          generateReportPDF({
            title: `${customReportType.toUpperCase()} Report`,
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            headers,
            rows,
            reportType: customReportType,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'PDF report generated' });
        } else {
          toast({ title: 'Info', description: 'No data available for this report' });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
    setIsExporting(false);
  };

  // Print report function - same logic as PDF but opens for printing
  const handlePrintCustomReport = async () => {
    if (!customReportType) return;
    setIsExporting(true);
    try {
      const categoryIds = getCategoryIds();

      // Get filtered inventory items for category restrictions
      let inventoryQuery = supabase.from('inventory_items').select('id, category_id');
      if (hasRestrictions && categoryIds.length > 0) {
        inventoryQuery = inventoryQuery.in('category_id', categoryIds);
      }
      const { data: inventoryItems } = await inventoryQuery;
      const validItemIds = inventoryItems?.map(i => i.id) || [];

      if (customReportType === 'quotations') {
        let query = supabase
          .from('quotations')
          .select('*, customers(name), quotation_items(*, inventory_items(name, category_id))')
          .order('created_at', { ascending: true });
        
        if (startDate && endDate) {
          const start = new Date(`${startDate}T00:00:00.000Z`).toISOString();
          const end = new Date(`${endDate}T23:59:59.999Z`).toISOString();
          query = query.gte('created_at', start).lte('created_at', end);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        let filteredData = data || [];
        if (hasRestrictions && categoryIds.length > 0) {
          filteredData = filteredData.filter((q: any) => 
            q.quotation_items?.some((item: any) => 
              categoryIds.includes(item.inventory_items?.category_id)
            )
          );
        }
        
        if (filteredData.length > 0) {
          const quotationsData = filteredData.map((q: any) => ({
            quotation_number: q.quotation_number,
            created_at: q.created_at,
            customer_name: q.customers?.name || 'N/A',
            total_amount: q.total_amount,
            discount_type: q.discount_type,
            discount_value: q.discount_value,
            tax_amount: q.tax_amount,
            grand_total: q.grand_total,
            items: q.quotation_items?.filter((item: any) => 
              !hasRestrictions || categoryIds.includes(item.inventory_items?.category_id)
            ).map((item: any) => ({
              name: item.inventory_items?.name || 'N/A',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            })) || []
          }));
          
          printDetailedQuotationReport({
            title: 'Quotations Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            quotations: quotationsData,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'Report opened for printing' });
        } else {
          toast({ title: 'Info', description: 'No quotations found' });
        }
      } else if (customReportType === 'inventory') {
        let query = supabase
          .from('inventory_items')
          .select('*, product_categories(name), suppliers(name)')
          .order('name', { ascending: true });
        
        if (hasRestrictions && categoryIds.length > 0) {
          query = query.in('category_id', categoryIds);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data && data.length > 0) {
          printDetailedInventoryReport({
            title: 'INVENTORY Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            items: data,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'Report opened for printing' });
        } else {
          toast({ title: 'Info', description: 'No inventory items found' });
        }
      } else if (customReportType === 'sales') {
        const { data: invoices } = await supabase
          .from('sales_invoices')
          .select('*, customers(name)');
        
        let filteredData = invoices || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const { data: invoiceItems } = await supabase
            .from('sales_invoice_items')
            .select('sales_invoice_id, inventory_item_id');
          const validInvoiceIds = new Set(
            invoiceItems?.filter(ii => validItemIds.includes(ii.inventory_item_id))
              .map(ii => ii.sales_invoice_id) || []
          );
          filteredData = filteredData.filter(inv => validInvoiceIds.has(inv.id));
        }
        
        if (filteredData.length > 0) {
          const salesData = filteredData.map((inv: any) => ({
            invoice_number: inv.invoice_number,
            created_at: inv.created_at,
            customer_name: inv.customers?.name || 'N/A',
            invoice_type: inv.invoice_type,
            total_amount: inv.total_amount,
            discount_type: inv.discount_type,
            discount_value: inv.discount_value,
            grand_total: inv.grand_total,
            status: inv.status
          }));
          
          printDetailedSalesReport({
            title: 'SALES Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            invoices: salesData,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'Report opened for printing' });
        } else {
          toast({ title: 'Info', description: 'No data available' });
        }
      } else if (customReportType === 'purchase-orders') {
        const { data: pos } = await supabase
          .from('purchase_orders')
          .select('*, suppliers(name)');
        
        let filteredData = pos || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const { data: poItems } = await supabase
            .from('purchase_order_items')
            .select('purchase_order_id, inventory_item_id');
          const validPOIds = new Set(
            poItems?.filter(pi => validItemIds.includes(pi.inventory_item_id))
              .map(pi => pi.purchase_order_id) || []
          );
          filteredData = filteredData.filter(p => validPOIds.has(p.id));
        }
        
        if (filteredData.length > 0) {
          const poData = filteredData.map((po: any) => ({
            order_number: po.order_number,
            created_at: po.created_at,
            supplier_name: po.suppliers?.name || 'N/A',
            expected_delivery_date: po.expected_delivery_date,
            total_amount: po.total_amount,
            tax_amount: po.tax_amount,
            grand_total: po.grand_total,
            status: po.status
          }));
          
          printDetailedPOReport({
            title: 'PURCHASE ORDERS Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            orders: poData,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'Report opened for printing' });
        } else {
          toast({ title: 'Info', description: 'No data available' });
        }
      } else if (customReportType === 'customers') {
        const { data, error } = await supabase.from('customers').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          printDetailedCustomersReport({
            title: 'CUSTOMERS Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            customers: data,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'Report opened for printing' });
        } else {
          toast({ title: 'Info', description: 'No data available' });
        }
      } else if (customReportType === 'suppliers') {
        const { data, error } = await supabase.from('suppliers').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          printDetailedSuppliersReport({
            title: 'SUPPLIERS Report',
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            suppliers: data,
            created_by_name: userFullName || 'N/A'
          });
          toast({ title: 'Success', description: 'Report opened for printing' });
        } else {
          toast({ title: 'Info', description: 'No data available' });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate print report', variant: 'destructive' });
    }
    setIsExporting(false);
  };

  // Print delivery notes report
  const handlePrintDeliveryNotesReport = () => {
    if (deliveryNotes.length === 0) {
      toast({ title: 'Info', description: 'No data to print' });
      return;
    }
    const dnData = deliveryNotes.map(dn => ({
      delivery_note_number: dn.delivery_note_number,
      delivery_note_date: dn.delivery_note_date,
      customer_name: dn.customer?.name || '-',
      invoice_number: dn.sales_invoice?.invoice_number || '-',
      warranty_type: dn.warranty_type || '-',
      driver_name: dn.driver_name || '-',
      status: dn.status
    }));
    
    printDetailedDeliveryNotesReport({
      title: 'DELIVERY NOTES Report',
      dateRange: dnStartDate && dnEndDate ? `${dnStartDate} to ${dnEndDate}` : undefined,
      deliveryNotes: dnData,
      created_by_name: userFullName || 'N/A'
    });
    toast({ title: 'Success', description: 'Report opened for printing' });
  };

  const handleGenerateCustomReportCSV = async () => {
    if (!customReportType) return;
    setIsExporting(true);
    try {
      const categoryIds = getCategoryIds();

      // Get filtered inventory items for category restrictions
      let inventoryQuery = supabase.from('inventory_items').select('id, category_id');
      if (hasRestrictions && categoryIds.length > 0) {
        inventoryQuery = inventoryQuery.in('category_id', categoryIds);
      }
      const { data: inventoryItems } = await inventoryQuery;
      const validItemIds = inventoryItems?.map(i => i.id) || [];

      let data: any[] = [];
      
      if (customReportType === 'inventory') {
        let query = supabase.from('inventory_items').select('*');
        if (hasRestrictions && categoryIds.length > 0) {
          query = query.in('category_id', categoryIds);
        }
        const { data: invData, error } = await query;
        if (error) throw error;
        data = invData || [];
      } else if (customReportType === 'quotations') {
        const { data: quotations } = await supabase.from('quotations').select('*');
        data = quotations || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const { data: quotationItems } = await supabase
            .from('quotation_items')
            .select('quotation_id, inventory_item_id');
          const validQuotationIds = new Set(
            quotationItems?.filter(qi => validItemIds.includes(qi.inventory_item_id))
              .map(qi => qi.quotation_id) || []
          );
          data = data.filter(q => validQuotationIds.has(q.id));
        }
      } else if (customReportType === 'sales') {
        const { data: invoices } = await supabase.from('sales_invoices').select('*');
        data = invoices || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const { data: invoiceItems } = await supabase
            .from('sales_invoice_items')
            .select('sales_invoice_id, inventory_item_id');
          const validInvoiceIds = new Set(
            invoiceItems?.filter(ii => validItemIds.includes(ii.inventory_item_id))
              .map(ii => ii.sales_invoice_id) || []
          );
          data = data.filter(inv => validInvoiceIds.has(inv.id));
        }
      } else if (customReportType === 'purchase-orders') {
        const { data: pos } = await supabase.from('purchase_orders').select('*');
        data = pos || [];
        if (hasRestrictions && categoryIds.length > 0) {
          const { data: poItems } = await supabase
            .from('purchase_order_items')
            .select('purchase_order_id, inventory_item_id');
          const validPOIds = new Set(
            poItems?.filter(pi => validItemIds.includes(pi.inventory_item_id))
              .map(pi => pi.purchase_order_id) || []
          );
          data = data.filter(p => validPOIds.has(p.id));
        }
      } else {
        const tableName = customReportType as any;
        const { data: tableData, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        data = tableData || [];
      }

      if (data.length > 0) {
        exportToCSV(data, `${customReportType}-${new Date().toISOString().split('T')[0]}.csv`);
        toast({ title: 'Success', description: 'CSV exported' });
      } else {
        toast({ title: 'Info', description: 'No data available for this report' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export CSV', variant: 'destructive' });
    }
    setIsExporting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Business insights and performance metrics</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={handleExportAll}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Reports'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalRevenue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">From paid invoices</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">All sales invoices</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quotations</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuotations}</div>
              <p className="text-xs text-muted-foreground">Total quotations</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Notes</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveryNotes}</div>
              <p className="text-xs text-muted-foreground">Total delivery notes</p>
            </CardContent>
          </Card>
        </div>

        {/* Category-Specific Reports Section */}
        {(isAdmin || userCategories.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Category Reports
              </CardTitle>
              <CardDescription>Statistics by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(hasRestrictions ? userCategories : categories).map(cat => {
                  const stats = categoryStats[cat.id] || { items: 0, quotations: 0, invoices: 0 };
                  const catConfig: {[key: string]: {icon: any, color: string, bgColor: string}} = {
                    'مولدات كهربائية': { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
                    'معدات ثقيلة': { icon: Truck, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
                    'حراثات زراعية': { icon: Tractor, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
                  };
                  const config = catConfig[cat.name] || { icon: BarChart3, color: 'text-primary', bgColor: 'bg-primary/10' };
                  const IconComponent = config.icon;
                  
                  return (
                    <Card key={cat.id} className={`${config.bgColor} border-0`}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium flex items-center gap-2 ${config.color}`}>
                          <IconComponent className="h-4 w-4" />
                          {cat.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xl font-bold">{stats.items}</div>
                            <p className="text-xs text-muted-foreground">Items</p>
                          </div>
                          <div>
                            <div className="text-xl font-bold">{stats.quotations}</div>
                            <p className="text-xs text-muted-foreground">Quotations</p>
                          </div>
                          <div>
                            <div className="text-xl font-bold">{stats.invoices}</div>
                            <p className="text-xs text-muted-foreground">Invoices</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Reports</CardTitle>
              <CardDescription>Revenue and performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSpecificReport('monthly-sales')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Monthly Sales Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSpecificReport('customer-performance')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Customer Performance Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSpecificReport('category-analysis')}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Product Category Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>Stock and procurement analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSpecificReport('stock-levels')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Stock Level Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSpecificReport('supplier-performance')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Supplier Performance
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSpecificReport('po-analysis')}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Purchase Order Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Notes Report Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Notes Report
            </CardTitle>
            <CardDescription>Search and filter delivery notes by date, customer, and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>From Date</Label>
                  <Input 
                    type="date" 
                    value={dnStartDate}
                    onChange={(e) => setDnStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input 
                    type="date" 
                    value={dnEndDate}
                    onChange={(e) => setDnEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Customer</Label>
                  <Select value={dnCustomerId} onValueChange={setDnCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={dnStatus} onValueChange={setDnStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={fetchDeliveryNotes} disabled={loadingDeliveryNotes}>
                  {loadingDeliveryNotes ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="outline" onClick={handleExportDeliveryNotesCSV} disabled={deliveryNotes.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportDeliveryNotesPDF} disabled={deliveryNotes.length === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={handlePrintDeliveryNotesReport} disabled={deliveryNotes.length === 0}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>

              {deliveryNotes.length > 0 && (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invoice Ref.</TableHead>
                        <TableHead>Driver</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryNotes.map((dn) => (
                        <TableRow key={dn.id}>
                          <TableCell className="font-medium">{dn.delivery_note_number}</TableCell>
                          <TableCell>{dn.delivery_note_date}</TableCell>
                          <TableCell>{dn.customer?.name}</TableCell>
                          <TableCell>
                            <Badge variant={dn.status === 'delivered' ? 'default' : dn.status === 'cancelled' ? 'destructive' : 'outline'}>
                              {dn.status === 'pending' ? 'Pending' : dn.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                            </Badge>
                          </TableCell>
                          <TableCell>{dn.sales_invoice?.invoice_number || '-'}</TableCell>
                          <TableCell>{dn.driver_name || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Reports</CardTitle>
            <CardDescription>Generate custom reports with date range filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={customReportType} onValueChange={setCustomReportType}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="inventory">Inventory Report</SelectItem>
                      <SelectItem value="purchase-orders">Purchase Orders Report</SelectItem>
                      <SelectItem value="quotations">Quotations Report</SelectItem>
                      <SelectItem value="customers">Customer Report</SelectItem>
                      <SelectItem value="suppliers">Supplier Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={handleGenerateCustomReportPDF}
                  disabled={!customReportType || isExporting}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF
                </Button>
                <Button 
                  onClick={handlePrintCustomReport}
                  disabled={!customReportType || isExporting}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
                <Button 
                  onClick={handleGenerateCustomReportCSV}
                  disabled={!customReportType || isExporting}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;