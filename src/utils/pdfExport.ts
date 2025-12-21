import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import mfLogo from '@/assets/mf-logo.png';
import tehamaLogo from '@/assets/tehama-logo.png';

// Helper function to format currency with commas
const formatCurrency = (amount: number): string => {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 14, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 14, 17);
  
  // Logo on top-right
  const logo = isCat ? tehamaLogo : mfLogo;
  try {
    doc.addImage(logo, 'PNG', 160, 8, 35, 18);
  } catch (e) {
    console.error('Error adding logo to PDF:', e);
  }
  
  return 25; // Return Y position where content should start
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

// Helper function to add footer with company info
const addPDFFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  // Center footer
  const footerText = `${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location} | ${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}`;
  const textWidth = doc.getTextWidth(footerText);
  const centerX = (doc.internal.pageSize.width - textWidth) / 2;
  doc.text(footerText, centerX, pageHeight - 8);
};

// Helper function to add signature section at the bottom of last page
const addSignatureSection = (doc: jsPDF, createdByName?: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Position signature section above footer
  const signatureY = pageHeight - 35;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Prepared by section on the right
  const rightX = pageWidth - 65;
  doc.text('Prepared by:', rightX, signatureY);
  
  if (createdByName) {
    doc.setFont('helvetica', 'bold');
    doc.text(createdByName, rightX, signatureY + 5);
    doc.setFont('helvetica', 'normal');
  }
  
  // Signature line
  doc.line(rightX, signatureY + 15, rightX + 45, signatureY + 15);
  doc.setFontSize(7);
  doc.text('Signature', rightX + 12, signatureY + 19);
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
  customs_duty_status?: string;
  delivery_terms?: string;
  delivery_details?: string;
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
  customs_duty_status?: string;
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
  customs_duty_status?: string;
}

export const generateQuotationPDF = (data: QuotationData) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginBottom = 42; // Space for signature and footer
  
  // Add header with logo and company info
  addPDFHeader(doc, true);
  
  // Document title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 105, 32, { align: 'center' });
  
  // Quotation details - compact two-column layout
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let yPos = 40;
  const col1X = 14;
  const col2X = pageWidth / 2 + 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation #:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.quotation_number, col1X + 25, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Valid Until:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.validity_period, col2X + 22, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col1X + 22, yPos);
  
  if (data.customs_duty_status) {
    doc.setFont('helvetica', 'bold');
    doc.text('Customs:', col2X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customs_duty_status, col2X + 18, yPos);
  }
  
  if (data.delivery_terms) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Terms:', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.delivery_terms, col1X + 30, yPos);
  }
  if (data.delivery_details) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Details:', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.delivery_details, col1X + 32, yPos);
  }
  
  // Items table - Calculate amounts
  const discountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const netAmount = data.total_amount - discountAmount;
  
  const footRows: any[] = [];
  
  // Always show Value first
  footRows.push(['', '', 'Value:', formatCurrency(data.total_amount)]);
  
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Given Discount (${data.discount_value}%):`
      : 'Given Discount:';
    footRows.push(['', '', discountLabel, `-${formatCurrency(discountAmount)}`]);
    footRows.push(['', '', 'Net Amount:', formatCurrency(netAmount)]);
  }
  
  footRows.push(
    ['', '', 'Tax:', formatCurrency(data.tax_amount)],
    ['', '', 'Grand Total:', formatCurrency(data.grand_total)]
  );
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toLocaleString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total_price)
    ]),
    foot: footRows,
    showFoot: 'lastPage',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { bottom: marginBottom }
  });
  
  // Add amount in words
  let currentY = (doc as any).lastAutoTable.finalY + 6;
  if (currentY > pageHeight - marginBottom - 15) {
    doc.addPage();
    addPDFHeader(doc, true);
    currentY = 35;
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(amountToWords(data.grand_total), 14, currentY + 4);
  
  // Notes with proper multi-line handling
  if (data.notes) {
    let notesY = currentY + 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 14, notesY);
    
    notesY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Split text into lines that fit the page width
    const maxWidth = pageWidth - 28;
    const lines = doc.splitTextToSize(data.notes, maxWidth);
    
    // Add lines with page break handling
    lines.forEach((line: string) => {
      if (notesY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        notesY = 35;
      }
      doc.text(line, 14, notesY);
      notesY += 4;
    });
  }
  
  // Add signature section to the last page
  const totalPages = doc.getNumberOfPages();
  doc.setPage(totalPages);
  addSignatureSection(doc, data.created_by_name);
  
  // Add footer to all pages
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
  }
  
  // Mobile-compatible save method
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `quotation-${data.quotation_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
};

