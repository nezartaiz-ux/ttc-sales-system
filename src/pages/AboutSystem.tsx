import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Users,
  Package,
  FileText,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  Image,
  FileSpreadsheet,
  Shield,
  Zap,
  Globe,
  Lock,
  CheckCircle2,
  Building2,
  UserCheck,
  Boxes,
  Tags,
  Receipt,
  ClipboardList,
} from "lucide-react";

const AboutSystem = () => {
  const modules = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Dashboard",
      description: "Central hub displaying real-time statistics, performance charts, stock levels, and quick action buttons for efficient navigation.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Customer Management",
      description: "Complete customer database with contact info, credit limits, activity status, and transaction history tracking.",
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Supplier Management",
      description: "Manage supplier relationships, contact details, and link suppliers to inventory items for streamlined procurement.",
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Inventory Management",
      description: "Full stock control with SKU tracking, batch numbers, minimum stock alerts, pricing, and location management.",
    },
    {
      icon: <Tags className="h-6 w-6" />,
      title: "Category Management",
      description: "Organize products into categories like Generators, Equipment, and Tractors for better inventory organization.",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Quotations",
      description: "Create professional quotations with automatic numbering, tax calculations, validity periods, and PDF export.",
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "Purchase Orders",
      description: "Manage procurement with supplier orders, expected delivery dates, customs status, and order tracking.",
    },
    {
      icon: <Receipt className="h-6 w-6" />,
      title: "Sales Invoices",
      description: "Generate cash or credit invoices with automatic calculations, payment terms, and conversion from quotations.",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Delivery Notes",
      description: "Track deliveries with driver info, transport details, warranty types, and link to sales invoices.",
    },
    {
      icon: <ClipboardList className="h-6 w-6" />,
      title: "Reports",
      description: "Comprehensive reporting with PDF/CSV export for sales, inventory, customers, suppliers, and delivery notes.",
    },
    {
      icon: <Image className="h-6 w-6" />,
      title: "Image Gallery",
      description: "Visual catalog of equipment and products organized by category for easy reference and sharing.",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6" />,
      title: "Technical Datasheets",
      description: "Store and manage technical specifications and documentation for products and equipment.",
    },
  ];

  const userRoles = [
    {
      role: "Administrator",
      description: "Full system access including user management and settings",
      color: "bg-red-500",
    },
    {
      role: "Sales Staff",
      description: "Manage customers, quotations, and sales invoices",
      color: "bg-blue-500",
    },
    {
      role: "Inventory Staff",
      description: "Handle inventory, categories, and purchase orders",
      color: "bg-green-500",
    },
    {
      role: "Accountant",
      description: "Access to invoices and financial reports",
      color: "bg-purple-500",
    },
    {
      role: "Management",
      description: "View-only access to all reports and statistics",
      color: "bg-orange-500",
    },
  ];

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Automation",
      items: [
        "Auto-generated document numbers",
        "Automatic tax & discount calculations",
        "Real-time stock updates",
        "Low stock alerts",
      ],
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Security",
      items: [
        "Role-based access control",
        "Row-level security policies",
        "Encrypted connections",
        "Secure authentication",
      ],
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Cloud-Based",
      items: [
        "Access from anywhere",
        "Automatic backups",
        "No installation required",
        "Cross-device compatibility",
      ],
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Integration",
      items: [
        "Quotation to invoice conversion",
        "Invoice to delivery note linking",
        "Supplier-item associations",
        "Category-based filtering",
      ],
    },
  ];

  const problems = [
    { problem: "Scattered data across files and papers", solution: "Centralized unified database" },
    { problem: "Difficulty tracking inventory levels", solution: "Real-time stock monitoring with alerts" },
    { problem: "Slow quotation and invoice creation", solution: "One-click document generation with templates" },
    { problem: "Lost customer and supplier records", solution: "Organized digital records with search" },
    { problem: "No accurate management reports", solution: "Comprehensive exportable reports" },
    { problem: "Complex tax and discount calculations", solution: "Automatic precise calculations" },
    { problem: "No employee access control", solution: "Multi-level permission system" },
    { problem: "Difficulty tracking purchase orders", solution: "Full order status tracking" },
  ];

  return (
    <DashboardLayout>
      <ScrollArea className="h-[calc(100vh-2rem)]">
        <div className="space-y-8 p-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <h1 className="text-4xl font-bold text-primary">
              Tehama Sales System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive business management solution designed for efficient sales, 
              inventory, and procurement operations with a modern, user-friendly interface.
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-sm">Version 1.0</Badge>
              <Badge variant="outline" className="text-sm">Cloud-Based</Badge>
              <Badge variant="outline" className="text-sm">Arabic & English</Badge>
            </div>
          </div>

          <Separator />

          {/* Vision & Mission */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To provide an integrated system that helps companies and organizations 
                  manage their business operations with high efficiency and maximize the 
                  benefit from their resources.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simplifying complex business operations and providing smart tools 
                  for making informed decisions based on accurate data.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Problems & Solutions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Problems We Solve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {problems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="text-destructive font-semibold text-sm">✗</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm line-through text-muted-foreground">
                        {item.problem}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <p className="text-sm text-foreground">{item.solution}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">System Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-all hover:border-primary/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {module.icon}
                      </div>
                      <h3 className="font-semibold">{module.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Lock className="h-6 w-6" />
                User Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userRoles.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <h3 className="font-semibold">{item.role}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      {feature.icon}
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {feature.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Technical Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Supported Browsers</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Google Chrome 90+</li>
                    <li>• Mozilla Firefox 88+</li>
                    <li>• Microsoft Edge 90+</li>
                    <li>• Safari 14+</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Connection Requirements</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Stable internet connection</li>
                    <li>• Minimum 2 Mbps speed</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Supported Devices</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Desktop computers</li>
                    <li>• Laptops</li>
                    <li>• Tablets</li>
                    <li>• Smartphones</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 space-y-4 border-t">
            <div className="flex items-center justify-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-semibold">Designed & Developed by</span>
            </div>
            <p className="text-xl font-bold text-primary">
              Dev-Art for Technology Solutions
            </p>
            <p className="text-sm text-muted-foreground">
              © 2026 All Rights Reserved
            </p>
            <blockquote className="italic text-muted-foreground max-w-md mx-auto">
              "A smart system is one that makes work easier, not more complex."
            </blockquote>
          </div>
        </div>
      </ScrollArea>
    </DashboardLayout>
  );
};

export default AboutSystem;
