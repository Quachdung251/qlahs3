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
}

const CaseReportModal: React.FC<CaseReportModalProps> = ({ caseItem, onClose }) => {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null); // Ref cho canvas trong modal (để xem trước)
  const reportContentRef = useRef<HTMLDivElement>(null); // Ref cho nội dung báo cáo để in
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null); // State để lưu trữ Data URL của QR Code

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
    if (qrImageUrl) { // Đảm bảo qrImageUrl đã có
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        let defendantsHtml = '';
        if (caseItem.defendants && caseItem.defendants.length > 0) {
          defendantsHtml += `<div class="defendant-section" style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc;">
                                <h3 style="font-size: 1.1em; font-weight: bold; margin-bottom: 10px;">DANH SÁCH BỊ CAN</h3>`;
          caseItem.defendants.forEach((defendant, index) => {
            defendantsHtml += `<div style="border: 1px solid #eee; padding: 8px; margin-bottom: 8px; border-radius: 4px; font-size: 0.9em;">
                                  <p style="margin-bottom: 4px;"><span style="font-weight: bold;">Tên:</span> ${defendant.name}</p>
                                  <p style="margin-bottom: 4px;"><span style="font-weight: bold;">Tội danh:</span> ${defendant.charges}</p>
                                  <p style="margin-bottom: 4px;"><span style="font-weight: bold;">Biện pháp ngăn chặn:</span> ${defendant.preventiveMeasure}</p>`;
            if (defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline) {
              defendantsHtml += `<p><span style="font-weight: bold;">Thời hạn tạm giam:</span> ${formatDate(defendant.detentionDeadline)}</p>`;
            }
            defendantsHtml += `</div>`;
          });
          defendantsHtml += `</div>`;
        }

        const printContent = `
          <div class="report-container" style="position: relative; width: 190mm; min-height: 277mm; margin: auto; padding: 15mm; box-sizing: border-box; font-size: 10pt; line-height: 1.4;">
            <h2 style="font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 15px;">THÔNG TIN VỤ ÁN</h2>

            <div class="qr-code-print-container" style="position: absolute; top: 15mm; right: 15mm; text-align: center;">
              <img src="${qrImageUrl}" alt="Mã QR Vụ án" style="width: 80px; height: 80px; border: 1px solid #ccc; padding: 2px; display: block; margin: 0 auto;">
              <p style="font-size: 8pt; color: #666; margin-top: 5px;">ID Vụ án: ${caseItem.id}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 15px; margin-bottom: 15px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="font-weight: bold; width: 80px; flex-shrink: 0;">TÊN VỤ ÁN:</span>
                <span style="flex-grow: 1;">${caseItem.name}</span>
              </div>
              <div style="display: flex; align-items: flex-start;">
                <span style="font-weight: bold; width: 80px; flex-shrink: 0;">ĐIỀU LUẬT:</span>
                <span style="flex-grow: 1;">${caseItem.charges}</span>
              </div>
              <div style="display: flex; align-items: flex-start;">
                <span style="font-weight: bold; width: 80px; flex-shrink: 0;">HẠN ĐIỀU TRA:</span>
                <span style="flex-grow: 1;">${formatDate(caseItem.investigationDeadline)}</span>
              </div>
              <div style="display: flex; align-items: flex-start;">
                <span style="font-weight: bold; width: 80px; flex-shrink: 0;">KSV:</span>
                <span style="flex-grow: 1;">
                  ${caseItem.prosecutor}
                  ${caseItem.supportingProsecutors && caseItem.supportingProsecutors.length > 0 ?
                    ` (Hỗ trợ: ${caseItem.supportingProsecutors.join(', ')})` : ''}
                </span>
              </div>
              <div style="display: flex; align-items: flex-start; grid-column: span 2;">
                <span style="font-weight: bold; width: 80px; flex-shrink: 0;">GHI CHÚ:</span>
                <span style="flex-grow: 1;">${caseItem.notes || 'Không có'}</span>
              </div>
            </div>

            ${defendantsHtml}
          </div>
        `;

        printWindow.document.write('<html><head><title>Báo cáo Vụ án</title>');
        printWindow.document.write(`
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
            .report-container { width: 210mm; min-height: 297mm; margin: 0; padding: 15mm; box-sizing: border-box; font-size: 10pt; line-height: 1.4; position: relative; }
            h2 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 15px; }
            h3 { font-size: 12pt; font-weight: bold; margin-bottom: 10px; }
            .info-row { display: flex; margin-bottom: 5px; }
            .info-label { font-weight: bold; width: 100px; flex-shrink: 0; }
            .info-value { flex-grow: 1; }
            .defendant-section { margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px; }
            .defendant-item { border: 1px solid #eee; padding: 8px; margin-bottom: 8px; border-radius: 4px; }
            .qr-code-print-container { position: absolute; top: 15mm; right: 15mm; text-align: center; }
            .qr-code-print-container img { display: block; margin: 0 auto; } /* Center image */
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent); // Ghi nội dung đã tạo vào cửa sổ in
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 500);
      }
    } else {
      console.error("Không thể in báo cáo: Mã QR chưa được tạo hoặc nội dung báo cáo không có sẵn.");
      // Có thể hiển thị một thông báo lỗi cho người dùng ở đây
      alert("Không thể tạo báo cáo. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
          <h3 className="text-xl font-semibold text-gray-800">Báo cáo Thông tin Vụ án</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        <div ref={reportContentRef} className="p-6 text-gray-800">
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

          {/* Hiển thị QR Code trong modal bằng canvas (để xem trước) */}
          <div className="qr-code-container mt-8 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2">Mã QR Vụ án</h3>
            {/* Sử dụng canvas để hiển thị QR trong modal */}
            <canvas ref={qrCanvasRef} className="border border-gray-300 rounded-md p-2"></canvas>
            {/* Thẻ img ẩn chứa Data URL của QR để sử dụng trong bản in */}
            {qrImageUrl && <img src={qrImageUrl} alt="QR Code Vụ án" className="hidden" id="qrImageForPrint" />}
            <p className="text-sm text-gray-600 mt-2">ID Vụ án: {caseItem.id}</p>
          </div>
        </div>

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
