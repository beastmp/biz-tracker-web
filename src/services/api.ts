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
  imageUrl?: string; // New field for storing image URL
  tags?: string[]; // New field for storing tags
  lastUpdated?: Date;
}

// Define sale item interface
export interface SaleItem {
  item: string | Item; // ID or full Item object when populated
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

// Create API instance
const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Items API methods
export const itemsApi = {
  getAll: async (): Promise<Item[]> => {
    const response = await api.get('/api/items');
    return response.data;
  },
  getById: async (id: string): Promise<Item> => {
    const response = await api.get(`/api/items/${id}`);
    return response.data;
  },
  create: async (item: Item | FormData): Promise<Item> => {
    const response = await fetch(`${config.API_URL}/api/items`, {
      method: 'POST',
      body: item instanceof FormData ? item : JSON.stringify(item),
      headers: item instanceof FormData ? {} : {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to create item');
    return await response.json();
  },
  update: async (id: string, item: Partial<Item> | FormData): Promise<Item> => {
    const response = await fetch(`${config.API_URL}/api/items/${id}`, {
      method: 'PATCH',
      body: item instanceof FormData ? item : JSON.stringify(item),
      headers: item instanceof FormData ? {} : {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to update item');
    return await response.json();
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/items/${id}`);
  },
};

// Sales API methods
export const salesApi = {
  getAll: async (): Promise<Sale[]> => {
    const response = await api.get('/api/sales');
    return response.data;
  },
  getById: async (id: string): Promise<Sale> => {
    const response = await api.get(`/api/sales/${id}`);
    return response.data;
  },
  create: async (sale: Sale): Promise<Sale> => {
    const response = await api.post('/api/sales', sale);
    return response.data;
  },
  update: async (id: string, sale: Partial<Sale>): Promise<Sale> => {
    const response = await api.patch(`/api/sales/${id}`, sale);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/sales/${id}`);
  },
  getReport: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/api/sales/reports/by-date?${params.toString()}`);
    return response.data;
  }
};

// Add purchases API
export const purchasesApi = {
  getAll: async (): Promise<Purchase[]> => {
    const response = await api.get('/api/purchases');
    return response.data;
  },
  getById: async (id: string): Promise<Purchase> => {
    const response = await api.get(`/api/purchases/${id}`);
    return response.data;
  },
  create: async (purchase: Purchase): Promise<Purchase> => {
    const response = await api.post('/api/purchases', purchase);
    return response.data;
  },
  update: async (id: string, purchase: Partial<Purchase>): Promise<Purchase> => {
    const response = await api.patch(`/api/purchases/${id}`, purchase);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/purchases/${id}`);
  },
  getReport: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/api/purchases/reports/by-date?${params.toString()}`);
    return response.data;
  }
};