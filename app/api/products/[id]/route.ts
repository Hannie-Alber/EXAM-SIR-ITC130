export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/productStore";
import {
  updateProductSchema,
  type UpdateProductInput,
} from "@/lib/productSchemas";

type RouteParams = Promise<{ id: string }>;

interface RouteContext {
  params: RouteParams;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const product = getProductById(id);
  if (!product) {
    return NextResponse.json(
      { error: `Product ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: product });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const json = (await req.json()) as unknown;
    const parsed = updateProductSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload: UpdateProductInput = parsed.data;
    const updated = updateProduct(id, payload);

    if (!updated) {
      return NextResponse.json(
        { error: `Product ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("Error updating product", err);
    return NextResponse.json(
      { error: "Unexpected error updating product" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const ok = deleteProduct(id);
  if (!ok) {
    return NextResponse.json(
      { error: `Product ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
