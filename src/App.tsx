import React, { useState, useEffect } from 'react';
import { Department, PatrolLog, Issue } from './types';
import HospitalMap from './components/HospitalMap';
import AgentControlPanel from './components/AgentControlPanel';
import HazardAuditTool from './components/HazardAuditTool';
import ActiveWardsList from './components/ActiveWardsList';
import { Bot, ShieldCheck, ShieldAlert, HeartPulse, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [logs, setLogs] = useState<PatrolLog[]>([]);
  const [agentStatus, setAgentStatus] = useState<'Monitoring' | 'Auditing' | 'Scanning' | 'Standby'>('Standby');
  const [lastScanAt, setLastScanAt] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ED-A');
  const [loading, setLoading] = useState<boolean>(true);

  // Sync state with server-side database
  const fetchHospitalState = async () => {
    try {
      const res = await fetch('/api/hospital');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
        setLogs(data.logs);
        setAgentStatus(data.agentStatus);
        setLastScanAt(data.lastScanAt);
      }
    } catch (err) {
      console.error("Failed to connect to express backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalState();
  }, []);

  const handleSelectDepartment = (id: string) => {
    setSelectedDepartmentId(id);
  };

  const handleAuditCompleted = (report: any, updatedDepartments: Department[], updatedLogs: PatrolLog[]) => {
    setDepartments(updatedDepartments);
    setLogs(updatedLogs);
    // Automatically select the patient ward that was just audited to show findings
    if (report && report.patientId) {
      setSelectedDepartmentId(report.patientId);
    }
  };

  const handleResolveIssue = async (deptId: string, issueId: string, newStatus: Issue['status']) => {
    try {
      const res = await fetch("/api/hospital/resolve-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: deptId,
          issueId,
          newStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to update hazard status on server:", err);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setAgentStatus('Scanning');
      const res = await fetch("/api/hospital/trigger-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
        setLogs(data.logs);
        setAgentStatus(data.agentStatus);
        setLastScanAt(data.lastScanAt);
      }
    } catch (err) {
      console.error("Agent sweep request failed:", err);
    } finally {
      setAgentStatus('Monitoring');
    }
  };

  // Calculate Overall Score helper
  const calculateOverallScore = () => {
    if (departments.length === 0) return 100;
    const sum = departments.reduce((acc, current) => acc + current.safetyScore, 0);
    return Math.round(sum / departments.length);
  };

  const overallScore = calculateOverallScore();

  const getAgentStatusLabel = (status: string) => {
    switch (status) {
      case 'Monitoring': return 'Active Watch';
      case 'Auditing': return 'Auditing';
      case 'Scanning': return 'Live Scan';
      default: return 'Standby';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center" id="loading-state">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin"></div>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">INITIALIZING CLINICAL SURVEILLANCE SYSTEM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" id="applet-viewport">
      
      {/* Primary Branded Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs" id="app-main-header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between" id="header-content-container">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-600 text-white p-2 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-slate-800 text-base md:text-xl tracking-tight leading-none">AuthMed : Hospital Risk Agent</h1>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-mono font-medium px-1.5 py-0.5 rounded">v3.5 Live</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Autonomous Agent for Clinical Safety & Medication Administration Risk Inspection</p>
            </div>
          </div>

          {/* Unified Clinical Integrity Badge Panel */}
          <div className="flex items-center space-x-4" id="header-status-panel">
            <div className="text-right hidden sm:block">
              <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Therapeutic Safety</span>
              <div className="flex items-center space-x-2">
                <span className={`text-base md:text-xl font-bold font-mono ${overallScore >= 90 ? 'text-emerald-500' : overallScore >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {overallScore}%
                </span>
                <span className="text-xs text-slate-400">High Compliance</span>
              </div>
            </div>

            <div className="px-3 py-2 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 flex items-center space-x-2 text-xs font-mono" id="agent-active-badge">
              <div className="relative">
                <Bot className="w-4 h-4 text-teal-300" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <span className="hidden md:inline uppercase text-[10px] text-slate-400">AGENT:</span>
              <span className="text-teal-300 uppercase text-[10px] font-bold">{getAgentStatusLabel(agentStatus)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6" id="app-main-content">
        
        {/* Dynamic Alert Banner for Hospital Risks */}
        {overallScore < 85 && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-start space-x-3 mb-6 shadow-xs animate-slideDown animate-duration-300" id="critical-alert-banner">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm">
              <h4 className="font-bold">Critical Vigilance Threshold Breached</h4>
              <p className="text-rose-600 mt-0.5">The average pharmacological safety index has dropped to <strong className="font-black">{overallScore}%</strong> due to active safety alerts. Please review required risk mitigation actions.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-grid">
          
          {/* LEFT WING: Floor plan map and active list */}
          <div className="lg:col-span-8 flex flex-col space-y-6" id="dashboard-left-wing">
            
            {/* Interactive map */}
            <HospitalMap
              departments={departments}
              selectedId={selectedDepartmentId}
              onSelectDepartment={handleSelectDepartment}
            />

            {/* active lists panel */}
            <ActiveWardsList
              departments={departments}
              selectedDepartmentId={selectedDepartmentId}
              onSelectDepartment={handleSelectDepartment}
              onResolveIssue={handleResolveIssue}
            />
            
          </div>

          {/* RIGHT WING: Telemetry, Logs feed and AI Audits tool */}
          <div className="lg:col-span-4 flex flex-col space-y-6" id="dashboard-right-wing">
            
            {/* Agent terminal panel */}
            <AgentControlPanel
              agentStatus={agentStatus}
              logs={logs}
              lastScanAt={lastScanAt}
              onTriggerScan={handleTriggerScan}
            />

            {/* Gemini audit tool */}
            <HazardAuditTool
              departments={departments}
              selectedDepartmentId={selectedDepartmentId}
              onAuditCompleted={handleAuditCompleted}
              onSetAgentStatus={setAgentStatus}
            />

          </div>

        </div>

      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center mt-auto" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 text-[10px] font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-y-2">
          <span>© 2026 REMIX: AUTHMED RISK CONTROL SYSTEM INC.</span>
          <span>AUTONOMOUS CLINICAL AGENT IN ENFORCEMENT MODE</span>
        </div>
      </footer>

    </div>
  );
}
