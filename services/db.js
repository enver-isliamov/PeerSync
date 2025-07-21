import { openDB } from 'idb';

const DB_NAME = 'PeerSyncDB';
const DB_VERSION = 1;
const FOLDERS_STORE_NAME = 'folders';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(FOLDERS_STORE_NAME)) {
      db.createObjectStore(FOLDERS_STORE_NAME, { keyPath: 'id' });
    }
  },
});

export const saveFolders = async (folders) => {
  const db = await dbPromise;
  const tx = db.transaction(FOLDERS_STORE_NAME, 'readwrite');
  await tx.objectStore(FOLDERS_STORE_NAME).clear(); // Clear old data first
  const storePromises = folders.map(folder => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { handle, ...serializableFolder } = folder;
    return tx.objectStore(FOLDERS_STORE_NAME).put(serializableFolder);
  });
  await Promise.all([...storePromises, tx.done]);
};

export const getFolders = async () => {
  const db = await dbPromise;
  const serializableFolders = await db.getAll(FOLDERS_STORE_NAME);
  // Return folders without handles. Handles must be re-acquired.
  return serializableFolders.map(f => ({ ...f, peers: [], syncProgress: {} }));
};