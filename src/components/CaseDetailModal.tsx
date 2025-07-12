// ./components/CaseTable.tsx
import React, { useState, useMemo } from 'react';
import { Trash2, ArrowRight, CheckCircle, PauseCircle, Send, Edit2, MoreHorizontal, MessageSquare, Clock, Star, Printer, Users } from 'lucide-react'; // Added Users icon
import { Case, Defendant } from '../types';
import { getDaysRemaining, isExpiringSoon, getCurrentDate } from '../utils/dateUtils'; // Added getCurrentDate
import NotesModal from './NotesModal';
import ExtensionModal from './ExtensionModal';
import QRCodeDisplayModal from './QRCodeDisplayModal';
import { generateQrCodeData } from '../utils/qrUtils';

interface CaseTableProps {
  cases: Case[];
  columns: {
    key: keyof Case | 'shortestDetention' | 'investigationRemaining' | 'shortestDetentionRemaining' | 'notes' | 'actions' | 'isImportant' | 'defendantsActions'; // Removed totalDefendants, added defendantsActions
    label: string;
    render?: (caseItem: Case) => React.ReactNode;
    sortable?: boolean;
  }[];
  onDeleteCase: (caseId: string) => void;
  onTransferStage: (caseId: string, newStage: Case['stage'], commandDate: string) => void; // Added commandDate
  onUpdateCase: (updatedCase: Case) => void;
  onEditCase: (caseItem: Case) => void;
  onToggleImportant: (caseId: string, isImportant: boolean) => void;
  showWarnings?: boolean;
}

