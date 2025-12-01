import { z } from "zod";

export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().optional(),
  title: z.string().optional(),
  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be greater than 0"),
  compare_at_price: z.number().nullable().optional(),
  inventory_quantity: z.number().int().nonnegative().optional(),
  requires_shipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
  option_values: z.array(z.string()).optional(),
});

export const optionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Option name is required"),
  values: z.array(z.string()).nonempty("Option must have at least one value"),
});

export const imageSchema = z.object({
  id: z.string().optional(),
  src: z.string().url("Image must be a valid URL"),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body_html: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .optional(),
  vendor: z.string().min(1, "Vendor is required"),
  product_type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  options: z.array(optionSchema).optional(),
  images: z.array(imageSchema).optional(),
  variants: z.array(variantSchema).nonempty("At least one variant is required"),
  published_at: z.string().datetime().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
