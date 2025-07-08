import React, { useState } from 'react';
import { BarChart3, Calendar, FileText, Users, TrendingUp, ArrowRight, Download } from 'lucide-react';
import { Case } from '../types';
import DateInput from './DateInput';
import { parseDate, getCurrentDate } from '../utils/dateUtils';

interface StatisticsProps {
  cases: Case[];
}

const Statistics: React.FC<StatisticsProps> = ({ cases }) => {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());

  // Filter cases by date range
  const getFilteredCases = () => {
    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    
    return cases.filter(caseItem => {
      const createdDate = parseDate(caseItem.createdAt);
      return createdDate >= from && createdDate <= to;
    });
  };

  const filteredCases = getFilteredCases();

  // Calculate statistics
  const getNewCasesStats = () => {
    const newCases = filteredCases.length;
    const newDefendants = filteredCases.reduce((total, caseItem) => total + caseItem.defendants.length, 0);
    return { cases: newCases, defendants: newDefendants };
  };

  const getProcessedCasesStats = () => {
    const processedCases = filteredCases.filter(c => 
      ['Hoàn thành', 'Tạm đình chỉ', 'Đình chỉ', 'Chuyển đi'].includes(c.stage)
    );
    
    const stats = {
      completed: processedCases.filter(c => c.stage === 'Hoàn thành').length,
      suspended: processedCases.filter(c => c.stage === 'Tạm đình chỉ').length,
      discontinued: processedCases.filter(c => c.stage === 'Đình chỉ').length,
      transferred: processedCases.filter(c => c.stage === 'Chuyển đi').length,
      totalCases: processedCases.length,
      totalDefendants: processedCases.reduce((total, caseItem) => total + caseItem.defendants.length, 0)
    };
    
    return stats;
  };

  const getStageStats = () => {
    return {
      investigation: filteredCases.filter(c => c.stage === 'Điều tra').length,
      prosecution: filteredCases.filter(c => c.stage === 'Truy tố').length,
      trial: filteredCases.filter(c => c.stage === 'Xét xử').length,
      completed: filteredCases.filter(c => c.stage === 'Hoàn thành').length,
      suspended: filteredCases.filter(c => c.stage === 'Tạm đình chỉ').length,
      discontinued: filteredCases.filter(c => c.stage === 'Đình chỉ').length,
      transferred: filteredCases.filter(c => c.stage === 'Chuyển đi').length
    };
  };

  // HÀM exportToExcel CŨ ĐÃ ĐƯỢC CHUYỂN LÊN App.tsx VÀ utils/excelExportUtils.ts
  // const exportToExcel = () => {
  //   const newStats = getNewCasesStats();
  //   const processedStats = getProcessedCasesStats();
  //   const stageStats = getStageStats();

  //   // Create proper tab-separated content for Excel
  //   const csvRows = [
  //     ['BÁO CÁO THỐNG KÊ VỤ ÁN'],
  //     [`Từ ngày: ${fromDate} - Đến ngày: ${toDate}`],
  //     [''],
  //     ['PHẦN I: VỤ ÁN/BỊ CAN MỚI NHẬN'],
  //     ['Chỉ tiêu', 'Số vụ án', 'Số bị can'],
  //     ['Mới nhận trong kỳ', newStats.cases.toString(), newStats.defendants.toString()],
  //     [''],
  //     ['PHẦN II: VỤ ÁN/BỊ CAN ĐÃ XỬ LÝ'],
  //     ['Chỉ tiêu', 'Số vụ án', 'Số bị can'],
  //     ['Tổng đã xử lý', processedStats.totalCases.toString(), processedStats.totalDefendants.toString()],
  //     ['- Hoàn thành (đã xét xử)', processedStats.completed.toString(), filteredCases.filter(c => c.stage === 'Hoàn thành').reduce((total, c) => total + c.defendants.length, 0).toString()],
  //     ['- Tạm đình chỉ', processedStats.suspended.toString(), filteredCases.filter(c => c.stage === 'Tạm đình chỉ').reduce((total, c) => total + c.defendants.length, 0).toString()],
  //     ['- Đình chỉ', processedStats.discontinued.toString(), filteredCases.filter(c => c.stage === 'Đình chỉ').reduce((total, c) => total + c.defendants.length, 0).toString()],
  //     ['- Chuyển đi', processedStats.transferred.toString(), filteredCases.filter(c => c.stage === 'Chuyển đi').reduce((total, c) => total + c.defendants.length, 0).toString()],
  //     [''],
  //     ['PHẦN III: PHÂN BỐ THEO GIAI ĐOẠN'],
  //     ['Giai đoạn', 'Số vụ án'],
  //     ['Điều tra', stageStats.investigation.toString()],
  //     ['Truy tố', stageStats.prosecution.toString()],
  //     ['Xét xử', stageStats.trial.toString()],
  //     ['Hoàn thành', stageStats.completed.toString()],
  //     ['Tạm đình chỉ', stageStats.suspended.toString()],
  //     ['Đình chỉ', stageStats.discontinued.toString()],
  //     ['Chuyển đi', stageStats.transferred.toString()]
  //   ];

  //   const csvContent = csvRows.map(row => row.join('\t')).join('\n');

  //   // Add BOM for UTF-8
  //   const BOM = '\uFEFF';
  //   const blob = new Blob([BOM + csvContent], { type: 'text/plain;charset=utf-8;' });
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', `thong-ke-vu-an-${fromDate.replace(/\//g, '-')}-${toDate.replace(/\//g, '-')}.txt`);
  //   link.style.visibility = 'hidden';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const newStats = getNewCasesStats();
  const processedStats = getProcessedCasesStats();
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
          Thống Kê Dữ Liệu
        </h2>
        {/* Nút Xuất Excel đã được di chuyển lên App.tsx, loại bỏ khỏi đây */}
        {/* <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          Xuất Excel
        </button> */}
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
          Thống kê từ {fromDate} đến {toDate} ({filteredCases.length} vụ án)
        </div>
      </div>

      {/* New Cases Statistics */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-600" />
          Vụ Án / Bị Can Mới Nhận
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Số Vụ Án Mới"
            value={newStats.cases}
            icon={<FileText size={32} />}
            color="bg-green-600"
          />
          <StatCard
            title="Số Bị Can Mới"
            value={newStats.defendants}
            icon={<Users size={32} />}
            color="bg-blue-600"
          />
        </div>
      </div>

      {/* Processed Cases Statistics */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ArrowRight size={20} className="text-purple-600" />
          Vụ Án / Bị Can Đã Xử Lý
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatCard
            title="Tổng Vụ Án Đã Xử Lý"
            value={processedStats.totalCases}
            icon={<FileText size={32} />}
            color="bg-purple-600"
          />
          <StatCard
            title="Tổng Bị Can Đã Xử Lý"
            value={processedStats.totalDefendants}
            icon={<Users size={32} />}
            color="bg-indigo-600"
          />
        </div>
        
        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Hoàn Thành"
            value={processedStats.completed}
            icon={<FileText size={24} />}
            color="bg-green-500"
            subtitle="(đã xét xử)"
          />
          <StatCard
            title="Tạm Đình Chỉ"
            value={processedStats.suspended}
            icon={<FileText size={24} />}
            color="bg-yellow-500"
            subtitle="vụ án"
          />
          <StatCard
            title="Đình Chỉ"
            value={processedStats.discontinued}
            icon={<FileText size={24} />}
            color="bg-red-500"
            subtitle="vụ án"
          />
          <StatCard
            title="Chuyển Đi"
            value={processedStats.transferred}
            icon={<FileText size={24} />}
            color="bg-gray-500"
            subtitle="vụ án"
          />
        </div>
      </div>

      {/* Current Stage Distribution */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          Phân Bố Theo Giai Đoạn
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            title="Điều Tra"
            value={stageStats.investigation}
            icon={<FileText size={24} />}
            color="bg-orange-600"
            subtitle="vụ án"
          />
          <StatCard
            title="Truy Tố"
            value={stageStats.prosecution}
            icon={<FileText size={24} />}
            color="bg-purple-600"
            subtitle="vụ án"
          />
          <StatCard
            title="Xét Xử"
            value={stageStats.trial}
            icon={<FileText size={24} />}
            color="bg-indigo-600"
            subtitle="vụ án"
          />
          <StatCard
            title="Hoàn Thành"
            value={stageStats.completed}
            icon={<FileText size={24} />}
            color="bg-green-600"
            subtitle="vụ án"
          />
          <StatCard
            title="Tạm Đình Chỉ"
            value={stageStats.suspended}
            icon={<FileText size={24} />}
            color="bg-yellow-600"
            subtitle="vụ án"
          />
          <StatCard
            title="Đình Chỉ"
            value={stageStats.discontinued}
            icon={<FileText size={24} />}
            color="bg-red-600"
            subtitle="vụ án"
          />
          <StatCard
            title="Chuyển Đi"
            value={stageStats.transferred}
            icon={<FileText size={24} />}
            color="bg-gray-600"
            subtitle="vụ án"
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
              <th className="px-4 py-3 text-center font-medium text-gray-700">Số Vụ Án</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Số Bị Can</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="bg-green-50">
              <td className="px-4 py-3 font-medium">Mới nhận trong kỳ</td>
              <td className="px-4 py-3 text-center font-bold text-green-600">{newStats.cases}</td>
              <td className="px-4 py-3 text-center font-bold text-green-600">{newStats.defendants}</td>
            </tr>
            <tr className="bg-purple-50">
              <td className="px-4 py-3 font-medium">Đã xử lý trong kỳ</td>
              <td className="px-4 py-3 text-center font-bold text-purple-600">{processedStats.totalCases}</td>
              <td className="px-4 py-3 text-center font-bold text-purple-600">{processedStats.totalDefendants}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Hoàn thành (đã xét xử)</td>
              <td className="px-4 py-3 text-center text-green-600">{processedStats.completed}</td>
              <td className="px-4 py-3 text-center text-green-600">
                {filteredCases.filter(c => c.stage === 'Hoàn thành').reduce((total, c) => total + c.defendants.length, 0)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Tạm đình chỉ</td>
              <td className="px-4 py-3 text-center text-yellow-600">{processedStats.suspended}</td>
              <td className="px-4 py-3 text-center text-yellow-600">
                {filteredCases.filter(c => c.stage === 'Tạm đình chỉ').reduce((total, c) => total + c.defendants.length, 0)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Đình chỉ</td>
              <td className="px-4 py-3 text-center text-red-600">{processedStats.discontinued}</td>
              <td className="px-4 py-3 text-center text-red-600">
                {filteredCases.filter(c => c.stage === 'Đình chỉ').reduce((total, c) => total + c.defendants.length, 0)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">- Chuyển đi</td>
              <td className="px-4 py-3 text-center text-gray-600">{processedStats.transferred}</td>
              <td className="px-4 py-3 text-center text-gray-600">
                {filteredCases.filter(c => c.stage === 'Chuyển đi').reduce((total, c) => total + c.defendants.length, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;
