import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import tehamaLogo from '@/assets/tehama-logo.png';

const COMPANY_INFO = {
  name: "Tehama Trading Company",
  fullName: "The Tehama Trading Co",
  address: "Algiers Street, P.O.Box: 73",
  city: "Sana'a, Republic of Yemen",
  phone: "+967 1 208916 - 113",
  phoneDirect: "+967 1 208524 (dir)",
  email: "nizar@tehama.com.ye",
  fax: "+967 1 466056",
  branches: {
    hod: "(HO) Hod. Tel: 03 200150 – Fax: 01-200149",
    aden: "Aden Tel-Fax: 241736 – Telex: 2377-Aden. Tel: 241974",
    taiz: "Taiz Tel-Fax: 04-245623/4. Fax: 245622",
    mukalla: "Mukalla Tel: 05-325901/2"
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

export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header with logo
  try {
    doc.addImage(tehamaLogo, 'PNG', 14, 10, 40, 22);
  } catch (e) {
    console.error('Error adding logo:', e);
  }

  // Company Info - Right side
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.fullName, pageWidth - 14, 15, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, pageWidth - 14, 21, { align: 'right' });
  doc.text(COMPANY_INFO.city, pageWidth - 14, 26, { align: 'right' });
  doc.text(`Tel: ${COMPANY_INFO.phone}`, pageWidth - 14, 31, { align: 'right' });
  doc.text(`E-mail: ${COMPANY_INFO.email}`, pageWidth - 14, 36, { align: 'right' });

  // Title based on warranty type
  const title = data.warranty_type === 'تحت الضمان' 
    ? 'Under Warranty Materials Delivery Note'
    : 'Materials Delivery Note';
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 50, { align: 'center' });

  // Delivery Note details
  let yPos = 62;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Details table
  const detailsData = [
    ['Delivery Note Number:', data.delivery_note_number],
    ['Delivery Note Date:', data.delivery_note_date],
    ['Customer Name:', data.customer_name],
    ['Customer Address:', data.customer_address],
    ['Model:', data.model],
  ];

  autoTable(doc, {
    startY: yPos,
    body: detailsData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Material List Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Material List:', 14, yPos);
  yPos += 5;

  // Materials table
  autoTable(doc, {
    startY: yPos,
    head: [['SL', 'Model', 'DESCRIPTION', 'QTY', 'REMARKS']],
    body: data.items.map((item, index) => [
      index + 1,
      item.model,
      item.description,
      item.quantity,
      item.remarks
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 20 },
      4: { cellWidth: 40 }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Dispatching Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Dispatching Details:', 14, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mean of Despatch: ${data.mean_of_despatch}`, 14, yPos);
  yPos += 6;
  doc.text(`Mean Number: ${data.mean_number}`, 14, yPos);
  yPos += 6;
  doc.text(`Driver Name: ${data.driver_name}`, 14, yPos);
  yPos += 15;

  // Signature section
  const sigColWidth = (pageWidth - 28) / 3;
  const sigY = yPos;

  // Prepared by (Company)
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared by:', 14, sigY);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.name, 14, sigY + 6);
  doc.line(14, sigY + 25, 14 + sigColWidth - 10, sigY + 25);
  doc.text('Signature', 14, sigY + 30);
  doc.text(`Name: ${data.created_by_name}`, 14, sigY + 36);

  // Receiving (Customer)
  const col2X = 14 + sigColWidth;
  doc.setFont('helvetica', 'bold');
  doc.text("Receiving Driver's:", col2X, sigY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name, col2X, sigY + 6);
  doc.line(col2X, sigY + 25, col2X + sigColWidth - 10, sigY + 25);
  doc.text('Signature', col2X, sigY + 30);
  doc.text('Name: _________________', col2X, sigY + 36);

  // Driver signature
  const col3X = 14 + sigColWidth * 2;
  doc.line(col3X, sigY + 25, col3X + sigColWidth - 10, sigY + 25);
  doc.text('Signature', col3X, sigY + 30);
  doc.text('Name: _________________', col3X, sigY + 36);

  // Footer with branches
  const footerY = pageHeight - 15;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Branches:', 14, footerY);
  doc.setFont('helvetica', 'normal');
  const branchesText = `${COMPANY_INFO.branches.hod} | ${COMPANY_INFO.branches.aden} | ${COMPANY_INFO.branches.taiz} | ${COMPANY_INFO.branches.mukalla}`;
  doc.text(branchesText, 14, footerY + 4);

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

  const title = data.warranty_type === 'تحت الضمان'
    ? 'Under Warranty Materials Delivery Note'
    : 'Materials Delivery Note';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Delivery Note ${data.delivery_note_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .logo { width: 120px; }
          .company-info { text-align: right; font-size: 10px; }
          .company-info h3 { margin: 0 0 5px 0; font-size: 14px; }
          h1 { text-align: center; margin: 20px 0; font-size: 18px; }
          .details { margin-bottom: 20px; }
          .details p { margin: 3px 0; }
          .details strong { display: inline-block; width: 150px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .dispatch-details { margin: 20px 0; }
          .dispatch-details p { margin: 5px 0; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature-box { width: 30%; text-align: center; }
          .signature-box p { margin: 3px 0; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8px; border-top: 1px solid #ddd; padding: 10px; }
          @media print { .footer { position: fixed; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${tehamaLogo}" alt="Logo" class="logo" />
          <div class="company-info">
            <h3>${COMPANY_INFO.fullName}</h3>
            <p>${COMPANY_INFO.address}</p>
            <p>${COMPANY_INFO.city}</p>
            <p>Tel: ${COMPANY_INFO.phone}</p>
            <p>E-mail: ${COMPANY_INFO.email}</p>
            <p>Fax: ${COMPANY_INFO.fax}</p>
          </div>
        </div>

        <h1>${title}</h1>

        <div class="details">
          <p><strong>Delivery Note Number:</strong> ${data.delivery_note_number}</p>
          <p><strong>Delivery Note Date:</strong> ${data.delivery_note_date}</p>
          <p><strong>Customer Name:</strong> ${data.customer_name}</p>
          <p><strong>Customer Address:</strong> ${data.customer_address}</p>
          <p><strong>Model:</strong> ${data.model}</p>
        </div>

        <h3>Material List:</h3>
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Model</th>
              <th>DESCRIPTION</th>
              <th>QTY</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.model}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${item.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="dispatch-details">
          <h3>Dispatching Details:</h3>
          <p><strong>Mean of Despatch:</strong> ${data.mean_of_despatch}</p>
          <p><strong>Mean Number:</strong> ${data.mean_number}</p>
          <p><strong>Driver Name:</strong> ${data.driver_name}</p>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <p><strong>Prepared by:</strong> ${COMPANY_INFO.name}</p>
            <div class="signature-line">Signature</div>
            <p>Name: ${data.created_by_name}</p>
          </div>
          <div class="signature-box">
            <p><strong>Receiving Driver's:</strong> ${data.customer_name}</p>
            <div class="signature-line">Signature</div>
            <p>Name: _________________</p>
          </div>
          <div class="signature-box">
            <p>&nbsp;</p>
            <div class="signature-line">Signature</div>
            <p>Name: _________________</p>
          </div>
        </div>

        <div class="footer">
          <strong>Branches:</strong> ${COMPANY_INFO.branches.hod} | ${COMPANY_INFO.branches.aden} | ${COMPANY_INFO.branches.taiz} | ${COMPANY_INFO.branches.mukalla}
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
