import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthSession, sanitizePhone } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas professores e administradores.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, nickname, phone, corda, role, birthdate, password, avatar_url } = body;

    // Check if user exists
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }
    const currentUser = userRes.rows[0];

    // Validate and sanitize phone if provided
    let finalPhone = currentUser.phone;
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      finalPhone = sanitizePhone(phone);
      if (finalPhone.length < 8) {
        return NextResponse.json({ error: 'Número de telefone inválido. Informe com DDD.' }, { status: 400 });
      }
      const existingPhone = await pool.query('SELECT id FROM users WHERE phone = $1 AND id != $2', [finalPhone, id]);
      if (existingPhone.rows.length > 0) {
        return NextResponse.json({ error: 'Este telefone já está cadastrado para outro aluno.' }, { status: 400 });
      }
    }

    // Handle password update if supplied
    let passwordHash = currentUser.password_hash;
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.trim().length < 4) {
        return NextResponse.json({ error: 'A nova senha deve conter pelo menos 4 caracteres.' }, { status: 400 });
      }
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const finalRole = role !== undefined && role.trim() !== '' ? role.trim() : currentUser.role;
    const isRecepcao = finalRole === 'RECEPCAO';
    const finalName = name !== undefined && name.trim() !== '' ? name.trim() : currentUser.name;
    const finalNickname = isRecepcao
      ? (nickname !== undefined && nickname.trim() !== '' ? nickname.trim() : 'Recepção')
      : (nickname !== undefined && nickname.trim() !== '' ? nickname.trim() : currentUser.nickname);
    const finalBirthdate = isRecepcao
      ? ''
      : (birthdate !== undefined && birthdate.trim() !== '' ? birthdate.trim() : currentUser.birthdate);
    const finalCorda = isRecepcao
      ? 'Sem Corda'
      : (corda !== undefined && corda.trim() !== '' ? corda.trim() : currentUser.corda);
    const finalAvatarUrl = avatar_url !== undefined ? avatar_url : currentUser.avatar_url;

    const res = await pool.query(
      `UPDATE users
       SET name = $1,
           nickname = $2,
           phone = $3,
           corda = $4,
           role = $5,
           birthdate = $6,
           password_hash = $7,
           avatar_url = $8
       WHERE id = $9
       RETURNING id, name, nickname, phone, birthdate, corda, role, avatar_url, created_at`,
      [finalName, finalNickname, finalPhone, finalCorda, finalRole, finalBirthdate, passwordHash, finalAvatarUrl, id]
    );

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas professores e administradores.' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting self
    if (session.id === id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta.' }, { status: 400 });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Aluno removido com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
