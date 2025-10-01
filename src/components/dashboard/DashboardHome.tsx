import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Users, 
  FileText, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Truck
} from "lucide-react";
import { CreateQuotationModal } from "@/components/modals/CreateQuotationModal";
import { CreatePOModal } from "@/components/modals/CreatePOModal";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-accent/10 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to Trade Flow System
        </h1>
        <p className="text-muted-foreground">
          Managing CAT gensets, heavy equipment, and Massey Ferguson agricultural tractors
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent">+5</span> new this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotations</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">7</span> expiring soon
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$248K</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="p-4 cursor-pointer hover:bg-accent/10 transition-colors border-primary/20"
                onClick={() => setIsQuotationModalOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">New Quotation</h3>
                    <p className="text-xs text-muted-foreground">Create quote</p>
                  </div>
                </div>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:bg-accent/10 transition-colors border-accent/20"
                onClick={() => setIsPOModalOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-8 w-8 text-accent" />
                  <div>
                    <h3 className="font-medium">Purchase Order</h3>
                    <p className="text-xs text-muted-foreground">Order supplies</p>
                  </div>
                </div>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:bg-primary/10 transition-colors border-primary/20"
                onClick={() => setIsInventoryModalOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">Add Inventory</h3>
                    <p className="text-xs text-muted-foreground">New items</p>
                  </div>
                </div>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:bg-accent/10 transition-colors border-accent/20"
                onClick={() => setIsCustomerModalOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-accent" />
                  <div>
                    <h3 className="font-medium">Add Customer</h3>
                    <p className="text-xs text-muted-foreground">New client</p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Important notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">
                    5 items below minimum level
                  </p>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Urgent
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Expiring Quotations</p>
                  <p className="text-xs text-muted-foreground">
                    7 quotations expire within 3 days
                  </p>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                  Review
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <Truck className="h-5 w-5 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pending Deliveries</p>
                  <p className="text-xs text-muted-foreground">
                    3 purchase orders awaiting delivery
                  </p>
                </div>
                <Badge variant="outline" className="text-accent border-accent">
                  Track
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateQuotationModal
        open={isQuotationModalOpen}
        onOpenChange={setIsQuotationModalOpen}
        onSuccess={() => navigate('/quotations')}
      />
      <CreatePOModal
        open={isPOModalOpen}
        onOpenChange={setIsPOModalOpen}
        onSuccess={() => navigate('/purchase-orders')}
      />
      <AddItemModal
        open={isInventoryModalOpen}
        onOpenChange={setIsInventoryModalOpen}
        onSuccess={() => navigate('/inventory')}
      />
      <AddCustomerModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        onSuccess={() => navigate('/customers')}
      />
    </div>
  );
};