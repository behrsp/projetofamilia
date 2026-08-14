import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDb, pool } from '@/lib/db';
import { sanitizePhone, generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Telefone e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhone(phone);
    const res = await pool.query(
      'SELECT id, name, nickname, phone, password_hash, birthdate, corda, role, avatar_url FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Telefone ou senha incorretos.' },
        { status: 401 }
      );
    }

    const user = res.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Telefone ou senha incorretos.' },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      phone: user.phone,
      role: user.role,
      corda: user.corda,
    };

    const token = generateToken(tokenPayload);

    const { password_hash, ...userWithoutPassword } = user;

    const response = NextResponse.json({ success: true, user: userWithoutPassword });
    response.cookies.set('abada_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar login.' }, { status: 500 });
  }
}
