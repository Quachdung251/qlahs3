// src/components/QRCodeDisplayModal.tsx
import React, { useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { createPrintableQrHtml } from '../utils/qrUtils';
import { Case } from '../types'; // Import Case interface
import QRCode from 'qrcode'; // Import qrcode từ npm package

interface QRCodeDisplayModalProps {
  caseData: Case; // Thay đổi prop để nhận toàn bộ đối tượng Case
  onClose: () => void;
}

const QRCodeDisplayModal: React.FC<QRCodeDisplayModalModalProps> = ({ caseData, onClose }) => {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Hàm để render QR code vào canvas
  useEffect(() => {
    if (qrCanvasRef.current && caseData.id) {
      const qrValue = JSON.stringify({ id: caseData.id, name: caseData.name }); // QR code chỉ cần id và tên để quét nhanh
      QRCode.toCanvas(qrCanvasRef.current, qrValue, {
        width: 180, // Kích thước hiển thị trong modal
        margin: 1, // Khoảng trắng xung quanh QR
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, function (error) {
        if (error) console.error(error);
      });
    }
  }, [caseData]);

  const handlePrint = () => {
    // Sử dụng hàm createPrintableQrHtml mới để tạo nội dung in
    const printContent = createPrintableQrHtml(caseData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      // setTimeout được sử dụng trong createPrintableQrHtml để đảm bảo QR render trước khi in
    } else {
      console.error("Không thể mở cửa sổ in. Có thể pop-up đã bị chặn.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Mã QR Hồ Sơ Vụ Án</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="mb-6 border p-4 rounded-lg bg-gray-50 flex flex-col items-center">
            <canvas ref={qrCanvasRef} className="w-[180px] h-[180px]"></canvas>
            <p className="text-sm text-gray-600 mt-2">Quét mã này để xem chi tiết hồ sơ</p>
          </div>

          <div className="w-full text-left bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Thông tin vụ án:</h3>
            <p className="text-sm text-gray-800 mb-1"><strong>Tên vụ án:</strong> {caseData.name}</p>
            <p className="text-sm text-gray-800 mb-1"><strong>Tội danh:</strong> {caseData.charges}</p>
            <p className="text-sm text-gray-800 mb-1"><strong>KSV phụ trách:</strong> {caseData.prosecutor}</p>
            <p className="text-sm text-gray-800 mb-1"><strong>Giai đoạn:</strong> {caseData.stage}</p>
            <p className="text-sm text-gray-800 mb-1"><strong>Thời hạn ĐT:</strong> {caseData.investigationDeadline}</p>
            {caseData.notes && <p className="text-sm text-gray-800 mb-1"><strong>Ghi chú:</strong> {caseData.notes}</p>}
          </div>

          {caseData.defendants && caseData.defendants.length > 0 && (
            <div className="w-full text-left bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Thông tin bị can:</h3>
              {caseData.defendants.map((defendant, index) => (
                <div key={defendant.id || index} className="mb-3 pb-3 border-b border-green-200 last:border-b-0 last:mb-0 last:pb-0">
                  <p className="text-sm text-gray-800 mb-1"><strong>Bị can {index + 1}:</strong> {defendant.name}</p>
                  <p className="text-sm text-gray-800 mb-1 ml-4"><strong>Tội danh:</strong> {defendant.charges}</p>
                  <p className="text-sm text-gray-800 mb-1 ml-4"><strong>Biện pháp:</strong> {defendant.preventiveMeasure}</p>
                  {defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline && (
                    <p className="text-sm text-gray-800 mb-1 ml-4"><strong>Hạn tạm giam:</strong> {defendant.detentionDeadline}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <Printer size={20} />
              In Hồ Sơ
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              <X size={20} />
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplayModal;
