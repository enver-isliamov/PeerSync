import React, { useState, useMemo, useEffect } from 'react';
import { PeerConnectionStatus, SyncStatus, FileSyncStatus } from '../types.js';
import { FileIcon } from './icons/FileIcon.js';
import { UsersIcon } from './icons/UsersIcon.js';
import { ViewListIcon } from './icons/ViewListIcon.js';
import { ViewGridIcon } from './icons/ViewGridIcon.js';
import { PhotographIcon } from './icons/PhotographIcon.js';
import { Spinner } from './icons/Spinner.js';
import { FolderIcon } from './icons/FolderIcon.js';
import { TrashIcon } from './icons/TrashIcon.js';
import { PencilIcon } from './icons/PencilIcon.js';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon.js';
import { CloudArrowDownIcon } from './icons/CloudArrowDownIcon.js';
import { CheckCircleIcon } from './icons/CheckCircleIcon.js';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon.js';
import { PlayIcon } from './icons/PlayIcon.js';
import { PauseIcon } from './icons/PauseIcon.js';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon.js';
import { DevicePhoneMobileIcon } from './icons/DevicePhoneMobileIcon.js';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDateHeader = (dateKey, locale = 'ru-RU') => {
    const headerDate = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    today.setHours(0,0,0,0);
    yesterday.setHours(0,0,0,0);
    headerDate.setHours(0,0,0,0);

    if (headerDate.getTime() === today.getTime()) return 'Сегодня';
    if (headerDate.getTime() === yesterday.getTime()) return 'Вчера';
    
    const formatterOptions = { month: 'long', day: 'numeric' };
    if (headerDate.getFullYear() !== today.getFullYear()) {
        formatterOptions.year = 'numeric';
    }
    return new Intl.DateTimeFormat(locale, formatterOptions).format(headerDate);
};

const useGroupedFiles = (files) => {
    return useMemo(() => {
        const grouped = files.reduce((acc, file) => {
            try {
                const dateKey = new Date(file.lastModified).toISOString().split('T')[0];
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(file);
                return acc;
            } catch (e) {
                console.warn(`Invalid date for file ${file.name}: ${file.lastModified}`);
                return acc;
            }
        }, {});
        
        const sortedDateKeys = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        sortedDateKeys.forEach(dateKey => {
            grouped[dateKey].sort((a, b) => b.lastModified - a.lastModified);
        });

        return { groupedFiles: grouped, sortedDateKeys };
    }, [files]);
};

const isImage = (fileName) => /\.(jpg|jpeg|png|gif|webp|heic|avif)$/i.test(fileName);

const ProgressBar = ({ progress }) => {
    const percent = progress.totalSize > 0 ? (progress.transferredSize / progress.totalSize) * 100 : 0;
    return (
        React.createElement('div', { className: "w-full" },
            React.createElement('div', { className: "relative w-full bg-slate-700 rounded-full h-2 overflow-hidden" },
                React.createElement('div', { className: "bg-sky-500 h-2 rounded-full", style: { width: `${percent}%` }})
            ),
            React.createElement('div', { className: "text-xs text-slate-400 mt-1 text-right" },
                `${formatBytes(progress.transferredSize, 1)} / ${formatBytes(progress.totalSize, 1)}`
            )
        )
    );
};

const FileStatusIcon = ({ status }) => {
    switch (status) {
        case FileSyncStatus.Synced:
            return React.createElement(CheckCircleIcon, { className: "w-5 h-5 text-green-500", title: "Синхронизировано" });
        case FileSyncStatus.NeedsDownload:
            return React.createElement(CloudArrowDownIcon, { className: "w-5 h-5 text-sky-500", title: "Требуется загрузка"});
        case FileSyncStatus.NeedsUpload:
            return React.createElement(CloudArrowUpIcon, { className: "w-5 h-5 text-amber-500", title: "Требуется выгрузка"});
        case FileSyncStatus.SyncingDownload:
        case FileSyncStatus.SyncingUpload:
            return React.createElement(Spinner, { className: "w-5 h-5 text-sky-400", title: "Синхронизация..." });
        case FileSyncStatus.Error:
            return React.createElement(ExclamationCircleIcon, { className: "w-5 h-5 text-red-500", title: "Ошибка"});
        default:
            return null;
    }
};

