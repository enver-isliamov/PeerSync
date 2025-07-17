import React from 'react';
import type { Folder } from '../types';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Spinner } from './icons/Spinner';

interface DeleteFolderModalProps {
  folder: Folder | null;
  onClose: () => void;
  onConfirm: (folderId: string) => void;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({ folder, onClose, onConfirm }) => {
  if (!folder) return null;
  
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = () => {
    setIsDeleting(true);
    // Simulate a small delay for visual feedback, then call the actual delete handler
    setTimeout(() => {
        onConfirm(folder.id);
        // No need to set isDeleting false as component will unmount
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          disabled={isDeleting}
          aria-label="Закрыть"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <div className="text-center">
            <div className="w-16 h-16 mx-auto flex items-center justify-center bg-red-900/30 rounded-full mb-4">
              <TrashIcon className="w-8 h-8 text-red-400"/>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2" id="modal-title">Удалить папку?</h2>
            <p className="text-slate-400 mb-8">
              Вы уверены, что хотите удалить папку <span className="font-semibold text-slate-200">{folder.name}</span>?
              <br/>
              Это действие нельзя будет отменить.
            </p>
            
            <div className="flex justify-center space-x-4">
                 <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-8 py-3 rounded-md text-base font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="px-8 py-3 rounded-md text-base font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isDeleting ? (
                      <>
                        <Spinner className="w-5 h-5 mr-3" />
                        Удаление...
                      </>
                  ) : 'Удалить'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
