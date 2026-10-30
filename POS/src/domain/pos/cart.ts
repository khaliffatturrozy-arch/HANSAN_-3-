export interface MenuItem {
  id: string;
  name: string;
  price: number; // whole currency units (demo)
  station: "kitchen" | "bar";
}

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  station: "kitchen" | "bar";
}

export function addItem(cart: CartItem[], item: MenuItem, qty = 1): CartItem[] {
  const existing = cart.find((c) => c.itemId === item.id);
  if (existing) {
    return cart.map((c) => (c.itemId === item.id ? { ...c, qty: c.qty + qty } : c));
  }
  return [...cart, { itemId: item.id, name: item.name, price: item.price, qty, station: item.station }];
}

export function updateQty(cart: CartItem[], itemId: string, qty: number): CartItem[] {
  if (qty <= 0) return cart.filter((c) => c.itemId !== itemId);
  return cart.map((c) => (c.itemId === itemId ? { ...c, qty } : c));
}

export function removeItem(cart: CartItem[], itemId: string): CartItem[] {
  return cart.filter((c) => c.itemId !== itemId);
}

export function computeTotals(cart: CartItem[], taxPercent = 0) {
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax = Math.round((subtotal * taxPercent) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total, itemCount: cart.reduce((s, c) => s + c.qty, 0) };
}
