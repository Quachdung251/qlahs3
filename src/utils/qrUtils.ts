// src/utils/qrUtils.ts

// Import QRCodeCore từ thư viện 'qrcode' để sử dụng phương thức toCanvas
import QRCodeCore from 'qrcode';
// Import QRCodeCanvas từ thư viện 'qrcode.react' nếu bạn muốn sử dụng nó như một React component
// import { QRCodeCanvas } from 'qrcode.react'; // Không cần thiết cho file này nếu chỉ dùng toCanvas

import { Case } from '../types'; // Đảm bảo đường dẫn đúng đến file types của bạn

/**
 * Tạo dữ liệu cho QR code từ thông tin vụ án.
 * Nên mã hóa thông tin cần thiết vào một chuỗi JSON để QR code có thể chứa.
 * Ví dụ: { id: "case_id_123", name: "Ten Vu An" }
 * @param caseData Thông tin vụ án
 * @returns Chuỗi JSON đã stringify để nhúng vào QR code
 */
export const generateQrCodeData = (caseData: Case): string => {
  // Chỉ lưu trữ những thông tin cần thiết để định danh vụ án
  // Có thể thêm các trường khác nếu muốn hiển thị nhanh sau khi quét mà không cần fetch lại
  const data = {
    id: caseData.id,
    name: caseData.name,
    // Thêm các trường khác nếu muốn hiển thị nhanh sau khi quét mà không cần fetch lại
    // charges: caseData.charges,
    // prosecutor: caseData.prosecutor,
  };
  return JSON.stringify(data);
};

/**
 * Giải mã dữ liệu từ QR code.
 * @param qrData Chuỗi dữ liệu từ QR code
 * @returns Đối tượng chứa ID vụ án và các thông tin khác
 */
export const decodeQrCodeData = (qrData: string): { id: string; name?: string } | null => {
  try {
    const parsedData = JSON.parse(qrData);
    // Đảm bảo rằng dữ liệu có ít nhất trường 'id'
    if (parsedData && typeof parsedData.id === 'string') {
      return parsedData;
    }
    return null;
  } catch (error) {
    console.error("Lỗi khi phân tích dữ liệu QR code:", error);
    return null;
  }
};

/**
 * Hàm để tạo một phần tử DOM chứa QR code và thông tin để in.
 * Hàm này không trực tiếp render mà trả về HTML string để sử dụng trong cửa sổ in.
 * @param qrCodeValue Giá trị chuỗi của QR code
 * @param caseName Tên vụ án để hiển thị trên nhãn
 * @returns Chuỗi HTML để in
 */
export const createPrintableQrHtml = (qrCodeValue: string, caseName: string): string => {
  return `
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
          overflow: hidden; /* Ngăn cuộn */
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
          text-align: center;
        }
        .label-name {
          font-size: 8px;
          font-weight: bold;
          margin-top: 5px;
          text-align: center;
          word-break: break-word; /* Ngắt từ nếu tên dài */
          line-height: 1.2;
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
          width: 80, // Kích thước pixel cho QR code
          height: 80,
          colorDark : "#000000",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });
        // Đảm bảo QR code được render trước khi in
        setTimeout(function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        }, 500); // Đợi một chút để QR code render
      </script>
    </body>
    </html>
  `;
};
