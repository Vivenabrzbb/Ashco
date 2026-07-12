export type ProductTag = 'none' | 'clearance' | 'trending' | 'new' | 'offer';

export const TAG_LABELS: Record<Exclude<ProductTag, 'none'>, string> = {
  clearance: 'Clearance',
  trending: 'Trending',
  new: 'New in',
  offer: 'Offer',
};

// Suggested categories shown in the admin dropdown/autocomplete — not a hard limit,
// you can type any category name and it'll be remembered.
export const SUGGESTED_CATEGORIES = [
  'Soft Drinks',
  'Snacks',
  'Confectionery',
  'Household',
  'Grocery',
  'Frozen',
];

export type Product = {
  id: string;
  name: string;
  description: string;
  price_pence: number;
  image_url: string | null;
  in_stock: boolean;
  tag: ProductTag;
  category: string;
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

// Very light UK postcode sanity check (not exhaustive, just catches typos)
export function isLikelyUkPostcode(value: string): boolean {
  const re = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
  return re.test(value.trim());
}
