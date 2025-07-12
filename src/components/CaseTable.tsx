// ./components/CaseTable.tsx
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Trash2, ArrowRight, CheckCircle, PauseCircle, StopCircle, Send, Edit2, MoreHorizontal, MessageSquare, Clock, Star, Printer, ArrowUp, ArrowDown } from 'lucide-react';
import { Case, Defendant } from '../types';
import { getDaysRemaining, isExpiringSoon } from '../utils/dateUtils';
import NotesModal from './NotesModal';
import ExtensionModal from './ExtensionModal';
import QRCodeDisplayModal from './QRCodeDisplayModal';
import { generateQrCodeData } from '../utils/qrUtils';

interface CaseTableProps {
  cases: Case[];
  columns: {
    key: keyof Case | 'totalDefendants' | 'shortestDetention' | 'investigationRemaining' | 'shortestDetentionRemaining' | 'notes' | 'actions' | 'isImportant';
    label: string;
    render?: (caseItem: Case) => React.ReactNode;
    sortable?: boolean;
  }[];
  onDeleteCase: (caseId: string) => void;
  onTransferStage: (caseId: string, newStage: Case['stage']) => void;
  onUpdateCase: (updatedCase: Case) => void;
  onEditCase: (caseItem: Case) => void;
  onToggleImportant: (caseId: string, isImportant: boolean) => void;
  showWarnings?: boolean;
}

type SortKey = keyof Case | 'totalDefendants' | 'shortestDetention' | 'investigationRemaining' | 'shortestDetentionRemaining' | 'isImportant';
type SortDirection = 'asc' | 'desc';

