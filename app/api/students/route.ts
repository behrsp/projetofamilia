import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthSession, sanitizePhone } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET all students
export async function GET() {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const res = await pool.query(
      'SELECT id, name, nickname, phone, birthdate, corda, role, avatar_url, created_at FROM users ORDER BY name ASC'
    );

    return NextResponse.json({ students: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Admin and Professor register new student directly
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente professores e administradores podem cadastrar alunos diretamente.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, nickname, phone, password, birthdate, corda, role } = body;
    const selectedRole = role || 'ALUNO';
    const isRecepcao = selectedRole === 'RECEPCAO';

    if (!name || !phone || (!isRecepcao && (!nickname || !birthdate))) {
      return NextResponse.json({ 
        error: isRecepcao 
          ? 'Nome e telefone são obrigatórios para a Recepção.' 
          : 'Nome, apelido, telefone e data de nascimento são obrigatórios.' 
      }, { status: 400 });
    }

    const cleanPhone = sanitizePhone(phone);
    if (cleanPhone.length < 8) {
      return NextResponse.json({ error: 'Número de telefone inválido.' }, { status: 400 });
    }

    // Check existing phone
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Este número de telefone já está cadastrado.' }, { status: 400 });
    }

    const initialPassword = password || '123456';
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const finalNickname = isRecepcao ? (nickname?.trim() || 'Recepção') : nickname.trim();
    const finalBirthdate = isRecepcao ? '' : birthdate.trim();
    const selectedCorda = isRecepcao ? 'Sem Corda' : (corda || 'Crua');

    const result = await pool.query(
      `INSERT INTO users (name, nickname, phone, password_hash, birthdate, corda, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, nickname, phone, birthdate, corda, role, avatar_url, created_at`,
      [name.trim(), finalNickname, cleanPhone, passwordHash, finalBirthdate, selectedCorda, selectedRole]
    );

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Self-update profile
export async function PUT(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, nickname, birthdate, corda, avatar_url } = body;

    const res = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           nickname = COALESCE($2, nickname),
           birthdate = COALESCE($3, birthdate),
           corda = COALESCE($4, corda),
           avatar_url = COALESCE($5, avatar_url)
       WHERE id = $6
       RETURNING id, name, nickname, phone, birthdate, corda, role, avatar_url`,
      [name, nickname, birthdate, corda, avatar_url, session.id]
    );

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
