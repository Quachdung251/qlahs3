// src/utils/excelExportUtils.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Case, Report } from '../types'; // Import các interface cần thiết

/**
 * Xuất dữ liệu ra file Excel (.xlsx).
 * @param data Mảng các đối tượng dữ liệu cần xuất.
 * @param columns Mảng các đối tượng { key: string, label: string } định nghĩa cột và tiêu đề.
 * @param fileName Tên file Excel sẽ được lưu.
 */
export const exportToExcel = (data: any[], columns: { key: string; label: string }[], fileName: string) => {
  if (!data || data.length === 0) {
    alert('Không có dữ liệu để xuất ra Excel.');
    return;
  }

  // Chuẩn bị dữ liệu theo thứ tự và tiêu đề cột mong muốn
  // json_to_sheet có thể tự động tạo header nếu không có header option,
  // nhưng việc định nghĩa rõ ràng giúp kiểm soát thứ tự và tên cột.
  const headerLabels = columns.map(col => col.label);
  const worksheetData = data.map(row => {
    const newRow: { [key: string]: any } = {};
    columns.forEach(col => {
      newRow[col.label] = row[col.key];
    });
    return newRow;
  });

  const ws = XLSX.utils.json_to_sheet(worksheetData, { header: headerLabels });

  // Điều chỉnh độ rộng cột (tùy chọn)
  // Tính toán độ rộng dựa trên tiêu đề và nội dung dài nhất trong cột
  const colWidths = columns.map(col => ({
    wch: Math.max(
      col.label.length, // Độ rộng tối thiểu bằng độ dài tiêu đề
      ...worksheetData.map(row => (row[col.label] ? String(row[col.label]).length : 0))
    ) + 2 // Thêm một chút padding
  }));
  ws['!cols'] = colWidths;

  // Tạo workbook và thêm worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo'); // Tên sheet là 'Báo cáo'

  // Ghi file và lưu
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(dataBlob, `${fileName}.xlsx`);
};

// Hàm tiện ích để chuẩn bị dữ liệu vụ án theo định dạng mong muốn
// Đây là hàm sẽ được gọi từ App.tsx
export const prepareCaseDataForExcel = (cases: Case[]) => {
  const dataToExport: any[] = [];
  const columns = [
    { key: 'caseName', label: 'Tên Vụ án' },
    { key: 'stage', label: 'Giai đoạn' },
    { key: 'investigationRemaining', label: 'Thời hạn ĐT còn lại' },
    { key: 'prosecutor', label: 'KSV' },
    { key: 'defendantName', label: 'Tên Bị can' },
    { key: 'defendantCharges', label: 'Tội danh Bị can' },
    { key: 'preventiveMeasure', label: 'Biện pháp Ngăn chặn' },
    { key: 'detentionDeadline', label: 'Thời hạn Tạm giam' },
    { key: 'caseNotes', label: 'Ghi chú Vụ án' },
  ];

  cases.forEach((caseItem: Case) => {
    if (caseItem.defendants && caseItem.defendants.length > 0) {
      caseItem.defendants.forEach((defendant, index) => {
        const row: any = {};
        // Chỉ điền thông tin vụ án cho dòng đầu tiên của mỗi vụ
        if (index === 0) {
          row.caseName = caseItem.name;
          row.stage = caseItem.stage;
          // Cần tính toán 'investigationRemaining' nếu nó không phải là thuộc tính trực tiếp
          // Hiện tại đang lấy giá trị của investigationDeadline, bạn có thể thay đổi logic này
          row.investigationRemaining = caseItem.investigationDeadline; 
          row.prosecutor = caseItem.prosecutor;
          row.caseNotes = caseItem.notes || ''; // Đảm bảo không undefined
        } else {
          // Để trống các cột vụ án cho các bị can tiếp theo
          row.caseName = '';
          row.stage = '';
          row.investigationRemaining = '';
          row.prosecutor = '';
          row.caseNotes = '';
        }

        // Điền thông tin bị can
        row.defendantName = defendant.name;
        row.defendantCharges = defendant.charges;
        row.preventiveMeasure = defendant.preventiveMeasure;
        row.detentionDeadline = defendant.detentionDeadline || ''; // Chỉ có nếu là tạm giam

        dataToExport.push(row);
      });
    } else {
      // Xử lý trường hợp vụ án không có bị can nào
      dataToExport.push({
        caseName: caseItem.name,
        stage: caseItem.stage,
        investigationRemaining: caseItem.investigationDeadline,
        prosecutor: caseItem.prosecutor,
        caseNotes: caseItem.notes || '',
        defendantName: 'Không có bị can',
        defendantCharges: '',
        preventiveMeasure: '',
        detentionDeadline: ''
      });
    }
  });

  return { data: dataToExport, columns: columns };
};


// Hàm tiện ích để chuẩn bị dữ liệu tin báo
export const prepareReportDataForExcel = (reports: Report[]) => {
  const dataToExport = reports.map(report => ({
    'Tên Tin báo': report.name,
    'Tội danh': report.charges,
    'Hạn giải quyết': report.resolutionDeadline,
    'KSV': report.prosecutor,
    'Ghi chú': report.notes || '',
    'Trạng thái': report.stage,
  }));

  const columns = [
    { key: 'Tên Tin báo', label: 'Tên Tin báo' },
    { key: 'Tội danh', label: 'Tội danh' },
    { key: 'Hạn giải quyết', label: 'Hạn giải quyết' },
    { key: 'KSV', label: 'KSV' },
    { key: 'Ghi chú', label: 'Ghi chú' },
    { key: 'Trạng thái', label: 'Trạng thái' },
  ];

  return { data: dataToExport, columns: columns };
};