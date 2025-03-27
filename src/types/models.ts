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
/**
 * Interface representing an inventory item which can be either a material, product, or both
 */
export interface Item {
  _id?: string;          // MongoDB document ID
  name: string;          // Item name
  sku: string;           // Stock keeping unit (unique identifier)
  category: string;      // Category for grouping/filtering
  trackingType: TrackingType;  // How inventory is tracked (quantity/weight)
  itemType: ItemType;    // Material, product or both
  quantity: number;      // Quantity in stock (for quantity tracking)
  weight: number;        // Weight in stock (for weight tracking)
  weightUnit: WeightUnit; // Unit of weight measurement
  price: number;         // Sale price
  priceType: PriceType;  // How the item is priced (each or by weight)
  description: string;   // Item description
  imageUrl?: string;     // URL to item image
  tags?: string[];       // Array of tags for search/filtering
  lastUpdated?: Date;    // When the item was last updated
  cost?: number;         // Purchase cost
  packInfo?: {          // For pack-based materials
    isPack: boolean;
    unitsPerPack: number;
    costPerUnit: number;
  };
  components?: ItemComponent[];      // Materials used in this product
  usedInProducts?: (string | Item)[]; // Products that use this material
}

/**
 * Represents a material component used in a product
 */
export interface ItemComponent {
  _id?: string;
  item: string | Item;  // Reference to the material item (ID or populated object)
  quantity: number;     // How many units of the material are used
  weight?: number;      // Weight of material used (for weight-based materials)
  weightUnit?: WeightUnit; // Unit of weight measurement
}

// Type guard to check if an item is populated
/**
 * Type guard to check if an item or component is populated (object vs ID string)
 * @param item The item to check
 * @returns True if the item is a populated object with a name property
 */
export function isPopulatedItem(item: string | Item | null | undefined): item is Item {
  return item !== null && item !== undefined && typeof item === 'object' && 'name' in item;
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
