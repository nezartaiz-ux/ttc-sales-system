import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import mfLogo from '@/assets/mf-logo.png';
import tehamaLogo from '@/assets/tehama-logo.png';

// Company information
const COMPANY_INFO = {
  name: "CAT Company",
  address: "Sana'a Branch",
  city: "Sana'a, Yemen"
};

// Helper function to add header with logo and company info
const addPDFHeader = (doc: jsPDF, isCat: boolean = true) => {
  // Company info on top-left
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 14, 21);
  doc.text(COMPANY_INFO.city, 14, 26);
  
  // Logo on top-right
  const logo = isCat ? tehamaLogo : mfLogo;
  try {
    doc.addImage(logo, 'PNG', 160, 10, 35, 20);
  } catch (e) {
    console.error('Error adding logo to PDF:', e);
  }
  
  return 35; // Return Y position where content should start
};

interface QuotationData {
  quotation_number: string;
  customer_name: string;
  validity_period: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  notes?: string;
}

interface POData {
  order_number: string;
  supplier_name: string;
  expected_delivery_date: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  notes?: string;
}

export const generateQuotationPDF = (data: QuotationData) => {
  const doc = new jsPDF();
  
  // Add header with logo and company info
  addPDFHeader(doc, true);
  
  // Document title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 105, 45, { align: 'center' });
  
  // Quotation details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quotation #: ${data.quotation_number}`, 14, 58);
  doc.text(`Customer: ${data.customer_name}`, 14, 65);
  doc.text(`Valid Until: ${data.validity_period}`, 14, 72);
  
  // Items table
  autoTable(doc, {
    startY: 80,
    head: [['Item', 'Quantity', 'Unit Price', 'Total']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`
    ]),
    foot: [
      ['', '', 'Subtotal:', `$${data.total_amount.toFixed(2)}`],
      ['', '', 'Tax:', `$${data.tax_amount.toFixed(2)}`],
      ['', '', 'Grand Total:', `$${data.grand_total.toFixed(2)}`]
    ],
    showFoot: 'lastPage'
  });
  
  // Notes
  if (data.notes) {
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(10);
    doc.text(`Notes: ${data.notes}`, 14, finalY + 10);
  }
  
  doc.save(`quotation-${data.quotation_number}.pdf`);
};

export const generatePOPDF = (data: POData) => {
  const doc = new jsPDF();
  
  // Add header with logo and company info
  addPDFHeader(doc, true);
  
  // Document title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', 105, 45, { align: 'center' });
  
  // PO details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`PO #: ${data.order_number}`, 14, 58);
  doc.text(`Supplier: ${data.supplier_name}`, 14, 65);
  doc.text(`Expected Delivery: ${data.expected_delivery_date}`, 14, 72);
  
  // Items table
  autoTable(doc, {
    startY: 80,
    head: [['Item', 'Quantity', 'Unit Price', 'Total']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`
    ]),
    foot: [
      ['', '', 'Subtotal:', `$${data.total_amount.toFixed(2)}`],
      ['', '', 'Tax:', `$${data.tax_amount.toFixed(2)}`],
      ['', '', 'Grand Total:', `$${data.grand_total.toFixed(2)}`]
    ],
    showFoot: 'lastPage'
  });
  
  // Notes
  if (data.notes) {
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(10);
    doc.text(`Notes: ${data.notes}`, 14, finalY + 10);
  }
  
  doc.save(`purchase-order-${data.order_number}.pdf`);
};

export const printQuotation = (data: QuotationData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quotation ${data.quotation_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .company-info { text-align: left; }
          .company-info h3 { margin: 0 0 5px 0; font-size: 16px; }
          .company-info p { margin: 2px 0; font-size: 11px; color: #555; }
          .logo { width: 120px; height: auto; }
          h1 { text-align: center; margin: 20px 0; }
          .header { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="company-info">
            <h3>${COMPANY_INFO.name}</h3>
            <p>${COMPANY_INFO.address}</p>
            <p>${COMPANY_INFO.city}</p>
          </div>
          <img src="${tehamaLogo}" alt="Company Logo" class="logo" />
        </div>
        <h1>QUOTATION</h1>
        <div class="header">
          <p><strong>Quotation #:</strong> ${data.quotation_number}</p>
          <p><strong>Customer:</strong> ${data.customer_name}</p>
          <p><strong>Valid Until:</strong> ${data.validity_period}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price.toFixed(2)}</td>
                <td>$${item.total_price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><strong>Subtotal:</strong> $${data.total_amount.toFixed(2)}</p>
          <p><strong>Tax:</strong> $${data.tax_amount.toFixed(2)}</p>
          <p><strong>Grand Total:</strong> $${data.grand_total.toFixed(2)}</p>
        </div>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

export const printPO = (data: POData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order ${data.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .company-info { text-align: left; }
          .company-info h3 { margin: 0 0 5px 0; font-size: 16px; }
          .company-info p { margin: 2px 0; font-size: 11px; color: #555; }
          .logo { width: 120px; height: auto; }
          h1 { text-align: center; margin: 20px 0; }
          .header { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="company-info">
            <h3>${COMPANY_INFO.name}</h3>
            <p>${COMPANY_INFO.address}</p>
            <p>${COMPANY_INFO.city}</p>
          </div>
          <img src="${tehamaLogo}" alt="Company Logo" class="logo" />
        </div>
        <h1>PURCHASE ORDER</h1>
        <div class="header">
          <p><strong>PO #:</strong> ${data.order_number}</p>
          <p><strong>Supplier:</strong> ${data.supplier_name}</p>
          <p><strong>Expected Delivery:</strong> ${data.expected_delivery_date}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price.toFixed(2)}</td>
                <td>$${item.total_price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><strong>Subtotal:</strong> $${data.total_amount.toFixed(2)}</p>
          <p><strong>Tax:</strong> $${data.tax_amount.toFixed(2)}</p>
          <p><strong>Grand Total:</strong> $${data.grand_total.toFixed(2)}</p>
        </div>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};
