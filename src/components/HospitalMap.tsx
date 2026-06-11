import React from 'react';
import { Department } from '../types';
import { Activity, Bed, FileSpreadsheet, Shield, ShieldX } from 'lucide-react';

interface HospitalMapProps {
  departments: Department[];
  selectedId: string;
  onSelectDepartment: (id: string) => void;
}

export default function HospitalMap({ departments, selectedId, onSelectDepartment }: HospitalMapProps) {
  // Map icons helper
  const renderDeptIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className={className} id="icon-activity" />;
      case 'Bed': return <Bed className={className} id="icon-bed" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className={className} id="icon-file" />;
      default: return <Shield className={className} id="icon-shield" />;
    }
  };

  const getBorderColor = (risk: Department['riskLevel'], isSelected: boolean) => {
    if (isSelected) return 'border-teal-500 shadow-lg ring-2 ring-teal-400/50 bg-teal-50/10';
    switch (risk) {
      case 'safe': return 'border-emerald-200 hover:border-emerald-400 bg-emerald-500/5';
      case 'LOW': return 'border-blue-200 hover:border-blue-400 bg-blue-500/5';
      case 'MODERATE': return 'border-amber-200 hover:border-amber-400 bg-amber-500/5';
      case 'CRITICAL': return 'border-rose-300 hover:border-rose-500 bg-rose-500/5 animate-pulse';
      default: return 'border-slate-200 hover:border-slate-350 bg-slate-50';
    }
  };

  const getBadgeColor = (risk: Department['riskLevel']) => {
    switch (risk) {
      case 'safe': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MODERATE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm" id="hospital-map-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2 mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-base" id="map-title">Clinical Watch Map</h3>
          <p className="text-xs text-slate-500" id="map-desc">Select a patient's bed to evaluate active prescriptions or inspect administration history.</p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-600" id="map-states-legend">
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Safe</span>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Moderate</span>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-rose-500 mr-1 animate-ping"></span> Critical</span>
        </div>
      </div>

      {/* Styled Grid/Map Floor Plan Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[300px]" id="map-grid-layout">
        
        {/* Row 1: Emergency & ICU */}
        {departments.filter(d => d.id === 'ED-A' || d.id === 'ICU-B').map((dept) => {
          const isSelected = selectedId === dept.id;
          return (
            <button
              key={dept.id}
              id={`map-dept-${dept.id}`}
              onClick={() => onSelectDepartment(dept.id)}
              className={`md:col-span-6 cursor-pointer text-left flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 min-h-[140px] ${getBorderColor(dept.riskLevel, isSelected)}`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-600'}`}>
                    {renderDeptIcon(dept.iconName, 'w-5 h-5')}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono block text-slate-400 font-bold uppercase">{dept.code}</span>
                    <h4 className="font-semibold text-slate-800 text-sm">{dept.patient.name}</h4>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded-full ${getBadgeColor(dept.riskLevel)}`}>
                  {dept.riskLevel.toUpperCase()}
                </span>
              </div>

              {/* Patient Basic Info */}
              <div className="my-2 text-[11px] text-slate-500 space-y-1">
                <div>Age: <strong className="text-slate-700">{dept.patient.age} years</strong> | Weight: <strong className="text-slate-700">{dept.patient.poids} kg</strong></div>
                <div className="truncate">Allergies: <strong className="text-rose-600 font-medium">{dept.patient.allergies.join(', ') || 'None documented'}</strong></div>
              </div>

              {/* Live Mini Stats */}
              <div className="pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-xs" id={`map-stats-${dept.id}`}>
                <div className="text-[10px] text-slate-400 font-mono">
                  {dept.issues.filter(i => i.status !== 'resolved').length} active alert(s)
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Clinical Safety Score: </span>
                  <span className={`font-mono font-bold ${dept.safetyScore >= 90 ? 'text-emerald-600' : dept.safetyScore >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {dept.safetyScore}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Central Hallway / Core Terminal Spacer */}
        <div className="md:col-span-12 py-2.5 px-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono" id="hallway-spacer">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
            <span>CLINICAL HALLWAY - INPATIENT CARE UNIT</span>
          </div>
          <span className="hidden sm:inline">ACTIVE PHARMACOLOGICAL DIRECTIVES</span>
        </div>

        {/* Row 2: Surgical, Pharmacy, CSSD */}
        {departments.filter(d => d.id !== 'ED-A' && d.id !== 'ICU-B').map((dept) => {
          const isSelected = selectedId === dept.id;
          return (
            <button
              key={dept.id}
              id={`map-dept-${dept.id}`}
              onClick={() => onSelectDepartment(dept.id)}
              className={`md:col-span-4 cursor-pointer text-left flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 min-h-[140px] ${getBorderColor(dept.riskLevel, isSelected)}`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-600'}`}>
                    {renderDeptIcon(dept.iconName, 'w-4 h-4')}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono block text-slate-400 font-bold uppercase">{dept.code}</span>
                    <h4 className="font-semibold text-slate-800 text-xs md:text-sm truncate max-w-[125px]">{dept.patient.name}</h4>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold border rounded-full ${getBadgeColor(dept.riskLevel)}`}>
                  {dept.riskLevel.toUpperCase()}
                </span>
              </div>

              {/* Patient Basic Info */}
              <div className="my-2 text-[10px] text-slate-500 space-y-0.5">
                <div>{dept.patient.age} yrs | {dept.patient.poids} kg</div>
                <div className="truncate text-slate-400">Allergies: <strong className="text-rose-600/90 font-medium">{dept.patient.allergies.join(', ') || 'None'}</strong></div>
              </div>

              {/* Live Mini Stats */}
              <div className="pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-xs" id={`map-stats-${dept.id}`}>
                <span className="text-[9px] font-mono text-slate-400">{dept.issues.filter(i => i.status !== 'resolved').length} alert(s)</span>
                <div className="text-right">
                  <span className={`font-mono text-xs font-bold ${dept.safetyScore >= 90 ? 'text-emerald-600' : dept.safetyScore >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {dept.safetyScore}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}

      </div>
    </div>
  );
}
