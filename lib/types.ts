export type OrderStatus = "awaiting_payment" | "paid" | "ordered" | "delivered" | "cancelled";

export type FormState = {
  error?: string;
  ok?: string;
  values?: Record<string, string>;
};

export type Address = {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country?: string | null;
};

export type Company = Address & {
  id: number;
  name: string;
  tagline: string | null;
  legal_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  vat_percent: number;
  currency: string;
  email: string | null;
  phone: string | null;
  bank_details: string | null;
  logo_path: string | null;
};

export type Profile = Address & {
  id: string;
  email: string;
  role: "customer" | "admin";
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

export type Product = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  cost_price: number;
  price: number;
  stock_qty: number;
  image_path: string | null;
  is_active: boolean;
};

export type StoreProduct = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  sale_price: number;
  discount_percent: number;
  stock_qty: number;
  image_path: string | null;
};

export type ActivePromotion = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  starts_at: string;
  ends_at: string | null;
  product_ids: string[];
};

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  promotion_items: { product_id: string; products: { name: string } | null }[];
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  unit_price: number;
  discount_percent: number;
  unit_price_after_discount: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: number;
  customer_id: string;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  vat_percent: number;
  vat_amount: number;
  total: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  invoice_number: string | null;
  company_snapshot: Partial<Company> | null;
  paid_at: string | null;
  ordered_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };
