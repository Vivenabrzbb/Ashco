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

// Optional suggested sub-categories per category, shown in admin once a category is picked.
// Purely a convenience list — any subcategory text is allowed, this just speeds up entry.
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
