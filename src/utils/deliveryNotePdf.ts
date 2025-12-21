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
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const materialConditionLabel = getMaterialConditionLabel(data.warranty_type);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Delivery Note ${data.delivery_note_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 15px; font-size: 11px; line-height: 1.3; }
          .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .company-info h3 { margin: 0 0 3px 0; font-size: 13px; }
          .company-info p { margin: 0; font-size: 9px; color: #555; }
          .logo { width: 100px; height: auto; }
          h1 { text-align: center; margin: 10px 0; font-size: 14px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 20px; margin-bottom: 12px; }
          .details p { margin: 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; font-size: 10px; }
          th { background-color: #444; color: white; }
          .dispatch-section { margin: 12px 0; }
          .dispatch-section h3 { font-size: 11px; margin-bottom: 5px; }
          .dispatch-section p { margin: 2px 0; }
          .signatures { display: flex; justify-content: space-between; margin-top: 25px; page-break-inside: avoid; }
          .signature-box { width: 30%; text-align: center; }
          .signature-box .label { font-weight: bold; font-size: 9px; }
          .signature-box .name { font-size: 9px; margin-bottom: 25px; }
          .signature-box .line { border-top: 1px solid #333; padding-top: 3px; font-size: 8px; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 10px; border-top: 1px solid #ddd; font-size: 8px; color: #555; background: white; }
          @page { margin: 10mm; margin-bottom: 25mm; }
          @media print { .footer { position: fixed; } }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="company-info">
            <h3>${COMPANY_INFO.name}</h3>
            <p>${COMPANY_INFO.address}</p>
          </div>
          <img src="${tehamaLogo}" alt="Logo" class="logo" />
        </div>
        
        <h1>MATERIALS DELIVERY NOTE</h1>
        
        <div class="details">
          <p><strong>DN #:</strong> ${data.delivery_note_number}</p>
          <p><strong>Date:</strong> ${data.delivery_note_date}</p>
          <p><strong>Customer:</strong> ${data.customer_name}</p>
          <p><strong>Address:</strong> ${data.customer_address || '-'}</p>
          <p><strong>Model:</strong> ${data.model || '-'}</p>
          <p><strong>Material Condition:</strong> ${materialConditionLabel}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width:25px">#</th>
              <th style="width:80px">Model</th>
              <th>Description</th>
              <th style="width:40px">Qty</th>
              <th style="width:100px">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.model || '-'}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${item.remarks || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="dispatch-section">
          <h3>Dispatching Details:</h3>
          <p><strong>Mean of Despatch:</strong> ${data.mean_of_despatch || '-'} &nbsp;&nbsp; <strong>Vehicle #:</strong> ${data.mean_number || '-'} &nbsp;&nbsp; <strong>Driver:</strong> ${data.driver_name || '-'}</p>
        </div>
        
        <div class="signatures">
          <div class="signature-box">
            <div class="label">Prepared by:</div>
            <div class="name">${data.created_by_name || ''}</div>
            <div class="line">Signature</div>
          </div>
          <div class="signature-box">
            <div class="label">Received by:</div>
            <div class="name">${data.customer_name}</div>
            <div class="line">Signature</div>
          </div>
          <div class="signature-box">
            <div class="label">Driver:</div>
            <div class="name">${data.driver_name || '_______________'}</div>
            <div class="line">Signature</div>
          </div>
        </div>
        
        <div class="footer">
          ${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location} | ${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}
        </div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
