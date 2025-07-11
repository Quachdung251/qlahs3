// src/utils/qrUtils.ts

import QRCode from 'qrcode.react'; // Import thư viện qrcode.react
import { Case } from '../types'; // Đảm bảo đường dẫn đúng đến file types của bạn

/**
 * Tạo dữ liệu cho QR code từ thông tin vụ án.
 * Nên mã hóa thông tin cần thiết vào một chuỗi JSON hoặc URL để QR code có thể chứa.
 * Ví dụ: { id: "case_id_123", name: "Ten Vu An" }
 * @param caseData Thông tin vụ án
 * @returns Chuỗi JSON đã stringify để nhúng vào QR code
 */
export const generateQrCodeData = (caseData: Case): string => {
  // Chỉ lưu trữ những thông tin cần thiết để định danh vụ án
  // Có thể thêm các trường khác nếu cần cho việc hiển thị nhanh sau khi quét
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
export const decodeQrCodeData = (qrData: string) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    return null;
  }
};

/**
 * Hàm để tạo một phần tử DOM chứa QR code và thông tin để in.
 * Điều này hữu ích khi sử dụng thư viện in như react-to-print.
 * @param qrCodeValue Giá trị chuỗi của QR code
 * @param caseName Tên vụ án để hiển thị trên nhãn
 * @returns Element HTML để in
 */
export const createPrintableQrLabel = (qrCodeValue: string, caseName: string) => {
  const printContent = document.createElement('div');
  printContent.style.width = '4cm';
  printContent.style.height = '3cm';
  printContent.style.display = 'flex';
  printContent.style.flexDirection = 'column';
  printContent.style.justifyContent = 'center';
  printContent.style.alignItems = 'center';
  printContent.style.padding = '5px';
  printContent.style.border = '1px solid #ccc'; // Thêm border để dễ hình dung kích thước

  // Tạo canvas để render QR code
  const canvas = document.createElement('canvas');
  QRCode.toCanvas(canvas, qrCodeValue, { width: 80, margin: 2 }, function (error) {
    if (error) console.error(error);
  });
  printContent.appendChild(canvas);

  // Thêm tên vụ án
  const nameDiv = document.createElement('div');
  nameDiv.style.fontSize = '8px';
  nameDiv.style.fontWeight = 'bold';
  nameDiv.style.marginTop = '5px';
  nameDiv.style.textAlign = 'center';
  nameDiv.textContent = caseName;
  printContent.appendChild(nameDiv);

  return printContent;
};