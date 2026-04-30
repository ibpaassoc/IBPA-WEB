import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const res = await fetch(`${backendUrl}/api/orders/verify/${token}`);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      const text = await res.text();
      return NextResponse.json({ error: text || "Backend Error" }, { status: res.status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
