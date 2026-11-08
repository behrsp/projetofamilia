import { ABADA_CORDAS } from './types';

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface ParsedBirthdate {
  day: number;
  month: number;
  year?: number;
}

/**
 * Parses birthdate string from formats like YYYY-MM-DD, DD/MM/YYYY, etc.
 */
export function parseBirthdate(birthdateStr?: string | null): ParsedBirthdate | null {
  if (!birthdateStr || typeof birthdateStr !== 'string') return null;
  const clean = birthdateStr.trim();
  if (!clean) return null;

  // Case 1: YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(clean)) {
    const parts = clean.split(/[-/T]/);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month)) {
      return { day, month, year };
    }
  }

  // Case 2: DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(clean)) {
    const parts = clean.split(/[-/]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month)) {
      return { day, month, year };
    }
  }

  // Fallback: Date object parse
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return {
      day: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      year: d.getUTCFullYear(),
    };
  }

  return null;
}

/**
 * Format birthdate to DD/MM/YYYY for Brazilian locale
 */
export function formatBirthdateBR(birthdateStr?: string | null): string {
  const parsed = parseBirthdate(birthdateStr);
  if (!parsed) return birthdateStr || '-';
  const day = String(parsed.day).padStart(2, '0');
  const month = String(parsed.month).padStart(2, '0');
  if (parsed.year) {
    return `${day}/${month}/${parsed.year}`;
  }
  return `${day}/${month}`;
}

/**
 * Formats birthdate for HTML input[type="date"] (YYYY-MM-DD)
 */
export function formatBirthdateForInput(birthdateStr?: string | null): string {
  const parsed = parseBirthdate(birthdateStr);
  if (!parsed) return '';
  const day = String(parsed.day).padStart(2, '0');
  const month = String(parsed.month).padStart(2, '0');
  const year = parsed.year ? String(parsed.year) : '2000';
  return `${year}-${month}-${day}`;
}

/**
 * Calculates current age
 */
export function calculateAge(birthdateStr?: string | null, referenceDate = new Date()): number | null {
  const parsed = parseBirthdate(birthdateStr);
  if (!parsed || !parsed.year) return null;
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;
  const currentDay = referenceDate.getDate();

  let age = currentYear - parsed.year;
  if (currentMonth < parsed.month || (currentMonth === parsed.month && currentDay < parsed.day)) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Checks if birthdate is today
 */
export function isBirthdayToday(birthdateStr?: string | null, today = new Date()): boolean {
  const parsed = parseBirthdate(birthdateStr);
  if (!parsed) return false;
  return parsed.day === today.getDate() && parsed.month === (today.getMonth() + 1);
}

/**
 * Checks if birthday falls in target month (1 to 12)
 */
export function isBirthdayInMonth(birthdateStr: string | null | undefined, targetMonth: number): boolean {
  const parsed = parseBirthdate(birthdateStr);
  if (!parsed) return false;
  return parsed.month === targetMonth;
}

/**
 * Generate WhatsApp message URL for birthday congratulations
 */
export function getWhatsAppBirthdayLink(phone: string, name: string, nickname?: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const greetingName = nickname ? `"${nickname}"` : name;
  const message = encodeURIComponent(
    `Salve ${greetingName}! 🎂🥋 Parabéns pelo seu aniversário! Que Deus e a Capoeira continuem iluminando sua caminhada com muita saúde, paz e axé! 🎉`
  );
  const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${finalPhone}?text=${message}`;
}

/**
 * Get cord styling metadata
 */
export function getCordInfo(cordName: string) {
  return ABADA_CORDAS.find((c) => c.name.toLowerCase() === cordName?.toLowerCase()) || {
    level: 'Aluno',
    name: cordName || 'Crua',
    color: '#e2e8f0',
    textColor: '#1e293b',
    description: '',
  };
}

/**
 * Returns current date in Brazil timezone as YYYY-MM-DD
 */
export function getLocalDateString(date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Get day of week in Brazil (0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb)
 */
export function getDayOfWeekBrazil(date = new Date()): number {
  try {
    const localDateStr = getLocalDateString(date);
    const [y, m, d] = localDateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0).getDay();
  } catch {
    return date.getDay();
  }
}

/**
 * Checks if a given date is a Capoeira class day (Segunda = 1, Quarta = 3)
 */
export function isClassDay(date = new Date()): boolean {
  const dow = getDayOfWeekBrazil(date);
  return dow === 1 || dow === 3;
}

/**
 * Returns weekday name in Portuguese
 */
export function getWeekdayName(date = new Date()): string {
  const dow = getDayOfWeekBrazil(date);
  const names = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return names[dow] || '';
}

/**
 * Returns all Mondays and Wednesdays (class dates) for a specific year and month
 * month is 1 to 12
 */
export function getClassDaysForMonth(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day, 12, 0, 0);
    const dow = d.getDay();
    if (dow === 1 || dow === 3) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(month).padStart(2, '0');
      dates.push(`${year}-${monthStr}-${dayStr}`);
    }
  }
  return dates;
}

/**
 * Returns class dates for the month that have already occurred up to referenceDate
 */
export function getCompletedClassDaysForMonth(year: number, month: number, referenceDate = new Date()): string[] {
  const allClassDays = getClassDaysForMonth(year, month);
  const todayStr = getLocalDateString(referenceDate);
  return allClassDays.filter((dateStr) => dateStr <= todayStr);
}

/**
 * Formats a date string like "2026-11-09" to "09/11 (Seg)"
 */
export function formatDateShortBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  const dow = dt.getDay();
  const dowShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dow];
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} (${dowShort})`;
}
