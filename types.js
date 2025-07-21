export const SyncStatus = {
  Synced: 'Синхронизировано',
  Syncing: 'Синхронизация...',
  Paused: 'Пауза',
  Error: 'Ошибка',
  PermissionNeeded: 'Требуется разрешение'
};

export const FileSyncStatus = {
  Synced: 'Synced',
  NeedsUpload: 'NeedsUpload',
  NeedsDownload: 'NeedsDownload',
  SyncingUpload: 'SyncingUpload',
  SyncingDownload: 'SyncingDownload',
  Error: 'Error',
};

export const PeerConnectionStatus = {
    Connecting: 'Подключение...',
    Connected: 'Подключено',
    Disconnected: 'Отключено',
    Failed: 'Ошибка соединения',
};

export const SyncMessageType = {
    FILE_LIST: 'FILE_LIST',
    REQUEST_FILE: 'REQUEST_FILE',
    START_FILE_TRANSFER: 'START_FILE_TRANSFER',
    FILE_TRANSFER_COMPLETE: 'FILE_TRANSFER_COMPLETE',
    FILE_RECEIVE_ACK: 'FILE_RECEIVE_ACK',
};