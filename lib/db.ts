import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zI8eswvJ3HDx@ep-hidden-tree-acxrx6rs-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Create a singleton connection pool
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        nickname VARCHAR(255) NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        birthdate VARCHAR(50) NOT NULL,
        corda VARCHAR(100) NOT NULL DEFAULT 'Crua',
        role VARCHAR(50) NOT NULL DEFAULT 'ALUNO',
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Músicas Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL DEFAULT 'Tradicional',
        lyrics TEXT NOT NULL,
        link_url TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Instrumentos (Vídeos) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS instruments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        video_url TEXT NOT NULL,
        duration VARCHAR(50) DEFAULT '2:00',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Eventos Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        banner_url TEXT,
        event_date VARCHAR(100) NOT NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. RSVPs de Eventos Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL, -- 'VOU', 'NAO_SEI', 'NAO_VOU'
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
      );
    `);

    // 6. Fotos Table (com expiração automática para 90 dias)
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        photo_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Pedidos Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
        response_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Mensagens (Chat Suporte) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure Admin Account Exists
    const adminPhone = '41984842941';
    const adminCheck = await client.query('SELECT id FROM users WHERE phone = $1', [adminPhone]);
    
    if (adminCheck.rows.length === 0) {
      const hashedPass = await bcrypt.hash('235689', 10);
      await client.query(`
        INSERT INTO users (name, nickname, phone, password_hash, birthdate, corda, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'Administrador ABADÁ',
        'Mestre Admin',
        adminPhone,
        hashedPass,
        '1985-01-01',
        'Branca',
        'ADMIN'
      ]);
      console.log('✅ Default Admin account created: 41984842941');
    }

    await client.query('COMMIT');
    isInitialized = true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database Initialization Error:', error);
    throw error;
  } finally {
    client.release();
  }
}
