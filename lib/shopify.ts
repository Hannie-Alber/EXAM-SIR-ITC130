export type ProductID = string;

export interface ShopifyImage {
  id?: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ShopifyOption {
  id?: string;
  name: string;
  values: string[];
}

export interface ShopifyVariant {
  id?: string;
  sku?: string;
  title?: string;
  price: number;
  compare_at_price?: number | null;
  inventory_quantity?: number;
  requires_shipping?: boolean;
  taxable?: boolean;
  option_values?: string[];
}

export interface ShopifyProduct {
  id: ProductID;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];

  options?: ShopifyOption[];
  variants: ShopifyVariant[];
  images?: ShopifyImage[];

  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface ProductListItem extends ShopifyProduct {
  min_price: number;
}
