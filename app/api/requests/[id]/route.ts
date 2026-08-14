import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente admin e professor podem gerenciar pedidos.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, response_reason } = body;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Status deve ser ACCEPTED ou REJECTED.' }, { status: 400 });
    }

    const res = await pool.query(
      `UPDATE requests
       SET status = $1,
           response_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, response_reason || '', id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
