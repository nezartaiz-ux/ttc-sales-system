import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import tehamaLogo from '@/assets/tehama-logo.png';

// Company information
const COMPANY_INFO = {
  name: "CAT Company",
  address: "Sana'a Branch",
  city: "Sana'a, Yemen"
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
  doc.text(COMPANY_INFO.city, 14, 26);
  
  // Logo on top-right
  try {
    doc.addImage(tehamaLogo, 'PNG', 160, 10, 35, 20);
  } catch (e) {
    console.error('Error adding logo to PDF:', e);
  }
  
  return 35; // Return Y position where content should start
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
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleDateString()}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  const filename = `${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