type SortKey = keyof Case | 'shortestDetention' | 'investigationRemaining' | 'shortestDetentionRemaining' | 'isImportant'; // Removed totalDefendants
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

  // Stage transfer confirmation state
  const [transferConfirm, setTransferConfirm] = useState<{ caseId: string; newStage: Case['stage']; commandDate: string } | null>(null);

  const handleTransferStageClick = (caseId: string, newStage: Case['stage']) => {
    setTransferConfirm({ caseId, newStage, commandDate: getCurrentDate() }); // Default to current date
  };

  const confirmTransferAction = () => {
    if (transferConfirm) {
      onTransferStage(transferConfirm.caseId, transferConfirm.newStage, transferConfirm.commandDate);
      setTransferConfirm(null);
    }
  };

  const getStageActions = (caseItem: Case) => {
    const actions = [];

    switch (caseItem.stage) {
      case 'Điều tra':
        actions.push(
          <button
            key="prosecution"
            onClick={() => handleTransferStageClick(caseItem.id, 'Truy tố')} // Use new handler
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
            onClick={() => handleTransferStageClick(caseItem.id, 'Xét xử')} // Use new handler
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
            onClick={() => handleTransferStageClick(caseItem.id, 'Hoàn thành')} // Use new handler
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
          onClick={() => handleTransferStageClick(caseItem.id, 'Chuyển đi')} // Use new handler
          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 transition-colors whitespace-nowrap"
        >
          <Send size={12} />
          Chuyển đi
        </button>
      );

      actions.push(
        <button
          key="suspend"
          onClick={() => handleTransferStageClick(caseItem.id, 'Tạm đình chỉ')} // Use new handler
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
      case 'shortestDetention':
        const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
        if (detainedDefendants.length === 0) return 'Không có';
        const shortestDays = Math.min(...detainedDefendants.map(d => getDaysRemaining(d.detentionDeadline!)));
        return `${shortestDays} ngày`;
      case 'investigationDeadline':
        return new Date(caseItem.investigationDeadline).toLocaleDateString('vi-VN'); // Format date
      case 'investigationRemaining':
        const remaining = getDaysRemaining(caseItem.investigationDeadline);
        return `${remaining} ngày`;
      case 'shortestDetentionRemaining':
        const detainedDefs = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
        if (detainedDefs.length === 0) return 'Không có';
        const shortestDetentionDays = Math.min(...detainedDefs.map(d => getDaysRemaining(d.detentionDeadline!)));
        return `${shortestDetentionDays} ngày`;
      case 'prosecutionTransferDate':
      case 'trialTransferDate':
        const dateValue = caseItem[column.key as keyof Case] as string | undefined;
        return dateValue ? new Date(dateValue).toLocaleDateString('vi-VN') : 'N/A'; // Format date
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
      case 'defendantsActions': // New column for defendants and their actions
        const numDefendants = caseItem.defendants.length;
        const expiringDetentions = caseItem.defendants.filter(d =>
          d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && isExpiringSoon(d.detentionDeadline)
        ).length;

        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 whitespace-nowrap">
              {numDefendants} bị can {expiringDetentions > 0 && `(${expiringDetentions} sắp hết hạn)`}
            </span>
            <button
              onClick={() => onEditCase(caseItem)} // Re-use onEditCase to open modal with case details
              className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
              title="Xem & Gia hạn Bị can"
            >
              <Users size={12} /> Xem
            </button>
          </div>
        );
      case 'actions':
        const stageActions = getStageActions(caseItem);
        const isExpanded = expandedActions.has(caseItem.id);

        return (
          <div className="relative flex flex-col items-start gap-1">
            <button
              key="print-qr"
              onClick={() => handlePrintExistingQR(caseItem)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors whitespace-nowrap"
              title="In nhãn QR Code"
            >
              <Printer size={12} />
              In QR
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditCase(caseItem)} // This now opens the CaseDetailModal
                className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
              >
                <Edit2 size={12} />
                Sửa
              </button>

              {/* Moved "Gia hạn Điều tra" button inside CaseDetailModal for better UX */}

              {stageActions.length > 0 && stageActions[0]}

              {stageActions.length > 1 && (
                <button
                  onClick={() => toggleActions(caseItem.id)}
                  className="p-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  <MoreHorizontal size={16} />
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
        // Ensure all dates are formatted consistently
        if (typeof value === 'string' && (column.key.includes('Date') || column.key.includes('Deadline'))) {
          try {
            const date = new Date(value);
            // Check if date is valid before formatting
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('vi-VN');
            }
          } catch (e) {
            // Fallback if date parsing fails
            console.error("Invalid date string:", value, e);
          }
        }
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

      const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
      if (detainedDefendants.length > 0 && detainedDefendants.some(d => isExpiringSoon(d.detentionDeadline!))) {
        return 'bg-yellow-50';
      }
    }
    return '';
  };

  const sortedCases = useMemo(() => {
    let sortableCases = [...cases];
    if (sortConfig.key) {
      sortableCases.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'isImportant':
            aValue = a.isImportant ? 1 : 0;
            bValue = b.isImportant ? 1 : 0;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'investigationDeadline':
            aValue = getDaysRemaining(a.investigationDeadline);
            bValue = getDaysRemaining(b.investigationDeadline);
            break;
          case 'shortestDetentionRemaining':
            const aDetainedDefs = a.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
            const bDetainedDefs = b.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof b.detentionDeadline === 'string' && b.detentionDeadline !== '');
            aValue = aDetainedDefs.length > 0 ? Math.min(...aDetainedDefs.map(d => getDaysRemaining(d.detentionDeadline!))) : Infinity;
            bValue = bDetainedDefs.length > 0 ? Math.min(...bDetainedDefs.map(d => getDaysRemaining(b.detentionDeadline!))) : Infinity;
            break;
          default:
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

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, direction] = event.target.value.split(':') as [SortKey, SortDirection];
    setSortConfig({ key, direction });
  };

  const EXPAND_COL_WIDTH = '56px'; // Adjusted from 14 to 56 to account for padding/margin
  const IMPORTANT_COL_WIDTH = '56px'; // Adjusted
  const NAME_COL_WIDTH = '180px'; // Adjusted for better visibility of name/charges

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Danh sách Vụ án</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 sr-only">Sắp xếp theo</label>
          <select
            id="sort-select"
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            onChange={handleSortChange}
            value={sortConfig.key ? `${sortConfig.key}:${sortConfig.direction}` : ''}
          >
            <option value="">Sắp xếp theo</option>
            <option value="createdAt:desc">Mới thêm (Mới nhất)</option>
            <option value="createdAt:asc">Mới thêm (Cũ nhất)</option>
            <option value="investigationDeadline:asc">Hạn điều tra (Gần nhất)</option>
            <option value="investigationDeadline:desc">Hạn điều tra (Muộn nhất)</option>
            <option value="shortestDetentionRemaining:asc">Hạn tạm giam (Gần nhất)</option>
            <option value="shortestDetentionRemaining:desc">Hạn tạm giam (Xa nhất)</option>
            <option value="isImportant:desc">Các vụ quan trọng (Trước)</option>
            <option value="name:asc">Tên vụ án (A-Z)</option>
            <option value="name:desc">Tên vụ án (Z-A)</option>
            <option value="stage:asc">Giai đoạn (A-Z)</option>
            <option value="stage:desc">Giai đoạn (Z-A)</option> {/* Thêm sắp xếp theo giai đoạn */}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Removed "Mở rộng" column */}
              <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 w-14" style={{ minWidth: IMPORTANT_COL_WIDTH }} >
                Quan trọng
              </th>
              {columns.map((column) => {
                // Do not render 'isImportant' as it has its own sticky column
                if (column.key === 'isImportant') return null;

                // Handle 'name' column sticky left
                if (column.key === 'name') {
                  return (
                    <th key={column.key} className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[56px] bg-gray-50 z-20`} style={{ minWidth: NAME_COL_WIDTH }}>
                      {column.label}
                    </th>
                  );
                }

                // Render 'defendantsActions' sticky right
                if (column.key === 'defendantsActions') {
                    return (
                        <th key={column.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20">
                            {column.label}
                        </th>
                    );
                }

                // Remaining columns
                return (
                  <th key={column.key} className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer' : ''}`}>
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCases.map((caseItem) => (
              <React.Fragment key={caseItem.id}>
                <tr className={`${isRowHighlighted(caseItem)} hover:bg-gray-100`}>
                  {/* Removed "Mở rộng" cell */}
                  <td className="px-1 py-3 text-sm text-gray-900 sticky left-0 bg-white z-10" style={{ minWidth: IMPORTANT_COL_WIDTH }}>
                    {renderCellContent(caseItem, { key: 'isImportant', label: 'Quan trọng' })}
                  </td>
                  {columns.map((column) => {
                    if (column.key === 'isImportant') return null;
                    if (column.key === 'name') {
                      return (
                        <td key={column.key} className="px-4 py-3 text-sm text-gray-900 sticky left-[56px] bg-white z-10" style={{ minWidth: NAME_COL_WIDTH }}>
                          {renderCellContent(caseItem, column)}
                        </td>
                      );
                    }
                    if (column.key === 'defendantsActions') {
                        return (
                            <td key={column.key} className="px-4 py-3 text-sm text-gray-900 sticky right-0 bg-white z-10">
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
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {notesCase && (
        <NotesModal
          caseItem={notesCase}
          onUpdateNotes={(caseId, notes) => {
            onUpdateCase({ ...notesCase, id: caseId, notes: notes } as Case);
            setNotesCase(null);
          }}
          onClose={() => setNotesCase(null)}
        />
      )}

      {extensionModal && (
        <ExtensionModal
          caseItem={extensionModal.case}
          extensionType={extensionModal.type}
          defendant={extensionModal.defendant}
          onExtend={(caseId, type, newDate, defendantId) => {
            const updatedCase = { ...extensionModal.case };
            if (type === 'investigation') {
              updatedCase.investigationDeadline = newDate;
            } else if (type === 'detention' && defendantId) {
              updatedCase.defendants = updatedCase.defendants.map(d =>
                d.id === defendantId ? { ...d, detentionDeadline: newDate } : d
              );
            }
            onUpdateCase(updatedCase);
            setExtensionModal(null);
          }}
          onClose={() => setExtensionModal(null)}
        />
      )}

      {/* Confirmation Modal for Delete */}
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

      {/* Confirmation Modal for Stage Transfer */}
      {transferConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận chuyển giai đoạn</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn chuyển vụ án này sang giai đoạn **"{transferConfirm.newStage}"** không?
            </p>
            <div className="mb-4">
              <label htmlFor="commandDate" className="block text-sm font-medium text-gray-700 mb-1">Ngày ra lệnh:</label>
              <input
                type="date"
                id="commandDate"
                value={transferConfirm.commandDate}
                onChange={(e) => setTransferConfirm({ ...transferConfirm, commandDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTransferConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={confirmTransferAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Xác nhận
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