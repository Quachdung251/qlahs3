import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Trash2, CheckCircle, XCircle, PauseCircle, Download, Edit2, MoreHorizontal, Send, ArrowUp, ArrowDown } from 'lucide-react';
import { Report, CaseFormData } from '../types';
import { getCurrentDate, getDaysRemaining } from '../utils/dateUtils';

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
  onEditReport: (reportItem: Report) => void;
}

type SortKey = keyof Report;
type SortDirection = 'asc' | 'desc';

const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  columns,
  onDeleteReport,
  onTransferStage,
  onUpdateReport,
  onTransferToCase,
  onEditReport
}) => {
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection | null }>({
    key: null,
    direction: null,
  });

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
      <div className="w-48 overflow-hidden text-ellipsis whitespace-nowrap" title={`${report.name} - ${report.charges}`}>
        <div className="font-medium text-gray-900">{report.name}</div>
        <div className="text-sm text-gray-500">{report.charges}</div>
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
              <button
                onClick={() => onEditReport(report)}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                <Edit2 size={12} />
                Sửa
              </button>

              {stageActions.length > 0 && stageActions[0]}

              {stageActions.length > 1 && (
                <button
                  onClick={() => toggleActions(report.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  <MoreHorizontal size={12} />
                </button>
              )}
            </div>

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, direction] = e.target.value.split(':');
    setSortConfig({ key: key as SortKey, direction: direction as SortDirection });
  };

  const sortedReports = useMemo(() => {
    let sortableReports = [...reports];
    if (sortConfig.key) {
      sortableReports.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'resolutionDeadline':
            aValue = getDaysRemaining(a.resolutionDeadline);
            bValue = getDaysRemaining(b.resolutionDeadline);
            break;
          default:
            aValue = a[sortConfig.key as keyof Report];
            bValue = b[sortConfig.key as keyof Report];
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            break;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableReports;
  }, [reports, sortConfig]);

  const EXPAND_COL_WIDTH = 72;
  const NAME_COL_WIDTH = 240;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">Danh sách Tin báo</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-reports-by" className="text-sm font-medium text-gray-700">Sắp xếp theo:</label>
          <select
            id="sort-reports-by"
            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={`${sortConfig.key || ''}:${sortConfig.direction || ''}`}
            onChange={handleSortChange}
          >
            <option value="">-- Chọn --</option>
            <option value="createdAt:desc">Mới thêm vào (Mới nhất)</option>
            <option value="createdAt:asc">Mới thêm vào (Cũ nhất)</option>
            <option value="resolutionDeadline:asc">Hạn giải quyết (Sớm nhất)</option>
            <option value="resolutionDeadline:desc">Hạn giải quyết (Muộn nhất)</option>
            <option value="name:asc">Tên tin báo (A-Z)</option>
            <option value="name:desc">Tên tin báo (Z-A)</option>
            <option value="stage:asc">Giai đoạn (A-Z)</option>
            <option value="stage:desc">Giai đoạn (Z-A)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30"
                style={{ minWidth: EXPAND_COL_WIDTH }}
              >
                Mở rộng
              </th>
              {columns.map((column) => {
                if (column.key === 'name') {
                  return (
                    <th
                      key={column.key}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[${EXPAND_COL_WIDTH}px] bg-gray-50 z-20`}
                      style={{ minWidth: NAME_COL_WIDTH }}
                    >
                      {column.label}
                    </th>
                  );
                }

                return (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedReports.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-8 text-gray-500">
                  Không có tin báo nào để hiển thị.
                </td>
              </tr>
            ) : (
              sortedReports.map((report) => (
                <React.Fragment key={report.id}>
                  <tr className="hover:bg-gray-50">
                    <td
                      className="px-2 py-4 whitespace-nowrap sticky left-0 bg-white z-20"
                      style={{ minWidth: EXPAND_COL_WIDTH }}
                    >
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
                    {columns.map((column) => {
                      if (column.key === 'name') {
                        return (
                          <td
                            key={column.key}
                            className="px-6 py-4 text-sm text-gray-900 sticky left-[${EXPAND_COL_WIDTH}px] bg-white z-10"
                            style={{ minWidth: NAME_COL_WIDTH }}
                          >
                            {renderCellContent(report, column)}
                          </td>
                        );
                      }
                      return (
                        <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                          {renderCellContent(report, column)}
                        </td>
                      );
                    })}
                  </tr>
                  {expandedReports.has(report.id) && (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-6 py-4 bg-gray-50">
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {reports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có tin báo nào
        </div>
      )}

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