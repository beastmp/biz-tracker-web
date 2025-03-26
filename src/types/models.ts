// Define weight units type
export type WeightUnit = 'oz' | 'lb' | 'g' | 'kg';

// Define tracking types
export type TrackingType = 'quantity' | 'weight';

// Define item types
export type ItemType = 'material' | 'product' | 'both';

// Define price types
export type PriceType = 'each' | 'per_weight_unit';

// Define payment methods
export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'check' | 'bank_transfer' | 'other';

// Define sale status
export type SaleStatus = 'completed' | 'refunded' | 'partially_refunded';

// Define purchase status
export type PurchaseStatus = 'pending' | 'received' | 'partially_received' | 'cancelled';

// Define item interface
export interface Item {
  _id?: string;
  name: string;
  sku: string;
  category: string;
  trackingType: TrackingType;
  itemType: ItemType;
  quantity: number;
  weight: number;
  weightUnit: WeightUnit;
  price: number;
  priceType: PriceType;
  description: string;
  imageUrl?: string;
  tags?: string[];
  lastUpdated?: Date;
  cost?: number;
  packInfo?: {
    isPack: boolean;
    unitsPerPack: number;
    costPerUnit: number;
  };
  components?: ItemComponent[];
  usedInProducts?: (string | Item)[];
}

export interface ItemComponent {
  item: string | Item;
  quantity: number;
  weight?: number;
  weightUnit?: WeightUnit;
}

// Define sale item interface
export interface SaleItem {
  item: string | Item;
  quantity: number;
  weight: number;
  weightUnit?: WeightUnit;
  priceAtSale: number;
}

// Define supplier interface
export interface Supplier {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
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
  paymentMethod: PaymentMethod;
  notes?: string;
  status: SaleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseItem {
  item: string | Item;
  quantity: number;
  weight?: number;
  weightUnit?: WeightUnit;
  costPerUnit: number;
  totalCost: number;
}

export interface Purchase {
  _id?: string;
  supplier: Supplier;
  items: PurchaseItem[];
  invoiceNumber?: string;
  purchaseDate?: Date;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  shippingCost?: number;
  total: number;
  notes?: string;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Report interfaces
export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  sales: Sale[];
  topProductsByQuantity: [string, number][];
  topProductsByWeight: [string, { weight: number, unit: string }][];
}

export interface PurchasesReport {
  totalPurchases: number;
  totalCost: number;
  averagePurchaseValue: number;
  purchases: Purchase[];
}
