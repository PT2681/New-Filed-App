import React from 'react';
import * as Icons from 'lucide-react';
import { Feature } from '../types';

interface FeatureCardProps {
  feature: Feature;
  onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onClick }) => {
  // Dynamically resolve icon from string name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[feature.iconName] || Icons.HelpCircle;

  return (
    <div
      onClick={onClick}
      className="bg-surface p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col items-center text-center gap-2 h-full justify-center"
    >
      <div className={`p-3 rounded-2xl w-fit ${feature.color} mb-1`}>
        <IconComponent className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{feature.title}</h3>
        <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-2">
          {feature.description}
        </p>
      </div>
    </div>
  );
};