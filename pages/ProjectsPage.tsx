import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Calendar, Briefcase, 
  MapPin, CheckCircle2, Filter
} from 'lucide-react';
import { Input } from '../components/FormElements';
import { ProjectStatus, RoutePath } from '../types';
import { MOCK_PROJECTS } from '../constants';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Hold': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredProjects = MOCK_PROJECTS.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-full flex flex-col space-y-6 pt-2 pb-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(RoutePath.HOME)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Assigned Projects</h1>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input 
            placeholder="Search projects..." 
            icon={Search} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="bg-white p-3 rounded-xl border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50"
          onClick={() => {
            const statuses = ['All', 'Active', 'Completed', 'Hold', 'Cancelled'];
            const nextIdx = (statuses.indexOf(filterStatus) + 1) % statuses.length;
            setFilterStatus(statuses[nextIdx]);
          }}
        >
          <Filter className={`w-5 h-5 ${filterStatus !== 'All' ? 'text-primary' : ''}`} />
        </button>
      </div>

      {/* Filter Chips (Visual Indicator) */}
      {filterStatus !== 'All' && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Filtering by:</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium text-slate-700 flex items-center gap-1">
            {filterStatus}
            <button onClick={() => setFilterStatus('All')} className="hover:text-red-500"><CheckCircle2 className="w-3 h-3" /></button>
          </span>
        </div>
      )}

      {/* Project List */}
      <div className="space-y-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.99] transition-transform"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-2">
                  <h3 className="font-bold text-slate-900 leading-snug">{project.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {project.type}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Details Grid */}
              <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Timeline</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(project.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(project.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Visits Done</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.visitsCompleted} visits</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                <span className="text-xs text-slate-400">ID: {project.id}</span>
                <button 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="text-sm font-semibold text-primary hover:text-indigo-700 flex items-center gap-1"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Projects Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              We couldn't find any projects matching your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};