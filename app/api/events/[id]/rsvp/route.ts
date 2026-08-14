import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Você precisa estar logado para responder ao evento.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['VOU', 'NAO_SEI', 'NAO_VOU'].includes(status)) {
      return NextResponse.json({ error: 'Opção de resposta inválida.' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
      [id, session.id, status]
    );

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
