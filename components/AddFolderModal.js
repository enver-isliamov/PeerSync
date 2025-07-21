import React, { useState } from 'react';
import { SyncStatus, FileSyncStatus } from '../types.js';
import { XIcon } from './icons/XIcon.js';
import { Spinner } from './icons/Spinner.js';
import { FolderIcon } from './icons/FolderIcon.js';

// Helper function to recursively get files from a directory handle
async function getFilesFromHandle(dirHandle) {
    const files = [];
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            files.push({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
            });
        }
        // Note: This version does not recurse into subdirectories for simplicity.
    }
    return files;
}


export const AddFolderModal = ({ onClose, onAddFolder }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isApiSupported = 'showDirectoryPicker' in window;

  const handleSelectFolder = async () => {
    if (!isApiSupported) {
        setError("Ваш браузер не поддерживает File System Access API.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const dirHandle = await window.showDirectoryPicker();
      
      const filesWithoutStatus = await getFilesFromHandle(dirHandle);
      const filesWithStatus = filesWithoutStatus.map(f => ({ ...f, status: FileSyncStatus.Synced }));

      const newFolder = {
        id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: dirHandle.name,
        // The path property is not available directly, so we use the name as a stand-in for display.
        path: `local\\${dirHandle.name}`, 
        status: SyncStatus.Synced,
        files: filesWithStatus,
        peers: [], // Peers will be added via WebRTC connection
        handle: dirHandle, // Storing the actual handle
      };
      
      onAddFolder(newFolder);
      onClose();

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled the picker, this is not an error
        console.log("Folder picker was cancelled by the user.");
      } else {
        setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка при выборе папки.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" },
      React.createElement('div', { className: "bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative" },
        React.createElement('button', {
          onClick: onClose,
          className: "absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        },
          React.createElement(XIcon, { className: "w-6 h-6" })
        ),
        React.createElement('div', { className: "text-center" },
            React.createElement(FolderIcon, { className: "w-12 h-12 mx-auto text-sky-500 mb-4" }),
            React.createElement('h2', { className: "text-2xl font-bold text-white mb-2" }, "Добавить локальную папку"),
            React.createElement('p', { className: "text-slate-400 mb-8" },
              "Выберите папку на вашем компьютере для начала синхронизации. Приложение запросит необходимые разрешения."
            ),
            
            error && React.createElement('p', { className: "text-red-400 text-sm mb-4" }, error),

            React.createElement('button', {
              type: "button",
              onClick: handleSelectFolder,
              disabled: isLoading || !isApiSupported,
              className: "w-full px-4 py-3 rounded-md text-base font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            },
              isLoading ? (
                  React.createElement(React.Fragment, null,
                    React.createElement(Spinner, { className: "w-5 h-5 mr-3" }),
                    "Обработка..."
                  )
              ) : 'Выбрать папку'
            ),
             !isApiSupported && React.createElement('p', { className: "text-yellow-400 text-xs mt-4" }, "Эта функция доступна только в браузерах на основе Chromium, таких как Chrome или Edge."),
             React.createElement('button', {
              type: "button",
              onClick: onClose,
              disabled: isLoading,
              className: "mt-3 px-4 py-2 rounded-md text-sm font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            },
              "Отмена"
            )
        )
      )
    )
  );
};
