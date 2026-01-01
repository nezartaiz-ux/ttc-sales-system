import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, TrendingUp, PieChart, FileText, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/utils/csvExport";
import { generateReportPDF, generateDetailedQuotationReport } from "@/utils/reportPdfExport";
import { useAuth } from "@/contexts/AuthContext";
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

  // Fetch user's full name
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        if (data) setUserFullName(data.full_name);
      }
    };
    fetchUserInfo();
  }, [user]);

  // Fetch summary data
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const [invoicesRes, quotationsRes, deliveryNotesRes, customersRes] = await Promise.all([
          supabase.from('sales_invoices').select('grand_total, status'),
          supabase.from('quotations').select('id'),
          supabase.from('delivery_notes').select('id'),
          supabase.from('customers').select('id, name').eq('is_active', true).order('name')
        ]);
        
        if (invoicesRes.data) {
          setTotalInvoices(invoicesRes.data.length);
          const paidRevenue = invoicesRes.data
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
          setTotalRevenue(paidRevenue);
        }
        
        if (quotationsRes.data) {
          setTotalQuotations(quotationsRes.data.length);
        }
        
        if (deliveryNotesRes.data) {
          setTotalDeliveryNotes(deliveryNotesRes.data.length);
        }
        
        if (customersRes.data) {
          setCustomers(customersRes.data);
        }
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };
    fetchSummaryData();
  }, []);

  // Fetch delivery notes with filters
  const fetchDeliveryNotes = async () => {
    setLoadingDeliveryNotes(true);
    try {
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
        query = query.eq('status', dnStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setDeliveryNotes(data || []);
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

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const [customers, suppliers, inventory, quotations, pos, invoices] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('quotations').select('*'),
        supabase.from('purchase_orders').select('*'),
        supabase.from('sales_invoices').select('*')
      ]);

      if (customers.data) exportToCSV(customers.data, `customers-${new Date().toISOString().split('T')[0]}.csv`);
      if (suppliers.data) exportToCSV(suppliers.data, `suppliers-${new Date().toISOString().split('T')[0]}.csv`);
      if (inventory.data) exportToCSV(inventory.data, `inventory-${new Date().toISOString().split('T')[0]}.csv`);
      if (quotations.data) exportToCSV(quotations.data, `quotations-${new Date().toISOString().split('T')[0]}.csv`);
      if (pos.data) exportToCSV(pos.data, `purchase-orders-${new Date().toISOString().split('T')[0]}.csv`);
      if (invoices.data) exportToCSV(invoices.data, `sales-invoices-${new Date().toISOString().split('T')[0]}.csv`);

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

      switch (reportType) {
        case 'monthly-sales':
          const { data: salesData } = await supabase
            .from('sales_invoices')
            .select('invoice_number, customer_id, grand_total, created_at, status')
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
          data = salesData;
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
          const { data: categoryData } = await supabase
            .from('product_categories')
            .select('name, description, is_active, created_at');
          data = categoryData;
          filename = `category-analysis-${date}.csv`;
          break;
        case 'stock-levels':
          const { data: stockData } = await supabase
            .from('inventory_items')
            .select('name, quantity, min_stock_level, unit_price, selling_price, location');
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
            .select('order_number, supplier_id, grand_total, status, expected_delivery_date, created_at');
          data = poData;
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
      // Special handling for detailed quotations report
      if (customReportType === 'quotations') {
        let query = supabase
          .from('quotations')
          .select('*, customers(name), quotation_items(*, inventory_items(name))')
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
        if (data && data.length > 0) {
          const quotationsData = data.map((q: any) => ({
            quotation_number: q.quotation_number,
            created_at: q.created_at,
            customer_name: q.customers?.name || 'N/A',
            total_amount: q.total_amount,
            discount_type: q.discount_type,
            discount_value: q.discount_value,
            tax_amount: q.tax_amount,
            grand_total: q.grand_total,
            items: q.quotation_items?.map((item: any) => ({
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
      } else {
        // Default report generation for other types
        const tableName = customReportType === 'sales' ? 'sales_invoices' as const : 
                          customReportType === 'purchase-orders' ? 'purchase_orders' as const :
                          customReportType === 'inventory' ? 'inventory_items' as const :
                          customReportType as any;
        const { data, error } = await supabase.from(tableName).select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map(row => headers.map(h => String((row as any)[h] || '')));
          
          // Map report types to match serial number formats
          let reportType = customReportType;
          if (customReportType === 'sales') reportType = 'sales';
          else if (customReportType === 'inventory') reportType = 'inventory';
          else if (customReportType === 'purchase-orders') reportType = 'purchase_orders';
          
          generateReportPDF({
            title: `${customReportType.toUpperCase()} Report`,
            dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
            headers,
            rows,
            reportType,
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

  const handleGenerateCustomReportCSV = async () => {
    if (!customReportType) return;
    setIsExporting(true);
    try {
      const tableName = customReportType === 'sales' ? 'sales_invoices' as const : 
                        customReportType === 'purchase-orders' ? 'purchase_orders' as const :
                        customReportType === 'inventory' ? 'inventory_items' as const :
                        customReportType as any;
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      if (data && data.length > 0) {
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
              <div className="flex gap-2">
                <Button onClick={fetchDeliveryNotes} disabled={loadingDeliveryNotes}>
                  {loadingDeliveryNotes ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="outline" onClick={handleExportDeliveryNotesCSV} disabled={deliveryNotes.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
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
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateCustomReportPDF}
                  disabled={!customReportType || isExporting}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF Report
                </Button>
                <Button 
                  onClick={handleGenerateCustomReportCSV}
                  disabled={!customReportType || isExporting}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
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