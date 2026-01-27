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

// Helper function to get tax label based on customs duty status
const getTaxLabel = (customsDutyStatus?: string | null): string => {
  if (customsDutyStatus === 'DDP Aden' || customsDutyStatus === "DDP Sana'a") {
    return 'Customs Duty & Sales Tax:';
  }
  return 'Tax:';
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
  quotation_date?: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  items: Array<{
    name: string;
    description?: string;
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
  
  // Quotation details - aligned layout
  doc.setFontSize(9);
  let yPos = 40;
  const labelX = 14;
  const valueX = 50; // Aligned value column
  const rightLabelX = pageWidth - 50;
  
  // Left side - aligned labels and values
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation #:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.quotation_number, valueX, yPos);
  
  // Right side - Quotation Date aligned to right with proper spacing
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation Date:', pageWidth - 60, yPos);
  doc.setFont('helvetica', 'normal');
  const dateText = data.quotation_date || data.validity_period;
  doc.text(dateText, pageWidth - 14, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, valueX, yPos);
  
  if (data.delivery_terms) {
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Terms:', labelX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.delivery_terms, valueX, yPos);
  }
  
  if (data.delivery_details) {
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Details:', labelX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.delivery_details, valueX, yPos);
  }
  
  // Items table - Calculate amounts
  const discountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const netAmount = data.total_amount - discountAmount;
  
  const footRows: any[] = [];
  
  // Only show Value, Discount, and Net Amount if discount is applied
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Given Discount (${data.discount_value}%):`
      : 'Given Discount:';
    footRows.push(['', '', discountLabel, `-${formatCurrency(discountAmount)}`]);
    footRows.push(['', '', 'Net Amount:', formatCurrency(netAmount)]);
  }
  
  footRows.push(
    ['', '', getTaxLabel(data.customs_duty_status), formatCurrency(data.tax_amount)],
    ['', '', 'Grand Total:', formatCurrency(data.grand_total)]
  );
  
  // Build table body with item descriptions
  const tableBody: any[] = [];
  data.items.forEach(item => {
    // Item row
    tableBody.push([
      item.name,
      item.quantity.toLocaleString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total_price)
    ]);
    // Description row if available - show product details
    if (item.description) {
      tableBody.push([
        { content: item.description, colSpan: 4, styles: { fontSize: 7, textColor: [80, 80, 80], fontStyle: 'italic', cellPadding: { top: 1, bottom: 3, left: 6, right: 2 } } }
      ]);
    }
  });

  autoTable(doc, {
    startY: yPos + 6,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: tableBody,
    foot: footRows,
    showFoot: 'lastPage',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { cellPadding: 1.5 },
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
  doc.text(amountToWords(data.grand_total), 14, currentY + 5);
  
  // Notes with proper multi-line handling - section headers bold and at start of line
  if (data.notes) {
    let notesY = currentY + 10;
    doc.setFontSize(8);
    
    const maxWidth = pageWidth - 28;
    const noteLines = data.notes.split('\n');
    
    noteLines.forEach((paragraph: string) => {
      if (notesY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        notesY = 35;
      }
      
      // Check if line is a section header (ends with ':' or is all caps or short)
      const trimmedLine = paragraph.trim();
      const isHeader = (trimmedLine.endsWith(':') && trimmedLine.length < 50) || 
                       (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && trimmedLine.length < 60);
      
      if (isHeader) {
        doc.setFont('helvetica', 'bold');
        doc.text(trimmedLine, 14, notesY);
        doc.setFont('helvetica', 'normal');
        notesY += 4.5;
      } else if (trimmedLine) {
        const lines = doc.splitTextToSize(trimmedLine, maxWidth);
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
      ['', '', getTaxLabel(data.customs_duty_status), formatCurrency(data.tax_amount)],
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
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginBottom = 42;
  
  // Add header with logo and company info
  addPDFHeader(doc, true);
  
  // Document title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 105, 32, { align: 'center' });
  
  // Quotation details - aligned layout
  doc.setFontSize(9);
  let yPos = 40;
  const labelX = 14;
  const valueX = 50;
  
  // Left side - aligned labels and values
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation #:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.quotation_number, valueX, yPos);
  
  // Right side - Quotation Date
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation Date:', pageWidth - 60, yPos);
  doc.setFont('helvetica', 'normal');
  const dateText = data.quotation_date || data.validity_period;
  doc.text(dateText, pageWidth - 14, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, valueX, yPos);
  
  if (data.delivery_terms) {
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Terms:', labelX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.delivery_terms, valueX, yPos);
  }
  
  if (data.delivery_details) {
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Details:', labelX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.delivery_details, valueX, yPos);
  }
  
  // Items table - Calculate amounts
  const discountAmount = (data.discount_value && data.discount_value > 0)
    ? (data.discount_type === 'percentage'
      ? (data.total_amount * data.discount_value / 100)
      : data.discount_value)
    : 0;
  const netAmount = data.total_amount - discountAmount;
  
  const footRows: any[] = [];
  
  // Only show Discount and Net Amount if discount is applied
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Given Discount (${data.discount_value}%):`
      : 'Given Discount:';
    footRows.push(['', '', discountLabel, `-${formatCurrency(discountAmount)}`]);
    footRows.push(['', '', 'Net Amount:', formatCurrency(netAmount)]);
  }
  
  footRows.push(
    ['', '', getTaxLabel(data.customs_duty_status), formatCurrency(data.tax_amount)],
    ['', '', 'Grand Total:', formatCurrency(data.grand_total)]
  );
  
  // Build table body with item descriptions
  const tableBody: any[] = [];
  data.items.forEach(item => {
    tableBody.push([
      item.name,
      item.quantity.toLocaleString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total_price)
    ]);
    if (item.description) {
      tableBody.push([
        { content: item.description, colSpan: 4, styles: { fontSize: 7, textColor: [80, 80, 80], fontStyle: 'italic', cellPadding: { top: 1, bottom: 3, left: 6, right: 2 } } }
      ]);
    }
  });

  autoTable(doc, {
    startY: yPos + 6,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: tableBody,
    foot: footRows,
    showFoot: 'lastPage',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { cellPadding: 1.5 },
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
  doc.text(amountToWords(data.grand_total), 14, currentY + 5);
  
  // Notes with proper multi-line handling
  if (data.notes) {
    let notesY = currentY + 10;
    doc.setFontSize(8);
    
    const maxWidth = pageWidth - 28;
    const noteLines = data.notes.split('\n');
    
    noteLines.forEach((paragraph: string) => {
      if (notesY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        notesY = 35;
      }
      
      const trimmedLine = paragraph.trim();
      const isHeader = (trimmedLine.endsWith(':') && trimmedLine.length < 50) || 
                       (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && trimmedLine.length < 60);
      
      if (isHeader) {
        doc.setFont('helvetica', 'bold');
        doc.text(trimmedLine, 14, notesY);
        doc.setFont('helvetica', 'normal');
        notesY += 4.5;
      } else if (trimmedLine) {
        const lines = doc.splitTextToSize(trimmedLine, maxWidth);
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
  
  // Open PDF for printing
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const printPO = (data: POData) => {
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
      ['', '', getTaxLabel(data.customs_duty_status), formatCurrency(data.tax_amount)],
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
  
  // Open PDF for printing
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
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
  
  // Only show Discount and Net Amount if discount is applied
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Given Discount (${data.discount_value}%):`
      : 'Given Discount:';
    invoiceFootRows.push(['', '', discountLabel, `-${formatCurrency(invoiceDiscountAmount)}`]);
    invoiceFootRows.push(['', '', 'Net Amount:', formatCurrency(invoiceNetAmount)]);
  }
  
  invoiceFootRows.push(
    ['', '', getTaxLabel(data.customs_duty_status), formatCurrency(data.tax_amount)],
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
  
  // Only show Discount and Net Amount if discount is applied
  if (data.discount_value && data.discount_value > 0) {
    const discountLabel = data.discount_type === 'percentage' 
      ? `Given Discount (${data.discount_value}%):`
      : 'Given Discount:';
    invoiceFootRows.push(['', '', discountLabel, `-${formatCurrency(invoiceDiscountAmount)}`]);
    invoiceFootRows.push(['', '', 'Net Amount:', formatCurrency(invoiceNetAmount)]);
  }
  
  invoiceFootRows.push(
    ['', '', getTaxLabel(data.customs_duty_status), formatCurrency(data.tax_amount)],
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
    
    const maxWidth = pageWidth - 28;
    const lines = doc.splitTextToSize(data.notes, maxWidth);
    
    lines.forEach((line: string) => {
      if (currentY > pageHeight - marginBottom) {
        doc.addPage();
        addPDFHeader(doc, true);
        currentY = 40;
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
  
  // Open PDF for printing
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};
