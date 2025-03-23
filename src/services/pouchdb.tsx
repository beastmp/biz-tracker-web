import PouchDB from 'pouchdb';
import { config } from '../config/env';
import { Item } from './api';

// Create local and remote databases
const localDb = new PouchDB<Item>(config.OFFLINE_DB_NAME);
const remoteDb = new PouchDB<Item>(config.SYNC_URL);

// Set up sync
export const setupSync = () => {
  localDb.sync(remoteDb, {
    live: true,
    retry: true
  }).on('change', (change) => {
    console.log('Data change detected:', change);
  }).on('error', (err) => {
    console.error('Sync error:', err);
  });
};

// Database operations
export const db = {
  async getAll(): Promise<Item[]> {
    try {
      const result = await localDb.allDocs({
        include_docs: true
      });
      return result.rows.map(row => row.doc as Item);
    } catch (error) {
      console.error('Error fetching items from PouchDB:', error);
      throw error;
    }
  },

  async get(id: string): Promise<Item> {
    try {
      return await localDb.get(id);
    } catch (error) {
      console.error(`Error fetching item ${id} from PouchDB:`, error);
      throw error;
    }
  },

  async add(item: Item): Promise<Item> {
    try {
      const response = await localDb.post(item);
      return { ...item, _id: response.id };
    } catch (error) {
      console.error('Error adding item to PouchDB:', error);
      throw error;
    }
  },

  async update(item: Item): Promise<Item> {
    if (!item._id) throw new Error('Item ID is required for update');
    
    try {
      const existingItem = await localDb.get(item._id);
      const updatedItem = { ...item, _rev: existingItem._rev };
      await localDb.put(updatedItem);
      return updatedItem;
    } catch (error) {
      console.error(`Error updating item ${item._id} in PouchDB:`, error);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const doc = await localDb.get(id);
      await localDb.remove(doc);
    } catch (error) {
      console.error(`Error removing item ${id} from PouchDB:`, error);
      throw error;
    }
  }
};

// Initialize sync on app start
setupSync();