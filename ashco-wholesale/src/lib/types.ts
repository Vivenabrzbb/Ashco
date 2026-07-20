export type ProductTag = 'none' | 'clearance' | 'trending' | 'new' | 'offer';

export const TAG_LABELS: Record<Exclude<ProductTag, 'none'>, string> = {
  clearance: 'Clearance',
  trending: 'Trending',
  new: 'New in',
  offer: 'Offer',
};

export const SUGGESTED_CATEGORIES = [
  'Drinks',
  'Soft Drinks',
  'Snacks',
  'Confectionery',
  'American Products',
  'American Drinks',
  'Polish Beers',
  'Coffee',
  'Household',
  'Grocery',
  'Frozen',
  'Bakery',
  'Pet Care',
];

export const SUGGESTED_SUBCATEGORIES: Record<string, string[]> = {
  Drinks: ['Carbonates', 'Energy Drinks', 'Milkshakes', 'Sports & Isotonic', 'Water', 'Juice'],
  'Soft Drinks': ['Coca-Cola', 'Pepsi', 'Energy Drinks', 'Water', 'Juice'],
  Snacks: ['Crisps', 'Nuts', 'Popcorn'],
  Confectionery: ['Chocolate', 'Sweets', 'Gum', 'Mints', 'Bagged Sweets'],
  'American Products': ['Candy', 'Soda', 'Snacks'],
  'American Drinks': ['Soda', 'Energy Drinks', 'Juice'],
  'Polish Beers': ['Lager', 'Wheat Beer', 'Non-Alcoholic'],
  Coffee: ['Instant', 'Ground', 'Beans', 'Pods'],
  Household: ['Cleaning', 'Toiletries', 'Batteries', 'Pet Care'],
  Grocery: ['Tinned Goods', 'Sauces', 'Baking'],
  Frozen: ['Ice Cream', 'Ready Meals'],
  Bakery: ['Bread', 'Cakes', 'Pastries'],
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price_pence: number;
  image_url: string | null;
  in_stock: boolean;
  tag: ProductTag;
  category: string;
  subcategory: string | null;
  created_at: string;
};

export type CartLine = {
  product_id: string;
  name: string;
  price_pence: number;
  quantity: number;
};

export type CheckoutPayload = {
  items: { product_id: string; quantity: number }[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
};

export type Order = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  status: string;
  subtotal_pence: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_pence: number;
  quantity: number;
};

export function formatGBP(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}

export function isLikelyUkPostcode(value: string): boolean {
  const re = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
  return re.test(value.trim());
}
