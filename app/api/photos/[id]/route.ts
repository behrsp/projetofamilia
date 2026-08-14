import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente admin e professor podem excluir fotos.' }, { status: 403 });
    }

    const { id } = await params;
    await pool.query('DELETE FROM photos WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Foto excluída com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
