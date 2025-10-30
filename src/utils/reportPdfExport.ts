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

export const generateReportPDF = (reportData: {
  title: string;
  dateRange?: string;
  headers: string[];
  rows: any[][];
  summary?: { label: string; value: string }[];
}) => {
  const doc = new jsPDF();
  
  // Add header with logo and company info
  addReportHeader(doc);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.title, 14, 45);
  
  // Date range if provided
  if (reportData.dateRange) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.dateRange, 14, 53);
  }
  
  // Main table
  autoTable(doc, {
    startY: reportData.dateRange ? 60 : 53,
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
  
  const filename = `${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
