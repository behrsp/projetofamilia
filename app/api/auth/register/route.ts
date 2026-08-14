import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDb, pool } from '@/lib/db';
import { sanitizePhone, generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { name, nickname, phone, password, birthdate, corda } = body;

    if (!name || !nickname || !phone || !password || !birthdate) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhone(phone);
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { error: 'Número de telefone inválido.' },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este número de telefone já está cadastrado.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const selectedCorda = corda || 'Crua';

    const result = await pool.query(
      `INSERT INTO users (name, nickname, phone, password_hash, birthdate, corda, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'ALUNO')
       RETURNING id, name, nickname, phone, birthdate, corda, role, avatar_url, created_at`,
      [name, nickname, cleanPhone, passwordHash, birthdate, selectedCorda]
    );

    const user = result.rows[0];
    const tokenPayload = {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      phone: user.phone,
      role: user.role,
      corda: user.corda,
    };

    const token = generateToken(tokenPayload);

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('abada_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar cadastro.' }, { status: 500 });
  }
}
