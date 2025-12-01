import fs from "fs";
import path from "path";
import {
  ProductID,
  ProductListItem,
  ShopifyProduct,
  ShopifyVariant,
  ShopifyOption,
  ShopifyImage,
} from "./shopify";
import { randomUUID } from "crypto";

const DATA_FILE = path.join(process.cwd(), "data", "products.json");

type NewProductInput = {
  title: string;
  body_html?: string;
  vendor: string;
  product_type?: string;
  tags?: string[];
  options?: ShopifyOption[];
  images?: ShopifyImage[];
  variants: Omit<ShopifyVariant, "id">[];
  published_at?: string | null;
};

type UpdateProductInput = Partial<NewProductInput>;

function ensureDataFileExists() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const seed = createSeedProducts();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

function readProductsFromFile(): ShopifyProduct[] {
  ensureDataFileExists();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as ShopifyProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProductsToFile(products: ShopifyProduct[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf8");
}

function createSeedProducts(): ShopifyProduct[] {
  const now = new Date().toISOString();

  const base: Omit<ShopifyProduct, "id" | "variants"> = {
    title: "Sample T-Shirt",
    body_html:
      "<p>A comfy cotton t-shirt inspired by Shopify.</p><p>Perfect for devs.</p>",
    vendor: "Dev Merch Co.",
    product_type: "Shirt",
    tags: ["tshirt", "dev", "cotton"],
    options: [
      {
        id: "opt-size",
        name: "Size",
        values: ["S", "M", "L"],
      },
      {
        id: "opt-color",
        name: "Color",
        values: ["Black", "White"],
      },
    ],
    images: [
      {
        id: "img-1",
        src: "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg",
        alt: "Black t-shirt on hanger",
      },
    ],
    created_at: now,
    updated_at: now,
    published_at: now,
  };

  const variants: ShopifyVariant[] = [
    {
      id: "var-1",
      title: "Black / M",
      price: 19.99,
      inventory_quantity: 10,
      sku: "TSHIRT-BLK-M",
      option_values: ["M", "Black"],
    },
    {
      id: "var-2",
      title: "White / M",
      price: 21.99,
      inventory_quantity: 5,
      sku: "TSHIRT-WHT-M",
      option_values: ["M", "White"],
    },
  ];

  return [
    {
      ...base,
      id: "prod-1",
      variants,
    },
  ];
}

export function listProducts(): ProductListItem[] {
  const products = readProductsFromFile();
  return products.map((p) => ({
    ...p,
    min_price:
      p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.price)) : 0,
  }));
}

export function getProductById(id: ProductID): ShopifyProduct | undefined {
  const products = readProductsFromFile();
  return products.find((p) => p.id === id);
}

export function createProduct(input: NewProductInput): ShopifyProduct {
  const products = readProductsFromFile();
  const now = new Date().toISOString();
  const id = randomUUID();

  const variants: ShopifyVariant[] = input.variants.map((v) => ({
    ...v,
    id: randomUUID(),
  }));

  const product: ShopifyProduct = {
    id,
    title: input.title,
    body_html: input.body_html,
    vendor: input.vendor,
    product_type: input.product_type,
    tags: input.tags,
    options: input.options,
    images: input.images,
    variants,
    created_at: now,
    updated_at: now,
    published_at: input.published_at ?? now,
  };

  products.push(product);
  writeProductsToFile(products);
  return product;
}

export function updateProduct(
  id: ProductID,
  input: UpdateProductInput
): ShopifyProduct | undefined {
  const products = readProductsFromFile();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;

  const existing = products[idx];

  const updated: ShopifyProduct = {
    ...existing,
    ...input,
    variants: input.variants
      ? input.variants.map((v, i) => ({
          ...v,
          id: existing.variants[i]?.id ?? randomUUID(),
        }))
      : existing.variants,
    updated_at: new Date().toISOString(),
  };

  products[idx] = updated;
  writeProductsToFile(products);
  return updated;
}

export function deleteProduct(id: ProductID): boolean {
  const products = readProductsFromFile();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  writeProductsToFile(products);
  return true;
}
