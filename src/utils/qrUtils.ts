// src/utils/qrUtils.ts

import QRCodeCore from 'qrcode';
import { Case, Defendant } from '../types';

/**
 * Tạo dữ liệu cho QR code từ thông tin vụ án.
 * Mã hóa toàn bộ thông tin cần thiết vào một chuỗi JSON.
 * @param caseData Thông tin vụ án đầy đủ
 * @returns Chuỗi JSON đã stringify để nhúng vào QR code
 */
export const generateQrCodeData = (caseData: Case): string => {
  // Bao gồm tất cả thông tin cần thiết để hiển thị trên nhãn in
  const data = {
    id: caseData.id,
    name: caseData.name,
    charges: caseData.charges,
    prosecutor: caseData.prosecutor,
    investigationDeadline: caseData.investigationDeadline,
    stage: caseData.stage,
    notes: caseData.notes,
    defendants: caseData.defendants.map(d => ({
      name: d.name,
      charges: d.charges,
      preventiveMeasure: d.preventiveMeasure,
      detentionDeadline: d.detentionDeadline || '', // Đảm bảo luôn có giá trị string
    })),
    // Thêm các trường khác nếu cần
    prosecutionTransferDate: caseData.prosecutionTransferDate || '',
    trialTransferDate: caseData.trialTransferDate || '',
  };
  return JSON.stringify(data);
};

/**
 * Giải mã dữ liệu từ QR code.
 * @param qrData Chuỗi dữ liệu từ QR code
 * @returns Đối tượng Case cơ bản hoặc null nếu lỗi
 */
export const decodeQrCodeData = (qrData: string): Case | null => {
  try {
    const parsedData: Case = JSON.parse(qrData);
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
 * Hàm để tạo một phần tử DOM chứa QR code và thông tin để in trên khổ A4.
 * @param caseData Thông tin vụ án đầy đủ
 * @returns Chuỗi HTML để in
 */
export const createPrintableQrHtml = (caseData: Case): string => {
  const qrCodeValue = generateQrCodeData(caseData); // Sử dụng hàm generateQrCodeData để đảm bảo dữ liệu đầy đủ
  const defendantsHtml = caseData.defendants.map(d => `
    <div class="defendant-item">
      <strong>Tên:</strong> ${d.name}<br/>
      <strong>Tội danh:</strong> ${d.charges}<br/>
      <strong>Biện pháp:</strong> ${d.preventiveMeasure}
      ${d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline ? `<br/><strong>Hạn tạm giam:</strong> ${d.detentionDeadline}` : ''}
    </div>
  `).join('');

  return `
    <html>
    <head>
      <title>In Hồ Sơ Vụ Án: ${caseData.name}</title>
      <style>
        @page {
          size: A4;
          margin: 1cm; /* Khoảng cách lề cho A4 */
        }
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .print-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
        }
        .header {
          width: 100%;
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
          color: #2c3e50;
        }
        .header p {
          font-size: 14px;
          color: #7f8c8d;
        }
        .content-wrapper {
          display: flex;
          width: 100%;
          max-width: 800px; /* Giới hạn chiều rộng nội dung để dễ đọc */
          gap: 30px;
          justify-content: center;
        }
        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0; /* Không co lại */
        }
        canvas {
          width: 150px !important; /* Kích thước QR code trên A4 */
          height: 150px !important;
          border: 1px solid #ccc;
          padding: 5px;
          border-radius: 5px;
        }
        .case-details {
          flex-grow: 1;
          font-size: 14px;
          line-height: 1.6;
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .case-details h2 {
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 10px;
          color: #34495e;
        }
        .case-details strong {
          color: #2c3e50;
        }
        .defendant-section {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
        }
        .defendant-section h2 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #34495e;
        }
        .defendant-item {
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="header">
          <h1>Hồ Sơ Vụ Án</h1>
          <p>Thông tin chi tiết vụ án và bị can</p>
        </div>
        <div class="content-wrapper">
          <div class="qr-section">
            <canvas id="qrCanvasPrint"></canvas>
            <p style="font-weight: bold; margin-top: 10px; font-size: 12px;">Mã QR Hồ Sơ</p>
          </div>
          <div class="case-details">
            <h2>Thông Tin Vụ Án</h2>
            <p><strong>Tên Vụ Án:</strong> ${caseData.name}</p>
            <p><strong>Tội Danh:</strong> ${caseData.charges}</p>
            <p><strong>Kiểm Sát Viên:</strong> ${caseData.prosecutor}</p>
            <p><strong>Thời Hạn Điều Tra:</strong> ${caseData.investigationDeadline}</p>
            <p><strong>Giai Đoạn:</strong> ${caseData.stage}</p>
            ${caseData.prosecutionTransferDate ? `<p><strong>Ngày Chuyển Truy Tố:</strong> ${caseData.prosecutionTransferDate}</p>` : ''}
            ${caseData.trialTransferDate ? `<p><strong>Ngày Chuyển Xét Xử:</strong> ${caseData.trialTransferDate}</p>` : ''}
            ${caseData.notes ? `<p><strong>Ghi Chú:</strong> ${caseData.notes}</p>` : ''}
          </div>
        </div>
        <div class="defendant-section">
          <h2>Thông Tin Bị Can</h2>
          ${defendantsHtml || '<p>Không có thông tin bị can.</p>'}
        </div>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode.js/1.0.0/qrcode.min.js"></script>
      <script>
        var qrcode = new QRCode(document.getElementById("qrCanvasPrint"), {
          text: "${qrCodeValue}",
          width: 150,
          height: 150,
          colorDark : "#000000",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });
        setTimeout(function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        }, 500);
      </script>
    </body>
    </html>
  `;
};