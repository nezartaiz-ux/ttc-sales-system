import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import mfLogo from '@/assets/mf-logo.png';
import tehamaLogo from '@/assets/tehama-logo.png';

// Company information
const COMPANY_INFO = {
  name: "Tehama Trading Company",
  address: "Sana'a Regional Office",
  footer: {
    postBox: "Post Box: 73",
    location: "Sana'a, Yemen",
    phone: "Phone: 967 1 208916/400266",
    fax: "Fax: 967 1 466056"
  }
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
  
  // Logo on top-right
  const logo = isCat ? tehamaLogo : mfLogo;
  try {
    doc.addImage(logo, 'PNG', 160, 10, 35, 20);
  } catch (e) {
    console.error('Error adding logo to PDF:', e);
  }
  
  return 30; // Return Y position where content should start
};

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  let word = '';
  let i = 0;
  
  while (num > 0) {
    if (num % 1000 !== 0) {
      word = convertLessThanThousand(num % 1000) + (thousands[i] !== '' ? ' ' + thousands[i] : '') + (word !== '' ? ' ' + word : '');
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return word.trim();
};

const amountToWords = (amount: number): string => {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  
  let result = numberToWords(dollars) + ' Dollar' + (dollars !== 1 ? 's' : '');
  
  if (cents > 0) {
    result += ' and ' + numberToWords(cents) + ' Cent' + (cents !== 1 ? 's' : '');
  }
  
  return result;
};

// Helper function to add footer
const addPDFFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Center footer
  const footerText = `${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location} | ${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}`;
  const textWidth = doc.getTextWidth(footerText);
  const centerX = (doc.internal.pageSize.width - textWidth) / 2;
  doc.text(footerText, centerX, pageHeight - 10);
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
  created_by_name?: string;
  discount_type?: string;
  discount_value?: number;
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
  created_by_name?: string;
}

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  invoice_type: string;
  due_date: string;
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
  created_by_name?: string;
  discount_type?: string;
  discount_value?: number;
}

export const generateQuotationPDF = (data: QuotationData) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginBottom = 20; // Space for footer
  
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
  if (data.created_by_name) {
    doc.text(`Created by: ${data.created_by_name}`, 14, 79);
  }
  
  // Items table - Calculate amounts
  const discountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const netAmount = data.total_amount - discountAmount;
  
  const footRows: any[] = [];
  
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Given Discount (${data.discount_value}%):`
      : 'Given Discount:';
    footRows.push(['', '', discountLabel, `-$${discountAmount.toFixed(2)}`]);
    footRows.push(['', '', 'Net Amount:', `$${netAmount.toFixed(2)}`]);
  }
  
  footRows.push(
    ['', '', 'Tax:', `$${data.tax_amount.toFixed(2)}`],
    ['', '', 'Grand Total:', `$${data.grand_total.toFixed(2)}`]
  );
  
  autoTable(doc, {
    startY: data.created_by_name ? 87 : 80,
    head: [['Item', 'Quantity', 'Unit Price', 'Total']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`
    ]),
    foot: footRows,
    showFoot: 'lastPage',
    margin: { bottom: marginBottom }
  });
  
  // Add amount in words
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  if (currentY > pageHeight - marginBottom - 20) {
    doc.addPage();
    addPDFHeader(doc, true);
    currentY = 40;
  }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(amountToWords(data.grand_total), 14, currentY + 6);
  
  // Notes with proper multi-line handling
  if (data.notes) {
    let currentY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 14, currentY);
    
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Split text into lines that fit the page width
    const maxWidth = pageWidth - 28; // 14mm margin on each side
    const lines = doc.splitTextToSize(data.notes, maxWidth);
    
    // Add lines with page break handling
    lines.forEach((line: string) => {
      if (currentY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        currentY = 40; // Start below header on new page
      }
      doc.text(line, 14, currentY);
      currentY += 5;
    });
  }
  
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
  }
  
  doc.save(`quotation-${data.quotation_number}.pdf`);
};

