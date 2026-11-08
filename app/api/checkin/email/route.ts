import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';
import { 
  getClassDaysForMonth, 
  getCompletedClassDaysForMonth, 
  MONTH_NAMES 
} from '@/lib/dateUtils';
import { User } from '@/lib/types';

export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { recipientEmail, month, year, subject, customNotes } = body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ error: 'Por favor, informe um endereço de e-mail válido.' }, { status: 400 });
    }

    const now = new Date();
    const targetMonth = parseInt(month || String(now.getMonth() + 1), 10);
    const targetYear = parseInt(year || String(now.getFullYear()), 10);
    const monthName = MONTH_NAMES[targetMonth - 1] || `Mês ${targetMonth}`;

    // Fetch data
    const studentsRes = await pool.query(
      'SELECT id, name, nickname, phone, corda, role FROM users ORDER BY name ASC'
    );
    const students: User[] = studentsRes.rows;

    const monthCheckinsRes = await pool.query(
      `SELECT c.user_id, c.checkin_date::text as checkin_date
       FROM checkins c
       WHERE EXTRACT(MONTH FROM c.checkin_date) = $1 AND EXTRACT(YEAR FROM c.checkin_date) = $2
       ORDER BY c.checkin_date ASC`,
      [targetMonth, targetYear]
    );

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

    // Filter students with alerts (> 3 absences)
    const alertStudents: Array<{ name: string; nickname: string; faltas: number; corda: string }> = [];
    const reportItems: string[] = [];

    students.forEach((st) => {
      const dates = userMonthDates.get(st.id) || [];
      const presencasMes = dates.length;
      const presencasAno = yearCountsMap.get(st.id) || 0;
      const faltasMes = Math.max(0, totalAulasOcorridas - presencasMes);
      const isAlert = faltasMes > 3;

      if (isAlert) {
        alertStudents.push({
          name: st.name,
          nickname: st.nickname,
          faltas: faltasMes,
          corda: st.corda,
        });
      }

      const freqPct = totalAulasOcorridas > 0 
        ? Math.min(100, Math.round((presencasMes / totalAulasOcorridas) * 100)) + '%'
        : '100%';

      reportItems.push(
        `- ${st.name} ("${st.nickname}") | Corda: ${st.corda} | Presenças no Mês: ${presencasMes} | Faltas: ${faltasMes} (${freqPct}) | Ano: ${presencasAno} ${isAlert ? '[⚠️ ALERTA DE FALTAS]' : ''}`
      );
    });

    // Build plain text report
    const emailSubject = subject || `Relatório de Frequência ABADÁ Capoeira - ${monthName}/${targetYear}`;
    
    let reportText = `RELATÓRIO DE FREQUÊNCIA - GRUPO ABADÁ CAPOEIRA\n`;
    reportText += `Mês de Referência: ${monthName} de ${targetYear}\n`;
    reportText += `Aulas Previstas (Segundas e Quartas): ${allClassDays.length}\n`;
    reportText += `Aulas Realizadas até o Momento: ${totalAulasOcorridas}\n`;
    reportText += `Total de Integrantes: ${students.length}\n`;
    reportText += `Alunos em Situação de Alerta (>3 faltas): ${alertStudents.length}\n`;
    
    if (customNotes) {
      reportText += `\nObservações do Professor/Admin:\n${customNotes}\n`;
    }

    if (alertStudents.length > 0) {
      reportText += `\n⚠️ ALUNOS EM ALERTA DE FALTAS (>3 FALTAS NO MÊS):\n`;
      alertStudents.forEach((a) => {
        reportText += `• ${a.name} ("${a.nickname}") - Corda: ${a.corda} -> ${a.faltas} faltas\n`;
      });
    }

    reportText += `\n--- LISTAGEM GERAL DE FREQUÊNCIA ---\n`;
    reportText += reportItems.join('\n');
    reportText += `\n\nEmitido pelo Sistema Oficial ABADÁ Capoeira em ${new Date().toLocaleDateString('pt-BR')}.`;

    // Create mailto link
    const mailtoLink = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(reportText)}`;

    return NextResponse.json({
      success: true,
      message: `Relatório preparado com sucesso para envio ao e-mail ${recipientEmail}!`,
      recipientEmail,
      subject: emailSubject,
      reportText,
      mailtoLink,
      stats: {
        totalStudents: students.length,
        alertCount: alertStudents.length,
        totalClassesMonth: allClassDays.length,
        completedClasses: totalAulasOcorridas,
      },
    });
  } catch (error: any) {
    console.error('Email report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

