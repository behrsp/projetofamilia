import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET chat messages
export async function GET(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    let query = `
      SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
             u.name as sender_name, u.nickname as sender_nickname, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
    `;
    const values: any[] = [];

    if (session.role === 'ALUNO') {
      // Aluno sees messages sent by them or sent directly to them
      query += ` WHERE m.sender_id = $1 OR m.receiver_id = $1`;
      values.push(session.id);
    } else {
      // Admin / Professor viewing chat with specific student or all
      if (targetUserId) {
        query += ` WHERE m.sender_id = $1 OR m.receiver_id = $1`;
        values.push(targetUserId);
      }
    }

    query += ` ORDER BY m.created_at ASC`;

    const res = await pool.query(query, values);
    return NextResponse.json({ messages: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST send chat message
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Você precisa estar logado para enviar mensagens.' }, { status: 401 });
    }

    const body = await req.json();
    const { content, receiver_id } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Conteúdo da mensagem não pode ser vazio.' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [session.id, receiver_id || null, content]
    );

    return NextResponse.json({ success: true, message: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
