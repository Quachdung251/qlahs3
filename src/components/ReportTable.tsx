import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, CheckCircle, XCircle, PauseCircle, Download, Edit2, MoreHorizontal, Send } from 'lucide-react';
import { Report, CaseFormData } from '../types';
import { getCurrentDate, getDaysRemaining } from '../utils/dateUtils';
import ReportEditModal from './ReportEditModal';

interface ReportTableProps {
  reports: Report[];
  columns: {
    key: keyof Report | 'actions';
    label: string;
    render?: (report: Report) => React.ReactNode;
  }[];
  onDeleteReport: (reportId: string) => void;
  onTransferStage: (reportId: string, newStage: Report['stage']) => void;
  onUpdateReport: (updatedReport: Report) => void;
  onTransferToCase: (caseData: CaseFormData) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ 
  reports, 
  columns, 
  onDeleteReport, 
  onTransferStage,
  onUpdateReport,
  onTransferToCase
}) => {
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  const toggleExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const toggleActions = (reportId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedActions(newExpanded);
  };

  const handleProsecute = (report: Report) => {
    // Convert report to case
    const caseData: CaseFormData = {
      name: report.name,
      charges: report.charges,
      investigationDeadline: getCurrentDate(),
      prosecutor: report.prosecutor,
      notes: report.notes,
      defendants: []
    };
    
    onTransferToCase(caseData);
    onTransferStage(report.id, 'Khởi tố');
    alert('Tin báo đã được khởi tố và chuyển sang hệ thống quản lý vụ án!');
  };

  // HÀM exportToExcel CŨ ĐÃ ĐƯỢC CHUYỂN LÊN App.tsx VÀ utils/excelExportUtils.ts
  // const exportToExcel = () => {
  //   if (reports.length === 0) {
  //     alert('Không có dữ liệu để xuất');
  //     return;
  //   }

  //   const headers = columns.filter(col => col.key !== 'actions').map(col => col.label);
    
  //   const csvRows = reports.map(report => {
  //     return columns.filter(col => col.key !== 'actions').map(col => {
  //       const value = report[col.key as keyof Report];
  //       return value ? value.toString() : '';
  //     });
  //   });

  //   const csvContent = [
  //     headers.join('\t'),
  //     ...csvRows.map(row => row.join('\t'))
  //   ].join('\n');

  //   const BOM = '\uFEFF';
  //   const blob = new Blob([BOM + csvContent], { type: 'text/plain;charset=utf-8;' });
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', `danh-sach-tin-bao-${new Date().toISOString().split('T')[0]}.txt`);
  //   link.style.visibility = 'hidden';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const getStageActions = (report: Report) => {
    const actions = [];
    
    if (report.stage === 'Đang xử lý') {
      actions.push(
        <button
          key="prosecute"
          onClick={() => handleProsecute(report)}
          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          <CheckCircle size={12} />
          Khởi tố
        </button>
      );
      
      actions.push(
        <button
          key="not-prosecute"
          onClick={() => onTransferStage(report.id, 'Không khởi tố')}
          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <XCircle size={12} />
          Không KT
        </button>
      );
      
      actions.push(
        <button
          key="suspend"
          onClick={() => onTransferStage(report.id, 'Tạm đình chỉ')}
          className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors whitespace-nowrap"
        >
          <PauseCircle size={12} />
          Tạm ĐC
        </button>
      );

      actions.push(
        <button
          key="transfer"
          onClick={() => onTransferStage(report.id, 'Chuyển đi')}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 transition-colors whitespace-nowrap"
        >
          <Send size={12} />
          Chuyển đi
        </button>
      );
    }

    return actions;
  };

  const renderReportNameCell = (report: Report) => {
    return (
      <div className="max-w-xs">
        <div className="font-medium text-gray-900 truncate" title={report.name}>
          {report.name}
        </div>
        <div className="text-sm text-gray-500 truncate" title={report.charges}>
          {report.charges}
        </div>
      </div>
    );
  };

  const renderNotesCell = (report: Report) => {
    if (!report.notes) return '-';
    
    return (
      <div className="max-w-xs">
        <div className="text-sm text-gray-900 truncate" title={report.notes}>
          {report.notes}
        </div>
      </div>
    );
  };

  const renderCellContent = (report: Report, column: typeof columns[0]) => {
    switch (column.key) {
      case 'name':
        return renderReportNameCell(report);
      case 'notes':
        return renderNotesCell(report);
      case 'resolutionDeadline':
        const daysRemaining = getDaysRemaining(report.resolutionDeadline);
        const isExpiring = daysRemaining <= 15;
        return (
          <div className={isExpiring ? 'text-red-600 font-medium' : ''}>
            {report.resolutionDeadline}
            {isExpiring && (
              <div className="text-xs">
                (còn {daysRemaining} ngày)
              </div>
            )}
          </div>
        );
      case 'actions':
        const stageActions = getStageActions(report);
        const isExpanded = expandedActions.has(report.id);
        
        return (
          <div className="relative">
            <div className="flex items-center gap-1">
              {/* Always show Edit button */}
              <button
                onClick={() => setEditingReport(report)}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                <Edit2 size={12} />
                Sửa
              </button>
              
              {/* Show first action if available */}
              {stageActions.length > 0 && stageActions[0]}
              
              {/* More actions button if there are additional actions */}
              {stageActions.length > 1 && (
                <button
                  onClick={() => toggleActions(report.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  <MoreHorizontal size={12} />
                </button>
              )}
            </div>
            
            {/* Expanded actions dropdown */}
            {isExpanded && stageActions.length > 1 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-max">
                <div className="p-2 space-y-1">
                  {stageActions.slice(1).map((action, index) => (
                    <div key={index} className="block">
                      {action}
                    </div>
                  ))}
                  <button
                    onClick={() => setConfirmDelete(report.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap w-full"
                  >
                    <Trash2 size={12} />
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        if (column.render) {
          return column.render(report);
        }
        return report[column.key as keyof Report];
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Nút Xuất Excel đã được di chuyển lên App.tsx, loại bỏ khỏi đây */}
      {/* {reports.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>
      )} */}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mở rộng
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <React.Fragment key={report.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleExpanded(report.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedReports.has(report.id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                      {renderCellContent(report, column)}
                    </td>
                  ))}
                </tr>
                {expandedReports.has(report.id) && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Chi tiết Tin báo:</h4>
                        <div className="bg-white p-3 rounded border">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Tên tin báo:</span> {report.name}
                            </div>
                            <div>
                              <span className="font-medium">Tội danh:</span> {report.charges}
                            </div>
                            <div>
                              <span className="font-medium">Hạn giải quyết:</span> {report.resolutionDeadline}
                            </div>
                            <div>
                              <span className="font-medium">KSV phụ trách:</span> {report.prosecutor}
                            </div>
                            <div>
                              <span className="font-medium">Trạng thái:</span> {report.stage}
                            </div>
                            {report.notes && (
                              <div className="md:col-span-3">
                                <span className="font-medium">Ghi chú:</span> {report.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {reports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có tin báo nào
        </div>
      )}

      {/* Edit Modal */}
      {editingReport && (
        <ReportEditModal
          report={editingReport}
          onSave={onUpdateReport}
          onClose={() => setEditingReport(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa tin báo này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteReport(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTable;
