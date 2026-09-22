import { useState } from 'react';
import { FolderKanban, Building2, Users, ClipboardList, ArrowRight, MapPin, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Project } from '@/types';

export const ProjectsView: React.FC = () => {
  const { state, navigateTo, openModal, getProjectAccounts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = state.projects.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fade-in">
      <Header
        title="Proyectos"
        subtitle={`${filtered.length} proyecto${filtered.length !== 1 ? 's' : ''}`}
        onNew={() => openModal('project-form')}
        newButtonLabel="Nuevo Proyecto"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraActions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="completed">Completado</option>
            </select>
            <div className="flex bg-[#2A2D35] border border-[#2E323A] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
              </button>
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban size={48} className="mx-auto text-[#3A3F48] mb-4" />
          <p className="text-[#6B7280]">No se encontraron proyectos</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E323A] bg-[#1E2128]">
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Nombre</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Ubicación</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Clientes</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Inicio</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const accountCount = getProjectAccounts(project.id).length;
                return (
                  <tr
                    key={project.id}
                    className="border-b border-[#25282F] hover:bg-[#2D3139] transition-colors cursor-pointer"
                    onClick={() => navigateTo('project-detail', project.id)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-[#F0F2F5]">{project.name}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{project.location}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{accountCount}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{formatDate(project.startDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={project.status === 'active' ? 'active' : project.status === 'completed' ? 'completed' : 'inactive'}>
                        {project.status === 'active' ? 'Activo' : project.status === 'completed' ? 'Completado' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); navigateTo('project-detail', project.id); }} className="text-[#D4A824] hover:text-[#E8C545] text-sm">Ver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string) {
  try { return format(parseISO(d), 'dd MMM yyyy', { locale: es }); } catch { return d; }
}

function ProjectCard({ project }: { project: Project }) {
  const { navigateTo, getProjectAccounts } = useApp();
  const accounts = getProjectAccounts(project.id);
  const accountCount = accounts.length;

  return (
    <div
      className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6 hover:border-[#3A3F48] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-250 cursor-pointer"
      onClick={() => navigateTo('project-detail', project.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-[#F0F2F5] line-clamp-1 pr-2">{project.name}</h3>
        <Badge variant={project.status === 'active' ? 'active' : project.status === 'completed' ? 'completed' : 'inactive'}>
          {project.status === 'active' ? 'Activo' : project.status === 'completed' ? 'Completado' : 'Inactivo'}
        </Badge>
      </div>
      <p className="text-sm text-[#A0A8B8] line-clamp-2 mb-4">{project.description || 'Sin descripción'}</p>
      <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-3">
        <MapPin size={12} className="text-[#D4A824]" />
        <span>{project.location || 'Sin ubicación'}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-4">
        <CalendarDays size={12} />
        <span>{formatDate(project.startDate)}</span>
        {project.endDate && <><span className="text-[#3A3F48]">→</span><span>{formatDate(project.endDate)}</span></>}
      </div>
      {project.budget && (
        <div className="text-xs text-[#D4A824] mb-3 font-medium">Presupuesto: ${project.budget.toLocaleString('es-CL')}</div>
      )}
      <div className="flex items-center justify-between border-t border-[#25282F] pt-3">
        <span className="flex items-center gap-1 text-xs text-[#6B7280]"><Building2 size={12} /> {accountCount} cuenta{accountCount !== 1 ? 's' : ''}</span>
        <button onClick={(e) => { e.stopPropagation(); navigateTo('project-detail', project.id); }} className="flex items-center gap-1 text-sm text-[#D4A824] hover:text-[#E8C545] transition-colors">Ver detalle <ArrowRight size={14} /></button>
      </div>
    </div>
  );
}
