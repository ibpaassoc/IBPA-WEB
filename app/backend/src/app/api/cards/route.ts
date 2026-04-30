import { NextResponse } from 'next/server';
import { requireDb, cardRequests } from '@/lib/db';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const db = requireDb();
    const requests = await db.select().from(cardRequests).orderBy(desc(cardRequests.createdAt));
    return NextResponse.json(requests, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
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
  try {
    const db = requireDb();
    const body = await req.json();
    const { cardName, userName } = body;

    if (!cardName || !userName) {
      return NextResponse.json(
        { error: 'cardName and userName are required' },
        { status: 400 }
      );
    }

    const [newRequest] = await db.insert(cardRequests).values({
      cardName,
      userName,
    }).returning();

    return NextResponse.json(newRequest, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}
