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

// Helper function to add header with logo and company info
const addReportHeader = (doc: jsPDF) => {
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

// Helper function to add footer
const addReportFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Center footer with company info
  const footerText = `${COMPANY_INFO.footer.postBox} | ${COMPANY_INFO.footer.location} | ${COMPANY_INFO.footer.phone} | ${COMPANY_INFO.footer.fax}`;
  const textWidth = doc.getTextWidth(footerText);
  const centerX = (doc.internal.pageSize.width - textWidth) / 2;
  doc.text(footerText, centerX, pageHeight - 15);
  
  // Page number
  doc.text(
    `Page ${pageNum} of ${totalPages} - Generated on ${new Date().toLocaleDateString()}`,
    14,
    pageHeight - 10
  );
};

// Helper function to generate report serial number
const generateReportSerialNumber = (reportType: string) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  // Generate a sequential number based on timestamp (simple approach)
  const counter = String(now.getTime() % 10000).padStart(4, '0');
  
  let prefix = 'RP';
  switch(reportType.toLowerCase()) {
    case 'sales':
      prefix = 'RP-Sales';
      break;
    case 'inventory':
      prefix = 'RP-Inv';
      break;
    case 'purchase orders':
    case 'purchase_orders':
      prefix = 'RP-PO';
      break;
    case 'quotations':
      prefix = 'RP-Quot';
      break;
    default:
      prefix = 'RP-Gen';
  }
  
  return `${prefix}-${counter}-${month}-${year}`;
};

export const generateReportPDF = (reportData: {
  title: string;
  dateRange?: string;
  headers: string[];
  rows: any[][];
  summary?: { label: string; value: string }[];
  reportType?: string;
}) => {
  const doc = new jsPDF();
  
  // Generate report serial number
  const reportSerial = generateReportSerialNumber(reportData.reportType || reportData.title);
  
  // Add header with logo and company info
  addReportHeader(doc);
  
  // Report serial number
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Report #: ${reportSerial}`, 14, 38);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.title, 14, 48);
  
  // Date range if provided
  if (reportData.dateRange) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.dateRange, 14, 56);
  }
  
  // Main table
  autoTable(doc, {
    startY: reportData.dateRange ? 63 : 56,
    head: [reportData.headers],
    body: reportData.rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] }
  });
  
  // Summary section if provided
  if (reportData.summary && reportData.summary.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, finalY + 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    reportData.summary.forEach((item, index) => {
      doc.text(`${item.label}: ${item.value}`, 14, finalY + 18 + (index * 7));
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addReportFooter(doc, i, pageCount);
  }
  
  const filename = `${reportSerial}-${reportData.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
};
