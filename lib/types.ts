export type UserRole = 'ADMIN' | 'PROFESSOR' | 'RECEPCAO' | 'ALUNO';

export interface User {
  id: string;
  name: string;
  nickname: string; // Apelido
  phone: string;    // Digits only e.g. 41999999999
  birthdate: string;
  corda: string;    // Graduation cord
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
}

export interface UserUpdatePayload {
  name?: string;
  nickname?: string;
  phone?: string;
  birthdate?: string;
  corda?: string;
  role?: UserRole;
  password?: string;
  avatar_url?: string;
}

export const ABADA_CORDAS = [
  { level: 'Iniciante', name: 'Crua', color: '#e2e8f0', textColor: '#1e293b', description: 'Cor neutral. Dada para iniciantes na Capoeira sem conhecimento prévio.' },
  { level: 'Aluno', name: 'Crua-Amarela', color: '#fef08a', textColor: '#854d0e', description: 'Transformação. Primeira corda recebida no batizado, com o apelido oficial.' },
  { level: 'Aluno', name: 'Amarela', color: '#eab308', textColor: '#713f12', description: '"O Ouro" - Valorização do aprendizado a ser desenvolvido.' },
  { level: 'Aluno', name: 'Amarela-Laranja', color: '#f97316', textColor: '#7c2d12', description: 'Transformação.' },
  { level: 'Aluno', name: 'Laranja', color: '#ea580c', textColor: '#ffffff', description: '"O Sol" - Despertar para a consciência do aprendizado.' },
  { level: 'Aluno', name: 'Laranja-Azul', color: '#0284c7', textColor: '#ffffff', description: 'Transformação. Preparação para o título de Graduado (ajuda iniciantes).' },
  { level: 'Aluno Graduado', name: 'Azul', color: '#2563eb', textColor: '#ffffff', description: '"O Mar" - Consciência da imensidão do caminho a percorrer.' },
  { level: 'Aluno Graduado', name: 'Azul-Verde', color: '#0d9488', textColor: '#ffffff', description: 'Transformação.' },
  { level: 'Aluno Graduado', name: 'Verde', color: '#16a34a', textColor: '#ffffff', description: '"A Floresta" - Pulmão do mundo, solidificação do aprendizado.' },
  { level: 'Aluno Graduado', name: 'Verde-Roxa', color: '#7c3aed', textColor: '#ffffff', description: 'Transformação. Alicerce da Abadá-Capoeira.' },
  { level: 'Instrutor', name: 'Roxa', color: '#9333ea', textColor: '#ffffff', description: '"A Ametista" - Continuidade da Capoeira, superação física e espiritual.' },
  { level: 'Instrutor', name: 'Roxa-Marrom', color: '#78350f', textColor: '#ffffff', description: 'Transformação.' },
  { level: 'Professor', name: 'Marrom', color: '#854d0e', textColor: '#ffffff', description: '"O Camaleão" - Estilo característico da Abadá-Capoeira do Mestre Camisa.' },
  { level: 'Professor', name: 'Marrom-Vermelha', color: '#b91c1c', textColor: '#ffffff', description: 'Transformação. Futuros Mestrandos e Mestres.' },
  { level: 'Mestrando', name: 'Vermelha', color: '#dc2626', textColor: '#ffffff', description: '"O Rubi" - Simboliza a justiça e a responsabilidade com a Capoeira.' },
  { level: 'Mestre', name: 'Vermelha-Branca', color: '#f43f5e', textColor: '#ffffff', description: 'Transformação. Congregação dos ideais da Abadá-Capoeira com sabedoria.' },
  { level: 'Grão-Mestre', name: 'Branca', color: '#ffffff', textColor: '#0f172a', description: '"O Diamante" - União de todas as cores. Sabedoria, lealdade e liderança máxima.' }
] as const;

export type InstrumentCategory = 'Berimbau' | 'Pandeiro' | 'Atabaque' | 'Agogô' | 'Cuia';

export interface Song {
  id: string;
  title: string;
  author: string;
  lyrics: string;
  link_url?: string;
  created_by?: string;
  created_at: string;
}

export interface InstrumentLesson {
  id: string;
  category: InstrumentCategory;
  title: string;
  video_url: string; // Base64 data URL or video file URL
  duration?: string;
  created_by?: string;
  created_at: string;
}

export interface GroupEvent {
  id: string;
  title: string;
  description: string;
  banner_url?: string;
  event_date: string;
  created_by?: string;
  created_at: string;
  my_rsvp?: 'VOU' | 'NAO_SEI' | 'NAO_VOU';
  rsvps_count?: {
    vou: number;
    nao_sei: number;
    nao_vou: number;
  };
  rsvps_details?: Array<{
    user_id: string;
    user_name: string;
    user_nickname: string;
    user_corda: string;
    status: 'VOU' | 'NAO_SEI' | 'NAO_VOU';
  }>;
}

export interface PhotoItem {
  id: string;
  title: string;
  photo_url: string;
  created_at: string;
  days_left?: number;
}

export interface StudentRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_nickname?: string;
  request_type: 'TUTORIAL' | 'TOQUE_BERIMBAU' | 'TOQUE_ATABAQUE' | 'MUSICA';
  title: string;
  description: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  response_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: UserRole;
  receiver_id?: string; // null means sent to Admin channel
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  checkin_date: string; // YYYY-MM-DD
  registered_by?: string;
  notes?: string;
  created_at: string;
  user_name?: string;
  user_nickname?: string;
  user_corda?: string;
  user_phone?: string;
  user_avatar?: string;
}

export interface StudentAttendanceStats {
  user: User;
  presencasMes: number;
  presencasAno: number;
  totalAulasOcorridas: number;
  totalAulasMes: number;
  faltasMes: number;
  frequenciaPct: number;
  alertaFaltas: boolean; // true se faltasMes > 3
  datasComparecidas: string[];
}

export interface AttendanceDashboardData {
  month: number;
  year: number;
  monthName: string;
  totalAulasMes: number;
  totalAulasOcorridas: number;
  classDates: string[];
  studentsStats: StudentAttendanceStats[];
  totalCheckinsMes: number;
  mediaAlunosPorAula: number;
  alunosEmAlertaCount: number;
  todayCheckins: Checkin[];
  isTodayClassDay: boolean;
  todayDateStr: string;
}
