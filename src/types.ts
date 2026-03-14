export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: 'pcs' | 'pack';
  imageUrl?: string;
  imagePath?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: any;
  updatedAt: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  type: 'online' | 'pos';
  deliveryMethod?: 'delivery' | 'pickup';
  deliveryAddress?: string;
  preferredDate?: string;
  preferredTime?: string;
  confirmedDate?: string;
  confirmedTime?: string;
  sellerNotes?: string;
  buyerNotes?: string;
  deliveryFee?: number;
  customerName?: string;
  timestamp: any;
}

export interface StoreSettings {
  storeName: string;
  adminEmail: string;
  phone?: string;
  address?: string;
  messengerLink?: string;
  businessHours?: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  isHoliday?: boolean;
  holidayMessage?: string;
}
