import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';
import { 
  getLocalDateString, 
  isClassDay, 
  getWeekdayName, 
  getClassDaysForMonth, 
  getCompletedClassDaysForMonth,
  MONTH_NAMES 
} from '@/lib/dateUtils';
import { User, StudentAttendanceStats, AttendanceDashboardData } from '@/lib/types';

export async function GET(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const todayDateStr = getLocalDateString(now);
    const todayIsClass = isClassDay(now);

    const isStaff = session.role === 'ADMIN' || session.role === 'PROFESSOR';
    const canViewDashboard = isStaff || session.role === 'RECEPCAO';

    // Student self-view
    if (!canViewDashboard) {
      const todayCheckinRes = await pool.query(
        'SELECT id, user_id, checkin_date::text, created_at, notes FROM checkins WHERE user_id = $1 AND checkin_date = $2',
        [session.id, todayDateStr]
      );

      const monthNum = now.getMonth() + 1;
      const yearNum = now.getFullYear();

      const monthCheckinsRes = await pool.query(
        'SELECT COUNT(*) as count FROM checkins WHERE user_id = $1 AND EXTRACT(MONTH FROM checkin_date) = $2 AND EXTRACT(YEAR FROM checkin_date) = $3',
        [session.id, monthNum, yearNum]
      );

      const yearCheckinsRes = await pool.query(
        'SELECT COUNT(*) as count FROM checkins WHERE user_id = $1 AND EXTRACT(YEAR FROM checkin_date) = $2',
        [session.id, yearNum]
      );

      return NextResponse.json({
        isStaff: false,
        isCheckedInToday: todayCheckinRes.rows.length > 0,
        todayCheckin: todayCheckinRes.rows[0] || null,
        myMonthCount: parseInt(monthCheckinsRes.rows[0]?.count || '0', 10),
        myYearCount: parseInt(yearCheckinsRes.rows[0]?.count || '0', 10),
        isTodayClassDay: todayIsClass,
        weekdayName: getWeekdayName(now),
        todayDateStr,
      });
    }

    // Staff Full Dashboard View
    const targetMonth = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const targetYear = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const targetDate = searchParams.get('date') || todayDateStr;

    // 1. Fetch all students (excluding RECEPCAO from training attendance list)
    const studentsRes = await pool.query(
      "SELECT id, name, nickname, phone, birthdate, corda, role, avatar_url, created_at FROM users WHERE role != 'RECEPCAO' ORDER BY name ASC"
    );
    const students: User[] = studentsRes.rows;

    // 2. Fetch checkins in the target month & year
    const monthCheckinsRes = await pool.query(
      `SELECT c.id, c.user_id, c.checkin_date::text as checkin_date, c.registered_by, c.notes, c.created_at,
              u.name as user_name, u.nickname as user_nickname, u.corda as user_corda, u.phone as user_phone, u.avatar_url as user_avatar
       FROM checkins c
       JOIN users u ON c.user_id = u.id
       WHERE EXTRACT(MONTH FROM c.checkin_date) = $1 AND EXTRACT(YEAR FROM c.checkin_date) = $2
       ORDER BY c.created_at DESC`,
      [targetMonth, targetYear]
    );

    // 3. Fetch checkin counts for the entire year per user
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

    // 4. Fetch checkins for the specific date (defaults to today)
    const dateCheckinsRes = await pool.query(
      `SELECT c.id, c.user_id, c.checkin_date::text as checkin_date, c.registered_by, c.notes, c.created_at,
              u.name as user_name, u.nickname as user_nickname, u.corda as user_corda, u.phone as user_phone, u.avatar_url as user_avatar
       FROM checkins c
       JOIN users u ON c.user_id = u.id
       WHERE c.checkin_date = $1
       ORDER BY c.created_at DESC`,
      [targetDate]
    );

    // 5. Calculate class days
    const allClassDays = getClassDaysForMonth(targetYear, targetMonth);
    const totalAulasMes = allClassDays.length;

    // Group month checkins by user_id and track which class dates actually had training/check-ins
    const userMonthCheckinDates = new Map<string, string[]>();
    const activeTrainingDatesSet = new Set<string>();
    monthCheckinsRes.rows.forEach((c) => {
      const dates = userMonthCheckinDates.get(c.user_id) || [];
      dates.push(c.checkin_date);
      userMonthCheckinDates.set(c.user_id, dates);
      if (c.checkin_date <= todayDateStr) {
        activeTrainingDatesSet.add(c.checkin_date);
      }
    });

    // Only count a class day as "ocorrida" (for absence calculation) if training/check-in actually took place on that date
    const totalAulasOcorridas = activeTrainingDatesSet.size;

    // Calculate per-student stats
    let alunosEmAlertaCount = 0;
    const studentsStats: StudentAttendanceStats[] = students.map((st) => {
      const dates = userMonthCheckinDates.get(st.id) || [];
      const presencasMes = dates.length;
      const presencasAno = yearCountsMap.get(st.id) || 0;
      const faltasMes = Math.max(0, totalAulasOcorridas - presencasMes);
      // Alerta se faltas no mês passarem de 3!
      const alertaFaltas = faltasMes > 3;
      if (alertaFaltas) alunosEmAlertaCount++;

      const frequenciaPct = totalAulasOcorridas > 0 
        ? Math.min(100, Math.round((presencasMes / totalAulasOcorridas) * 100))
        : 100;

      return {
        user: st,
        presencasMes,
        presencasAno,
        totalAulasOcorridas,
        totalAulasMes,
        faltasMes,
        frequenciaPct,
        alertaFaltas,
        datasComparecidas: dates,
      };
    });

    const totalCheckinsMes = monthCheckinsRes.rows.length;
    const mediaAlunosPorAula = totalAulasOcorridas > 0 
      ? Math.round((totalCheckinsMes / totalAulasOcorridas) * 10) / 10 
      : 0;

    // Combine month checkins and specific targetDate checkins so any selected day in the UI has full checkin details
    const combinedCheckinsMap = new Map<string, any>();
    monthCheckinsRes.rows.forEach((r) => combinedCheckinsMap.set(r.id, r));
    dateCheckinsRes.rows.forEach((r) => combinedCheckinsMap.set(r.id, r));

    const dashboard: AttendanceDashboardData = {
      month: targetMonth,
      year: targetYear,
      monthName: MONTH_NAMES[targetMonth - 1] || '',
      totalAulasMes,
      totalAulasOcorridas,
      classDates: allClassDays,
      studentsStats,
      totalCheckinsMes,
      mediaAlunosPorAula,
      alunosEmAlertaCount,
      todayCheckins: Array.from(combinedCheckinsMap.values()),
      isTodayClassDay: todayIsClass,
      todayDateStr,
    };

    return NextResponse.json({
      isStaff: true,
      canEdit: isStaff,
      dashboard,
    });
  } catch (error: any) {
    console.error('Checkin GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const isStaff = session.role === 'ADMIN' || session.role === 'PROFESSOR';
    if (session.role === 'RECEPCAO') {
      return NextResponse.json({ 
        error: 'A Recepção possui permissão apenas para visualizar, imprimir e exportar as chamadas.' 
      }, { status: 403 });
    }
    const now = new Date();
    const todayDateStr = getLocalDateString(now);

    let targetUserId = session.id;
    let targetDate = todayDateStr;
    let notes = 'Check-in pelo aplicativo';

    if (isStaff) {
      // Admin/Professor registering for a student (e.g. student without phone)
      if (body.user_id) {
        targetUserId = body.user_id;
      }
      if (body.date) {
        targetDate = body.date;
      }
      if (body.notes) {
        notes = body.notes;
      } else if (targetUserId !== session.id) {
        notes = `Registrado por ${session.nickname || session.name}`;
      }
    } else {
      // Regular student self check-in
      // Verify if it's class day (Segunda ou Quarta)
      if (!isClassDay(now)) {
        return NextResponse.json({ 
          error: `Hoje (${getWeekdayName(now)}) não é dia regular de treino. Os treinos acontecem nas Segundas e Quartas-feiras.` 
        }, { status: 400 });
      }
      targetDate = todayDateStr;
      notes = 'Presença confirmada pelo aluno';
    }

    // Check if check-in already exists for this user and date
    const existing = await pool.query(
      'SELECT id FROM checkins WHERE user_id = $1 AND checkin_date = $2',
      [targetUserId, targetDate]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Check-in de presença já realizado para esta data.' 
      }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO checkins (user_id, checkin_date, registered_by, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, checkin_date::text, registered_by, notes, created_at`,
      [targetUserId, targetDate, session.id, notes]
    );

    return NextResponse.json({
      success: true,
      message: 'Presença confirmada com sucesso! Bom treino!',
      checkin: result.rows[0],
    });
  } catch (error: any) {
    console.error('Checkin POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores e professores.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const checkinId = searchParams.get('id');
    const userId = searchParams.get('user_id');
    const date = searchParams.get('date');
    const resetMonth = searchParams.get('reset_month');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (resetMonth === '1' && month && year) {
      await pool.query(
        'DELETE FROM checkins WHERE EXTRACT(MONTH FROM checkin_date) = $1 AND EXTRACT(YEAR FROM checkin_date) = $2',
        [parseInt(month, 10), parseInt(year, 10)]
      );
      return NextResponse.json({ success: true, message: 'Todas as chamadas do mês foram zeradas com sucesso.' });
    }

    if (checkinId) {
      await pool.query('DELETE FROM checkins WHERE id = $1', [checkinId]);
      return NextResponse.json({ success: true, message: 'Presença removida com sucesso.' });
    }

    if (userId && date) {
      await pool.query('DELETE FROM checkins WHERE user_id = $1 AND checkin_date = $2', [userId, date]);
      return NextResponse.json({ success: true, message: 'Presença removida com sucesso.' });
    }

    return NextResponse.json({ error: 'Identificador do check-in não fornecido.' }, { status: 400 });
  } catch (error: any) {
    console.error('Checkin DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

