import React, { useState, useMemo, useEffect } from 'react';
import type { Folder, FileData, Peer, SyncProgress } from '../types';
import { PeerConnectionStatus, SyncStatus, FileSyncStatus } from '../types';
import { FileIcon } from './icons/FileIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ViewListIcon } from './icons/ViewListIcon';
import { ViewGridIcon } from './icons/ViewGridIcon';
import { PhotographIcon } from './icons/PhotographIcon';
import { Spinner } from './icons/Spinner';
import { FolderIcon } from './icons/FolderIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { CloudArrowDownIcon } from './icons/CloudArrowDownIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';


interface FolderDetailProps {
  folder: Folder;
  onConnectPeer: (folderId: string) => void;
  onReGrantPermission: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onRename: (folderId: string, newName: string) => void;
  onTogglePause: (folderId: string) => void;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDateHeader = (dateKey: string, locale = 'ru-RU'): string => {
    const headerDate = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    today.setHours(0,0,0,0);
    yesterday.setHours(0,0,0,0);
    headerDate.setHours(0,0,0,0);

    if (headerDate.getTime() === today.getTime()) return 'Сегодня';
    if (headerDate.getTime() === yesterday.getTime()) return 'Вчера';
    
    const formatterOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    if (headerDate.getFullYear() !== today.getFullYear()) {
        formatterOptions.year = 'numeric';
    }
    return new Intl.DateTimeFormat(locale, formatterOptions).format(headerDate);
};

const useGroupedFiles = (files: FileData[]) => {
    return useMemo(() => {
        const grouped = files.reduce<Record<string, FileData[]>>((acc, file) => {
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

const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif|webp|heic|avif)$/i.test(fileName);

const ProgressBar: React.FC<{ progress: SyncProgress }> = ({ progress }) => {
    const percent = progress.totalSize > 0 ? (progress.transferredSize / progress.totalSize) * 100 : 0;
    return (
        <div className="w-full">
            <div className="relative w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
            </div>
            <div className="text-xs text-slate-400 mt-1 text-right">
                {`${formatBytes(progress.transferredSize, 1)} / ${formatBytes(progress.totalSize, 1)}`}
            </div>
        </div>
    );
};

const FileStatusIcon: React.FC<{ status: FileSyncStatus }> = ({ status }) => {
    switch (status) {
        case FileSyncStatus.Synced:
            return <CheckCircleIcon className="w-5 h-5 text-green-500" title="Синхронизировано" />;
        case FileSyncStatus.NeedsDownload:
            return <CloudArrowDownIcon className="w-5 h-5 text-sky-500" title="Требуется загрузка"/>;
        case FileSyncStatus.NeedsUpload:
            return <CloudArrowUpIcon className="w-5 h-5 text-amber-500" title="Требуется выгрузка"/>;
        case FileSyncStatus.SyncingDownload:
        case FileSyncStatus.SyncingUpload:
            return <Spinner className="w-5 h-5 text-sky-400" title="Синхронизация..." />;
        case FileSyncStatus.Error:
            return <ExclamationCircleIcon className="w-5 h-5 text-red-500" title="Ошибка"/>;
        default:
            return null;
    }
};

const FilesList: React.FC<{ groupedFiles: Record<string, FileData[]>; sortedDateKeys: string[]; syncProgress?: Record<string, SyncProgress> }> = ({ groupedFiles, sortedDateKeys, syncProgress = {} }) => (
    <div className="space-y-6">
        {sortedDateKeys.map(dateKey => (
            <div key={dateKey}>
                <h4 className="text-base font-semibold text-slate-300 py-2 sticky top-0 bg-slate-900/80 backdrop-blur-sm px-2 -mx-2 mb-2">
                    {formatDateHeader(dateKey)}
                </h4>
                <ul className="space-y-1">
                    {groupedFiles[dateKey].map((file) => {
                        const progress = (file.status === FileSyncStatus.SyncingDownload || file.status === FileSyncStatus.SyncingUpload) && syncProgress[file.name];
                        return (
                            <li key={file.name} className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/50 rounded-md">
                                <div className="flex items-center min-w-0">
                                    <FileIcon className="w-5 h-5 text-slate-400 mr-4 flex-shrink-0"/>
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-300 truncate">{file.name}</p>
                                        <p className="text-xs text-slate-500">{new Date(file.lastModified).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit'})}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                    <div className="w-32 text-sm text-slate-400 font-mono">
                                      {progress ? <ProgressBar progress={progress} /> : formatBytes(file.size)}
                                    </div>
                                    <div className="w-6 flex items-center justify-center">
                                       <FileStatusIcon status={file.status} />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        ))}
    </div>
);

const FilesGrid: React.FC<{ groupedFiles: Record<string, FileData[]>; sortedDateKeys: string[]; syncProgress?: Record<string, SyncProgress> }> = ({ groupedFiles, sortedDateKeys, syncProgress = {} }) => (
    <div className="space-y-8">
        {sortedDateKeys.map(dateKey => (
            <div key={dateKey}>
                <h4 className="text-base font-semibold text-slate-300 py-2 sticky top-0 bg-slate-900/80 backdrop-blur-sm px-2 -mx-2 mb-2">
                    {formatDateHeader(dateKey)}
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {groupedFiles[dateKey].map((file) => {
                         const progress = (file.status === FileSyncStatus.SyncingDownload || file.status === FileSyncStatus.SyncingUpload) && syncProgress[file.name];
                        return (
                             <div key={file.name} className="group relative aspect-square bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                                {isImage(file.name) ? (
                                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                         <PhotographIcon className="w-8 h-8 text-slate-500"/>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center p-2">
                                        <FileIcon className="w-8 h-8 text-slate-400"/>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 z-10">
                                    <FileStatusIcon status={file.status} />
                                </div>
                                {progress ? (
                                    <div className="absolute inset-0 bg-black/70 p-2 flex flex-col justify-end">
                                        <p className="text-xs font-semibold truncate text-white mb-2">{file.name}</p>
                                        <ProgressBar progress={progress} />
                                    </div>
                                ) : (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <p className="text-xs font-semibold truncate">{file.name}</p>
                                        <p className="text-xs text-slate-300">{formatBytes(file.size)}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
);


const PeersTab: React.FC<{ folder: Folder; onConnectPeer: (folderId: string) => void }> = ({ folder, onConnectPeer }) => {
    
    const getStatusIndicator = (status: PeerConnectionStatus) => {
        switch (status) {
            case PeerConnectionStatus.Connected:
                return <span className="w-3 h-3 rounded-full bg-green-500" title="Подключено"></span>;
            case PeerConnectionStatus.Connecting:
                return <Spinner className="w-4 h-4 text-sky-400" title="Подключение..."/>;
            case PeerConnectionStatus.Disconnected:
                return <span className="w-3 h-3 rounded-full bg-slate-500" title="Отключено"></span>;
            case PeerConnectionStatus.Failed:
                return <span className="w-3 h-3 rounded-full bg-red-500" title="Ошибка"></span>;
        }
    };

    return (
        <div className="mt-4">
            <div className="mb-6">
                <button onClick={() => onConnectPeer(folder.id)} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors">
                    Подключить новое устройство
                </button>
            </div>
             {folder.peers.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <UsersIcon className="w-12 h-12 mx-auto" />
                    <p className="mt-4">Нет подключенных устройств.</p>
                </div>
            ) : (
            <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-300 mb-2">Подключенные устройства</h4>
                <ul className="divide-y divide-slate-700">
                    {folder.peers.map((peer) => (
                        <li key={peer.id} className="flex items-center justify-between py-3 px-2">
                            <div className="flex items-center">
                                <div className="w-4 h-4 flex items-center justify-center mr-4 flex-shrink-0">{getStatusIndicator(peer.connectionStatus)}</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-200">{peer.name}</p>
                                    <p className="text-xs text-slate-400">{peer.connectionStatus}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            )}
        </div>
    );
};

const PermissionNeededView: React.FC<{ folderName: string, onGrant: () => void }> = ({ folderName, onGrant }) => (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-yellow-900/20 rounded-lg m-4">
        <h3 className="text-xl font-bold text-yellow-300">Требуется разрешение</h3>
        <p className="mt-2 text-yellow-400/80 max-w-md">
            Для продолжения синхронизации папки "{folderName}" необходимо снова предоставить доступ.
            Браузеры требуют этого из соображений безопасности после перезапуска.
        </p>
        <button 
            onClick={onGrant}
            className="mt-6 px-6 py-3 bg-yellow-500 text-yellow-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors">
            Предоставить доступ
        </button>
    </div>
);


const SyncSummary: React.FC<{ files: FileData[] }> = ({ files }) => {
    const summary = useMemo(() => {
        const needsUpload = files.filter(f => f.status === FileSyncStatus.NeedsUpload || f.status === FileSyncStatus.SyncingUpload).length;
        const needsDownload = files.filter(f => f.status === FileSyncStatus.NeedsDownload || f.status === FileSyncStatus.SyncingDownload).length;
        
        const parts: string[] = [];
        if (needsDownload > 0) parts.push(`Загрузка: ${needsDownload}`);
        if (needsUpload > 0) parts.push(`Выгрузка: ${needsUpload}`);

        if (parts.length === 0) return null;
        
        return parts.join(', ');
    }, [files]);

    if (!summary) return null;

    return (
        <div className="flex items-center gap-2 text-xs text-sky-400">
            <Spinner className="w-3 h-3"/>
            <span>{summary}</span>
        </div>
    );
};

export const FolderDetail: React.FC<FolderDetailProps> = ({ folder, onConnectPeer, onReGrantPermission, onDelete, onRename, onTogglePause }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'peers'>('files');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentName, setCurrentName] = useState(folder.name);

  useEffect(() => {
    // Reset editing state when folder changes
    setIsEditingName(false);
    setCurrentName(folder.name);
  }, [folder]);

  useEffect(() => {
      // When folder changes, if it has no peers, switch to files tab
      if (folder.peers.length === 0 && activeTab === 'peers') {
          setActiveTab('files');
      }
  }, [folder, activeTab]);
  
  const handleNameSave = () => {
    if (currentName.trim() && currentName.trim() !== folder.name) {
      onRename(folder.id, currentName.trim());
    } else {
        // If name is unchanged or empty, revert to original
        setCurrentName(folder.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    <div className="p-6 h-full flex flex-col">
        <div className="flex items-start gap-4">
            <div className="w-16 h-16 flex-shrink-0 bg-slate-800 rounded-lg flex items-center justify-center">
                <FolderIcon className="w-10 h-10 text-sky-500" />
            </div>
            <div className="flex-grow min-w-0 group">
                {isEditingName ? (
                    <input 
                        type="text"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="text-2xl font-bold bg-slate-700/50 w-full rounded-md px-2 py-1 outline-none ring-2 ring-sky-500"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white truncate">{folder.name}</h2>
                        <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white" aria-label="Редактировать имя папки">
                            <PencilIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
                <p className="text-sm text-slate-400 font-mono mt-1 break-all">{folder.path}</p>
                {folder.status === SyncStatus.Syncing && <SyncSummary files={folder.files} />}
            </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
             <div className="flex items-center space-x-4">
                <span>{folder.files.length} файлов</span>
                <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                <span>{formatBytes(totalSize)}</span>
            </div>
        </div>

        <div className="py-4 mt-2 border-b border-t border-slate-800 flex items-center justify-between">
            <button
                onClick={() => onTogglePause(folder.id)}
                disabled={folder.status === SyncStatus.PermissionNeeded}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={folder.status === SyncStatus.Paused ? "Возобновить синхронизацию" : "Приостановить синхронизацию"}
            >
                {folder.status === SyncStatus.Paused ? <PlayIcon className="w-4 h-4"/> : <PauseIcon className="w-4 h-4"/>}
                <span>{folder.status === SyncStatus.Paused ? 'Возобновить' : 'Пауза'}</span>
            </button>
            <button
                onClick={() => onDelete(folder.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 rounded-md text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                aria-label="Удалить папку"
            >
                <TrashIcon className="w-4 h-4"/>
                <span>Удалить</span>
            </button>
        </div>
        
        {folder.status === SyncStatus.PermissionNeeded ? (
            <PermissionNeededView folderName={folder.name} onGrant={() => onReGrantPermission(folder.id)} />
        ) : (
            <>
                <div className="mt-2 border-b border-slate-700 flex justify-between items-center">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('files')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'files' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'}`}>
                            <FileIcon className="w-5 h-5 inline-block mr-2" />Файлы
                        </button>
                        <button onClick={() => setActiveTab('peers')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'peers' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'}`}>
                            <UsersIcon className="w-5 h-5 inline-block mr-2" />Устройства ({folder.peers.length})
                        </button>
                    </nav>
                    {activeTab === 'files' && (
                        <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-md">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="View as list"><ViewListIcon className="w-5 h-5"/></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="View as grid"><ViewGridIcon className="w-5 h-5"/></button>
                        </div>
                    )}
                </div>
                
                <div className="flex-grow overflow-y-auto mt-4 -mr-6 pr-4">
                    {activeTab === 'files' && (
                         sortedDateKeys.length === 0 ? (
                            <div className="text-center p-10 text-slate-500"><FileIcon className="w-12 h-12 mx-auto" /><p className="mt-4">В этой папке нет файлов.</p></div>
                         ) : (
                            viewMode === 'list' 
                                ? <FilesList groupedFiles={groupedFiles} sortedDateKeys={sortedDateKeys} syncProgress={folder.syncProgress}/> 
                                : <FilesGrid groupedFiles={groupedFiles} sortedDateKeys={sortedDateKeys} syncProgress={folder.syncProgress}/>
                         )
                    )}
                    {activeTab === 'peers' && <PeersTab folder={folder} onConnectPeer={onConnectPeer} />}
                </div>
            </>
        )}
    </div>
  );
};