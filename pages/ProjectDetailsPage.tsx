import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, User, FileText, 
  MoreHorizontal, Layers, MapPin, CheckCircle2,
  Navigation, AlertCircle
} from 'lucide-react';
import { Button } from '../components/FormElements';
import { Project, ProjectStatus, RoutePath, Tour } from '../types';
import { MOCK_PROJECTS, MOCK_TOURS } from '../constants';

type TabType = 'OVERVIEW' | 'VISITS';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projectTours, setProjectTours] = useState<Tour[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  useEffect(() => {
    // 1. Load Project
    const foundProject = MOCK_PROJECTS.find(p => p.id === id);
    setProject(foundProject || null);

    // 2. Load Associated Tours (Visits)
    if (foundProject) {
      const savedTours = localStorage.getItem('tours_data');
      const allTours: Tour[] = savedTours ? JSON.parse(savedTours) : MOCK_TOURS;
      
      const relevantTours = allTours
        .filter(t => t.projectId === foundProject.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Newest first
        
      setProjectTours(relevantTours);
    }
  }, [id]);

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

  // Calculate progress bar width
  const progressPercent = Math.min((project.visitsCompleted / 20) * 100, 100); 

  const renderOverview = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
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

  const renderVisits = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
       <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-slate-900">Visit History</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {projectTours.length} Total
          </span>
       </div>

       {projectTours.length > 0 ? (
          projectTours.map((tour) => (
             <div 
                key={tour.id} 
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3"
             >
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-bold text-slate-900 text-sm">{tour.taskName}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                         <MapPin className="w-3 h-3 text-slate-400" />
                         {tour.toLocation}
                      </div>
                   </div>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      tour.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                      tour.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      tour.status === 'Claimed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-orange-50 text-orange-700 border-orange-100'
                   }`}>
                      {tour.status}
                   </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-xs">
                   <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(tour.startDate).toLocaleDateString()}
                   </div>
                   {tour.distanceCovered && (
                      <span className="font-medium text-slate-700">
                         {tour.distanceCovered} km covered
                      </span>
                   )}
                </div>
             </div>
          ))
       ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
             <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-2" />
             <p className="text-slate-500 text-sm">No visits recorded yet.</p>
          </div>
       )}
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 pt-2 pb-6">
      
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

      {/* Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'OVERVIEW' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('VISITS')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'VISITS' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Visit Log
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'OVERVIEW' ? renderOverview() : renderVisits()}
      </div>

    </div>
  );
};