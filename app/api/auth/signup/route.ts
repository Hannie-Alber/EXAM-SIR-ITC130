export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/userStore";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid signup data",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    try {
      const user = await createUser(name, email, password);
      return NextResponse.json(
        {
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        },
        { status: 201 }
      );
    } catch (err: any) {
      if (err?.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
