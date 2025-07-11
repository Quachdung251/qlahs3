// src/components/QRCodeScannerModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, UploadCloud, Search } from 'lucide-react';
import jsQR from 'jsqr'; // Thư viện giải mã QR code
import { decodeQrCodeData } from '../utils/qrUtils';

interface QRCodeScannerModalProps {
  onScanSuccess: (caseId: string) => void;
  onClose: () => void;
}

const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    // Kiểm tra xem có camera hay không
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      setHasCamera(videoInputDevices.length > 0);
    });
  }, []);

  const startScanner = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setIsScanning(true);
      setScanMessage('Đang khởi động camera...');
      requestAnimationFrame(() => tick(stream));
    } catch (err) {
      console.error("Lỗi khi truy cập camera:", err);
      setScanMessage('Không thể truy cập camera. Vui lòng kiểm tra quyền hoặc thử tải ảnh.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setScanMessage(null);
  };

  const tick = (stream: MediaStream) => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      stopScanner();
      return;
    }

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // Đảm bảo canvas có kích thước phù hợp với video
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          console.log("Mã QR được phát hiện:", code.data);
          const decodedData = decodeQrCodeData(code.data);
          if (decodedData && decodedData.id) {
            onScanSuccess(decodedData.id);
            stopScanner();
            onClose(); // Đóng modal sau khi quét thành công
            return;
          } else {
            setScanMessage('Mã QR không hợp lệ hoặc không chứa ID vụ án.');
          }
        }
      }
    }
    requestAnimationFrame(() => tick(stream));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanMessage('Đang xử lý ảnh...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0, img.width, img.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            console.log("Mã QR từ ảnh:", code.data);
            const decodedData = decodeQrCodeData(code.data);
            if (decodedData && decodedData.id) {
              onScanSuccess(decodedData.id);
              onClose(); // Đóng modal sau khi quét thành công
            } else {
              setScanMessage('Mã QR không hợp lệ hoặc không chứa ID vụ án.');
            }
          } else {
            setScanMessage('Không tìm thấy mã QR trong ảnh.');
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopScanner(); // Đảm bảo dừng camera khi component unmount
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Đóng"
        >
          <X size={24} />
        </button>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
          <Search size={24} /> Quét Mã QR Hồ Sơ
        </h3>

        <div className="flex flex-col items-center gap-4 mb-6">
          {hasCamera && (
            <button
              onClick={isScanning ? stopScanner : startScanner}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium shadow-md transition-colors ${
                isScanning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Camera size={20} />
              {isScanning ? 'Dừng Quét Camera' : 'Bắt Đầu Quét Camera'}
            </button>
          )}
          <label htmlFor="qr-image-upload" className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer font-medium shadow-md">
            <UploadCloud size={20} />
            Tải Ảnh Mã QR Từ File
            <input
              id="qr-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {isScanning && (
          <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
            {/* Video feed for camera scanning */}
            <video ref={videoRef} className="w-full h-full object-cover"></video>
            {/* Hidden canvas for processing video frames */}
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full hidden"></canvas>
            {/* Visual indicator for scanning area */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-3/4 border-4 border-blue-500 rounded-lg animate-pulse"></div>
            </div>
          </div>
        )}

        {scanMessage && (
          <p className={`text-center text-sm mt-4 ${scanMessage.startsWith('Không thể') || scanMessage.startsWith('Không tìm thấy') || scanMessage.startsWith('Mã QR không hợp lệ') ? 'text-red-600' : 'text-green-600'}`}>
            {scanMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default QRCodeScannerModal;
