// ./components/CaseActions.tsx
import React from 'react';
import { ArrowRight, CheckCircle, PauseCircle, Send, Trash2, Edit2, Clock, MoreHorizontal, MessageSquare, Star, Printer } from 'lucide-react';
import { Case, Defendant } from '../types';

interface CaseActionsProps {
  caseItem: Case;
  onTransferStage: (caseId: string, newStage: Case['stage']) => void;
  onEditCase: (caseItem: Case) => void;
  onToggleImportant: (caseId: string, isImportant: boolean) => void;
  onSetNotesCase: (caseItem: Case) => void;
  onSetExtensionModal: (modalProps: {
    case: Case;
    type: 'investigation' | 'detention';
    defendant?: Defendant;
  }) => void;
  onSetConfirmDelete: (caseId: string) => void;
  onHandlePrintExistingQR: (caseItem: Case) => void;
  expandedActions: Set<string>;
  toggleActions: (caseId: string) => void;
}

const CaseActions: React.FC<CaseActionsProps> = ({
  caseItem,
  onTransferStage,
  onEditCase,
  onToggleImportant,
  onSetNotesCase,
  onSetExtensionModal,
  onSetConfirmDelete,
  onHandlePrintExistingQR,
  expandedActions,
  toggleActions,
}) => {
  const isExpanded = expandedActions.has(caseItem.id);

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
          onClick={() => onSetConfirmDelete(caseItem.id)}
          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <Trash2 size={12} />
          Đình chỉ
        </button>
      );
    }
    return actions;
  };

  const stageActions = getStageActions(caseItem);

  return (
    <div className="relative flex flex-col items-start gap-1">
      {/* Primary Actions (always visible) */}
      <div className="flex items-center gap-1">
        <button
          key="print-qr"
          onClick={() => onHandlePrintExistingQR(caseItem)}
          className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors whitespace-nowrap"
          title="In nhãn QR Code"
        >
          <Printer size={12} />
          In QR
        </button>
        <button
          onClick={() => onEditCase(caseItem)}
          className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
        >
          <Edit2 size={12} />
          Sửa
        </button>

        {caseItem.stage === 'Điều tra' && (
          <button
            onClick={() => onSetExtensionModal({ case: caseItem, type: 'investigation' })}
            className="p-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
            title="Gia hạn Điều tra"
          >
            <Clock size={16} />
          </button>
        )}

        {/* Display first stage action if available */}
        {stageActions.length > 0 && stageActions[0]}

        {/* More actions button if there are more than 1 stage actions or other actions */}
        {(stageActions.length > 1 || caseItem.defendants.some(d => d.preventiveMeasure === 'Tạm giam')) && (
          <button
            onClick={() => toggleActions(caseItem.id)}
            className="p-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
            title="Thêm hành động"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>

      {/* Expanded Actions Dropdown */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-max">
          <div className="p-2 space-y-1">
            {/* Stage actions (excluding the first one if already displayed) */}
            {stageActions.slice(1).map((action, index) => (
              <div key={`stage-action-${index}`} className="block">
                {action}
              </div>
            ))}

            {/* Detention Extension Actions for each detained defendant */}
            {caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && typeof d.detentionDeadline === 'string' && d.detentionDeadline !== '').map((defendant) => (
              <button
                key={`detention-extend-${defendant.id}`}
                onClick={() => onSetExtensionModal({ case: caseItem, type: 'detention', defendant })}
                className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors whitespace-nowrap w-full justify-start"
                title={`Gia hạn tạm giam cho ${defendant.name}`}
              >
                <Clock size={12} />
                Gia hạn TG ({defendant.name.split(' ')[0]})
              </button>
            ))}

            {/* Other general actions */}
            <button
              onClick={() => onSetNotesCase(caseItem)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap w-full justify-start"
              title="Xem/Sửa ghi chú"
            >
              <MessageSquare size={12} />
              Ghi chú
            </button>
            <button
              onClick={() => onToggleImportant(caseItem.id, !caseItem.isImportant)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors whitespace-nowrap w-full justify-start ${
                caseItem.isImportant ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={caseItem.isImportant ? 'Bỏ đánh dấu quan trọng' : 'Đánh dấu quan trọng'}
            >
              <Star size={12} fill={caseItem.isImportant ? 'currentColor' : 'none'} />
              {caseItem.isImportant ? 'Bỏ Q.trọng' : 'Đánh Q.trọng'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseActions;