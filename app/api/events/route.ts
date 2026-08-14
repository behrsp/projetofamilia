import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

// GET all events with student RSVPs
export async function GET() {
  try {
    await initDb();
    const session = await getAuthSession();
    
    const eventsRes = await pool.query('SELECT * FROM events ORDER BY event_date ASC, created_at DESC');
    const events = eventsRes.rows;

    for (const evt of events) {
      // RSVP counts
      const rsvpCountRes = await pool.query(
        `SELECT status, COUNT(*)::int as count FROM event_rsvps WHERE event_id = $1 GROUP BY status`,
        [evt.id]
      );
      
      const counts = { vou: 0, nao_sei: 0, nao_vou: 0 };
      rsvpCountRes.rows.forEach((row) => {
        if (row.status === 'VOU') counts.vou = row.count;
        if (row.status === 'NAO_SEI') counts.nao_sei = row.count;
        if (row.status === 'NAO_VOU') counts.nao_vou = row.count;
      });
      evt.rsvps_count = counts;

      // Current user RSVP
      if (session) {
        const userRsvpRes = await pool.query(
          `SELECT status FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
          [evt.id, session.id]
        );
        if (userRsvpRes.rows.length > 0) {
          evt.my_rsvp = userRsvpRes.rows[0].status;
        }
      }

      // Detailed RSVP list (for Admin / Professor dashboard)
      if (session && (session.role === 'ADMIN' || session.role === 'PROFESSOR')) {
        const detailsRes = await pool.query(
          `SELECT r.user_id, r.status, u.name as user_name, u.nickname as user_nickname, u.corda as user_corda
           FROM event_rsvps r
           JOIN users u ON r.user_id = u.id
           WHERE r.event_id = $1
           ORDER BY u.name ASC`,
          [evt.id]
        );
        evt.rsvps_details = detailsRes.rows;
      }
    }

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create event (Admin & Professor only)
export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PROFESSOR')) {
      return NextResponse.json({ error: 'Somente o admin e professor podem criar eventos.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, banner_url, event_date } = body;

    if (!title || !description || !event_date) {
      return NextResponse.json({ error: 'Título, descrição e data são obrigatórios.' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO events (title, description, banner_url, event_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, banner_url || '', event_date, session.id]
    );

    return NextResponse.json({ success: true, event: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
