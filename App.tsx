
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Folder, Peer, SyncMessage, FileData, SyncProgress } from './types';
import { PeerConnectionStatus, SyncStatus, SyncMessageType, FileSyncStatus } from './types';
import { FolderList } from './components/FolderList';
import { FolderDetail } from './components/FolderDetail';
import { AddFolderModal } from './components/AddFolderModal';
import { ConnectPeerModal } from './components/ConnectPeerModal';
import { JoinSyncModal } from './components/JoinSyncModal';
import { PlusIcon } from './components/icons/PlusIcon';
import { FolderIcon } from './components/icons/FolderIcon';
import { QrcodeIcon } from './components/icons/QrcodeIcon';
import { WebRTCManager } from './services/webrtc';
import { getFolders, saveFolders } from './services/db';
import { DeleteFolderModal } from './components/DeleteFolderModal';
import { Instructions } from './components/Instructions';
import { QuestionMarkCircleIcon } from './components/icons/QuestionMarkCircleIcon';


async function getFilesFromHandle(dirHandle: FileSystemDirectoryHandle): Promise<Omit<FileData, 'status'>[]> {
    const files: Omit<FileData, 'status'>[] = [];
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            files.push({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
            });
        }
    }
    return files;
}

const App: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isDBLoading, setIsDBLoading] = useState(true);
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConnectPeerModalOpen, setIsConnectPeerModalOpen] = useState(false);
  const [isJoinSyncModalOpen, setIsJoinSyncModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  // WebRTC connection states
  const [offerToConnect, setOfferToConnect] = useState<RTCSessionDescriptionInit | null>(null);
  const [connectingPeerId, setConnectingPeerId] = useState<string | null>(null);


  // Buffer for receiving file chunks - NOW only for progress tracking
  const fileReceiveProgress = useRef<Record<string, { receivedSize: number, totalSize: number }>>({});
  // Ref to hold the writable streams for large files
  const fileWriteStreams = useRef<Record<string, FileSystemWritableFileStream>>({});

  // --- Persistence Logic ---
  useEffect(() => {
    const loadState = async () => {
      setIsDBLoading(true);
      const savedFolders = await getFolders();
      // Check for permissions after loading
      for (const folder of savedFolders) {
          if ('showDirectoryPicker' in window) {
             folder.status = SyncStatus.PermissionNeeded;
             folder.handle = undefined; // Handles are not persisted
          } else {
             folder.status = SyncStatus.Error; // API not supported
          }
      }
      setFolders(savedFolders);
      setIsDBLoading(false);
      if (savedFolders.length === 0) {
        setIsInstructionsVisible(true);
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    if (!isDBLoading) {
      saveFolders(folders);
    }
  }, [folders, isDBLoading]);


  const updateFolder = (folderId: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...updates } : f));
  };
  
  const updateFileStatus = (folderId: string, fileName: string, status: FileSyncStatus) => {
    setFolders(prev => prev.map(f => {
        if (f.id === folderId) {
            return {
                ...f,
                files: f.files.map(file => file.name === fileName ? { ...file, status } : file)
            };
        }
        return f;
    }));
  };

  const updatePeerStatus = (peerId: string, status: PeerConnectionStatus) => {
    setFolders(prev => prev.map(f => ({
        ...f,
        peers: f.peers.map(p => p.id === peerId ? { ...p, connectionStatus: status } : p)
    })));
  };

  const updateSyncProgress = (folderId: string, fileName: string, progress: SyncProgress | null) => {
      setFolders(prev => prev.map(f => {
          if (f.id === folderId) {
              const newSyncProgress = { ...f.syncProgress };
              if (progress) {
                  newSyncProgress[fileName] = progress;
              } else {
                  delete newSyncProgress[fileName];
              }
              return { ...f, syncProgress: newSyncProgress };
          }
          return f;
      }));
  };
  
  const checkFileSyncStatus = async (peerId: string, folderId: string, remoteFiles: Omit<FileData, 'status'>[]) => {
      const localFolder = folders.find(f => f.id === folderId);
      if (!localFolder || !localFolder.handle || localFolder.status === SyncStatus.PermissionNeeded || localFolder.status === SyncStatus.Paused) {
          console.warn(`Folder ${localFolder?.name} is not ready for sync (status: ${localFolder?.status}).`);
          return;
      }
      
      const localFiles = localFolder.files;
      const newFiles: FileData[] = [];
      const allFileNames = new Set([...localFiles.map(f => f.name), ...remoteFiles.map(f => f.name)]);

      let filesToRequest = 0;
      let filesToUpload = 0;

      for (const fileName of allFileNames) {
          const localFile = localFiles.find(f => f.name === fileName);
          const remoteFile = remoteFiles.find(f => f.name === fileName);

          if (localFile && !remoteFile) {
              newFiles.push({ ...localFile, status: FileSyncStatus.NeedsUpload });
              filesToUpload++;
          } else if (!localFile && remoteFile) {
              newFiles.push({ ...remoteFile, status: FileSyncStatus.NeedsDownload });
              filesToRequest++;
          } else if (localFile && remoteFile) {
              if (localFile.lastModified < remoteFile.lastModified) {
                  newFiles.push({ ...remoteFile, status: FileSyncStatus.NeedsDownload });
                  filesToRequest++;
              } else if (localFile.lastModified > remoteFile.lastModified) {
                  newFiles.push({ ...localFile, status: FileSyncStatus.NeedsUpload });
                  filesToUpload++;
              } else {
                  newFiles.push({ ...localFile, status: FileSyncStatus.Synced });
              }
          }
      }

      updateFolder(folderId, { files: newFiles.sort((a,b) => b.lastModified - a.lastModified) });
      
      if(filesToRequest > 0) {
          updateFolder(folderId, { status: SyncStatus.Syncing });
          for (const file of newFiles) {
              if (file.status === FileSyncStatus.NeedsDownload) {
                   WebRTCManager.sendMessage(peerId, {
                      type: SyncMessageType.REQUEST_FILE,
                      payload: { folderId, fileName: file.name }
                  });
              }
          }
      }
      
      if(filesToUpload === 0 && filesToRequest === 0) {
          updateFolder(folderId, { status: SyncStatus.Synced });
      } else {
          updateFolder(folderId, { status: SyncStatus.Syncing });
      }
  };


  const webrtcCallbacks = {
      onStatusChange: (peerId: string, status: PeerConnectionStatus) => {
          updatePeerStatus(peerId, status);
          if (status === PeerConnectionStatus.Connected) {
              const connectedFolder = folders.find(f => f.peers.some(p => p.id === peerId));
              if (connectedFolder && connectedFolder.status !== SyncStatus.PermissionNeeded && connectedFolder.status !== SyncStatus.Paused) {
                  updateFolder(connectedFolder.id, { status: SyncStatus.Syncing });
                  WebRTCManager.sendMessage(peerId, {
                      type: SyncMessageType.FILE_LIST,
                      payload: {
                          folderId: connectedFolder.id,
                          folderName: connectedFolder.name,
                          files: connectedFolder.files,
                      }
                  });
              }
          }
          if (status === PeerConnectionStatus.Disconnected || status === PeerConnectionStatus.Failed) {
              WebRTCManager.closeConnection(peerId);
          }
      },
      onDataChannel: (peerId: string, channel: RTCDataChannel) => {
          channel.onmessage = async (event) => {
            if (typeof event.data === 'string') {
              const message = JSON.parse(event.data) as SyncMessage;
              // Check if folder is paused before processing most messages
              const folderIdForPauseCheck = message.payload.folderId;
              const folderForPauseCheck = folders.find(f => f.id === folderIdForPauseCheck);
              if (folderForPauseCheck?.status === SyncStatus.Paused && message.type !== SyncMessageType.FILE_LIST) {
                  // Allow FILE_LIST to be processed to establish connection, but ignore other sync traffic
                  return;
              }
              
              switch (message.type) {
                case SyncMessageType.FILE_LIST: {
                  const { folderId, folderName, files: remoteFiles } = message.payload;
                  let localFolder = folders.find(f => f.id === folderId);
                  
                  if (!localFolder) {
                    try {
                        const newHandle = await window.showDirectoryPicker();
                        const filesInHandle = await getFilesFromHandle(newHandle);
                        const newFolder: Folder = {
                          id: folderId,
                          name: folderName,
                          path: `local\\${newHandle.name}`,
                          status: SyncStatus.Syncing,
                          files: filesInHandle.map(f => ({...f, status: FileSyncStatus.NeedsUpload })),
                          peers: [{ id: peerId, name: `Устройство-${peerId.slice(-4)}`, connectionStatus: PeerConnectionStatus.Connected }],
                          handle: newHandle,
                          syncProgress: {},
                        };
                        setFolders(prev => [...prev, newFolder]);
                        setSelectedFolderId(newFolder.id);
                        localFolder = newFolder;
                        
                        // Also send our file list back
                         WebRTCManager.sendMessage(peerId, {
                            type: SyncMessageType.FILE_LIST,
                            payload: { folderId, folderName, files: newFolder.files }
                        });
                    } catch(e) {
                        console.error("User cancelled directory picker or an error occurred.", e);
                        WebRTCManager.closeConnection(peerId);
                        return;
                    }
                  } else {
                      const peerExists = localFolder.peers.some(p => p.id === peerId);
                      if (!peerExists) {
                           updateFolder(folderId, {
                               peers: [...localFolder.peers, { id: peerId, name: `Устройство-${peerId.slice(-4)}`, connectionStatus: PeerConnectionStatus.Connected }]
                           })
                      }
                  }
                  
                  // Run sync check
                  await checkFileSyncStatus(peerId, folderId, remoteFiles);
                  break;
                }
                case SyncMessageType.REQUEST_FILE: {
                  const { folderId, fileName } = message.payload;
                  const folder = folders.find(f => f.id === folderId);
                  if (folder && folder.handle) {
                    try {
                        updateFileStatus(folderId, fileName, FileSyncStatus.SyncingUpload);
                        const fileHandle = await folder.handle.getFileHandle(fileName);
                        const file = await fileHandle.getFile();
                        WebRTCManager.sendMessage(peerId, { type: SyncMessageType.START_FILE_TRANSFER, payload: { folderId, fileName, fileSize: file.size, fileType: file.type } });
                        const CHUNK_SIZE = 256 * 1024; // 256KB
                        for (let i = 0; i < file.size; i += CHUNK_SIZE) {
                            const chunk = file.slice(i, i + CHUNK_SIZE);
                            const chunkBuffer = await chunk.arrayBuffer();
                            await WebRTCManager.sendMessage(peerId, chunkBuffer);
                        }
                        WebRTCManager.sendMessage(peerId, { type: SyncMessageType.FILE_TRANSFER_COMPLETE, payload: { folderId, fileName }});
                    } catch(e) { 
                      console.error(`Could not read or send file ${fileName}:`, e);
                      updateFileStatus(folderId, fileName, FileSyncStatus.Error);
                    }
                  }
                  break;
                }
                case SyncMessageType.START_FILE_TRANSFER: {
                  const { folderId, fileName, fileSize } = message.payload;
                  const folder = folders.find(f => f.id === folderId);
                  if (folder && folder.handle) {
                      try {
                          updateFileStatus(folderId, fileName, FileSyncStatus.SyncingDownload);
                          const fileHandle = await folder.handle.getFileHandle(fileName, { create: true });
                          const writable = await fileHandle.createWritable();
                          const streamKey = `${peerId}:${folderId}:${fileName}`;
                          fileWriteStreams.current[streamKey] = writable;
                          fileReceiveProgress.current[streamKey] = { receivedSize: 0, totalSize: fileSize };
                          updateSyncProgress(folderId, fileName, { totalSize: fileSize, transferredSize: 0 });
                      } catch (e) {
                          console.error(`Could not create writable stream for ${fileName}:`, e);
                          updateFileStatus(folderId, fileName, FileSyncStatus.Error);
                      }
                  }
                  break;
                }
                case SyncMessageType.FILE_TRANSFER_COMPLETE: {
                    const { folderId, fileName } = message.payload;
                    const streamKey = `${peerId}:${folderId}:${fileName}`;
                    const writable = fileWriteStreams.current[streamKey];
                    if (writable) {
                        await writable.close();
                        delete fileWriteStreams.current[streamKey];
                        delete fileReceiveProgress.current[streamKey];

                        const folder = folders.find(f => f.id === folderId);
                        if (folder && folder.handle) {
                           const fileHandle = await folder.handle.getFileHandle(fileName);
                           const savedFile = await fileHandle.getFile();
                           const newFileData: FileData = { name: savedFile.name, size: savedFile.size, lastModified: savedFile.lastModified, status: FileSyncStatus.Synced };
                           
                           setFolders(prev => prev.map(f => {
                              if (f.id === folderId) {
                                  const otherFiles = f.files.filter(file => file.name !== fileName);
                                  return { ...f, files: [...otherFiles, newFileData].sort((a,b) => b.lastModified - a.lastModified) };
                              }
                              return f;
                           }));
                        }

                        updateSyncProgress(folderId, fileName, null);
                        WebRTCManager.sendMessage(peerId, { type: SyncMessageType.FILE_RECEIVE_ACK, payload: { folderId, fileName } });
                    }
                    break;
                }
                case SyncMessageType.FILE_RECEIVE_ACK: {
                    const { folderId, fileName } = message.payload;
                    console.log(`Peer ${peerId} acknowledged receipt of ${fileName}`);
                    updateFileStatus(folderId, fileName, FileSyncStatus.Synced);

                    const folder = folders.find(f => f.id === folderId);
                    if(folder && folder.files.every(f => f.status === FileSyncStatus.Synced)) {
                        updateFolder(folderId, {status: SyncStatus.Synced});
                    }
                    break;
                }
              }
            } else if (event.data instanceof ArrayBuffer) {
              let activeStreamKey: string | undefined;
              for (const key in fileWriteStreams.current) {
                  if (key.startsWith(peerId)) {
                      activeStreamKey = key;
                      break;
                  }
              }

              if (activeStreamKey) {
                  const writable = fileWriteStreams.current[activeStreamKey];
                  const progress = fileReceiveProgress.current[activeStreamKey];
                  const [, folderId, fileName] = activeStreamKey.split(':');
                  const folder = folders.find(f => f.id === folderId);
                  if (folder?.status === SyncStatus.Paused) return;

                  try {
                      await writable.write(event.data);
                      progress.receivedSize += event.data.byteLength;
                      updateSyncProgress(folderId, fileName, { totalSize: progress.totalSize, transferredSize: progress.receivedSize });
                  } catch (e) {
                      console.error(`Error writing chunk to file ${fileName}:`, e);
                      updateFileStatus(folderId, fileName, FileSyncStatus.Error);
                      await writable.close();
                      delete fileWriteStreams.current[activeStreamKey];
                      delete fileReceiveProgress.current[activeStreamKey];
                  }
              }
            }
          };
      },
      onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => {
          // No-op for manual signaling
      }
  };

  const handleStartConnectPeer = async (folderId: string) => {
    const peerId = `peer_${Date.now()}`;
    setConnectingPeerId(peerId);
    try {
      const offer = await WebRTCManager.createOffer(peerId, webrtcCallbacks);
      const newPeer: Peer = { id: peerId, name: `Устройство-${peerId.slice(-4)}`, connectionStatus: PeerConnectionStatus.Connecting };
      updateFolder(folderId, { peers: [...folders.find(f => f.id === folderId)!.peers, newPeer] });
      setOfferToConnect(offer);
      setIsConnectPeerModalOpen(true);
    } catch (error) { console.error("Failed to create offer:", error); }
  };

  const handleAnswerSubmit = async (answerStr: string) => {
    if (!connectingPeerId) return;
    try {
        const answer = JSON.parse(answerStr) as RTCSessionDescriptionInit;
        await WebRTCManager.setRemoteAnswer(connectingPeerId, answer);
        setIsConnectPeerModalOpen(false);
        setOfferToConnect(null);
        setConnectingPeerId(null);
    } catch (error) { console.error("Failed to set remote answer:", error); }
  };

  const handleOfferScanned = async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
      const peerId = `peer_${Date.now()}`;
      try {
        const answer = await WebRTCManager.createAnswer(peerId, offer, webrtcCallbacks);
        return answer;
      } catch (error) {
          console.error("Failed to create answer:", error);
          return null;
      }
  };

  const handleAddFolder = async (newFolder: Folder) => {
     // When adding a new folder, all its files are considered "synced" locally
    // but will be "NeedsUpload" once connected to a peer with an empty folder.
    const filesWithStatus: FileData[] = newFolder.files.map(f => ({ ...f, status: FileSyncStatus.Synced }));
    const folderWithFileStatus = { ...newFolder, files: filesWithStatus };

    setFolders(prev => [...prev, folderWithFileStatus]);
    setSelectedFolderId(newFolder.id);
    setIsInstructionsVisible(false);
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    updateFolder(folderId, { name: newName });
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => {
        const newFolders = prev.filter(f => f.id !== folderId);
        if (newFolders.length === 0) {
            setIsInstructionsVisible(true);
        }
        return newFolders;
    });
    if (selectedFolderId === folderId) {
        setSelectedFolderId(folders.length > 1 ? folders.find(f => f.id !== folderId)!.id : null);
    }
    setFolderToDelete(null); // Close modal
  };

  const handleReGrantPermission = async (folderId: string) => {
    try {
        const folderToUpdate = folders.find(f => f.id === folderId);
        if (!folderToUpdate) return;
        
        const newHandle = await window.showDirectoryPicker();
        if(newHandle.name !== folderToUpdate.name && folderToUpdate.path !== `local\\${newHandle.name}`) {
            alert("Вы выбрали другую папку. Пожалуйста, выберите папку с именем: " + folderToUpdate.name);
            return;
        }

        const files = await getFilesFromHandle(newHandle);
        const filesWithStatus = files.map(f => ({...f, status: FileSyncStatus.Synced}));
        const newStatus = folderToUpdate.status === SyncStatus.Paused ? SyncStatus.Paused : SyncStatus.Synced;
        updateFolder(folderId, { handle: newHandle, files: filesWithStatus, status: newStatus });

        // Trigger sync with existing peers if not paused
        if (newStatus !== SyncStatus.Paused) {
            for (const peer of folderToUpdate.peers) {
                if (peer.connectionStatus === PeerConnectionStatus.Connected) {
                    WebRTCManager.sendMessage(peer.id, {
                        type: SyncMessageType.FILE_LIST,
                        payload: {
                            folderId: folderId,
                            folderName: newHandle.name,
                            files: filesWithStatus,
                        }
                    });
                }
            }
        }

    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
           console.log("Picker cancelled");
        } else {
            console.error("Error re-granting permission:", err);
            updateFolder(folderId, { status: SyncStatus.Error });
        }
    }
  };

  const handleTogglePauseFolder = (folderId: string) => {
      const folder = folders.find(f => f.id === folderId);
      if (!folder || folder.status === SyncStatus.PermissionNeeded) return;

      if (folder.status === SyncStatus.Paused) {
          // Resuming: change status and trigger a sync check with all connected peers
          updateFolder(folderId, { status: SyncStatus.Syncing });
          folder.peers.forEach(peer => {
              if (peer.connectionStatus === PeerConnectionStatus.Connected) {
                  WebRTCManager.sendMessage(peer.id, {
                      type: SyncMessageType.FILE_LIST,
                      payload: {
                          folderId: folder.id,
                          folderName: folder.name,
                          files: folder.files
                      }
                  });
              }
          });
      } else {
          // Pausing
          updateFolder(folderId, { status: SyncStatus.Paused });
      }
  };

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find(f => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);
  
  const handleCloseConnectPeerModal = () => {
      if (connectingPeerId) {
          WebRTCManager.closeConnection(connectingPeerId);
          setFolders(prev => prev.map(f => ({
              ...f,
              peers: f.peers.filter(p => p.id !== connectingPeerId)
          })))
      }
      setIsConnectPeerModalOpen(false);
      setOfferToConnect(null);
      setConnectingPeerId(null);
  }

  const handleSelectFoldersView = () => {
      setSelectedFolderId(null);
      setIsInstructionsVisible(false);
  }

  const handleSelectInstructionsView = () => {
      setSelectedFolderId(null);
      setIsInstructionsVisible(true);
  }

  return (
    <>
      <div className="h-screen w-screen flex bg-slate-900 font-sans">
        <aside className="w-96 bg-slate-800/50 flex flex-col border-r border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50">
            <h1 className="text-2xl font-bold text-white">Peer<span className="text-sky-400">Sync</span></h1>
            <p className="text-sm text-slate-400">Real P2P File Sync</p>
          </div>
          <nav className="flex-grow p-4 overflow-y-auto space-y-1">
            <button
              onClick={handleSelectFoldersView}
              className={`w-full flex items-center px-3 py-2 text-left rounded-md text-base font-medium transition-colors ${
                !selectedFolderId && !isInstructionsVisible
                  ? 'bg-sky-500/10 text-sky-300'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <FolderIcon className="w-6 h-6 mr-3" />
              Все папки
            </button>
            <button
              onClick={handleSelectInstructionsView}
              className={`w-full flex items-center px-3 py-2 text-left rounded-md text-base font-medium transition-colors ${
                isInstructionsVisible
                  ? 'bg-sky-500/10 text-sky-300'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <QuestionMarkCircleIcon className="w-6 h-6 mr-3" />
              Как пользоваться?
            </button>
          </nav>
          <div className="p-4 border-t border-slate-700/50 space-y-2 flex-shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Добавить папку
            </button>
            <button
              onClick={() => setIsJoinSyncModalOpen(true)}
              className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
              <QrcodeIcon className="w-5 h-5 mr-2" />
              Присоединиться к синхронизации
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-slate-900 overflow-y-auto">
          {isInstructionsVisible ? (
            <Instructions />
          ) : selectedFolder ? (
            <FolderDetail 
              folder={selectedFolder} 
              onReGrantPermission={handleReGrantPermission} 
              onConnectPeer={handleStartConnectPeer}
              onDelete={(id) => setFolderToDelete(folders.find(f => f.id === id) || null)}
              onRename={handleRenameFolder}
              onTogglePause={handleTogglePauseFolder}
            />
          ) : (
            <FolderList 
              folders={folders} 
              onSelectFolder={setSelectedFolderId}
              onShowInstructions={() => setIsInstructionsVisible(true)}
            />
          )}
        </main>
      </div>

      {isAddModalOpen && <AddFolderModal onClose={() => setIsAddModalOpen(false)} onAddFolder={handleAddFolder}/>}

      {isConnectPeerModalOpen && (
        <ConnectPeerModal
          offer={offerToConnect}
          onClose={handleCloseConnectPeerModal}
          onAnswerSubmit={handleAnswerSubmit}
        />
      )}
      
      {isJoinSyncModalOpen && (
        <JoinSyncModal
          onClose={() => setIsJoinSyncModalOpen(false)}
          onOfferScanned={handleOfferScanned}
        />
      )}

      {folderToDelete && (
        <DeleteFolderModal
            folder={folderToDelete}
            onClose={() => setFolderToDelete(null)}
            onConfirm={handleDeleteFolder}
        />
      )}
    </>
  );
};

export default App;
