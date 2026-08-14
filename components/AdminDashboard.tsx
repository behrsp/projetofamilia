'use client';

import React, { useState } from 'react';
import { User, ABADA_CORDAS, UserRole } from '@/lib/types';
import { 
  Users, 
  Search, 
  Award, 
  Edit3, 
  Trash2, 
  UserPlus, 
  ShieldAlert, 
  Check, 
  X,
  Phone,
  Calendar,
  Lock
} from 'lucide-react';

interface AdminDashboardProps {
  students: User[];
  onAddStudent: (data: any) => Promise<void>;
  onUpdateStudent: (id: string, data: Partial<User>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onOpenCordGuide: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onOpenCordGuide,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCordFilter, setSelectedCordFilter] = useState('');
  
  // Edit Modal state
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editCorda, setEditCorda] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('ALUNO');
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Add Student Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newBirthdate, setNewBirthdate] = useState('');
  const [newCorda, setNewCorda] = useState('Crua');
  const [newRole, setNewRole] = useState<UserRole>('ALUNO');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compute student count by cord
  const cordCounts: Record<string, number> = {};
  students.forEach((s) => {
    cordCounts[s.corda] = (cordCounts[s.corda] || 0) + 1;
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);
    const matchesCord = selectedCordFilter ? s.corda === selectedCordFilter : true;
    return matchesSearch && matchesCord;
  });

  const handleStartEdit = (student: User) => {
    setEditingStudent(student);
    setEditCorda(student.corda);
    setEditRole(student.role);
    setEditName(student.name);
    setEditNickname(student.nickname);
    setEditPhone(student.phone);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    try {
      setLoading(true);
      await onUpdateStudent(editingStudent.id, {
        name: editName,
        nickname: editNickname,
        phone: editPhone,
        corda: editCorda,
        role: editRole,
      });
      setEditingStudent(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar aluno.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNickname.trim() || !newPhone.trim() || !newBirthdate.trim()) {
      setError('Por favor, preencha nome, apelido, telefone e data de nascimento.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onAddStudent({
        name: newName,
        nickname: newNickname,
        phone: newPhone,
        password: newPassword || '123456',
        birthdate: newBirthdate,
        corda: newCorda,
        role: newRole,
      });

      setIsAddModalOpen(false);
      setNewName('');
      setNewNickname('');
      setNewPhone('');
      setNewPassword('123456');
      setNewBirthdate('');
      setNewCorda('Crua');
      setNewRole('ALUNO');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar aluno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4 shadow-xl">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Alunos</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{students.length}</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4 shadow-xl">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Graduação Ativa</p>
            <h3 className="text-2xl font-extrabold text-amber-300 mt-0.5">{Object.keys(cordCounts).length} Cordas</h3>
          </div>
        </div>

        <button
          onClick={onOpenCordGuide}
          className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center justify-between text-left shadow-xl group transition-all"
        >
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Informativo ABADÁ</p>
            <h3 className="text-sm font-extrabold text-white group-hover:text-emerald-200 mt-0.5">
              Ver Tabela de Cordas
            </h3>
          </div>
          <Award className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
        </button>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4 shadow-xl">
          <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Professores / Admin</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">
              {students.filter((s) => s.role !== 'ALUNO').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter, Search & Add Student Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar aluno por nome, apelido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Cord Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 shrink-0">Filtrar Corda:</span>
          <select
            value={selectedCordFilter}
            onChange={(e) => setSelectedCordFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
          >
            <option value="">Todas as Cordas</option>
            {ABADA_CORDAS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({cordCounts[c.name] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Add Student Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          <span>Cadastrar Novo Aluno</span>
        </button>
      </div>

      {/* Student List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Aluno / Apelido</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Nascimento</th>
                <th className="px-6 py-4">Graduação (Corda)</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Name & Nickname */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-sm block">
                            {st.name}
                          </span>
                          <span className="text-amber-400 font-semibold">
                            &quot;{st.nickname}&quot;
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{st.phone}</span>
                      </div>
                    </td>

                    {/* Birthdate */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{st.birthdate}</span>
                      </div>
                    </td>

                    {/* Corda Badge */}
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full font-bold text-slate-900 bg-amber-400 border border-amber-300 shadow-sm inline-block">
                        {st.corda}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                          st.role === 'ADMIN'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : st.role === 'PROFESSOR'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleStartEdit(st)}
                          className="p-2 text-slate-300 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all"
                          title="Gerenciar / Alterar Corda e Função"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteStudent(st.id)}
                          className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          title="Excluir Aluno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Cadastrar Novo Aluno</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              {error && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Apelido na Capoeira *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sorriso"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Telefone (Login do Aluno) *</label>
                <input
                  type="text"
                  required
                  placeholder="41999999999 ou 41-99999-9999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Senha Inicial</label>
                <input
                  type="text"
                  placeholder="123456 (Padrão)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  value={newBirthdate}
                  onChange={(e) => setNewBirthdate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Graduação (Corda ABADÁ)</label>
                <select
                  value={newCorda}
                  onChange={(e) => setNewCorda(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                >
                  {ABADA_CORDAS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Função</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                >
                  <option value="ALUNO">ALUNO</option>
                  <option value="PROFESSOR">PROFESSOR</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-white">Gerenciar Aluno</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nome Completo</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Apelido na Capoeira</label>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Corda (Graduação ABADÁ)</label>
              <select
                value={editCorda}
                onChange={(e) => setEditCorda(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              >
                {ABADA_CORDAS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Função no Sistema</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              >
                <option value="ALUNO">ALUNO</option>
                <option value="PROFESSOR">PROFESSOR</option>
                <option value="ADMIN">ADMINISTRADOR</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
