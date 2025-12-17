/**
 * Excel Export Utility for Dashboard Reports
 * Uses SheetJS (xlsx) library to generate proper XLSX files
 */
import * as XLSX from 'xlsx';

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
}

interface WorkbookData {
  dashboardSummary: SheetData;
  topCustomers: SheetData;
  topProducts: SheetData;
  salarySummary: SheetData;
  employeeSalaries: SheetData;
  reportInfo: {
    generatedAt: string;
    month: number;
    year: number;
    dateRange: {
      from: string;
      to: string;
    };
  };
}

/**
 * Create worksheet from sheet data with proper structure
 */
function createWorksheet(sheet: SheetData, reportInfo: WorkbookData['reportInfo']): XLSX.WorkSheet {
  // Prepare data array with title, info and headers
  const wsData: any[][] = [];
  
  // Add title row
  wsData.push([sheet.sheetName]);
  
  // Add report info row
  const reportDate = new Date(reportInfo.generatedAt).toLocaleString('vi-VN');
  wsData.push([`Báo cáo: Tháng ${reportInfo.month}/${reportInfo.year} | Ngày tạo: ${reportDate}`]);
  
  // Empty row for spacing
  wsData.push([]);
  
  // Add headers
  wsData.push(sheet.headers);
  
  // Add data rows
  sheet.rows.forEach(row => {
    wsData.push(row);
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths: XLSX.ColInfo[] = sheet.headers.map((header, idx) => {
    // Calculate width based on header and data
    let maxWidth = header.length;
    sheet.rows.forEach(row => {
      const cellValue = String(row[idx] || '');
      if (cellValue.length > maxWidth) {
        maxWidth = cellValue.length;
      }
    });
    return { wch: Math.min(Math.max(maxWidth + 2, 12), 50) };
  });
  ws['!cols'] = colWidths;
  
  // Merge title cell across all columns
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: sheet.headers.length - 1 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: sheet.headers.length - 1 } });
  
  return ws;
}

/**
 * Generate and download XLSX file
 */
export function downloadExcelReport(data: WorkbookData, filename?: string): void {
  // Create new workbook
  const wb = XLSX.utils.book_new();
  
  // Define sheets to create
  const sheets = [
    { data: data.dashboardSummary, name: 'Dashboard Summary' },
    { data: data.topCustomers, name: 'Top Customers' },
    { data: data.topProducts, name: 'Top Products' },
    { data: data.salarySummary, name: 'Salary Summary' },
    { data: data.employeeSalaries, name: 'Employee Salaries' }
  ];
  
  // Create each worksheet
  sheets.forEach(sheet => {
    const ws = createWorksheet(sheet.data, data.reportInfo);
    // Sheet name max 31 characters
    const sheetName = sheet.name.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  // Generate filename with timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  const monthYear = `${data.reportInfo.month}-${data.reportInfo.year}`;
  const finalFilename = filename || `PharmaCare_Report_${monthYear}_${dateStr}.xlsx`;
  
  // Write and download file
  XLSX.writeFile(wb, finalFilename);
}

/**
 * Download as CSV (single sheet)
 */
export function downloadCSVReport(sheet: SheetData, filename: string): void {
  // Prepare data array
  const wsData: any[][] = [sheet.headers, ...sheet.rows];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Create workbook with single sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  // Write as CSV
  XLSX.writeFile(wb, filename, { bookType: 'csv' });
}

/**
 * Generate Excel blob for custom handling
 */
export function generateExcelBlob(data: WorkbookData): Blob {
  // Create new workbook
  const wb = XLSX.utils.book_new();
  
  // Define sheets to create
  const sheets = [
    { data: data.dashboardSummary, name: 'Dashboard Summary' },
    { data: data.topCustomers, name: 'Top Customers' },
    { data: data.topProducts, name: 'Top Products' },
    { data: data.salarySummary, name: 'Salary Summary' },
    { data: data.employeeSalaries, name: 'Employee Salaries' }
  ];
  
  // Create each worksheet
  sheets.forEach(sheet => {
    const ws = createWorksheet(sheet.data, data.reportInfo);
    const sheetName = sheet.name.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  // Generate array buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  // Create blob
  return new Blob([wbout], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

export type { WorkbookData, SheetData };
