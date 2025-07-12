// types.ts
export interface Defendant {
  id: string;
  name: string;
  charges: string; // Tội danh (Điều, Khoản)
  preventiveMeasure: 'Tại ngoại' | 'Tạm giam';
  detentionDeadline?: string; // dd/MM/yyyy format
}

export interface Case {
  id: string;
  name: string;
  charges: string; // Tội danh vụ án (Điều, Khoản)
  investigationDeadline: string; // dd/MM/yyyy format
  prosecutor: string;
  supportingProsecutors?: string[]; // THÊM DÒNG NÀY: Mảng tên kiểm sát viên hỗ trợ
  notes?: string; // Ghi chú thay thế cho investigator
  stage: 'Điều tra' | 'Truy tố' | 'Xét xử' | 'Hoàn thành' | 'Tạm đình chỉ' | 'Đình chỉ' | 'Chuyển đi';
  prosecutionTransferDate?: string; // dd/MM/yyyy format
  trialTransferDate?: string; // dd/MM/yyyy format
  resolutionForm?: string; // THÊM DÒNG NÀY: Hình thức giải quyết
  defendants: Defendant[];
  createdAt: string;
  isImportant?: boolean; // THÊM DÒNG NÀY: Đánh dấu vụ án quan trọng
}

export interface CaseFormData {
  name: string;
  charges: string;
  investigationDeadline: string;
  prosecutor: string;
  supportingProsecutors?: string[]; // THÊM DÒNG NÀY: Mảng tên kiểm sát viên hỗ trợ
  notes?: string;
  defendants: Omit<Defendant, 'id'>[];
}

export interface Report {
  id: string;
  name: string;
  charges: string; // Tội danh tin báo
  resolutionDeadline: string; // dd/MM/yyyy format - ngày hết hạn giải quyết (thay cho reportDate)
  prosecutor: string;
  notes?: string; // Ghi chú
  stage: 'Đang xử lý' | 'Khởi tố' | 'Không khởi tố' | 'Tạm đình chỉ' | 'Chuyển đi';
  prosecutionDate?: string; // dd/MM/yyyy format - ngày khởi tố
  resolutionDate?: string; // dd/MM/yyyy format - ngày quyết định không khởi tố/tạm đình chỉ
  createdAt: string;
}

export interface ReportFormData {
  name: string;
  charges: string;
  resolutionDeadline: string; // Thay cho reportDate
  prosecutor: string;
  notes?: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface UserSession {
  user: User;
  isLoggedIn: boolean;
}
