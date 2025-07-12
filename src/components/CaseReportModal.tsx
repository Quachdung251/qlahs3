// components/CaseReportModal.tsx
import React, { useRef, useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { Case, Defendant } from '../types';
import { generateQrCodeData } from '../utils/qrUtils';
import QRCode from 'qrcode'; // Import thư viện qrcode
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CaseReportModalProps {
  caseItem: Case;
  onClose: () => void;
  autoPrint?: boolean; // Thêm prop mới để tự động in
}

const CaseReportModal: React.FC<CaseReportModalProps> = ({ caseItem, onClose, autoPrint }) => {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null); // Ref cho canvas trong modal (để xem trước)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null); // State để lưu trữ Data URL của QR Code
  const hasPrinted = useRef(false); // Ref để theo dõi xem đã in chưa

  // Effect để vẽ QR Code trong modal (để xem trước) và tạo Data URL cho bản in
  useEffect(() => {
    const generateAndSetQrCode = async () => {
      if (qrCanvasRef.current) {
        try {
          const qrValue = generateQrCodeData(caseItem);
          // Vẽ lên canvas để xem trước trong modal
          await QRCode.toCanvas(qrCanvasRef.current, qrValue, {
            width: 100,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          // Tạo Data URL (base64) để nhúng vào bản in
          const dataUrl = await QRCode.toDataURL(qrValue, {
            width: 80, // Kích thước QR code trong bản in (nhỏ hơn để vừa A4)
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrImageUrl(dataUrl); // Lưu Data URL vào state
        } catch (error) {
          console.error('Lỗi khi tạo QR Code:', error);
          setQrImageUrl(null);
        }
      }
    };

    generateAndSetQrCode();
  }, [caseItem]);

  // Effect để tự động in nếu autoPrint là true và QR đã sẵn sàng
  useEffect(() => {
    if (autoPrint && qrImageUrl && !hasPrinted.current) {
      // Đợi một chút để modal render hoàn chỉnh trước khi in
      setTimeout(() => {
        handlePrintReport();
        hasPrinted.current = true; // Đánh dấu đã in để tránh in lặp lại
      }, 300);
    }
  }, [autoPrint, qrImageUrl]); // Chỉ chạy khi autoPrint hoặc qrImageUrl thay đổi

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const [day, month, year] = dateString.split('/');
      const isoDateString = `${year}-${month}-${day}`;
      return format(new Date(isoDateString), 'dd/MM/yyyy', { locale: vi });
    } catch (e) {
      console.error("Lỗi định dạng ngày:", dateString, e);
      return dateString;
    }
  };

  const handlePrintReport = () => {
    if (!qrImageUrl) {
      alert("Không thể tạo báo cáo. Mã QR chưa sẵn sàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
      return;
    }

    let defendantsHtml = '';
    if (caseItem.defendants && caseItem.defendants.length > 0) {
      defendantsHtml += `<div class="defendant-section">
                            <h3 class="defendant-header">DANH SÁCH BỊ CAN</h3>`;
      caseItem.defendants.forEach((defendant, index) => {
        defendantsHtml += `<div class="defendant-item">
                              <p><span class="font-bold">Tên:</span> ${defendant.name}</p>
                              <p><span class="font-bold">Tội danh:</span> ${defendant.charges}</p>
                              <p><span class="font-bold">Biện pháp ngăn chặn:</span> ${defendant.preventiveMeasure}</p>`;
        if (defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline) {
          defendantsHtml += `<p><span class="font-bold">Thời hạn tạm giam:</span> ${formatDate(defendant.detentionDeadline)}</p>`;
        }
        defendantsHtml += `</div>`;
      });
      defendantsHtml += `</div>`;
    }

    const printContentHtml = `
      <div class="report-container">
        <h2 class="report-header">THÔNG TIN VỤ ÁN</h2>

        <div class="qr-code-print-container">
          <img src="${qrImageUrl}" alt="Mã QR Vụ án">
        </div>

        <div class="main-content-area">
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">TÊN VỤ ÁN:</span>
              <span class="info-value">${caseItem.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ĐIỀU LUẬT:</span>
              <span class="info-value">${caseItem.charges}</span>
            </div>
            <div class="info-row">
              <span class="info-label">HẠN ĐIỀU TRA:</span>
              <span class="info-value">${formatDate(caseItem.investigationDeadline)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">KSV:</span>
              <span class="info-value">
                ${caseItem.prosecutor}
                ${caseItem.supportingProsecutors && caseItem.supportingProsecutors.length > 0 ?
                  ` (Hỗ trợ: ${caseItem.supportingProsecutors.join(', ')})` : ''}
              </span>
            </div>
            <div class="info-row full-width-info">
              <span class="info-label">GHI CHÚ:</span>
              <span class="info-value">${caseItem.notes || 'Không có'}</span>
            </div>
          </div>

          ${defendantsHtml}
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write('<!DOCTYPE html><html><head><title>Báo cáo Vụ án</title>');
      printWindow.document.write(`
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact; /* Đảm bảo màu sắc được in chính xác */
          }
          .report-container {
            width: 210mm; /* Chiều rộng A4 */
            min-height: 297mm; /* Chiều cao A4 */
            margin: 0;
            padding: 15mm; /* Padding cho nội dung bên trong trang A4 */
            box-sizing: border-box;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
            background-color: #fff; /* Đảm bảo nền trắng khi in */
            position: relative; /* Để position absolute của QR hoạt động */
          }
          .report-header {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
          }
          .qr-code-print-container {
            position: absolute;
            top: 15mm;
            right: 15mm;
            text-align: center;
            z-index: 1000;
          }
          .qr-code-print-container img {
            width: 80px;
            height: 80px;
            border: 1px solid #ccc;
            padding: 2px;
            display: block;
            margin: 0 auto;
          }
          /* Điều chỉnh khoảng cách cho nội dung chính để tránh bị QR đè */
          .main-content-area {
            padding-right: 100px; /* Tạo khoảng trống cho QR code (80px QR + 20px margin) */
            box-sizing: border-box;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 15px;
            margin-bottom: 15px;
          }
          .info-row {
            display: flex;
            align-items: flex-start;
          }
          .info-label {
            font-weight: bold;
            width: 80px; /* Điều chỉnh chiều rộng cho nhãn */
            flex-shrink: 0;
          }
          .info-value {
            flex-grow: 1;
          }
          .full-width-info {
            grid-column: span 2;
          }
          .defendant-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #ccc;
          }
          .defendant-header {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .defendant-item {
            border: 1px solid #eee;
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
            font-size: 0.9em;
          }
          /* Ẩn các phần tử không cần thiết khi in */
          .no-print {
            display: none !important;
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContentHtml); // Ghi nội dung đã tạo vào cửa sổ in
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      
      // Không đóng cửa sổ in hoặc modal tự động. Người dùng sẽ đóng thủ công.
      // printWindow.onafterprint = () => printWindow.close(); // Bỏ dòng này
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header của Modal - Ẩn khi in */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10 no-print">
          <h3 className="text-xl font-semibold text-gray-800">Báo cáo Thông tin Vụ án</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nội dung hiển thị trong modal */}
        {/* Phần này sẽ hiển thị trong modal, không phải là phần được in trực tiếp */}
        <div className="p-6 text-gray-800">
          <h2 className="text-2xl font-bold text-center mb-6">THÔNG TIN VỤ ÁN</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
            <div className="flex items-start">
              <span className="font-semibold w-32 flex-shrink-0">TÊN VỤ ÁN:</span>
              <span className="flex-grow">{caseItem.name}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold w-32 flex-shrink-0">ĐIỀU LUẬT:</span>
              <span className="flex-grow">{caseItem.charges}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold w-32 flex-shrink-0">HẠN ĐIỀU TRA:</span>
              <span className="flex-grow">{formatDate(caseItem.investigationDeadline)}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold w-32 flex-shrink-0">KSV:</span>
              <span className="flex-grow">
                {caseItem.prosecutor}
                {caseItem.supportingProsecutors && caseItem.supportingProsecutors.length > 0 &&
                  ` (Hỗ trợ: ${caseItem.supportingProsecutors.join(', ')})`}
              </span>
            </div>
            <div className="flex items-start col-span-full">
              <span className="font-semibold w-32 flex-shrink-0">GHI CHÚ:</span>
              <span className="flex-grow">{caseItem.notes || 'Không có'}</span>
            </div>
          </div>

          {caseItem.defendants && caseItem.defendants.length > 0 && (
            <div className="defendant-section mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-4">DANH SÁCH BỊ CAN</h3>
              {caseItem.defendants.map((defendant, index) => (
                <div key={defendant.id || index} className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
                  <p className="mb-2"><span className="font-semibold">Tên:</span> {defendant.name}</p>
                  <p className="mb-2"><span className="font-semibold">Tội danh:</span> {defendant.charges}</p>
                  <p className="mb-2"><span className="font-semibold">Biện pháp ngăn chặn:</span> {defendant.preventiveMeasure}</p>
                  {defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline && (
                    <p><span className="font-semibold">Thời hạn tạm giam:</span> {formatDate(defendant.detentionDeadline)}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* QR Code cho hiển thị modal (mặc định hiển thị, ẩn khi in) */}
          <div className="qr-code-container mt-8 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2">Mã QR Vụ án</h3>
            <canvas ref={qrCanvasRef} className="border border-gray-300 rounded-md p-2"></canvas>
            <p className="text-sm text-gray-600 mt-2">ID Vụ án: {caseItem.id}</p>
          </div>
        </div>


        {/* Footer của Modal với các nút hành động - Ẩn khi in */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex justify-end gap-3 no-print">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Printer size={16} />
            In Báo cáo
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseReportModal;
