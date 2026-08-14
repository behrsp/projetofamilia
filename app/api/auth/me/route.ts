import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const res = await pool.query(
      'SELECT id, name, nickname, phone, birthdate, corda, role, avatar_url, created_at FROM users WHERE id = $1',
      [session.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
