import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Certificate card requests are no longer supported in this service.' },
    { status: 410 },
  );
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    { error: 'Certificate card requests are no longer supported in this service.' },
    { status: 410 },
  );
}