export const generatePOPDF = (data: POData) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginBottom = 20; // Space for footer
  
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
  if (data.created_by_name) {
    doc.text(`Created by: ${data.created_by_name}`, 14, 79);
  }
  
  // Items table
  autoTable(doc, {
    startY: data.created_by_name ? 87 : 80,
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
    showFoot: 'lastPage',
    margin: { bottom: marginBottom }
  });
  
  // Notes with proper multi-line handling
  if (data.notes) {
    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, currentY);
    
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Split text into lines that fit the page width
    const maxWidth = pageWidth - 28; // 14mm margin on each side
    const lines = doc.splitTextToSize(data.notes, maxWidth);
    
    // Add lines with page break handling
    lines.forEach((line: string) => {
      if (currentY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        currentY = 40; // Start below header on new page
      }
      doc.text(line, 14, currentY);
      currentY += 5;
    });
  }
  
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
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
          .notes { margin-top: 30px; margin-bottom: 60px; white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #555; background: white; }
          @page { margin-bottom: 80px; }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="company-info">
            <h3>${COMPANY_INFO.name}</h3>
            <p>${COMPANY_INFO.address}</p>
          </div>
          <img src="${tehamaLogo}" alt="Company Logo" class="logo" />
        </div>
        <h1>QUOTATION</h1>
        <div class="header">
          <p><strong>Quotation #:</strong> ${data.quotation_number}</p>
          <p><strong>Customer:</strong> ${data.customer_name}</p>
          <p><strong>Valid Until:</strong> ${data.validity_period}</p>
          ${data.created_by_name ? `<p><strong>Created by:</strong> ${data.created_by_name}</p>` : ''}
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
          ${data.discount_value && data.discount_value > 0 ? `
            <p><strong>${data.discount_type === 'percentage' ? `Given Discount (${data.discount_value}%):` : 'Given Discount:'}</strong> -$${(data.discount_type === 'percentage' ? data.total_amount * data.discount_value / 100 : data.discount_value).toFixed(2)}</p>
            <p><strong>Net Amount:</strong> $${(data.total_amount - (data.discount_type === 'percentage' ? data.total_amount * data.discount_value / 100 : data.discount_value)).toFixed(2)}</p>
          ` : ''}
          <p><strong>Tax:</strong> $${data.tax_amount.toFixed(2)}</p>
          <p><strong>Grand Total:</strong> $${data.grand_total.toFixed(2)}</p>
        </div>
        <div style="margin-top: 20px;">
          <p><strong>Amount in Words:</strong> ${(() => {
            const dollars = Math.floor(data.grand_total);
            const cents = Math.round((data.grand_total - dollars) * 100);
            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
            const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            const thousands = ['', 'Thousand', 'Million'];
            
            const convertLessThanThousand = (n) => {
              if (n === 0) return '';
              if (n < 10) return ones[n];
              if (n < 20) return teens[n - 10];
              if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
              return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
            };
            
            let word = '';
            let i = 0;
            let num = dollars;
            
            while (num > 0) {
              if (num % 1000 !== 0) {
                word = convertLessThanThousand(num % 1000) + (thousands[i] !== '' ? ' ' + thousands[i] : '') + (word !== '' ? ' ' + word : '');
              }
              num = Math.floor(num / 1000);
              i++;
            }
            
            let result = (word || 'Zero') + ' Dollar' + (dollars !== 1 ? 's' : '');
            if (cents > 0) {
              result += ' and ' + convertLessThanThousand(cents) + ' Cent' + (cents !== 1 ? 's' : '');
            }
            return result.trim();
          })()}</p>
        </div>
        ${data.notes ? `<div class="notes"><strong>Terms & Conditions:</strong><br/>${data.notes.replace(/\n/g, '<br/>')}</div>` : ''}
        <div class="footer">
          <p>${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location}</p>
          <p>${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}</p>
        </div>
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
          .notes { margin-top: 30px; margin-bottom: 60px; white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #555; background: white; }
          @page { margin-bottom: 80px; }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="company-info">
            <h3>${COMPANY_INFO.name}</h3>
            <p>${COMPANY_INFO.address}</p>
          </div>
          <img src="${tehamaLogo}" alt="Company Logo" class="logo" />
        </div>
        <h1>PURCHASE ORDER</h1>
        <div class="header">
          <p><strong>PO #:</strong> ${data.order_number}</p>
          <p><strong>Supplier:</strong> ${data.supplier_name}</p>
          <p><strong>Expected Delivery:</strong> ${data.expected_delivery_date}</p>
          ${data.created_by_name ? `<p><strong>Created by:</strong> ${data.created_by_name}</p>` : ''}
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
        ${data.notes ? `<div class="notes"><strong>Notes:</strong><br/>${data.notes.replace(/\n/g, '<br/>')}</div>` : ''}
        <div class="footer">
          <p>${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location}</p>
          <p>${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}</p>
        </div>
        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginBottom = 20; // Space for footer
  
  // Add header with logo and company info
  addPDFHeader(doc, true);
  
  // Document title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES INVOICE', 105, 45, { align: 'center' });
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${data.invoice_number}`, 14, 58);
  doc.text(`Customer: ${data.customer_name}`, 14, 65);
  doc.text(`Type: ${data.invoice_type.toUpperCase()}`, 14, 72);
  doc.text(`Due Date: ${data.due_date}`, 14, 79);
  if (data.created_by_name) {
    doc.text(`Created by: ${data.created_by_name}`, 14, 86);
  }
  
  // Items table - Calculate amounts
  const invoiceDiscountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const invoiceNetAmount = data.total_amount - invoiceDiscountAmount;
  
  const invoiceFootRows: any[] = [];
  
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Given Discount (${data.discount_value}%):`
      : 'Given Discount:';
    invoiceFootRows.push(['', '', discountLabel, `-$${invoiceDiscountAmount.toFixed(2)}`]);
    invoiceFootRows.push(['', '', 'Net Amount:', `$${invoiceNetAmount.toFixed(2)}`]);
  }
  
  invoiceFootRows.push(
    ['', '', 'Tax:', `$${data.tax_amount.toFixed(2)}`],
    ['', '', 'Grand Total:', `$${data.grand_total.toFixed(2)}`]
  );
  
  autoTable(doc, {
    startY: data.created_by_name ? 94 : 87,
    head: [['Item', 'Quantity', 'Unit Price', 'Total']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`
    ]),
    foot: invoiceFootRows,
    showFoot: 'lastPage',
    margin: { bottom: marginBottom }
  });
  
  // Add amount in words
  let invoiceCurrentY = (doc as any).lastAutoTable.finalY + 10;
  if (invoiceCurrentY > pageHeight - marginBottom - 20) {
    doc.addPage();
    addPDFHeader(doc, true);
    invoiceCurrentY = 40;
  }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words:', 14, invoiceCurrentY);
  doc.setFont('helvetica', 'normal');
  doc.text(amountToWords(data.grand_total), 14, invoiceCurrentY + 6);
  
  // Notes with proper multi-line handling
  if (data.notes) {
    let currentY = invoiceCurrentY + 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, currentY);
    
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Split text into lines that fit the page width
    const maxWidth = pageWidth - 28; // 14mm margin on each side
    const lines = doc.splitTextToSize(data.notes, maxWidth);
    
    // Add lines with page break handling
    lines.forEach((line: string) => {
      if (currentY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        currentY = 40; // Start below header on new page
      }
      doc.text(line, 14, currentY);
      currentY += 5;
    });
  }
  
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
  }
  
  doc.save(`invoice-${data.invoice_number}.pdf`);
};

export const printInvoice = (data: InvoiceData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${data.invoice_number}</title>
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
          .notes { margin-top: 30px; margin-bottom: 60px; white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #555; background: white; }
          @page { margin-bottom: 80px; }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="company-info">
            <h3>${COMPANY_INFO.name}</h3>
            <p>${COMPANY_INFO.address}</p>
          </div>
          <img src="${tehamaLogo}" alt="Company Logo" class="logo" />
        </div>
        <h1>SALES INVOICE</h1>
        <div class="header">
          <p><strong>Invoice #:</strong> ${data.invoice_number}</p>
          <p><strong>Customer:</strong> ${data.customer_name}</p>
          <p><strong>Type:</strong> ${data.invoice_type.toUpperCase()}</p>
          <p><strong>Due Date:</strong> ${data.due_date}</p>
          ${data.created_by_name ? `<p><strong>Created by:</strong> ${data.created_by_name}</p>` : ''}
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
          ${data.discount_value && data.discount_value > 0 ? `
            <p><strong>${data.discount_type === 'percentage' ? `Given Discount (${data.discount_value}%):` : 'Given Discount:'}</strong> -$${(data.discount_type === 'percentage' ? data.total_amount * data.discount_value / 100 : data.discount_value).toFixed(2)}</p>
            <p><strong>Net Amount:</strong> $${(data.total_amount - (data.discount_type === 'percentage' ? data.total_amount * data.discount_value / 100 : data.discount_value)).toFixed(2)}</p>
          ` : ''}
          <p><strong>Tax:</strong> $${data.tax_amount.toFixed(2)}</p>
          <p><strong>Grand Total:</strong> $${data.grand_total.toFixed(2)}</p>
        </div>
        <div style="margin-top: 20px; margin-bottom: 60px;">
          <p><strong>Amount in Words:</strong> ${(() => {
            const dollars = Math.floor(data.grand_total);
            const cents = Math.round((data.grand_total - dollars) * 100);
            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
            const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            const thousands = ['', 'Thousand', 'Million'];
            
            const convertLessThanThousand = (n) => {
              if (n === 0) return '';
              if (n < 10) return ones[n];
              if (n < 20) return teens[n - 10];
              if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
              return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
            };
            
            let word = '';
            let i = 0;
            let num = dollars;
            
            while (num > 0) {
              if (num % 1000 !== 0) {
                word = convertLessThanThousand(num % 1000) + (thousands[i] !== '' ? ' ' + thousands[i] : '') + (word !== '' ? ' ' + word : '');
              }
              num = Math.floor(num / 1000);
              i++;
            }
            
            let result = (word || 'Zero') + ' Dollar' + (dollars !== 1 ? 's' : '');
            if (cents > 0) {
              result += ' and ' + convertLessThanThousand(cents) + ' Cent' + (cents !== 1 ? 's' : '');
            }
            return result.trim();
          })()}</p>
        </div>
        ${data.notes ? `<div class="notes"><strong>Notes:</strong><br/>${data.notes.replace(/\n/g, '<br/>')}</div>` : ''}
        <div class="footer">
          <p>${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location}</p>
          <p>${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}</p>
        </div>
        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};
