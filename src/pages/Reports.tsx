import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, TrendingUp, PieChart, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/utils/csvExport";
import { generateReportPDF } from "@/utils/reportPdfExport";

const Reports = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [customReportType, setCustomReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const { toast } = useToast();

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
      const tableName = customReportType === 'sales' ? 'sales_invoices' as const : 
                        customReportType === 'purchase-orders' ? 'purchase_orders' as const :
                        customReportType as any;
      const { data } = await supabase.from(tableName).select('*');
      
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => String((row as any)[h] || '')));
        
        // Map report types to match serial number formats
        let reportType = customReportType;
        if (customReportType === 'sales') reportType = 'sales';
        else if (customReportType === 'inventory') reportType = 'inventory';
        else if (customReportType === 'purchase-orders') reportType = 'purchase_orders';
        else if (customReportType === 'quotations') reportType = 'quotations';
        
        generateReportPDF({
          title: `${customReportType.toUpperCase()} Report`,
          dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
          headers,
          rows,
          reportType
        });
        toast({ title: 'Success', description: 'PDF report generated' });
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
                        customReportType as any;
      const { data } = await supabase.from(tableName).select('*');
      if (data) {
        exportToCSV(data, `${customReportType}-${new Date().toISOString().split('T')[0]}.csv`);
        toast({ title: 'Success', description: 'CSV exported' });
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$248K</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">+18%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15.3%</div>
              <p className="text-xs text-muted-foreground">Year over year</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <PieChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.8%</div>
              <p className="text-xs text-muted-foreground">Above industry avg</p>
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