const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  columns,
  onDeleteCase,
  onTransferStage,
  onUpdateCase,
  onEditCase,
  onToggleImportant,
  showWarnings = false
}) => {
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [notesCase, setNotesCase] = useState<Case | null>(null);
  const [extensionModal, setExtensionModal] = useState<{
    case: Case;
    type: 'investigation' | 'detention';
    defendant?: Defendant;
  } | null>(null);

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCaseData, setQrCaseData] = useState<{ qrValue: string; caseName: string } | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection | null }>({
    key: null,
    direction: null,
  });

  const toggleExpanded = (caseId: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId);
    } else {
      newExpanded.add(caseId);
    }
    setExpandedCases(newExpanded);
  };

  const toggleActions = (caseId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId);
    } else {
      newExpanded.add(caseId);
    }
    setExpandedActions(newExpanded);
  };

  const handlePrintExistingQR = (caseItem: Case) => {
    const qrValue = generateQrCodeData(caseItem);
    setQrCaseData({ qrValue, caseName: caseItem.name });
    setShowQrModal(true);
  };

  const getStageActions = (caseItem: Case) => {
    const actions = [];

    switch (caseItem.stage) {
      case 'Điều tra':
        actions.push(
          <button
            key="prosecution"
            onClick={() => onTransferStage(caseItem.id, 'Truy tố')}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={12} />
            Chuyển TT
          </button>
        );
        break;
      case 'Truy tố':
        actions.push(
          <button
            key="trial"
            onClick={() => onTransferStage(caseItem.id, 'Xét xử')}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={12} />
            Chuyển XX
          </button>
        );
        break;
      case 'Xét xử':
        actions.push(
          <button
            key="complete"
            onClick={() => onTransferStage(caseItem.id, 'Hoàn thành')}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <CheckCircle size={12} />
            Hoàn thành
          </button>
        );
        break;
    }

    if (!['Hoàn thành', 'Đình chỉ', 'Chuyển đi'].includes(caseItem.stage)) {
      actions.push(
        <button
          key="transfer"
          onClick={() => onTransferStage(caseItem.id, 'Chuyển đi')}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 transition-colors whitespace-nowrap"
        >
          <Send size={12} />
          Chuyển đi
        </button>
      );

      actions.push(
        <button
          key="suspend"
          onClick={() => onTransferStage(caseItem.id, 'Tạm đình chỉ')}
          className="flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors whitespace-nowrap"
        >
          <PauseCircle size={12} />
          Tạm ĐC
        </button>
      );

      actions.push(
        <button
          key="discontinue"
          onClick={() => setConfirmDelete(caseItem.id)}
          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <Trash2 size={12} />
          Đình chỉ
        </button>
      );
    }

    actions.push(
      <button
        key="print-qr"
        onClick={() => handlePrintExistingQR(caseItem)}
        className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors whitespace-nowrap"
        title="In nhãn QR Code"
      >
        <Printer size={12} />
        In QR
      </button>
    );

    return actions;
  };

  const renderCaseNameCell = (caseItem: Case) => {
    return (
      <div className="w-32 overflow-hidden text-ellipsis whitespace-nowrap" title={`${caseItem.name} - ${caseItem.charges}`}>
        <div className="font-medium text-gray-900">{caseItem.name}</div>
        <div className="text-sm text-gray-500">{caseItem.charges}</div>
      </div>
    );
  };

  const renderNotesCell = (caseItem: Case) => {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setNotesCase(caseItem)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
          title="Xem/Sửa ghi chú"
        >
          <MessageSquare size={12} />
          Ghi chú
        </button>
        {caseItem.notes && (
          <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={caseItem.notes}>
            <div className="text-sm text-gray-600">{caseItem.notes}</div>
          </div>
        )}
      </div>
    );
  };

  const renderCellContent = (caseItem: Case, column: typeof columns[0]) => {
    switch (column.key) {
      case 'name':
        return renderCaseNameCell(caseItem);
      case 'totalDefendants':
        return `${caseItem.defendants.length} bị can`;
      case 'shortestDetention':
        // Đảm bảo chỉ lấy các bị can có detentionDeadline là chuỗi không rỗng
        const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
        if (detainedDefendants.length === 0) return 'Không có';
        const shortestDays = Math.min(...detainedDefendants.map(d => getDaysRemaining(d.detentionDeadline!)));
        return `${shortestDays} ngày`;
      case 'investigationRemaining':
        const remaining = getDaysRemaining(caseItem.investigationDeadline);
        return `${remaining} ngày`;
      case 'shortestDetentionRemaining':
        // Đảm bảo chỉ lấy các bị can có detentionDeadline là chuỗi không rỗng
        const detainedDefs = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
        if (detainedDefs.length === 0) return 'Không có';
        const shortestDetentionDays = Math.min(...detainedDefs.map(d => getDaysRemaining(d.detentionDeadline!)));
        return `${shortestDetentionDays} ngày`;
      case 'notes':
        return renderNotesCell(caseItem);
      case 'isImportant':
        return (
          <button
            onClick={() => onToggleImportant(caseItem.id, !caseItem.isImportant)}
            className={`p-1 rounded-full transition-colors ${
              caseItem.isImportant ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-500'
            }`}
            title={caseItem.isImportant ? 'Bỏ đánh dấu quan trọng' : 'Đánh dấu quan trọng'}
          >
            <Star size={20} fill={caseItem.isImportant ? 'currentColor' : 'none'} />
          </button>
        );
      case 'actions':
        const stageActions = getStageActions(caseItem);
        const isExpanded = expandedActions.has(caseItem.id);

        return (
          <div className="relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditCase(caseItem)}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                <Edit2 size={12} />
                Sửa
              </button>

              {caseItem.stage === 'Điều tra' && (
                <button
                  onClick={() => setExtensionModal({ case: caseItem, type: 'investigation' })}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  <Clock size={12} />
                  Gia hạn ĐT
                </button>
              )}

              {stageActions.length > 0 && stageActions[0]}

              {stageActions.length > 1 && (
                <button
                  onClick={() => toggleActions(caseItem.id)}
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
                </div>
              </div>
            )}
          </div>
        );
      default:
        if (column.render) {
          return column.render(caseItem);
        }
        const value = caseItem[column.key as keyof Case];
        return typeof value === 'string' || typeof value === 'number' ? value : '';
    }
  };

  const isRowHighlighted = (caseItem: Case) => {
    if (caseItem.isImportant) {
      return 'bg-blue-50';
    }
    if (showWarnings) {
      if (caseItem.stage === 'Điều tra' && isExpiringSoon(caseItem.investigationDeadline)) {
        return 'bg-yellow-50';
      }

      // Đảm bảo chỉ lấy các bị can có detentionDeadline là chuỗi không rỗng
      const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
      if (detainedDefendants.some(d => isExpiringSoon(d.detentionDeadline!))) {
        return 'bg-yellow-50';
      }
    }
    return '';
  };

  // Cập nhật hàm handleSort để nhận cả key và direction
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, direction] = e.target.value.split(':');
    setSortConfig({ key: key as SortKey, direction: direction as SortDirection });
  };

  const sortedCases = useMemo(() => {
    let sortableCases = [...cases];
    if (sortConfig.key) {
      sortableCases.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'isImportant':
            aValue = a.isImportant ? 1 : 0; // 1 nếu quan trọng, 0 nếu không
            bValue = b.isImportant ? 1 : 0;
            break;
          case 'createdAt': // Mới thêm vào
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'investigationDeadline': // Hạn điều tra
            aValue = getDaysRemaining(a.investigationDeadline);
            bValue = getDaysRemaining(b.investigationDeadline);
            break;
          case 'shortestDetentionRemaining': // Hạn tạm giam (gần nhất)
            // Đảm bảo chỉ lấy các bị can có detentionDeadline là chuỗi không rỗng
            const aDetainedDefs = a.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
            const bDetainedDefs = b.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof b.detentionDeadline === 'string' && b.detentionDeadline !== '');
            aValue = aDetainedDefs.length > 0 ? Math.min(...aDetainedDefs.map(d => getDaysRemaining(d.detentionDeadline!))) : Infinity;
            bValue = bDetainedDefs.length > 0 ? Math.min(...bDetainedDefs.map(d => getDaysRemaining(b.detentionDeadline!))) : Infinity;
            break;
          default: // Sắp xếp theo tên vụ án hoặc các trường khác
            aValue = a[sortConfig.key as keyof Case];
            bValue = b[sortConfig.key as keyof Case];
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
    return sortableCases;
  }, [cases, sortConfig]);

  // Chiều rộng ước tính của các cột sticky (để tính toán left offset)
  const EXPAND_COL_WIDTH = 56; // w-14 ~ 56px
  const IMPORTANT_COL_WIDTH = 56; // w-14 ~ 56px
  const NAME_COL_WIDTH = 160; // w-32 (128px) + 2*16px (px-4) = 160px

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Ô sắp xếp riêng */}
      <div className="p-4 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">Danh sách Vụ án</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">Sắp xếp theo:</label>
          <select
            id="sort-by"
            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={`${sortConfig.key || ''}:${sortConfig.direction || ''}`}
            onChange={handleSortChange}
          >
            <option value="">-- Chọn --</option>
            <option value="createdAt:desc">Mới thêm vào (Mới nhất)</option>
            <option value="createdAt:asc">Mới thêm vào (Cũ nhất)</option>
            <option value="investigationDeadline:asc">Hạn điều tra (Sớm nhất)</option>
            <option value="investigationDeadline:desc">Hạn điều tra (Muộn nhất)</option>
            <option value="shortestDetentionRemaining:asc">Hạn tạm giam (Gần nhất)</option>
            <option value="shortestDetentionRemaining:desc">Hạn tạm giam (Xa nhất)</option>
            <option value="isImportant:desc">Các vụ quan trọng (Trước)</option>
            <option value="name:asc">Tên vụ án (A-Z)</option>
            <option value="name:desc">Tên vụ án (Z-A)</option>
            <option value="stage:asc">Giai đoạn (A-Z)</option> {/* Thêm sắp xếp theo giai đoạn */}
          </select>
        </div>
      </div>

      {/* Bao bọc toàn bộ bảng để thanh cuộn ngang áp dụng cho cả header và body */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 w-14"
                style={{ minWidth: EXPAND_COL_WIDTH }}
              >
                Mở rộng
              </th>
              <th
                className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[56px] bg-gray-50 z-30 w-14"
                style={{ minWidth: IMPORTANT_COL_WIDTH }}
              >
                Quan trọng
              </th>
              {columns.map((column) => {
                if (column.key === 'isImportant') return null; // Không render lại cột này ở đây
                // Bỏ `cursor-pointer` và `onClick` trên `<th>`
                // Sắp xếp đã được xử lý bằng ô `select` riêng.

                // Đặc biệt xử lý cột 'name' để nó cũng sticky
                if (column.key === 'name') {
                  return (
                    <th
                      key={column.key}
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[112px] bg-gray-50 z-20`}
                      style={{ minWidth: NAME_COL_WIDTH }}
                    >
                      {column.label}
                    </th>
                  );
                }

                // Các cột còn lại
                return (
                  <th
                    key={column.key}
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-8 text-gray-500">
                  Không có vụ án nào để hiển thị.
                </td>
              </tr>
            ) : (
              sortedCases.map((caseItem) => (
                <React.Fragment key={caseItem.id}>
                  <tr className={`${isRowHighlighted(caseItem)} hover:bg-gray-50`}>
                    <td
                      className="px-1 py-3 whitespace-nowrap sticky left-0 bg-white z-20"
                      style={{ minWidth: EXPAND_COL_WIDTH }}
                    >
                      <button
                        onClick={() => toggleExpanded(caseItem.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedCases.has(caseItem.id) ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </button>
                    </td>
                    <td
                      className="px-1 py-3 text-sm text-gray-900 sticky left-[56px] bg-white z-20"
                      style={{ minWidth: IMPORTANT_COL_WIDTH }}
                    >
                      {renderCellContent(caseItem, { key: 'isImportant', label: 'Quan trọng' })}
                    </td>
                    {columns.map((column) => {
                       if (column.key === 'isImportant') return null; // Không render lại cột này
                       if (column.key === 'name') { // Đặc biệt xử lý cột 'name'
                         return (
                           <td
                             key={column.key}
                             className="px-4 py-3 text-sm text-gray-900 sticky left-[112px] bg-white z-10"
                             style={{ minWidth: NAME_COL_WIDTH }}
                           >
                             {renderCellContent(caseItem, column)}
                           </td>
                         );
                       }
                      return (
                        <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                          {renderCellContent(caseItem, column)}
                        </td>
                      );
                    })}
                  </tr>
                  {expandedCases.has(caseItem.id) && (
                    <tr>
                      {/* Cần điều chỉnh colSpan để phù hợp với số lượng cột hiện tại (bao gồm 3 cột sticky) */}
                      <td colSpan={columns.length + 2} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Chi tiết Bị Can:</h4>
                          {caseItem.defendants.map((defendant, index) => (
                            <div key={defendant.id || index} className="bg-white p-3 rounded border">
                              <div className="flex flex-wrap text-sm items-start gap-x-4 gap-y-2">
                                <div className="w-32 flex-shrink-0">
                                  <span className="font-medium">Tên:</span> <span className="whitespace-normal">{defendant.name}</span>
                                </div>
                                <div className="w-64 flex-shrink-0">
                                  <span className="font-medium">Tội danh:</span> <span className="whitespace-normal">{defendant.charges}</span>
                                </div>
                                <div className="w-32 flex-shrink-0">
                                  <span className="font-medium">Biện pháp:</span> <span className="whitespace-normal">{defendant.preventiveMeasure}</span>
                                </div>
                                {/* Đảm bảo chỉ hiển thị và tính toán nếu detentionDeadline là chuỗi không rỗng */}
                                {defendant.preventiveMeasure === 'Tạm giam' && typeof defendant.detentionDeadline === 'string' && defendant.detentionDeadline !== '' && (
                                  <div className="flex-auto flex items-center">
                                    <div>
                                      <span className="font-medium">Hạn tạm giam:</span> <span className="whitespace-normal">{defendant.detentionDeadline}</span>
                                      <span className={`ml-1 ${isExpiringSoon(defendant.detentionDeadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                        ({getDaysRemaining(defendant.detentionDeadline)} ngày)
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => setExtensionModal({ case: caseItem, type: 'detention', defendant })}
                                      className="flex items-center gap-0 px-0 py-0 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors ml-2"
                                    >
                                      <Clock size={10} />
                                      Gia hạn
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
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

      {/* Notes Modal */}
      {notesCase && (
        <NotesModal
          case={notesCase}
          onSave={onUpdateCase}
          onClose={() => setNotesCase(null)}
        />
      )}

      {/* Extension Modal */}
      {extensionModal && (
        <ExtensionModal
          case={extensionModal.case}
          type={extensionModal.type}
          defendant={extensionModal.defendant}
          onSave={onUpdateCase}
          onClose={() => setExtensionModal(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa vụ án này không? Hành động này không thể hoàn tác.
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
                  onDeleteCase(confirmDelete);
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

      {/* Modal hiển thị QR Code cho vụ án hiện có */}
      {showQrModal && qrCaseData && (
        <QRCodeDisplayModal
          qrCodeValue={qrCaseData.qrValue}
          caseName={qrCaseData.caseName}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
};

export default CaseTable;