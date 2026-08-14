import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET all requests (Students see their own, Admin/Professor see all)
export async function GET() {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let query = `
      SELECT r.id, r.user_id, r.request_type, r.title, r.description, r.status, r.response_reason, r.created_at, r.updated_at,
             u.name as user_name, u.nickname as user_nickname
      FROM requests r
      JOIN users u ON r.user_id = u.id
    `;
    const values: any[] = [];

    // If student, filter by their user_id
    if (session.role !== 'ADMIN' && session.role !== 'PROFESSOR') {
      query += ` WHERE r.user_id = $1`;
      values.push(session.id);
    }

    query += ` ORDER BY r.created_at DESC`;

    const res = await pool.query(query, values);
    return NextResponse.json({ requests: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create request (Student or any user)
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Você precisa estar logado para enviar um pedido.' }, { status: 401 });
    }

    const body = await req.json();
    const { request_type, title, description } = body;

    if (!request_type || !title || !description) {
      return NextResponse.json({ error: 'Tipo, título e descrição são obrigatórios.' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO requests (user_id, request_type, title, description, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING *`,
      [session.id, request_type, title, description]
    );

    return NextResponse.json({ success: true, request: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
