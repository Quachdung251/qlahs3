// ./components/CaseTable.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, ArrowRight, CheckCircle, PauseCircle, StopCircle, Send, Download, Edit2, MoreHorizontal, MessageSquare, Clock, Star, Printer } from 'lucide-react';
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
  }[];
  onDeleteCase: (caseId: string) => void;
  onTransferStage: (caseId: string, newStage: Case['stage']) => void;
  onUpdateCase: (updatedCase: Case) => void;
  onEditCase: (caseItem: Case) => void;
  onToggleImportant: (caseId: string, isImportant: boolean) => void;
  showWarnings?: boolean;
}

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
      <div className="max-w-xs">
        <div className="font-medium text-gray-900 truncate" title={caseItem.name}>
          {caseItem.name}
        </div>
        <div className="text-sm text-gray-500 truncate" title={caseItem.charges}>
          {caseItem.charges}
        </div>
      </div>
    );
  };

  const renderNotesCell = (caseItem: Case) => {
    // ... (existing renderNotesCell function)
    return (
      <button
        onClick={() => setNotesCase(caseItem)}
        className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors whitespace-nowrap"
      >
        <MessageSquare size={12} />
        {caseItem.notes ? 'Xem ghi chú' : 'Thêm ghi chú'}
      </button>
    );
  };

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  const sortedCases = React.useMemo(() => {
    let sortableItems = [...cases];

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Case];
        const bValue = b[sortConfig.key as keyof Case];

        if (sortConfig.key === 'totalDefendants') {
          return sortConfig.direction === 'ascending'
            ? (a.defendants?.length || 0) - (b.defendants?.length || 0)
            : (b.defendants?.length || 0) - (a.defendants?.length || 0);
        }

        if (sortConfig.key === 'shortestDetention') {
          // Filter for valid detention deadlines for sorting
          const aDetentionDates = a.defendants
            ?.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '')
            .map(d => d.detentionDeadline!); // Non-null assertion is safe due to filter

          const bDetentionDates = b.defendants
            ?.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '')
            .map(d => d.detentionDeadline!); // Non-null assertion is safe due to filter

          const getMinDateTimestamp = (dates: string[] | undefined) => {
            if (!dates || dates.length === 0) return Infinity; // Treat as very long if no valid dates
            const timestamps = dates.map(dateStr => {
              const parts = dateStr.split('/');
              // Convert DD/MM/YYYY to MM/DD/YYYY for Date object
              return new Date(`${parts[1]}/${parts[0]}/${parts[2]}`).getTime();
            });
            return Math.min(...timestamps);
          };

          const aMinTimestamp = getMinDateTimestamp(aDetentionDates);
          const bMinTimestamp = getMinDateTimestamp(bDetentionDates);

          return sortConfig.direction === 'ascending'
            ? aMinTimestamp - bMinTimestamp
            : bMinTimestamp - aMinTimestamp;
        }


        if (sortConfig.key === 'investigationRemaining') {
          const aRemaining = getDaysRemaining(a.investigationDeadline);
          const bRemaining = getDaysRemaining(b.investigationDeadline);
          return sortConfig.direction === 'ascending' ? aRemaining - bRemaining : bRemaining - aRemaining;
        }

        if (sortConfig.key === 'shortestDetentionRemaining') {
          const aDetainedDefs = a.defendants?.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
          const bDetainedDefs = b.defendants?.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');

          const aShortestDetentionDays = aDetainedDefs && aDetainedDefs.length > 0
            ? Math.min(...aDetainedDefs.map(d => getDaysRemaining(d.detentionDeadline!)))
            : Infinity;
          const bShortestDetentionDays = bDetainedDefs && bDetainedDefs.length > 0
            ? Math.min(...bDetainedDefs.map(d => getDaysRemaining(d.detentionDeadline!)))
            : Infinity;

          return sortConfig.direction === 'ascending'
            ? aShortestDetentionDays - bShortestDetentionDays
            : bShortestDetentionDays - aShortestDetentionDays;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending'
            ? aValue - bValue
            : bValue - aValue;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [cases, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getClassNamesFor = (key: string) => {
    return sortConfig?.key === key ? sortConfig.direction : undefined;
  };

  const getRowHighlightClass = (caseItem: Case) => {
    if (showWarnings) {
      if (caseItem.stage === 'Điều tra' && isExpiringSoon(caseItem.investigationDeadline)) {
        return 'bg-yellow-50';
      }
      const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
      if (detainedDefendants.some(d => isExpiringSoon(d.detentionDeadline!))) {
        return 'bg-yellow-50';
      }
    }
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mở rộng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quan trọng
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort(column.key as string)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {sortConfig?.key === column.key && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-4 text-center text-gray-500">
                  Không có vụ án nào
                </td>
              </tr>
            ) : (
              sortedCases.map((caseItem) => (
                <React.Fragment key={caseItem.id}>
                  <tr className={`hover:bg-gray-50 ${getRowHighlightClass(caseItem)}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleExpanded(caseItem.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedCases.has(caseItem.id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {columns.find(c => c.key === 'isImportant')?.render?.(caseItem)}
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.render ? (
                          column.render(caseItem)
                        ) : (
                          column.key === 'totalDefendants' ? (caseItem.defendants?.length || 0) :
                          column.key === 'shortestDetention' ? (
                            (() => {
                                const validDetentionDates = caseItem.defendants
                                    ?.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '')
                                    .map(d => d.detentionDeadline!); // Safe due to filter

                                if (!validDetentionDates || validDetentionDates.length === 0) return 'N/A';

                                const sortedDates = [...validDetentionDates].sort((dateA, dateB) => {
                                    const partsA = dateA.split('/');
                                    const partsB = dateB.split('/');
                                    const dateObjA = new Date(`${partsA[1]}/${partsA[0]}/${partsA[2]}`);
                                    const dateObjB = new Date(`${partsB[1]}/${partsB[0]}/${partsB[2]}`);
                                    return dateObjA.getTime() - dateObjB.getTime();
                                });
                                return sortedDates[0];
                            })()
                          ) :
                          column.key === 'investigationRemaining' ? (
                            `${getDaysRemaining(caseItem.investigationDeadline)} ngày`
                          ) :
                          column.key === 'shortestDetentionRemaining' ? (
                            (() => {
                              const detainedDefs = caseItem.defendants?.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '');
                              if (!detainedDefs || detainedDefs.length === 0) return 'Không có';
                              const shortestDetentionDays = Math.min(
                                ...detainedDefs.map(d => getDaysRemaining(d.detentionDeadline!))
                              );
                              return `${shortestDetentionDays} ngày`;
                            })()
                          ) :
                          caseItem[column.key as keyof Case] as React.ReactNode
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => toggleActions(caseItem.id)}
                          className="text-gray-500 hover:text-gray-700"
                          aria-haspopup="true"
                          aria-expanded={expandedActions.has(caseItem.id) ? 'true' : 'false'}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        {expandedActions.has(caseItem.id) && (
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                              <button onClick={() => onEditCase(caseItem)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                                <Edit2 size={16} /> Sửa
                              </button>
                              <button onClick={() => setNotesCase(caseItem)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                                <MessageSquare size={16} /> Ghi chú
                              </button>
                              {caseItem.stage === 'Điều tra' && (
                                <button onClick={() => setExtensionModal({ case: caseItem, type: 'investigation' })} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                                  <Clock size={16} /> Gia hạn ĐT
                                </button>
                              )}
                              {caseItem.defendants && caseItem.defendants.some(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline) && (
                                <button onClick={() => setExtensionModal({ case: caseItem, type: 'detention' })} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                                  <Clock size={16} /> Gia hạn TG
                                </button>
                              )}
                              {getStageActions(caseItem).map((action, index) => (
                                <div key={index} className="px-4 py-2 text-sm">
                                  {action}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedCases.has(caseItem.id) && (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-6 py-4 bg-gray-50 text-sm text-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><span className="font-medium">Ngày khởi tố:</span> {caseItem.createdAt}</p>
                            <p><span className="font-medium">Ngày chuyển điều tra:</span> {caseItem.investigationTransferDate || 'N/A'}</p>
                            <p><span className="font-medium">Ngày chuyển truy tố:</span> {caseItem.prosecutionTransferDate || 'N/A'}</p>
                            <p><span className="font-medium">Ngày chuyển xét xử:</span> {caseItem.trialTransferDate || 'N/A'}</p>
                            <p><span className="font-medium">Giai đoạn:</span> {caseItem.stage}</p>
                            <p><span className="font-medium">Ghi chú:</span> {caseItem.notes || 'Không có'}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Thông tin Bị can:</h4>
                            {caseItem.defendants && caseItem.defendants.length > 0 ? (
                              caseItem.defendants.map((defendant, defIndex) => (
                                <div key={defIndex} className="mb-3 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                                  <p className="font-medium">{defendant.name} ({defendant.dateOfBirth})</p>
                                  <p className="text-xs text-gray-600">{defendant.address}</p>
                                  <p><span className="font-medium">Tội danh:</span> {defendant.charges}</p>
                                  <p><span className="font-medium">Biện pháp ngăn chặn:</span> {defendant.preventiveMeasure}</p>
                                  {defendant.preventiveMeasure === 'Tạm giam' && (
                                    <p><span className="font-medium">Thời hạn tạm giam:</span> {defendant.detentionDeadline || 'N/A'}</p>
                                  )}
                                  <p><span className="font-medium">Ghi chú bị can:</span> {defendant.notes || 'Không có'}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">Chưa có thông tin bị can.</p>
                            )}
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

      {sortedCases.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có vụ án nào
        </div>
      )}

      {notesCase && (
        <NotesModal
          caseItem={notesCase}
          onSaveNotes={(caseId, notes) => {
            onUpdateCase({ ...notesCase, id: caseId, notes: notes } as Case);
            setNotesCase(null);
          }}
          onClose={() => setNotesCase(null)}
        />
      )}

      {showQrModal && qrCaseData && (
        <QRCodeDisplayModal
          qrCodeValue={qrCaseData.qrValue}
          caseName={qrCaseData.caseName}
          onClose={() => setShowQrModal(false)}
        />
      )}

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
    </div>
  );
};

export default CaseTable;