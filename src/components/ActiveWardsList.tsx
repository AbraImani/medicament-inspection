import React, { useState } from 'react';
import { Department, Issue } from '../types';
import { ShieldCheck, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, User, Sparkles } from 'lucide-react';

interface ActiveWardsListProps {
  departments: Department[];
  selectedDepartmentId: string;
  onSelectDepartment: (id: string) => void;
  onResolveIssue: (deptId: string, issueId: string, newStatus: Issue['status']) => Promise<void>;
}

export default function ActiveWardsList({ departments, selectedDepartmentId, onSelectDepartment, onResolveIssue }: ActiveWardsListProps) {
  const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>({});

  const toggleIssueExpand = (issueId: string) => {
    setExpandedIssueIds(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  const getValidationBadge = (status: Issue['statutValidation']) => {
    switch (status) {
      case 'CRITICAL': return 'bg-rose-50 border-rose-200 text-rose-700 font-bold animate-pulse';
      case 'MODERATE': return 'bg-amber-50 border-amber-200 text-amber-700 font-semibold';
      case 'LOW': return 'bg-emerald-50 border-emerald-250 text-emerald-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getStatusBadge = (status: Issue['status']) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'mitigating': return 'bg-teal-50 border-teal-200 text-teal-700';
      default: return 'bg-rose-50 border-rose-200 text-rose-700';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4" id="wards-list-scroller">
      <h3 className="font-semibold text-slate-800 text-base flex items-center space-x-2" id="ward-status-header">
        <ShieldCheck className="w-5 h-5 text-teal-600 font-bold" />
        <span>Prescription Inspections & Clinical Risk Monitoring</span>
      </h3>

      {departments.map((dept) => {
        const isSelected = selectedDepartmentId === dept.id;
        const activeIssues = dept.issues.filter(i => i.status !== 'resolved');
        const resolvedIssues = dept.issues.filter(i => i.status === 'resolved');

        return (
          <div
            key={dept.id}
            id={`ward-card-${dept.id}`}
            onClick={() => onSelectDepartment(dept.id)}
            className={`cursor-pointer bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isSelected ? 'border-teal-500 shadow-md ring-1 ring-teal-500/20' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
          >
            {/* Header Area */}
            <div className={`p-4 flex items-center justify-between ${isSelected ? 'bg-teal-50/25' : 'bg-slate-50/40'}`} id={`ward-header-${dept.id}`}>
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-full bg-slate-200/80 text-slate-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 block tracking-wider uppercase">{dept.code}</span>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base flex items-center">
                    {dept.patient.name}
                  </h4>
                </div>
              </div>

              {/* Progress and score display */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">Clinical Safety Index</span>
                  <span className={`font-mono text-base md:text-lg font-bold ${dept.safetyScore >= 90 ? 'text-emerald-500' : dept.safetyScore >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {dept.safetyScore}%
                  </span>
                </div>

                {/* Score healthbar */}
                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                  <div
                    className={`h-full rounded-full ${dept.safetyScore >= 90 ? 'bg-emerald-500' : dept.safetyScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${dept.safetyScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Patient Clinical Profile Ribbon */}
            <div className="bg-slate-50/50 border-t border-b border-slate-100 px-4 py-2.5 flex flex-wrap gap-2 items-center" id={`patient-stats-${dept.id}`}>
              <span className="text-[9px] font-mono text-slate-400 uppercase font-black">Clinical Profile:</span>
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-medium">Age: <strong className="font-bold">{dept.patient.age} years</strong></span>
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-medium">Weight: <strong className="font-bold">{dept.patient.poids} kg</strong></span>
              
              {dept.patient.allergies.length > 0 ? (
                <div className="flex items-center space-x-1 flex-wrap">
                  <span className="text-[10px] text-rose-500 font-mono">Allergies:</span>
                  {dept.patient.allergies.map((all, i) => (
                    <span key={i} className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 px-1.5 py-0.25 rounded font-mono font-medium">{all}</span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-emerald-600 font-mono">No documented allergies</span>
              )}

              {dept.patient.antecedents.length > 0 && (
                <div className="flex items-center space-x-1 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-mono">History:</span>
                  {dept.patient.antecedents.map((ant, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.25 rounded font-mono">{ant}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Core Issues Block */}
            <div className="p-4 space-y-3" id={`issues-${dept.id}`}>
              {activeIssues.length === 0 ? (
                <div className="text-xs text-slate-400 flex items-center space-x-1.5 py-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No active safety alerts. Administration chart cleared by AuthMed.</span>
                </div>
              ) : (
                activeIssues.map((issue) => {
                  const isExpanded = expandedIssueIds[issue.id];
                  return (
                    <div
                      key={issue.id}
                      className="border border-slate-150 rounded-lg p-3 hover:border-slate-350 transition-colors bg-white shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid shifting selection
                        toggleIssueExpand(issue.id);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1.5">
                            <span className={`px-1.5 py-0.5 text-[8px] font-mono font-semibold uppercase border rounded ${getValidationBadge(issue.statutValidation)}`}>
                              {issue.statutValidation}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-mono text-slate-500 uppercase border rounded bg-slate-50`}>
                              {issue.category}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center">
                              <Clock className="w-3 h-3 mr-0.5" />
                              {formatTime(issue.reportedAt)}
                            </span>
                          </div>
                          <h5 className="font-semibold text-slate-800 text-xs md:text-sm leading-tight flex items-center space-x-1">
                            <span className="text-teal-600">{issue.medicamentNom}</span>
                            <span className="text-slate-400 font-mono text-[11px]">({issue.doseSoumise})</span>
                          </h5>
                        </div>

                        {/* Collapsing icon trigger */}
                        <button className="text-slate-400 hover:text-slate-600" id={`expand-issue-btn-${issue.id}`}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 md:line-clamp-none leading-relaxed">
                        {issue.raisonnementDetaille}
                      </p>

                      {/* Expanded action steps & mitigation procedures */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              Actionable Mitigation Protocols Required:
                            </span>
                            <ul className="space-y-1 text-xs text-slate-600">
                              {issue.mitigationSteps.map((step, sIdx) => (
                                <li key={sIdx} className="flex items-start space-x-1.5 leading-relaxed">
                                  <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200 font-bold text-slate-500 flex items-center justify-center text-[9px] mt-0.5 shrink-0">
                                    {sIdx + 1}
                                  </span>
                                  <span className="text-[11px]">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Control Actions Buttons */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1" id={`actions-panel-${issue.id}`}>
                            {issue.status === 'active' && (
                              <button
                                onClick={() => onResolveIssue(dept.id, issue.id, 'mitigating')}
                                className="cursor-pointer px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium text-[10px] rounded border border-teal-200 transition-colors text-center"
                              >
                                Initiate Active Clinical Protocol
                              </button>
                            )}
                            <button
                              onClick={() => onResolveIssue(dept.id, issue.id, 'resolved')}
                              className="cursor-pointer px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-[10px] rounded border border-slate-950 transition-colors flex-1 text-center"
                            >
                              Confirm Resolution & Adapt Order
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Collapsed Resolved list count tracker */}
              {resolvedIssues.length > 0 && (
                <div className="text-[10px] font-mono text-emerald-600 border border-dashed border-emerald-100 bg-emerald-500/5 px-2 py-1.5 rounded flex items-center" id={`resolved-tracker-${dept.id}`}>
                  <span>● RESOLVED ALERTS ({resolvedIssues.length}): Therapeutic validation successfully completed.</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
