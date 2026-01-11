import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export interface DeliveryNoteData {
  delivery_note_number: string;
  delivery_note_date: string;
  customer_name: string;
  customer_address: string;
  model: string;
  warranty_type: string;
  mean_of_despatch: string;
  mean_number: string;
  driver_name: string;
  created_by_name: string;
  items: Array<{
    model: string;
    description: string;
    quantity: number;
    remarks: string;
  }>;
}

// Helper function to add header
const addPDFHeader = (doc: jsPDF) => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 14, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 14, 17);
  
  try {
    doc.addImage(tehamaLogo, 'PNG', 160, 8, 35, 18);
  } catch (e) {
    console.error('Error adding logo to PDF:', e);
  }
  
  return 25;
};

// Helper function to add footer
const addPDFFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  const footerText = `${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location} | ${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}`;
  const textWidth = doc.getTextWidth(footerText);
  const centerX = (doc.internal.pageSize.width - textWidth) / 2;
  doc.text(footerText, centerX, pageHeight - 8);
};

// Helper function to get material condition label
const getMaterialConditionLabel = (value: string): string => {
  const labels: Record<string, string> = {
    'new': 'New',
    'used': 'Used',
    'under_warranty': 'Under Warranty',
    'new_sale': 'New',
    'out_of_warranty': 'Used',
  };
  return labels[value] || value;
};

export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 40;

  // Add header
  addPDFHeader(doc);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MATERIALS DELIVERY NOTE', pageWidth / 2, 32, { align: 'center' });

  // Document details - compact layout
  let yPos = 40;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Two columns for details
  const col1X = 14;
  const col2X = pageWidth / 2 + 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('DN #:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.delivery_note_number, col1X + 18, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.delivery_note_date, col2X + 15, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col1X + 22, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_address || '-', col2X + 18, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Model:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.model || '-', col1X + 16, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Material Condition:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(getMaterialConditionLabel(data.warranty_type), col2X + 38, yPos);
  
  yPos += 8;

  // Materials table - compact
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Model', 'Description', 'Qty', 'Remarks']],
    body: data.items.map((item, index) => [
      index + 1,
      item.model || '-',
      item.description,
      item.quantity,
      item.remarks || '-'
    ]),
    styles: { 
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: { 
      fillColor: [60, 60, 60], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 15 },
      4: { cellWidth: 35 }
    },
    margin: { bottom: marginBottom }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Dispatching Details - compact
  if (yPos > pageHeight - marginBottom - 40) {
    doc.addPage();
    addPDFHeader(doc);
    yPos = 35;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Dispatching Details:', col1X, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Mean of Despatch: ${data.mean_of_despatch || '-'}`, col1X, yPos);
  doc.text(`Vehicle #: ${data.mean_number || '-'}`, col2X, yPos);
  
  yPos += 5;
  doc.text(`Driver: ${data.driver_name || '-'}`, col1X, yPos);
  
  yPos += 12;

  // Signature section - compact 3 columns
  const sigColWidth = (pageWidth - 28) / 3;
  
  if (yPos > pageHeight - marginBottom - 30) {
    doc.addPage();
    addPDFHeader(doc);
    yPos = 35;
  }

  doc.setFontSize(8);
  
  // Column 1: Prepared by
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared by:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.created_by_name || '', col1X, yPos + 4);
  doc.line(col1X, yPos + 18, col1X + sigColWidth - 10, yPos + 18);
  doc.setFontSize(7);
  doc.text('Signature', col1X + (sigColWidth - 30) / 2, yPos + 22);

  // Column 2: Received by
  const col2SigX = col1X + sigColWidth;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Received by:', col2SigX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col2SigX, yPos + 4);
  doc.line(col2SigX, yPos + 18, col2SigX + sigColWidth - 10, yPos + 18);
  doc.setFontSize(7);
  doc.text('Signature', col2SigX + (sigColWidth - 30) / 2, yPos + 22);

  // Column 3: Driver
  const col3SigX = col1X + sigColWidth * 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver:', col3SigX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.driver_name || '_______________', col3SigX, yPos + 4);
  doc.line(col3SigX, yPos + 18, col3SigX + sigColWidth - 10, yPos + 18);
  doc.setFontSize(7);
  doc.text('Signature', col3SigX + (sigColWidth - 30) / 2, yPos + 22);

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
  }

  // Save PDF
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `delivery-note-${data.delivery_note_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
};

export const printDeliveryNote = (data: DeliveryNoteData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 40;

  // Add header
  addPDFHeader(doc);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MATERIALS DELIVERY NOTE', pageWidth / 2, 32, { align: 'center' });

  // Document details - compact layout
  let yPos = 40;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Two columns for details
  const col1X = 14;
  const col2X = pageWidth / 2 + 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('DN #:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.delivery_note_number, col1X + 18, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.delivery_note_date, col2X + 15, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col1X + 22, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_address || '-', col2X + 18, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Model:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.model || '-', col1X + 16, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Material Condition:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(getMaterialConditionLabel(data.warranty_type), col2X + 38, yPos);
  
  yPos += 8;

  // Materials table - compact
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Model', 'Description', 'Qty', 'Remarks']],
    body: data.items.map((item, index) => [
      index + 1,
      item.model || '-',
      item.description,
      item.quantity,
      item.remarks || '-'
    ]),
    styles: { 
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: { 
      fillColor: [60, 60, 60], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 15 },
      4: { cellWidth: 35 }
    },
    margin: { bottom: marginBottom }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Dispatching Details - compact
  if (yPos > pageHeight - marginBottom - 40) {
    doc.addPage();
    addPDFHeader(doc);
    yPos = 35;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Dispatching Details:', col1X, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Mean of Despatch: ${data.mean_of_despatch || '-'}`, col1X, yPos);
  doc.text(`Vehicle #: ${data.mean_number || '-'}`, col2X, yPos);
  
  yPos += 5;
  doc.text(`Driver: ${data.driver_name || '-'}`, col1X, yPos);
  
  yPos += 12;

  // Signature section - compact 3 columns
  const sigColWidth = (pageWidth - 28) / 3;
  
  if (yPos > pageHeight - marginBottom - 30) {
    doc.addPage();
    addPDFHeader(doc);
    yPos = 35;
  }

  doc.setFontSize(8);
  
  // Column 1: Prepared by
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared by:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.created_by_name || '', col1X, yPos + 4);
  doc.line(col1X, yPos + 18, col1X + sigColWidth - 10, yPos + 18);
  doc.setFontSize(7);
  doc.text('Signature', col1X + (sigColWidth - 30) / 2, yPos + 22);

  // Column 2: Received by
  const col2SigX = col1X + sigColWidth;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Received by:', col2SigX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col2SigX, yPos + 4);
  doc.line(col2SigX, yPos + 18, col2SigX + sigColWidth - 10, yPos + 18);
  doc.setFontSize(7);
  doc.text('Signature', col2SigX + (sigColWidth - 30) / 2, yPos + 22);

  // Column 3: Driver
  const col3SigX = col1X + sigColWidth * 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver:', col3SigX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.driver_name || '_______________', col3SigX, yPos + 4);
  doc.line(col3SigX, yPos + 18, col3SigX + sigColWidth - 10, yPos + 18);
  doc.setFontSize(7);
  doc.text('Signature', col3SigX + (sigColWidth - 30) / 2, yPos + 22);

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
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
