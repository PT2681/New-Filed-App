import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 opacity-60">
      <div className="bg-slate-100 p-6 rounded-full">
        <Construction className="w-12 h-12 text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-700">{title}</h2>
      <p className="text-slate-500 text-sm max-w-xs">
        This section is currently under development. Check back later for updates.
      </p>
    </div>
  );
};