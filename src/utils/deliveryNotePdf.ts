import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import tehamaLogo from '@/assets/tehama-logo.png';

// Company information - matching pdfExport.ts format
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

// Helper function to add header with logo and company info - same as pdfExport.ts
const addPDFHeader = (doc: jsPDF) => {
  // Company info on top-left
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 14, 21);
  
  // Logo on top-right
  try {
    doc.addImage(tehamaLogo, 'PNG', 160, 10, 35, 20);
  } catch (e) {
    console.error('Error adding logo to PDF:', e);
  }
  
  return 30; // Return Y position where content should start
};

// Helper function to add footer with company info - same as pdfExport.ts
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

export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 55;

  // Add header
  addPDFHeader(doc);

  // Title based on warranty type
  const title = data.warranty_type === 'تحت الضمان' 
    ? 'UNDER WARRANTY DELIVERY NOTE'
    : 'MATERIALS DELIVERY NOTE';
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 45, { align: 'center' });

  // Delivery Note details
  let yPos = 58;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Delivery Note #: ${data.delivery_note_number}`, 14, yPos);
  yPos += 7;
  doc.text(`Date: ${data.delivery_note_date}`, 14, yPos);
  yPos += 7;
  doc.text(`Customer: ${data.customer_name}`, 14, yPos);
  yPos += 7;
  doc.text(`Address: ${data.customer_address || '-'}`, 14, yPos);
  yPos += 7;
  doc.text(`Model: ${data.model || '-'}`, 14, yPos);
  yPos += 7;
  doc.text(`Warranty Type: ${data.warranty_type}`, 14, yPos);
  yPos += 10;

  // Materials table
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
    styles: { fontSize: 9 },
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 35 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 18 },
      4: { cellWidth: 40 }
    },
    margin: { bottom: marginBottom }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Dispatching Details section
  if (yPos > pageHeight - marginBottom - 50) {
    doc.addPage();
    addPDFHeader(doc);
    yPos = 40;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Dispatching Details:', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mean of Despatch: ${data.mean_of_despatch || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Mean Number: ${data.mean_number || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Driver Name: ${data.driver_name || '-'}`, 14, yPos);
  yPos += 20;

  // Signature section - 3 columns
  const sigColWidth = (pageWidth - 28) / 3;
  
  if (yPos > pageHeight - marginBottom - 40) {
    doc.addPage();
    addPDFHeader(doc);
    yPos = 40;
  }

  // Column 1: Prepared by
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared by:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  if (data.created_by_name) {
    doc.text(data.created_by_name, 14, yPos + 6);
  }
  doc.line(14, yPos + 25, 14 + sigColWidth - 10, yPos + 25);
  doc.setFontSize(8);
  doc.text('Signature', 14 + (sigColWidth - 30) / 2, yPos + 30);

  // Column 2: Received by (Customer)
  const col2X = 14 + sigColWidth;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Received by:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col2X, yPos + 6);
  doc.line(col2X, yPos + 25, col2X + sigColWidth - 10, yPos + 25);
  doc.setFontSize(8);
  doc.text('Signature', col2X + (sigColWidth - 30) / 2, yPos + 30);

  // Column 3: Driver
  const col3X = 14 + sigColWidth * 2;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver:', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.driver_name || '_______________', col3X, yPos + 6);
  doc.line(col3X, yPos + 25, col3X + sigColWidth - 10, yPos + 25);
  doc.setFontSize(8);
  doc.text('Signature', col3X + (sigColWidth - 30) / 2, yPos + 30);

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc);
  }

  // Save PDF - mobile compatible
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

  const title = data.warranty_type === 'تحت الضمان'
    ? 'UNDER WARRANTY DELIVERY NOTE'
    : 'MATERIALS DELIVERY NOTE';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Delivery Note ${data.delivery_note_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .company-info { text-align: left; }
          .company-info h3 { margin: 0 0 5px 0; font-size: 16px; }
          .company-info p { margin: 2px 0; font-size: 11px; color: #555; }
          .logo { width: 120px; height: auto; }
          h1 { text-align: center; margin: 20px 0; }
          .header { margin-bottom: 20px; }
          .header p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .dispatch-section { margin: 30px 0; }
          .dispatch-section h3 { margin-bottom: 10px; }
          .dispatch-section p { margin: 5px 0; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }
          .signature-box { width: 30%; text-align: center; }
          .signature-box .label { font-weight: bold; margin-bottom: 5px; }
          .signature-box .name { margin-bottom: 40px; }
          .signature-box .line { border-top: 1px solid #333; padding-top: 5px; font-size: 10px; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #555; background: white; }
          @page { margin-bottom: 80px; }
          @media print { .footer { position: fixed; } }
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
        
        <h1>${title}</h1>
        
        <div class="header">
          <p><strong>Delivery Note #:</strong> ${data.delivery_note_number}</p>
          <p><strong>Date:</strong> ${data.delivery_note_date}</p>
          <p><strong>Customer:</strong> ${data.customer_name}</p>
          <p><strong>Address:</strong> ${data.customer_address || '-'}</p>
          <p><strong>Model:</strong> ${data.model || '-'}</p>
          <p><strong>Warranty Type:</strong> ${data.warranty_type}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Model</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Remarks</th>
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
          <p><strong>Mean of Despatch:</strong> ${data.mean_of_despatch || '-'}</p>
          <p><strong>Mean Number:</strong> ${data.mean_number || '-'}</p>
          <p><strong>Driver Name:</strong> ${data.driver_name || '-'}</p>
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
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
