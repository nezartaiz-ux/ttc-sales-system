import { TourStep } from './GuidedTour';

// Dashboard page tour
export const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar-logo"]',
    title: 'Welcome to Tehama Sales System',
    content: 'This is your comprehensive sales management system. Use the sidebar to navigate between different modules.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: 'Dashboard',
    content: 'View your sales overview, recent activities, and key performance metrics at a glance.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-customers"]',
    title: 'Customer Management',
    content: 'Manage all your customers, track their information, credit limits, and purchase history.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-inventory"]',
    title: 'Inventory & Stock',
    content: 'Track your products, manage stock levels, and get alerts when items are running low.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-quotations"]',
    title: 'Quotations',
    content: 'Create and manage quotations for your customers. Track their status and convert them to invoices.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-invoices"]',
    title: 'Sales Invoices',
    content: 'Generate sales invoices, manage payments, and track outstanding amounts.',
    placement: 'right',
  },
  {
    target: '[data-tour="header-user"]',
    title: 'Your Profile',
    content: 'View your profile information and access account settings here.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="header-help"]',
    title: 'Need Help?',
    content: 'Click this button anytime to restart the tutorial and learn about system features.',
    placement: 'bottom',
  },
];

// Customers page tour
export const customersTourSteps: TourStep[] = [
  {
    target: '[data-tour="add-customer-btn"]',
    title: 'Add New Customer',
    content: 'Click here to add a new customer to your database with their contact details and credit limit.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search-input"]',
    title: 'Search Customers',
    content: 'Quickly find customers by name, email, or phone number using this search box.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="customers-table"]',
    title: 'Customer List',
    content: 'View all your customers here. Click on any row to see details, edit, or delete a customer.',
    placement: 'top',
  },
];

// Inventory page tour
export const inventoryTourSteps: TourStep[] = [
  {
    target: '[data-tour="add-item-btn"]',
    title: 'Add New Item',
    content: 'Add new products to your inventory with pricing, stock levels, and category information.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="category-filter"]',
    title: 'Filter by Category',
    content: 'Filter items by category to quickly find what you need.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="inventory-table"]',
    title: 'Inventory List',
    content: 'View all your inventory items. Items with low stock will be highlighted for your attention.',
    placement: 'top',
  },
];

// Quotations page tour
export const quotationsTourSteps: TourStep[] = [
  {
    target: '[data-tour="create-quotation-btn"]',
    title: 'Create Quotation',
    content: 'Create a new quotation for a customer. Select items, set prices, and add terms and conditions.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="quotations-table"]',
    title: 'Quotation List',
    content: 'View all quotations with their status. You can view, edit, convert to invoice, or generate PDF.',
    placement: 'top',
  },
];

// Sales Invoices page tour
export const salesInvoicesTourSteps: TourStep[] = [
  {
    target: '[data-tour="create-invoice-btn"]',
    title: 'Create Invoice',
    content: 'Generate a new sales invoice. You can create from scratch or convert from an existing quotation.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="invoices-table"]',
    title: 'Invoice List',
    content: 'Manage all your invoices here. Track payment status and generate PDF documents.',
    placement: 'top',
  },
];

// Purchase Orders page tour
export const purchaseOrdersTourSteps: TourStep[] = [
  {
    target: '[data-tour="create-po-btn"]',
    title: 'Create Purchase Order',
    content: 'Create new purchase orders to replenish your inventory from suppliers.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="po-table"]',
    title: 'Purchase Order List',
    content: 'Track all your purchase orders and their delivery status.',
    placement: 'top',
  },
];

// Delivery Notes page tour
export const deliveryNotesTourSteps: TourStep[] = [
  {
    target: '[data-tour="create-dn-btn"]',
    title: 'Create Delivery Note',
    content: 'Generate delivery notes for shipments to your customers.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dn-table"]',
    title: 'Delivery Notes List',
    content: 'View and manage all delivery notes. Track delivery status and generate PDF documents.',
    placement: 'top',
  },
];

// Reports page tour
export const reportsTourSteps: TourStep[] = [
  {
    target: '[data-tour="report-type-select"]',
    title: 'Select Report Type',
    content: 'Choose the type of report you want to generate - sales, inventory, quotations, and more.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="date-range"]',
    title: 'Date Range',
    content: 'Set the date range for your report to analyze specific time periods.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="generate-report-btn"]',
    title: 'Generate Report',
    content: 'Click to generate your report. You can then export it to PDF or print directly.',
    placement: 'bottom',
  },
];

// Settings page tour
export const settingsTourSteps: TourStep[] = [
  {
    target: '[data-tour="user-management"]',
    title: 'User Management',
    content: 'Manage system users, create new accounts, and reset passwords (Admin only).',
    placement: 'right',
  },
  {
    target: '[data-tour="permissions"]',
    title: 'Permissions',
    content: 'Control what each user can access and modify in the system.',
    placement: 'right',
  },
];

// Get tour steps based on current route
export const getTourStepsForRoute = (pathname: string): TourStep[] => {
  switch (pathname) {
    case '/':
      return dashboardTourSteps;
    case '/customers':
      return customersTourSteps;
    case '/inventory':
      return inventoryTourSteps;
    case '/quotations':
      return quotationsTourSteps;
    case '/sales-invoices':
      return salesInvoicesTourSteps;
    case '/purchase-orders':
      return purchaseOrdersTourSteps;
    case '/delivery-notes':
      return deliveryNotesTourSteps;
    case '/reports':
      return reportsTourSteps;
    case '/settings':
      return settingsTourSteps;
    default:
      return [];
  }
};
