export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { listProducts, createProduct } from "@/lib/productStore";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/lib/productSchemas";

export async function GET() {
  const data = listProducts();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as unknown;
    const parsed = createProductSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload: CreateProductInput = parsed.data;
    const product = createProduct(payload);

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (err) {
    console.error("Error creating product", err);
    return NextResponse.json(
      { error: "Unexpected error creating product" },
      { status: 500 }
    );
  }
}
