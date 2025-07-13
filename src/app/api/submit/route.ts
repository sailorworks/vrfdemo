import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name, twitter } = await request.json();
  return NextResponse.json({ name, twitter }, { status: 201 });
}
