import { NextResponse } from 'next/server';
import { requireDb, cardRequests } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = requireDb();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { status } = body as { status: any };

    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    let updateData: any = { status };

    if (status === 'accepted') {
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(1000 + Math.random() * 9000);
      updateData.certificateNumber = `CERT-${date}-${random}`;
    }

    const [updatedRequest] = await db
      .update(cardRequests)
      .set(updateData)
      .where(eq(cardRequests.id, id))
      .returning();

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRequest, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