export const generatePOPDF = (data: POData) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginBottom = 42;
  
  // Add header
  addPDFHeader(doc, true);
  
  // Document title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', 105, 32, { align: 'center' });
  
  // PO details - compact two-column layout
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let yPos = 40;
  const col1X = 14;
  const col2X = pageWidth / 2 + 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('PO #:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.order_number, col1X + 15, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Expected Delivery:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.expected_delivery_date, col2X + 35, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.supplier_name, col1X + 18, yPos);
  
  if (data.customs_duty_status) {
    doc.setFont('helvetica', 'bold');
    doc.text('Customs:', col2X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customs_duty_status, col2X + 18, yPos);
  }
  
  // Items table
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toLocaleString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total_price)
    ]),
    foot: [
      ['', '', 'Subtotal:', formatCurrency(data.total_amount)],
      ['', '', 'Tax:', formatCurrency(data.tax_amount)],
      ['', '', 'Grand Total:', formatCurrency(data.grand_total)]
    ],
    showFoot: 'lastPage',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { bottom: marginBottom }
  });
  
  // Notes
  if (data.notes) {
    let currentY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, currentY);
    
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const maxWidth = pageWidth - 28;
    const lines = doc.splitTextToSize(data.notes, maxWidth);
    
    lines.forEach((line: string) => {
      if (currentY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        currentY = 35;
      }
      doc.text(line, 14, currentY);
      currentY += 4;
    });
  }
  
  // Add signature section to the last page
  const totalPages = doc.getNumberOfPages();
  doc.setPage(totalPages);
  addSignatureSection(doc, data.created_by_name);
  
  // Add footer to all pages
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
  }
  
  // Mobile-compatible save method
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `purchase-order-${data.order_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
};

export const printQuotation = (data: QuotationData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  // Calculate discount and amounts
  const discountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const netAmount = data.total_amount - discountAmount;
  
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
          .notes { margin-top: 30px; white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
          .signature-section { margin-top: 60px; text-align: right; padding-right: 30px; }
          .signature-section .prepared-by { margin-bottom: 5px; }
          .signature-section .name { font-weight: bold; margin-bottom: 30px; }
          .signature-section .signature-line { width: 200px; border-top: 1px solid #333; margin-left: auto; margin-top: 30px; padding-top: 5px; }
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
          ${data.customs_duty_status ? `<p><strong>Customs & Duty Status:</strong> ${data.customs_duty_status}</p>` : ''}
          ${data.delivery_terms ? `<p><strong>Delivery Terms:</strong> ${data.delivery_terms}</p>` : ''}
          ${data.delivery_details ? `<p><strong>Delivery Details:</strong> ${data.delivery_details}</p>` : ''}
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
                <td>${item.quantity.toLocaleString()}</td>
                <td>$${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><strong>Value:</strong> $${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          ${data.discount_value && data.discount_value > 0 ? `
            <p><strong>${data.discount_type === 'percentage' ? `Given Discount (${data.discount_value}%):` : 'Given Discount:'}</strong> -$${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Net Amount:</strong> $${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          ` : ''}
          <p><strong>Tax:</strong> $${data.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Grand Total:</strong> $${data.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div style="margin-top: 20px;">
          <p><strong>Amount in Words:</strong> ${amountToWords(data.grand_total)}</p>
        </div>
        ${data.notes ? `<div class="notes"><strong>Terms & Conditions:</strong><br/>${data.notes.replace(/\n/g, '<br/>')}</div>` : ''}
        
        <div class="signature-section">
          <p class="prepared-by">Prepared by:</p>
          ${data.created_by_name ? `<p class="name">${data.created_by_name}</p>` : ''}
          <div class="signature-line">Signature</div>
        </div>
        
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
          .notes { margin-top: 30px; white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
          .signature-section { margin-top: 60px; text-align: right; padding-right: 30px; }
          .signature-section .prepared-by { margin-bottom: 5px; }
          .signature-section .name { font-weight: bold; margin-bottom: 30px; }
          .signature-section .signature-line { width: 200px; border-top: 1px solid #333; margin-left: auto; margin-top: 30px; padding-top: 5px; }
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
          ${data.customs_duty_status ? `<p><strong>Customs & Duty Status:</strong> ${data.customs_duty_status}</p>` : ''}
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
                <td>${item.quantity.toLocaleString()}</td>
                <td>$${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><strong>Subtotal:</strong> $${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Tax:</strong> $${data.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Grand Total:</strong> $${data.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        ${data.notes ? `<div class="notes"><strong>Notes:</strong><br/>${data.notes.replace(/\n/g, '<br/>')}</div>` : ''}
        
        <div class="signature-section">
          <p class="prepared-by">Prepared by:</p>
          ${data.created_by_name ? `<p class="name">${data.created_by_name}</p>` : ''}
          <div class="signature-line">Signature</div>
        </div>
        
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
  const marginBottom = 42;
  
  // Add header
  addPDFHeader(doc, true);
  
  // Document title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES INVOICE', 105, 32, { align: 'center' });
  
  // Invoice details - compact two-column layout
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let yPos = 40;
  const col1X = 14;
  const col2X = pageWidth / 2 + 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice #:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoice_number, col1X + 20, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.due_date, col2X + 20, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col1X + 22, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Type:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoice_type.toUpperCase(), col2X + 12, yPos);
  
  if (data.customs_duty_status) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Customs:', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customs_duty_status, col1X + 18, yPos);
  }
  
  // Items table - Calculate amounts
  const invoiceDiscountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const invoiceNetAmount = data.total_amount - invoiceDiscountAmount;
  
  const invoiceFootRows: any[] = [];
  invoiceFootRows.push(['', '', 'Value:', formatCurrency(data.total_amount)]);
  
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Discount (${data.discount_value}%):`
      : 'Discount:';
    invoiceFootRows.push(['', '', discountLabel, `-${formatCurrency(invoiceDiscountAmount)}`]);
    invoiceFootRows.push(['', '', 'Net Amount:', formatCurrency(invoiceNetAmount)]);
  }
  
  invoiceFootRows.push(
    ['', '', 'Tax:', formatCurrency(data.tax_amount)],
    ['', '', 'Grand Total:', formatCurrency(data.grand_total)]
  );
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toLocaleString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total_price)
    ]),
    foot: invoiceFootRows,
    showFoot: 'lastPage',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { bottom: marginBottom }
  });
  
  // Add amount in words
  let invoiceCurrentY = (doc as any).lastAutoTable.finalY + 6;
  if (invoiceCurrentY > pageHeight - marginBottom - 15) {
    doc.addPage();
    addPDFHeader(doc, true);
    invoiceCurrentY = 35;
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words:', 14, invoiceCurrentY);
  doc.setFont('helvetica', 'normal');
  doc.text(amountToWords(data.grand_total), 14, invoiceCurrentY + 4);
  
  // Notes
  if (data.notes) {
    let currentY = invoiceCurrentY + 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, currentY);
    
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
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
  
  // Add signature section to the last page
  const totalPages = doc.getNumberOfPages();
  doc.setPage(totalPages);
  addSignatureSection(doc, data.created_by_name);
  
  // Add footer to all pages
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
  }
  
  // Mobile-compatible save method
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `invoice-${data.invoice_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
};

export const printInvoice = (data: InvoiceData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  // Calculate discount and amounts
  const discountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const netAmount = data.total_amount - discountAmount;
  
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
          .notes { margin-top: 30px; white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
          .signature-section { margin-top: 60px; text-align: right; padding-right: 30px; }
          .signature-section .prepared-by { margin-bottom: 5px; }
          .signature-section .name { font-weight: bold; margin-bottom: 30px; }
          .signature-section .signature-line { width: 200px; border-top: 1px solid #333; margin-left: auto; margin-top: 30px; padding-top: 5px; }
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
          ${data.customs_duty_status ? `<p><strong>Customs & Duty Status:</strong> ${data.customs_duty_status}</p>` : ''}
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
                <td>${item.quantity.toLocaleString()}</td>
                <td>$${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><strong>Value:</strong> $${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          ${data.discount_value && data.discount_value > 0 ? `
            <p><strong>${data.discount_type === 'percentage' ? `Given Discount (${data.discount_value}%):` : 'Given Discount:'}</strong> -$${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Net Amount:</strong> $${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          ` : ''}
          <p><strong>Tax:</strong> $${data.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Grand Total:</strong> $${data.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div style="margin-top: 20px;">
          <p><strong>Amount in Words:</strong> ${amountToWords(data.grand_total)}</p>
        </div>
        ${data.notes ? `<div class="notes"><strong>Notes:</strong><br/>${data.notes.replace(/\n/g, '<br/>')}</div>` : ''}
        
        <div class="signature-section">
          <p class="prepared-by">Prepared by:</p>
          ${data.created_by_name ? `<p class="name">${data.created_by_name}</p>` : ''}
          <div class="signature-line">Signature</div>
        </div>
        
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
