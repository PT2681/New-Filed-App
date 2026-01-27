import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, User, FileText, 
  MoreHorizontal, Layers
} from 'lucide-react';
import { Button } from '../components/FormElements';
import { Project, ProjectStatus, RoutePath } from '../types';
import { MOCK_PROJECTS } from '../constants';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    // In a real app, fetch from API. Here we find in mock data.
    const foundProject = MOCK_PROJECTS.find(p => p.id === id);
    setProject(foundProject || null);
  }, [id]);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Hold': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>Project not found.</p>
        <Button variant="ghost" onClick={() => navigate(RoutePath.PROJECTS)} className="mt-4 w-auto">
          Go Back
        </Button>
      </div>
    );
  }

  // Calculate progress bar width based on arbitrary logic or just use visits as proxy
  const progressPercent = Math.min((project.visitsCompleted / 20) * 100, 100); 

  return (
    <div className="flex flex-col space-y-6 pt-2 pb-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(RoutePath.PROJECTS)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Project Details</span>
        </div>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-lg"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium border border-white/10">
              {project.type}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/20 backdrop-blur-md border border-white/10 text-white`}>
              {project.status}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2 leading-tight">{project.name}</h1>
          <p className="text-indigo-100 text-sm opacity-90 mb-6">
            ID: {project.id}
          </p>

          <div className="grid grid-cols-2 gap-4 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <div>
              <p className="text-[10px] text-indigo-200 uppercase font-semibold mb-1">Start Date</p>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-200" />
                {new Date(project.startDate).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-indigo-200 uppercase font-semibold mb-1">Deadline</p>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-200" />
                {new Date(project.endDate).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Description
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Progress Stats */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Progress
          </h3>
          <span className="text-sm font-bold text-primary">{project.visitsCompleted} Visits Done</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-400 text-right">Target based on estimated timeline</p>
      </div>

      {/* Quick Actions */}
      <div className="w-full">
        <Button variant="outline" className="h-12 bg-white">
          <FileText className="w-4 h-4 text-primary" />
          Docs
        </Button>
      </div>

      {/* Team */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 p-2 rounded-full">
            <User className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">Team Members</h4>
            <p className="text-xs text-slate-500">3 assigned</p>
          </div>
        </div>
      </div>
    </div>
  );
};