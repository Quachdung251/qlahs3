// src/utils/excelExportUtils.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const worksheetData = data.map(row => {
    const newRow: { [key: string]: any } = {};
    columns.forEach(col => {
      // Lấy giá trị từ key tương ứng trong đối tượng row
      // Map key của dữ liệu với label của cột
      newRow[col.label] = row[col.key]; 
    });
    return newRow;
  });

  // Tạo một worksheet mới
  const ws = XLSX.utils.json_to_sheet(worksheetData, { header: columns.map(col => col.label) });

  // Điều chỉnh độ rộng cột (tùy chọn)
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
