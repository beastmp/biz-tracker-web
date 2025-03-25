/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { config } from '../config/env';

// Define item interface
export interface Item {
  _id?: string;
  name: string;
  sku: string;
  category: string;
  trackingType: 'quantity' | 'weight';
  quantity: number;
  weight: number;
  weightUnit: 'oz' | 'lb' | 'g' | 'kg';
  price: number;
  priceType: 'each' | 'per_weight_unit';
  description: string;
  imageUrl?: string;
  tags?: string[];
  lastUpdated?: Date;
}

// Define sale item interface
export interface SaleItem {
  item: string | Item;
  quantity: number;
  weight: number;
  weightUnit?: 'oz' | 'lb' | 'g' | 'kg';
  priceAtSale: number;
}

// Define sale interface
export interface Sale {
  _id?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'check' | 'other';
  notes?: string;
  status: 'completed' | 'refunded' | 'partially_refunded';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseItem {
  item: string | Item;
  quantity: number;
  weight?: number;
  weightUnit?: 'oz' | 'lb' | 'g' | 'kg';
  costPerUnit: number;
  totalCost: number;
}

export interface Purchase {
  _id?: string;
  supplier: {
    name?: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  items: PurchaseItem[];
  invoiceNumber?: string;
  purchaseDate?: Date;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  shippingCost?: number;
  total: number;
  notes?: string;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'check' | 'bank_transfer' | 'other';
  status: 'pending' | 'received' | 'partially_received' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

// Create API instance with CORS credentials
const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable sending cookies with requests
});

// Items API methods - standardized to use Axios
export const itemsApi = {
  getAll: async (): Promise<Item[]> => {
    try {
      const response = await api.get('/api/items');
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Item> => {
    try {
      const response = await api.get(`/api/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw error;
    }
  },

  create: async (item: Item | FormData): Promise<Item> => {
    try {
      let response;
      if (item instanceof FormData) {
        response = await api.post('/api/items', item, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await api.post('/api/items', item);
      }
      return response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  update: async (id: string, item: Partial<Item> | FormData): Promise<Item> => {
    try {
      let response;
      if (item instanceof FormData) {
        response = await api.patch(`/api/items/${id}`, item, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await api.patch(`/api/items/${id}`, item);
      }
      return response.data;
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/items/${id}`);
    } catch (error) {
      console.error(`Error deleting item ${id}:`, error);
      throw error;
    }
  },

  getNextSku: async (): Promise<string> => {
    try {
      const response = await api.get('/api/items/nextsku');
      return response.data.nextSku;
    } catch (error) {
      console.error('Error in getNextSku:', error);
      // Return a default SKU as fallback
      return "0000000001";
    }
  },

  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get('/api/items/categories');
      return response.data;
    } catch (error) {
      console.error('Error in getCategories:', error);
      // Return empty array as fallback
      return [];
    }
  },

  getTags: async (): Promise<string[]> => {
    try {
      const response = await api.get('/api/items/tags');
      return response.data;
    } catch (error) {
      console.error('Error in getTags:', error);
      // Return empty array as fallback
      return [];
    }
  }
};

// Sales API methods
export const salesApi = {
  getAll: async (): Promise<Sale[]> => {
    try {
      const response = await api.get('/api/sales');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Sale> => {
    try {
      const response = await api.get(`/api/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      throw error;
    }
  },

  create: async (sale: Sale): Promise<Sale> => {
    try {
      const response = await api.post('/api/sales', sale);
      return response.data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  update: async (id: string, sale: Partial<Sale>): Promise<Sale> => {
    try {
      const response = await api.patch(`/api/sales/${id}`, sale);
      return response.data;
    } catch (error) {
      console.error(`Error updating sale ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/sales/${id}`);
    } catch (error) {
      console.error(`Error deleting sale ${id}:`, error);
      throw error;
    }
  },

  getReport: async (startDate?: string, endDate?: string): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/api/sales/reports/by-date?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  }
};

// Purchases API methods
export const purchasesApi = {
  getAll: async (): Promise<Purchase[]> => {
    try {
      const response = await api.get('/api/purchases');
      return response.data;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Purchase> => {
    try {
      const response = await api.get(`/api/purchases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching purchase ${id}:`, error);
      throw error;
    }
  },

  create: async (purchase: Purchase): Promise<Purchase> => {
    try {
      const response = await api.post('/api/purchases', purchase);
      return response.data;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  },

  update: async (id: string, purchase: Partial<Purchase>): Promise<Purchase> => {
    try {
      const response = await api.patch(`/api/purchases/${id}`, purchase);
      return response.data;
    } catch (error) {
      console.error(`Error updating purchase ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/purchases/${id}`);
    } catch (error) {
      console.error(`Error deleting purchase ${id}:`, error);
      throw error;
    }
  },

  getReport: async (startDate?: string, endDate?: string): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/api/purchases/reports/by-date?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching purchases report:', error);
      throw error;
    }
  }
};