// Define weight units type
export type WeightUnit = 'oz' | 'lb' | 'g' | 'kg';

// Define length units type
export type LengthUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft' | 'yd';

// Define area units type
export type AreaUnit = 'sqft' | 'sqm' | 'sqyd' | 'acre' | 'ha';

// Define volume units type
export type VolumeUnit = 'ml' | 'l' | 'gal' | 'floz' | 'cu_ft' | 'cu_m';

// Define tracking types
export type TrackingType = 'quantity' | 'weight' | 'length' | 'area' | 'volume';

// Define item types
export type ItemType = 'material' | 'product' | 'both';

// Define price types
export type PriceType = 'each' | 'per_weight_unit' | 'per_length_unit' | 'per_area_unit' | 'per_volume_unit';

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
  trackingType: TrackingType;  // How inventory is tracked
  itemType: ItemType;    // Material, product or both
  quantity: number;      // Quantity in stock (for quantity tracking)
  weight: number;        // Weight in stock (for weight tracking)
  weightUnit: WeightUnit; // Unit of weight measurement
  length: number;        // Length in stock
  lengthUnit: LengthUnit; // Unit of length measurement
  area: number;          // Area in stock
  areaUnit: AreaUnit;    // Unit of area measurement
  volume: number;        // Volume in stock
  volumeUnit: VolumeUnit; // Unit of volume measurement
  sellByMeasurement: TrackingType | null; // Default measurement for sales
  price: number;         // Sale price
  priceType: PriceType;  // How the item is priced
  packageSize?: {        // Package information
    value: number;       // Package size value
    unit: string | null; // Package size unit
    quantityPerPackage: number; // Quantity per package
  };
  description: string;   // Item description
  imageUrl?: string;     // URL to item image
  tags?: string[];       // Array of tags for search/filtering
  lastUpdated?: Date;    // When the item was last updated
  cost?: number;         // Purchase cost
  packInfo?: {           // For pack-based materials
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
  item: string | Item;     // Reference to the material item
  quantity: number;        // Quantity of the material used
  weight?: number;         // Weight of material used
  weightUnit?: WeightUnit; // Unit of weight measurement
  length?: number;         // Length of material used
  lengthUnit?: LengthUnit; // Unit of length measurement
  area?: number;           // Area of material used
  areaUnit?: AreaUnit;     // Unit of area measurement
  volume?: number;         // Volume of material used
  volumeUnit?: VolumeUnit; // Unit of volume measurement
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
  item: string | Item;       // Item ID or populated item
  name?: string;             // Name of the item (needed for display)
  quantity: number;          // Quantity sold
  weight: number;            // Weight sold
  weightUnit?: WeightUnit;   // Unit of weight measurement
  length: number;            // Length sold
  lengthUnit?: LengthUnit;   // Unit of length measurement
  area: number;              // Area sold
  areaUnit?: AreaUnit;       // Unit of area measurement
  volume: number;            // Volume sold
  volumeUnit?: VolumeUnit;   // Unit of volume measurement
  priceAtSale: number;       // Price at time of sale
  soldBy: TrackingType;      // How this item was sold (by quantity, weight, etc.)
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
  item: string | Item;       // Item ID or populated item
  quantity: number;          // Quantity purchased
  weight: number;            // Weight purchased
  weightUnit?: WeightUnit;   // Unit of weight measurement
  length: number;            // Length purchased
  lengthUnit?: LengthUnit;   // Unit of length measurement
  area: number;              // Area purchased
  areaUnit?: AreaUnit;       // Unit of area measurement
  volume: number;            // Volume purchased
  volumeUnit?: VolumeUnit;   // Unit of volume measurement
  costPerUnit: number;       // Cost per unit
  totalCost: number;         // Total cost
  purchasedBy: TrackingType; // How this item was purchased
  packageInfo?: {
    isPackage: boolean;
    packageSize: {
      value: number;
      unit: string;
    };
    quantityPerPackage: number;
  };
}

export interface Purchase {
  _id?: string;
  supplier: Supplier;
  items: PurchaseItem[];
  invoiceNumber?: string;
  purchaseDate?: Date;
  subtotal: number;
  discountAmount?: number;
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

interface MeasurementBreakdownItem {
  count: number;
  total: number;
}

export interface SalesTrendItem {
  date: string;
  totalSales: number;
  totalRevenue: number;
  measurementBreakdown?: {
    quantity?: MeasurementBreakdownItem;
    weight?: MeasurementBreakdownItem;
    length?: MeasurementBreakdownItem;
    area?: MeasurementBreakdownItem;
    volume?: MeasurementBreakdownItem;
  };
  quantityTotal: number;
  weightTotal: number;
  lengthTotal: number;
  areaTotal: number;
  volumeTotal: number;
}

// Purchase trend data structure
export interface PurchaseTrendItem {
  date: string;
  count: number;
  total: number;
  measurementBreakdown?: {
    quantity?: { count: number; total: number };
    weight?: { count: number; total: number };
    length?: { count: number; total: number };
    area?: { count: number; total: number };
    volume?: { count: number; total: number };
  };
  // Additional processed fields added by the hook
  quantityTotal?: number;
  weightTotal?: number;
  lengthTotal?: number;
  areaTotal?: number;
  volumeTotal?: number;
}
