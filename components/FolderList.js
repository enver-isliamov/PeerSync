import React from 'react';
import { SyncStatus, FileSyncStatus } from '../types.js';
import { FolderIcon } from './icons/FolderIcon.js';


const getStatusColorClasses = (status) => {
  switch (status) {
    case SyncStatus.Synced:
      return 'bg-green-500/10 text-green-400';
    case SyncStatus.Syncing:
      return 'bg-sky-500/10 text-sky-400';
    case SyncStatus.Paused:
      return 'bg-slate-500/10 text-slate-400';
    case SyncStatus.Error:
      return 'bg-red-500/10 text-red-400';
    case SyncStatus.PermissionNeeded:
        return 'bg-yellow-500/10 text-yellow-400';
    default:
      return 'bg-slate-500/10 text-slate-400';
  }
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getSyncStatusText = (folder) => {
    if (folder.status !== SyncStatus.Syncing) {
        return folder.status;
    }

    const syncedCount = folder.files.filter(f => f.status === FileSyncStatus.Synced).length;
    const totalCount = folder.files.length;
    
    if (totalCount === 0) return folder.status;

    return `Синхронизация (${syncedCount}/${totalCount})`;
}


export const FolderList = ({ folders, onSelectFolder, onShowInstructions }) => {
  if (folders.length === 0) {
    return (
      React.createElement('div', { className: "text-center p-10 flex flex-col items-center justify-center h-full" },
        React.createElement(FolderIcon, { className: "w-16 h-16 mx-auto text-slate-600" }),
        React.createElement('h3', { className: "mt-4 text-xl font-semibold text-slate-300" }, "Папок пока нет"),
        React.createElement('p', { className: "mt-1 text-slate-500 max-w-sm" }, "Нажмите \"Добавить папку\", чтобы начать, или прочтите инструкцию, чтобы узнать, как работает приложение."),
        React.createElement('button',
            {
                onClick: onShowInstructions,
                className: "mt-6 px-5 py-2.5 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
            },
            "Прочитать инструкцию"
        )
      )
    );
  }

  return (
    React.createElement('div', { className: "p-4 space-y-3 pb-20 md:pb-4" },
      folders.map(folder => {
        const totalSize = folder.files.reduce((sum, file) => sum + file.size, 0);
        return (
          React.createElement('div', {
            key: folder.id,
            className: "bg-slate-800 rounded-lg p-4 flex items-center justify-between hover:bg-slate-700/50 border border-transparent hover:border-sky-600 transition-all cursor-pointer group",
            onClick: () => onSelectFolder(folder.id)
          },
            React.createElement('div', { className: "flex items-center min-w-0" },
               React.createElement('div', { className: "w-12 h-12 mr-4 flex-shrink-0 bg-slate-700 rounded-md flex items-center justify-center overflow-hidden" },
                  React.createElement(FolderIcon, { className: "w-8 h-8 text-sky-500" })
               ),
              React.createElement('div', { className: "min-w-0" },
                React.createElement('h3', { className: "font-bold text-lg text-slate-100 truncate" }, folder.name),
                React.createElement('div', { className: "flex items-center space-x-3 text-sm text-slate-400 mt-1" },
                  React.createElement('span', { className: `px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColorClasses(folder.status)} ${folder.status === SyncStatus.Syncing ? 'animate-pulse' : ''}` },
                    getSyncStatusText(folder)
                  ),
                  React.createElement('span', null, `${folder.files.length} файлов`),
                  React.createElement('span', null, formatBytes(totalSize))
                )
              )
            )
          )
        );
      })
    )
  );
};
