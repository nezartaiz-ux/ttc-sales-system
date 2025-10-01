import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReportPDF = (reportData: {
  title: string;
  dateRange?: string;
  headers: string[];
  rows: any[][];
  summary?: { label: string; value: string }[];
}) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(reportData.title, 14, 20);
  
  // Date range if provided
  if (reportData.dateRange) {
    doc.setFontSize(10);
    doc.text(reportData.dateRange, 14, 28);
  }
  
  // Main table
  autoTable(doc, {
    startY: reportData.dateRange ? 35 : 28,
    head: [reportData.headers],
    body: reportData.rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] }
  });
  
  // Summary section if provided
  if (reportData.summary && reportData.summary.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 35;
    doc.setFontSize(12);
    doc.text('Summary', 14, finalY + 10);
    doc.setFontSize(10);
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
