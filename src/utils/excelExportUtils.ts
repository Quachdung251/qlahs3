// src/utils/excelExportUtils.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Case, Report } from '../types'; // Import các interface cần thiết
import { parseDate, getCurrentDate, getDaysRemaining, isExpiringSoon } from './dateUtils'; // Import các hàm xử lý ngày tháng

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
  const headerLabels = columns.map(col => col.label);
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
  const ws = XLSX.utils.json_to_sheet(worksheetData, { header: headerLabels });

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
          row.investigationRemaining = `${getDaysRemaining(caseItem.investigationDeadline)} ngày`; 
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
        investigationRemaining: `${getDaysRemaining(caseItem.investigationDeadline)} ngày`,
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


/**
 * Chuẩn bị dữ liệu thống kê vụ án để xuất ra Excel.
 * @param cases Mảng các đối tượng Case.
 * @param fromDate Ngày bắt đầu thống kê.
 * @param toDate Ngày kết thúc thống kê.
 */
export const prepareCaseStatisticsForExcel = (cases: Case[], fromDate: string, toDate: string) => {
  const from = parseDate(fromDate);
  const to = parseDate(toDate);
    
  const filteredCases = cases.filter(caseItem => {
    const createdDate = parseDate(caseItem.createdAt);
    return createdDate >= from && createdDate <= to;
  });

  const getNewCasesStats = () => {
    const newCases = filteredCases.length;
    const newDefendants = filteredCases.reduce((total, caseItem) => total + caseItem.defendants.length, 0);
    return { cases: newCases, defendants: newDefendants };
  };

  const getProcessedCasesStats = () => {
    const processedCases = filteredCases.filter(c => 
      ['Hoàn thành', 'Tạm đình chỉ', 'Đình chỉ', 'Chuyển đi'].includes(c.stage)
    );
    
    const stats = {
      completed: processedCases.filter(c => c.stage === 'Hoàn thành').length,
      suspended: processedCases.filter(c => c.stage === 'Tạm đình chỉ').length,
      discontinued: processedCases.filter(c => c.stage === 'Đình chỉ').length,
      transferred: processedCases.filter(c => c.stage === 'Chuyển đi').length,
      totalCases: processedCases.length,
      totalDefendants: processedCases.reduce((total, caseItem) => total + caseItem.defendants.length, 0)
    };
    
    return stats;
  };

  const getStageStats = () => {
    return {
      investigation: filteredCases.filter(c => c.stage === 'Điều tra').length,
      prosecution: filteredCases.filter(c => c.stage === 'Truy tố').length,
      trial: filteredCases.filter(c => c.stage === 'Xét xử').length,
      completed: filteredCases.filter(c => c.stage === 'Hoàn thành').length,
      suspended: filteredCases.filter(c => c.stage === 'Tạm đình chỉ').length,
      discontinued: filteredCases.filter(c => c.stage === 'Đình chỉ').length,
      transferred: filteredCases.filter(c => c.stage === 'Chuyển đi').length
    };
  };

  const newStats = getNewCasesStats();
  const processedStats = getProcessedCasesStats();
  const stageStats = getStageStats();

  const dataToExport = [
    { key: 'header1', label: 'BÁO CÁO THỐNG KÊ VỤ ÁN', value: '' },
    { key: 'dateRange', label: `Từ ngày: ${fromDate} - Đến ngày: ${toDate}`, value: '' },
    { key: 'empty1', label: '', value: '' },
    { key: 'section1Header', label: 'PHẦN I: VỤ ÁN/BỊ CAN MỚI NHẬN', value: '' },
    { key: 'newCasesLabel', label: 'Chỉ tiêu', value: 'Số vụ án', value2: 'Số bị can' },
    { key: 'newCases', label: 'Mới nhận trong kỳ', value: newStats.cases, value2: newStats.defendants },
    { key: 'empty2', label: '', value: '' },
    { key: 'section2Header', label: 'PHẦN II: VỤ ÁN/BỊ CAN ĐÃ XỬ LÝ', value: '' },
    { key: 'processedCasesLabel', label: 'Chỉ tiêu', value: 'Số vụ án', value2: 'Số bị can' },
    { key: 'totalProcessed', label: 'Tổng đã xử lý', value: processedStats.totalCases, value2: processedStats.totalDefendants },
    { key: 'completed', label: '- Hoàn thành (đã xét xử)', value: processedStats.completed, value2: filteredCases.filter(c => c.stage === 'Hoàn thành').reduce((total, c) => total + c.defendants.length, 0) },
    { key: 'suspended', label: '- Tạm đình chỉ', value: processedStats.suspended, value2: filteredCases.filter(c => c.stage === 'Tạm đình chỉ').reduce((total, c) => total + c.defendants.length, 0) },
    { key: 'discontinued', label: '- Đình chỉ', value: processedStats.discontinued, value2: filteredCases.filter(c => c.stage === 'Đình chỉ').reduce((total, c) => total + c.defendants.length, 0) },
    { key: 'transferred', label: '- Chuyển đi', value: processedStats.transferred, value2: filteredCases.filter(c => c.stage === 'Chuyển đi').reduce((total, c) => total + c.defendants.length, 0) },
    { key: 'empty3', label: '', value: '' },
    { key: 'section3Header', label: 'PHẦN III: PHÂN BỐ THEO GIAI ĐOẠN', value: '' },
    { key: 'stageLabel', label: 'Giai đoạn', value: 'Số vụ án' },
    { key: 'investigation', label: 'Điều tra', value: stageStats.investigation },
    { key: 'prosecution', label: 'Truy tố', value: stageStats.prosecution },
    { key: 'trial', label: 'Xét xử', value: stageStats.trial },
    { key: 'completedStage', label: 'Hoàn thành', value: stageStats.completed },
    { key: 'suspendedStage', label: 'Tạm đình chỉ', value: stageStats.suspended },
    { key: 'discontinuedStage', label: 'Đình chỉ', value: stageStats.discontinued },
    { key: 'transferredStage', label: 'Chuyển đi', value: stageStats.transferred },
  ];

  const columns = [
    { key: 'label', label: 'Chỉ tiêu' },
    { key: 'value', label: 'Số vụ án' },
    { key: 'value2', label: 'Số bị can' }, // Chỉ dùng cho một số dòng
  ];

  // Điều chỉnh để những dòng không có value2 sẽ không hiển thị cột đó
  // hoặc chỉ hiển thị cho các dòng có dữ liệu bị can
  const finalColumns = [
    { key: 'label', label: 'Chỉ tiêu' },
    { key: 'value', label: 'Số liệu' },
  ];

  // Cần một cách linh hoạt hơn để xử lý cột, có thể tạo ra các sheet riêng hoặc xử lý trong hàm exportToExcel
  // Tạm thời, chúng ta sẽ tạo một mảng dữ liệu phẳng với các cột cố định,
  // và các ô không liên quan sẽ để trống.

  const formattedData = dataToExport.map(item => {
    const row: any = {};
    if (item.key === 'header1' || item.key === 'dateRange' || item.key.startsWith('empty') || item.key.endsWith('Header')) {
      row['Chỉ tiêu'] = item.label;
      row['Số liệu'] = ''; // Để trống
      row['Số bị can'] = ''; // Để trống
    } else if (item.key === 'newCasesLabel' || item.key === 'processedCasesLabel') {
      row['Chỉ tiêu'] = item.label;
      row['Số liệu'] = item.value;
      row['Số bị can'] = item.value2;
    } else if (item.key === 'stageLabel') {
      row['Chỉ tiêu'] = item.label;
      row['Số liệu'] = item.value;
      row['Số bị can'] = ''; // Để trống
    }
    else {
      row['Chỉ tiêu'] = item.label;
      row['Số liệu'] = item.value;
      row['Số bị can'] = item.value2 !== undefined ? item.value2 : ''; // Chỉ điền nếu có value2
    }
    return row;
  });

  const finalHeaders = ['Chỉ tiêu', 'Số liệu'];
  // Nếu có bất kỳ dòng nào có 'Số bị can', thì thêm cột này vào header
  if (dataToExport.some(item => item.value2 !== undefined && item.value2 !== '')) {
    finalHeaders.push('Số bị can');
  }


  return { data: formattedData, columns: finalHeaders.map(h => ({ key: h, label: h })) };
};

