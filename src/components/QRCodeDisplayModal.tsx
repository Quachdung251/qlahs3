// src/components/QRCodeDisplayModal.tsx
import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import { Download, Printer, X } from 'lucide-react';
import { createPrintableQrLabel } from '../utils/qrUtils'; // Import hàm tiện ích

interface QRCodeDisplayModalProps {
  qrCodeValue: string;
  caseName: string;
  onClose: () => void;
}

const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({ qrCodeValue, caseName, onClose }) => {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr_code_${caseName.replace(/\s/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = createPrintableQrLabel(qrCodeValue, caseName);
      printWindow.document.write(`
        <html>
        <head>
          <title>In Nhãn QR Code</title>
          <style>
            @page {
              size: 4cm 3cm; /* Kích thước nhãn 4x3 cm */
              margin: 0;
            }
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .label-container {
              width: 4cm;
              height: 3cm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 5px;
              box-sizing: border-box; /* Đảm bảo padding không làm tăng kích thước */
            }
            .label-name {
              font-size: 8px;
              font-weight: bold;
              margin-top: 5px;
              text-align: center;
              word-break: break-word; /* Ngắt từ nếu tên dài */
            }
            canvas {
              width: 2.5cm !important; /* Đảm bảo kích thước QR code phù hợp */
              height: 2.5cm !important;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <canvas id="qrCanvasPrint"></canvas>
            <div class="label-name">${caseName}</div>
          </div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode.js/1.0.0/qrcode.min.js"></script>
          <script>
            // Sử dụng qrcode.js để render QR code trên cửa sổ in
            var qrcode = new QRCode(document.getElementById("qrCanvasPrint"), {
              text: "${qrCodeValue}",
              width: 80,
              height: 80,
              colorDark : "#000000",
              colorLight : "#ffffff",
              correctLevel : QRCode.CorrectLevel.H
            });
            window.onload = function() {
              printWindow.print();
              printWindow.onafterprint = function() {
                printWindow.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Mã QR Vụ Án Mới</h3>
        <div className="flex justify-center mb-6">
          <QRCode
            value={qrCodeValue}
            size={180}
            level="H"
            includeMargin={true}
            renderAs="canvas"
            ref={qrCodeRef}
            className="rounded-md shadow-sm"
          />
        </div>
        <p className="text-center text-gray-700 text-lg font-medium mb-4">{caseName}</p>
        <p className="text-center text-sm text-gray-500 mb-6">
          Mã QR này chứa thông tin định danh của vụ án.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            <Download size={18} />
            Tải QR Code
          </button>
          <button
            onClick={handlePrintQR}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-md"
          >
            <Printer size={18} />
            In Nhãn (4x3 cm)
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplayModal;