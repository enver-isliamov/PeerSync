export enum SyncStatus {
  Synced = 'Синхронизировано',
  Syncing = 'Синхронизация...',
  Paused = 'Пауза',
  Error = 'Ошибка',
  PermissionNeeded = 'Требуется разрешение'
}

// New enum for individual file status
export enum FileSyncStatus {
  Synced = 'Synced',
  NeedsUpload = 'NeedsUpload',
  NeedsDownload = 'NeedsDownload',
  SyncingUpload = 'SyncingUpload',
  SyncingDownload = 'SyncingDownload',
  Error = 'Error',
}

export interface FileData {
  name: string;
  size: number; // in bytes
  lastModified: number; // timestamp
  status: FileSyncStatus; // Status for each file
}

export enum PeerConnectionStatus {
    Connecting = 'Подключение...',
    Connected = 'Подключено',
    Disconnected = 'Отключено',
    Failed = 'Ошибка соединения',
}

export type SignalingData = {
    type: 'offer' | 'answer' | 'candidate';
    sdp?: string;
    candidate?: RTCIceCandidateInit | RTCIceCandidate;
};

export interface Peer {
  id: string; // This will be the unique ID of the peer connection
  name: string; // e.g., 'Peer's Browser'
  connectionStatus: PeerConnectionStatus;
}

export interface SyncProgress {
    totalSize: number;
    transferredSize: number;
}

export interface Folder {
  id: string;
  name:string;
  path: string; // For display purposes, the actual access is through the handle
  status: SyncStatus;
  files: FileData[];
  peers: Peer[];
  syncProgress?: Record<string, SyncProgress>; // key is filename
  shareKey?: string;
  // The handle to the actual directory on the user's filesystem.
  // This is not serializable and must be handled carefully.
  handle?: FileSystemDirectoryHandle;
}

// --- Sync Protocol Definitions ---
export enum SyncMessageType {
    FILE_LIST = 'FILE_LIST',
    REQUEST_FILE = 'REQUEST_FILE',
    START_FILE_TRANSFER = 'START_FILE_TRANSFER',
    FILE_TRANSFER_COMPLETE = 'FILE_TRANSFER_COMPLETE',
    FILE_RECEIVE_ACK = 'FILE_RECEIVE_ACK',
}

export interface FileListPayload {
    folderId: string;
    folderName: string;
    // Sending files without status, as status is local to each peer
    files: Omit<FileData, 'status'>[];
}

export interface RequestFilePayload {
    folderId: string;
    fileName: string;
}

export interface StartFileTransferPayload {
    folderId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
}

export type SyncMessage =
    | { type: SyncMessageType.FILE_LIST; payload: FileListPayload }
    | { type: SyncMessageType.REQUEST_FILE; payload: RequestFilePayload }
    | { type: SyncMessageType.START_FILE_TRANSFER; payload: StartFileTransferPayload }
    | { type: SyncMessageType.FILE_TRANSFER_COMPLETE; payload: RequestFilePayload } // Re-used payload
    | { type: SyncMessageType.FILE_RECEIVE_ACK; payload: RequestFilePayload }; // Re-used payload


// START: Type definitions for File System Access API
// These interfaces are for APIs that may not be in all TypeScript DOM lib versions.
// This avoids compile errors without needing to change tsconfig.json.
// By declaring them here, they become globally available in the project.
declare global {
  // These are part of the File System Access API.
  // We declare them here to ensure they are available for TypeScript.
  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
    queryPermission(options?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission(options?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
    close(): Promise<void>;
  }

  interface Window {
    showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
  }
}
// END: Type definitions