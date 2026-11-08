import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';
import { 
  getClassDaysForMonth, 
  getCompletedClassDaysForMonth, 
  MONTH_NAMES 
} from '@/lib/dateUtils';
import { User } from '@/lib/types';

export async function GET(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const targetMonth = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const targetYear = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const monthName = MONTH_NAMES[targetMonth - 1] || `Mês ${targetMonth}`;

    // 1. Fetch students
    const studentsRes = await pool.query(
      'SELECT id, name, nickname, phone, corda, role FROM users ORDER BY name ASC'
    );
    const students: User[] = studentsRes.rows;

    // 2. Fetch month checkins
    const monthCheckinsRes = await pool.query(
      `SELECT c.user_id, c.checkin_date::text as checkin_date
       FROM checkins c
       WHERE EXTRACT(MONTH FROM c.checkin_date) = $1 AND EXTRACT(YEAR FROM c.checkin_date) = $2
       ORDER BY c.checkin_date ASC`,
      [targetMonth, targetYear]
    );

    // 3. Year counts
    const yearCountsRes = await pool.query(
      `SELECT user_id, COUNT(*) as count
       FROM checkins
       WHERE EXTRACT(YEAR FROM checkin_date) = $1
       GROUP BY user_id`,
      [targetYear]
    );
    const yearCountsMap = new Map<string, number>();
    yearCountsRes.rows.forEach((r) => {
      yearCountsMap.set(r.user_id, parseInt(r.count, 10));
    });

    const userMonthDates = new Map<string, string[]>();
    const activeTrainingDatesSet = new Set<string>();
    monthCheckinsRes.rows.forEach((c) => {
      const arr = userMonthDates.get(c.user_id) || [];
      arr.push(c.checkin_date);
      userMonthDates.set(c.user_id, arr);
      activeTrainingDatesSet.add(c.checkin_date);
    });

    const allClassDays = getClassDaysForMonth(targetYear, targetMonth);
    const totalAulasOcorridas = activeTrainingDatesSet.size;

    // Build CSV content with semicolon separator for Brazilian Excel
    const rows: string[] = [];

    // Header info rows
    rows.push(`RELATÓRIO OFICIAL DE FREQUÊNCIA - ABADÁ CAPOEIRA`);
    rows.push(`Período: ${monthName} de ${targetYear}`);
    rows.push(`Total de Aulas Previstas (Segundas e Quartas): ${allClassDays.length}`);
    rows.push(`Aulas Realizadas até o Momento: ${totalAulasOcorridas}`);
    rows.push(``);

    // Table Column Headers
    rows.push([
      'Nome Completo',
      'Apelido',
      'Graduação (Corda)',
      'Telefone',
      'Presenças no Mês',
      'Faltas no Mês',
      '% Frequência',
      'Presenças no Ano',
      'Situação',
      'Datas em que Compareceu',
    ].join(';'));

    students.forEach((st) => {
      const dates = userMonthDates.get(st.id) || [];
      const presencasMes = dates.length;
      const presencasAno = yearCountsMap.get(st.id) || 0;
      const faltasMes = Math.max(0, totalAulasOcorridas - presencasMes);
      const alerta = faltasMes > 3 ? '⚠️ ALERTA: Mais de 3 faltas' : '✅ Regular';
      const frequenciaPct = totalAulasOcorridas > 0 
        ? Math.min(100, Math.round((presencasMes / totalAulasOcorridas) * 100)) + '%'
        : '100%';

      const datesFormatted = dates.map(d => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}`;
      }).join(', ');

      rows.push([
        `"${st.name.replace(/"/g, '""')}"`,
        `"${st.nickname.replace(/"/g, '""')}"`,
        `"${st.corda}"`,
        `"${st.phone}"`,
        presencasMes,
        faltasMes,
        `"${frequenciaPct}"`,
        presencasAno,
        `"${alerta}"`,
        `"${datesFormatted}"`,
      ].join(';'));
    });

    // Add BOM for Excel UTF-8 recognition
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const filename = `frequencia_abada_${monthName.toLowerCase()}_${targetYear}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