/**
 * Chuẩn bị dữ liệu thống kê tin báo để xuất ra Excel.
 * @param reports Mảng các đối tượng Report.
 * @param fromDate Ngày bắt đầu thống kê.
 * @param toDate Ngày kết thúc thống kê.
 */
export const prepareReportStatisticsForExcel = (reports: Report[], fromDate: string, toDate: string) => {
  const from = parseDate(fromDate);
  const to = parseDate(toDate);
    
  const filteredReports = reports.filter(report => {
    const createdDate = parseDate(report.createdAt);
    return createdDate >= from && createdDate <= to;
  });

  const getNewReportsStats = () => {
    return filteredReports.length;
  };

  const getProcessedReportsStats = () => {
    const processedReports = filteredReports.filter(r => 
      ['Khởi tố', 'Không khởi tố', 'Tạm đình chỉ', 'Chuyển đi'].includes(r.stage)
    );
    
    return {
      prosecuted: processedReports.filter(r => r.stage === 'Khởi tố').length,
      notProsecuted: processedReports.filter(r => r.stage === 'Không khởi tố').length,
      suspended: processedReports.filter(r => r.stage === 'Tạm đình chỉ').length,
      transferred: processedReports.filter(r => r.stage === 'Chuyển đi').length,
      total: processedReports.length
    };
  };

  const getStageStats = () => {
    return {
      pending: filteredReports.filter(r => r.stage === 'Đang xử lý').length,
      prosecuted: filteredReports.filter(r => r.stage === 'Khởi tố').length,
      notProsecuted: filteredReports.filter(r => r.stage === 'Không khởi tố').length,
      suspended: filteredReports.filter(r => r.stage === 'Tạm đình chỉ').length,
      transferred: filteredReports.filter(r => r.stage === 'Chuyển đi').length
    };
  };

  const newStats = getNewReportsStats();
  const processedStats = getProcessedReportsStats();
  const stageStats = getStageStats();

  const dataToExport = [
    { key: 'header1', label: 'BÁO CÁO THỐNG KÊ TIN BÁO' },
    { key: 'dateRange', label: `Từ ngày: ${fromDate} - Đến ngày: ${toDate}` },
    { key: 'empty1', label: '' },
    { key: 'section1Header', label: 'PHẦN I: TIN BÁO MỚI TIẾP NHẬN' },
    { key: 'newReportsLabel', label: 'Chỉ tiêu', value: 'Số tin báo' },
    { key: 'newReports', label: 'Mới tiếp nhận trong kỳ', value: newStats },
    { key: 'empty2', label: '' },
    { key: 'section2Header', label: 'PHẦN II: TIN BÁO ĐÃ XỬ LÝ' },
    { key: 'processedReportsLabel', label: 'Chỉ tiêu', value: 'Số tin báo' },
    { key: 'totalProcessed', label: 'Tổng đã xử lý', value: processedStats.total },
    { key: 'prosecuted', label: '- Khởi tố', value: processedStats.prosecuted },
    { key: 'notProsecuted', label: '- Không khởi tố', value: processedStats.notProsecuted },
    { key: 'suspended', label: '- Tạm đình chỉ', value: processedStats.suspended },
    { key: 'transferred', label: '- Chuyển đi', value: processedStats.transferred },
    { key: 'empty3', label: '' },
    { key: 'section3Header', label: 'PHẦN III: PHÂN BỐ THEO TRẠNG THÁI' },
    { key: 'stageLabel', label: 'Trạng thái', value: 'Số tin báo' },
    { key: 'pending', label: 'Đang xử lý', value: stageStats.pending },
    { key: 'prosecutedStage', label: 'Khởi tố', value: stageStats.prosecuted },
    { key: 'notProsecutedStage', label: 'Không khởi tố', value: stageStats.notProsecuted },
    { key: 'suspendedStage', label: 'Tạm đình chỉ', value: stageStats.suspended },
    { key: 'transferredStage', label: 'Chuyển đi', value: stageStats.transferred },
  ];

  const formattedData = dataToExport.map(item => {
    const row: any = {};
    if (item.key === 'header1' || item.key === 'dateRange' || item.key.startsWith('empty') || item.key.endsWith('Header')) {
      row['Chỉ tiêu'] = item.label;
      row['Số tin báo'] = ''; // Để trống
    } else if (item.key === 'newReportsLabel' || item.key === 'processedReportsLabel' || item.key === 'stageLabel') {
      row['Chỉ tiêu'] = item.label;
      row['Số tin báo'] = item.value;
    } else {
      row['Chỉ tiêu'] = item.label;
      row['Số tin báo'] = item.value;
    }
    return row;
  });

  const columns = [
    { key: 'Chỉ tiêu', label: 'Chỉ tiêu' },
    { key: 'Số tin báo', label: 'Số tin báo' },
  ];

  return { data: formattedData, columns: columns };
};