const FilesList = ({ groupedFiles, sortedDateKeys, syncProgress = {} }) => (
    React.createElement('div', { className: "space-y-6" },
        sortedDateKeys.map(dateKey => (
            React.createElement('div', { key: dateKey },
                React.createElement('h4', { className: "text-base font-semibold text-slate-300 py-2 sticky top-0 bg-slate-900/80 backdrop-blur-sm px-2 -mx-2 mb-2" },
                    formatDateHeader(dateKey)
                ),
                React.createElement('ul', { className: "space-y-1" },
                    groupedFiles[dateKey].map((file) => {
                        const progress = (file.status === FileSyncStatus.SyncingDownload || file.status === FileSyncStatus.SyncingUpload) && syncProgress[file.name];
                        return (
                            React.createElement('li', { key: file.name, className: "flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/50 rounded-md" },
                                React.createElement('div', { className: "flex items-center min-w-0" },
                                    React.createElement(FileIcon, { className: "w-5 h-5 text-slate-400 mr-4 flex-shrink-0" }),
                                    React.createElement('div', { className: "min-w-0" },
                                        React.createElement('p', { className: "text-sm text-slate-300 truncate" }, file.name),
                                        React.createElement('p', { className: "text-xs text-slate-500" }, new Date(file.lastModified).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit'}))
                                    )
                                ),
                                React.createElement('div', { className: "flex items-center gap-4 flex-shrink-0 ml-4" },
                                    React.createElement('div', { className: "w-32 text-sm text-slate-400 font-mono" },
                                      progress ? React.createElement(ProgressBar, { progress: progress }) : formatBytes(file.size)
                                    ),
                                    React.createElement('div', { className: "w-6 flex items-center justify-center" },
                                       React.createElement(FileStatusIcon, { status: file.status })
                                    )
                                )
                            )
                        );
                    })
                )
            )
        ))
    )
);

const FilesGrid = ({ groupedFiles, sortedDateKeys, syncProgress = {} }) => (
    React.createElement('div', { className: "space-y-8" },
        sortedDateKeys.map(dateKey => (
            React.createElement('div', { key: dateKey },
                React.createElement('h4', { className: "text-base font-semibold text-slate-300 py-2 sticky top-0 bg-slate-900/80 backdrop-blur-sm px-2 -mx-2 mb-2" },
                    formatDateHeader(dateKey)
                ),
                React.createElement('div', { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4" },
                    groupedFiles[dateKey].map((file) => {
                         const progress = (file.status === FileSyncStatus.SyncingDownload || file.status === FileSyncStatus.SyncingUpload) && syncProgress[file.name];
                        return (
                             React.createElement('div', { key: file.name, className: "group relative aspect-square bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden" },
                                isImage(file.name) ? (
                                    React.createElement('div', { className: "w-full h-full bg-slate-700 flex items-center justify-center" },
                                         React.createElement(PhotographIcon, { className: "w-8 h-8 text-slate-500" })
                                    )
                                ) : (
                                    React.createElement('div', { className: "flex flex-col items-center text-center p-2" },
                                        React.createElement(FileIcon, { className: "w-8 h-8 text-slate-400" })
                                    )
                                ),
                                React.createElement('div', { className: "absolute top-2 right-2 z-10" },
                                    React.createElement(FileStatusIcon, { status: file.status })
                                ),
                                progress ? (
                                    React.createElement('div', { className: "absolute inset-0 bg-black/70 p-2 flex flex-col justify-end" },
                                        React.createElement('p', { className: "text-xs font-semibold truncate text-white mb-2" }, file.name),
                                        React.createElement(ProgressBar, { progress: progress })
                                    )
                                ) : (
                                    React.createElement('div', { className: "absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" },
                                        React.createElement('p', { className: "text-xs font-semibold truncate" }, file.name),
                                        React.createElement('p', { className: "text-xs text-slate-300" }, formatBytes(file.size))
                                    )
                                )
                            )
                        );
                    })
                )
            )
        ))
    )
);


const PeersTab = ({ folder, onConnectPeer }) => {
    
    const getStatusIndicator = (status) => {
        switch (status) {
            case PeerConnectionStatus.Connected:
                return React.createElement('span', { className: "w-2.5 h-2.5 rounded-full bg-green-500", title: "Подключено" });
            case PeerConnectionStatus.Connecting:
                return React.createElement(Spinner, { className: "w-3 h-3 text-sky-400", title: "Подключение..."});
            case PeerConnectionStatus.Disconnected:
                return React.createElement('span', { className: "w-2.5 h-2.5 rounded-full bg-slate-500", title: "Отключено" });
            case PeerConnectionStatus.Failed:
                return React.createElement('span', { className: "w-2.5 h-2.5 rounded-full bg-red-500", title: "Ошибка" });
        }
    };

    return (
        React.createElement('div', { className: "mt-4" },
            React.createElement('div', { className: "mb-6" },
                React.createElement('button', { onClick: () => onConnectPeer(folder.id), className: "w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors" },
                    "Подключить новое устройство"
                )
            ),
             folder.peers.length === 0 ? (
                React.createElement('div', { className: "text-center py-10 text-slate-500" },
                    React.createElement(UsersIcon, { className: "w-12 h-12 mx-auto" }),
                    React.createElement('p', { className: "mt-4" }, "Нет подключенных устройств.")
                )
            ) : (
            React.createElement('div', { className: "space-y-2" },
                React.createElement('h4', { className: "text-base font-semibold text-slate-300 mb-2" }, "Подключенные устройства"),
                React.createElement('ul', { className: "divide-y divide-slate-800" },
                    folder.peers.map((peer) => (
                        React.createElement('li', { key: peer.id, className: "flex items-center justify-between py-3 px-2" },
                            React.createElement('div', { className: "flex items-center gap-4" },
                                React.createElement(DevicePhoneMobileIcon, { className: "w-6 h-6 text-slate-400" }),
                                React.createElement('div', null,
                                    React.createElement('p', { className: "text-sm font-semibold text-slate-200" }, peer.name),
                                    React.createElement('div', { className: "flex items-center gap-2 mt-1" },
                                       getStatusIndicator(peer.connectionStatus),
                                       React.createElement('p', { className: "text-xs text-slate-400" }, peer.connectionStatus)
                                    )
                                )
                            )
                        )
                    ))
                )
            )
            )
        )
    );
};

const PermissionNeededView = ({ folderName, onGrant }) => (
    React.createElement('div', { className: "flex-grow flex flex-col items-center justify-center text-center p-6 bg-yellow-900/20 rounded-lg m-4" },
        React.createElement('h3', { className: "text-xl font-bold text-yellow-300" }, "Требуется разрешение"),
        React.createElement('p', { className: "mt-2 text-yellow-400/80 max-w-md" },
            `Для продолжения синхронизации папки "${folderName}" необходимо снова предоставить доступ. Браузеры требуют этого из соображений безопасности после перезапуска.`
        ),
        React.createElement('button', {
            onClick: onGrant,
            className: "mt-6 px-6 py-3 bg-yellow-500 text-yellow-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors" },
            "Предоставить доступ"
        )
    )
);


const SyncSummary = ({ files }) => {
    const summary = useMemo(() => {
        const needsUpload = files.filter(f => f.status === FileSyncStatus.NeedsUpload || f.status === FileSyncStatus.SyncingUpload).length;
        const needsDownload = files.filter(f => f.status === FileSyncStatus.NeedsDownload || f.status === FileSyncStatus.SyncingDownload).length;
        
        const parts = [];
        if (needsDownload > 0) parts.push(`Загрузка: ${needsDownload}`);
        if (needsUpload > 0) parts.push(`Выгрузка: ${needsUpload}`);

        if (parts.length === 0) return null;
        
        return parts.join(', ');
    }, [files]);

    if (!summary) return null;

    return (
        React.createElement('div', { className: "flex items-center gap-2 text-xs text-sky-400" },
            React.createElement(Spinner, { className: "w-3 h-3" }),
            React.createElement('span', null, summary)
        )
    );
};

export const FolderDetail = ({ folder, onConnectPeer, onReGrantPermission, onDelete, onRename, onTogglePause, onBack }) => {
  const [activeTab, setActiveTab] = useState('files');
  const [viewMode, setViewMode] = useState('list');
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentName, setCurrentName] = useState(folder.name);

  useEffect(() => {
    // Reset editing state when folder changes
    setIsEditingName(false);
    setCurrentName(folder.name);
  }, [folder]);

  const handleNameSave = () => {
    if (currentName.trim() && currentName.trim() !== folder.name) {
      onRename(folder.id, currentName.trim());
    } else {
        // If name is unchanged or empty, revert to original
        setCurrentName(folder.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setCurrentName(folder.name);
      setIsEditingName(false);
    }
  };


  const { groupedFiles, sortedDateKeys } = useGroupedFiles(folder.files);
  const totalSize = useMemo(() => folder.files.reduce((sum, file) => sum + file.size, 0), [folder.files]);

  return (
    React.createElement('div', { className: "p-4 md:p-6 h-full flex flex-col" },
        // Mobile Header
        React.createElement('div', { className: "md:hidden flex items-center mb-4" },
            React.createElement('button', { onClick: onBack, className: "p-2 -ml-2 mr-2 text-slate-400 hover:text-white" },
                React.createElement(ChevronLeftIcon, { className: "w-6 h-6" })
            ),
            React.createElement('div', { className: "min-w-0" },
              React.createElement('h2', { className: "text-xl font-bold text-white truncate" }, folder.name)
            )
        ),
        // Desktop Header
        React.createElement('div', { className: "hidden md:flex items-start gap-4" },
            React.createElement('div', { className: "w-16 h-16 flex-shrink-0 bg-slate-800 rounded-lg flex items-center justify-center" },
                React.createElement(FolderIcon, { className: "w-10 h-10 text-sky-500" })
            ),
            React.createElement('div', { className: "flex-grow min-w-0 group" },
                isEditingName ? (
                    React.createElement('input', {
                        type: "text",
                        value: currentName,
                        onChange: (e) => setCurrentName(e.target.value),
                        onBlur: handleNameSave,
                        onKeyDown: handleKeyDown,
                        autoFocus: true,
                        className: "text-2xl font-bold bg-slate-700/50 w-full rounded-md px-2 py-1 outline-none ring-2 ring-sky-500"
                    })
                ) : (
                    React.createElement('div', { className: "flex items-center gap-2" },
                        React.createElement('h2', { className: "text-2xl font-bold text-white truncate" }, folder.name),
                        React.createElement('button', { onClick: () => setIsEditingName(true), className: "opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white", 'aria-label': "Редактировать имя папки" },
                            React.createElement(PencilIcon, { className: "w-5 h-5" })
                        )
                    )
                ),
                React.createElement('p', { className: "text-sm text-slate-400 font-mono mt-1 break-all" }, folder.path),
                folder.status === SyncStatus.Syncing && React.createElement(SyncSummary, { files: folder.files })
            )
        ),
        
        React.createElement('div', { className: "mt-4 flex items-center justify-between text-sm text-slate-300" },
             React.createElement('div', { className: "flex items-center space-x-4" },
                React.createElement('span', null, `${folder.files.length} файлов`),
                React.createElement('span', { className: "w-1 h-1 bg-slate-500 rounded-full" }),
                React.createElement('span', null, formatBytes(totalSize))
            )
        ),

        React.createElement('div', { className: "py-4 mt-2 border-b border-t border-slate-800 flex items-center justify-between" },
            React.createElement('button', {
                onClick: () => onTogglePause(folder.id),
                disabled: folder.status === SyncStatus.PermissionNeeded,
                className: "flex items-center gap-2 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                'aria-label': folder.status === SyncStatus.Paused ? "Возобновить синхронизацию" : "Приостановить синхронизацию"
            },
                folder.status === SyncStatus.Paused ? React.createElement(PlayIcon, { className: "w-4 h-4" }) : React.createElement(PauseIcon, { className: "w-4 h-4" }),
                React.createElement('span', null, folder.status === SyncStatus.Paused ? 'Возобновить' : 'Пауза')
            ),
            React.createElement('button', {
                onClick: () => onDelete(folder.id),
                className: "flex items-center gap-2 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 rounded-md text-sm font-semibold text-red-400 hover:text-red-300 transition-colors",
                'aria-label': "Удалить папку"
            },
                React.createElement(TrashIcon, { className: "w-4 h-4" }),
                React.createElement('span', null, "Удалить")
            )
        ),
        
        folder.status === SyncStatus.PermissionNeeded ? (
            React.createElement(PermissionNeededView, { folderName: folder.name, onGrant: () => onReGrantPermission(folder.id) })
        ) : (
            React.createElement(React.Fragment, null,
                React.createElement('div', { className: "mt-2 border-b border-slate-700 flex justify-between items-center" },
                    React.createElement('nav', { className: "-mb-px flex space-x-6", 'aria-label': "Tabs" },
                        React.createElement('button', { onClick: () => setActiveTab('files'), className: `whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'files' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'}` },
                            React.createElement(FileIcon, { className: "w-5 h-5 inline-block mr-2" }), "Файлы"
                        ),
                        React.createElement('button', { onClick: () => setActiveTab('peers'), className: `whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'peers' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'}` },
                            React.createElement(UsersIcon, { className: "w-5 h-5 inline-block mr-2" }), `Устройства (${folder.peers.length})`
                        )
                    ),
                    activeTab === 'files' && (
                        React.createElement('div', { className: "flex items-center space-x-1 bg-slate-800 p-1 rounded-md" },
                            React.createElement('button', { onClick: () => setViewMode('list'), className: `p-1.5 rounded-md ${viewMode === 'list' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`, 'aria-label': "View as list" }, React.createElement(ViewListIcon, { className: "w-5 h-5" })),
                            React.createElement('button', { onClick: () => setViewMode('grid'), className: `p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`, 'aria-label': "View as grid" }, React.createElement(ViewGridIcon, { className: "w-5 h-5" }))
                        )
                    )
                ),
                
                React.createElement('div', { className: "flex-grow overflow-y-auto mt-4" },
                    activeTab === 'files' && (
                         sortedDateKeys.length === 0 ? (
                            React.createElement('div', { className: "text-center p-10 text-slate-500" }, React.createElement(FileIcon, { className: "w-12 h-12 mx-auto" }), React.createElement('p', { className: "mt-4" }, "В этой папке нет файлов."))
                         ) : (
                            viewMode === 'list' 
                                ? React.createElement(FilesList, { groupedFiles: groupedFiles, sortedDateKeys: sortedDateKeys, syncProgress: folder.syncProgress }) 
                                : React.createElement(FilesGrid, { groupedFiles: groupedFiles, sortedDateKeys: sortedDateKeys, syncProgress: folder.syncProgress })
                         )
                    ),
                    activeTab === 'peers' && React.createElement(PeersTab, { folder: folder, onConnectPeer: onConnectPeer })
                )
            )
        )
    )
  );
};