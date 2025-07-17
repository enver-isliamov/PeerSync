
import React, { useState, useCallback } from 'react';
import type { Folder } from '../types';
import { XIcon } from './icons/XIcon';
import { CopyIcon } from './icons/CopyIcon';

interface ShareModalProps {
  folder: Folder | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ folder, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (folder && folder.shareKey) {
      navigator.clipboard.writeText(folder.shareKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [folder]);

  if (!folder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Поделиться папкой</h2>
        <p className="text-slate-400 mb-6 truncate">Вы делитесь папкой: <span className="font-semibold text-slate-300">{folder.name}</span></p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Ключ для обмена</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={folder.shareKey || ''}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                {copied ? 'Скопировано!' : <CopyIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Отправьте этот ключ другим пользователям, чтобы они могли синхронизировать эту папку.
          </p>
        </div>
      </div>
    </div>
  );
};