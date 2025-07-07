import React, { useState } from 'react';
import { BarChart3, Calendar, FileText, TrendingUp, Download } from 'lucide-react';
import { Report } from '../types';
import DateInput from './DateInput';
import { parseDate, getCurrentDate } from '../utils/dateUtils';

interface ReportStatisticsProps {
  reports: Report[];
}

const ReportStatistics: React.FC<ReportStatisticsProps> = ({ reports }) => {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());

  // Filter reports by date range
  const getFilteredReports = () => {
    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    
    return reports.filter(report => {
      const createdDate = parseDate(report.createdAt);
      return createdDate >= from && createdDate <= to;
    });
  };

  const filteredReports = getFilteredReports();

  // Calculate statistics
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

  // Export to Excel function
  const exportToExcel = () => {
    const newStats = getNewReportsStats();
    const processedStats = getProcessedReportsStats();
    const stageStats = getStageStats();

    const csvRows = [
      ['BÁO CÁO THỐNG KÊ TIN BÁO'],
      [`Từ ngày: ${fromDate} - Đến ngày: ${toDate}`],
      [''],
      ['PHẦN I: TIN BÁO MỚI TIẾP NHẬN'],
      ['Chỉ tiêu', 'Số tin báo'],
      ['Mới tiếp nhận trong kỳ', newStats.toString()],
      [''],
      ['PHẦN II: TIN BÁO ĐÃ XỬ LÝ'],
      ['Chỉ tiêu', 'Số tin báo'],
      ['Tổng đã xử lý', processedStats.total.toString()],
      ['- Khởi tố', processedStats.prosecuted.toString()],
      ['- Không khởi tố', processedStats.notProsecuted.toString()],
      ['- Tạm đình chỉ', processedStats.suspended.toString()],
      ['- Chuyển đi', processedStats.transferred.toString()],
      [''],
      ['PHẦN III: PHÂN BỐ THEO TRẠNG THÁI'],
      ['Trạng thái', 'Số tin báo'],
      ['Đang xử lý', stageStats.pending.toString()],
      ['Khởi tố', stageStats.prosecuted.toString()],
      ['Không khởi tố', stageStats.notProsecuted.toString()],
      ['Tạm đình chỉ', stageStats.suspended.toString()],
      ['Chuyển đi', stageStats.transferred.toString()]
    ];

    const csvContent = csvRows.map(row => row.join('\t')).join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `thong-ke-tin-bao-${fromDate.replace(/\//g, '-')}-${toDate.replace(/\//g, '-')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const newStats = getNewReportsStats();
  const processedStats = getProcessedReportsStats();
  const stageStats = getStageStats();

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; subtitle?: string }> = ({ 
    title, value, icon, color, subtitle 
  }) => (
    <div className={`${color} p-6 rounded-lg shadow-md text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-sm opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="text-white opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          Thống Kê Tin Báo
        </h2>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          Xuất Excel
        </button>
      </div>

      {/* Date Range Selection */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Khoảng Thời Gian Thống Kê</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateInput
            value={fromDate}
            onChange={setFromDate}
            label="Thống kê từ ngày"
            required
          />
          <DateInput
            value={toDate}
            onChange={setToDate}
            label="Thống kê đến ngày"
            required
          />
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Thống kê từ {fromDate} đến {toDate} ({filteredReports.length} tin báo)
        </div>
      </div>

      {/* New Reports Statistics */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-600" />
          Tin Báo Mới Tiếp Nhận
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <StatCard
            title="Số Tin Báo Mới"
            value={newStats}
            icon={<FileText size={32} />}
            color="bg-green-600"
          />
        </div>
      </div>

      {/* Processed Reports Statistics */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-600" />
          Tin Báo Đã Xử Lý
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <StatCard
            title="Tổng Tin Báo Đã Xử Lý"
            value={processedStats.total}
            icon={<FileText size={32} />}
            color="bg-purple-600"
          />
        </div>
        
        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Khởi Tố"
            value={processedStats.prosecuted}
            icon={<FileText size={24} />}
            color="bg-green-500"
            subtitle="tin báo"
          />
          <StatCard
            title="Không Khởi Tố"
            value={processedStats.notProsecuted}
            icon={<FileText size={24} />}
            color="bg-red-500"
            subtitle="tin báo"
          />
          <StatCard
            title="Tạm Đình Chỉ"
            value={processedStats.suspended}
            icon={<FileText size={24} />}
            color="bg-yellow-500"
            subtitle="tin báo"
          />
          <StatCard
            title="Chuyển Đi"
            value={processedStats.transferred}
            icon={<FileText size={24} />}
            color="bg-cyan-500"
            subtitle="tin báo"
          />
        </div>
      </div>

      {/* Current Stage Distribution */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          Phân Bố Theo Trạng Thái
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            title="Đang Xử Lý"
            value={stageStats.pending}
            icon={<FileText size={24} />}
            color="bg-yellow-600"
            subtitle="tin báo"
          />
          <StatCard
            title="Khởi Tố"
            value={stageStats.prosecuted}
            icon={<FileText size={24} />}
            color="bg-green-600"
            subtitle="tin báo"
          />
          <StatCard
            title="Không Khởi Tố"
            value={stageStats.notProsecuted}
            icon={<FileText size={24} />}
            color="bg-red-600"
            subtitle="tin báo"
          />
          <StatCard
            title="Tạm Đình Chỉ"
            value={stageStats.suspended}
            icon={<FileText size={24} />}
            color="bg-orange-600"
            subtitle="tin báo"
          />
          <StatCard
            title="Chuyển Đi"
            value={stageStats.transferred}
            icon={<FileText size={24} />}
            color="bg-cyan-600"
            subtitle="tin báo"
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="mt-8 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">Bảng Tổng Hợp</h3>
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Chỉ Tiêu</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Số Tin Báo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="bg-green-50">
              <td className="px-4 py-3 font-medium">Mới tiếp nhận trong kỳ</td>
              <td className="px-4 py-3 text-center font-bold text-green-600">{newStats}</td>
            </tr>
            <tr className="bg-purple-50">
              <td className="px-4 py-3 font-medium">Đã xử lý trong kỳ</td>
              <td className="px-4 py-3 text-center font-bold text-purple-600">{processedStats.total}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Khởi tố</td>
              <td className="px-4 py-3 text-center text-green-600">{processedStats.prosecuted}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Không khởi tố</td>
              <td className="px-4 py-3 text-center text-red-600">{processedStats.notProsecuted}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Tạm đình chỉ</td>
              <td className="px-4 py-3 text-center text-yellow-600">{processedStats.suspended}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Chuyển đi</td>
              <td className="px-4 py-3 text-center text-cyan-600">{processedStats.transferred}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportStatistics;