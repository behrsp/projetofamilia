import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'abada_capoeira_jwt_secret_key_2026_abada_group';

export interface TokenPayload {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  role: UserRole;
  corda: string;
}

/**
 * Strips all non-digit characters from phone input.
 * e.g. "41-9999-99999" or "(41) 99999-9999" => "41999999999"
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('abada_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
