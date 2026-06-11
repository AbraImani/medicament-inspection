import React, { useState } from 'react';
import { PatrolLog } from '../types';
import { Bot, RefreshCw, Terminal, Eye, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

interface AgentControlPanelProps {
  agentStatus: 'Monitoring' | 'Auditing' | 'Scanning' | 'Standby';
  logs: PatrolLog[];
  lastScanAt: string;
  onTriggerScan: () => Promise<void>;
}

export default function AgentControlPanel({ agentStatus, logs, lastScanAt, onTriggerScan }: AgentControlPanelProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScanClick = async () => {
    setIsScanning(true);
    await onTriggerScan();
    setTimeout(() => {
      setIsScanning(false);
    }, 1000);
  };

  const getLogIcon = (type: PatrolLog['type']) => {
    switch (type) {
      case 'alert':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0 animate-pulse" />;
      case 'warning':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />;
      default:
        return <Eye className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case 'Monitoring': return 'Active Watch';
      case 'Auditing': return 'Auditing Prescription';
      case 'Scanning': return 'Global Clinical Scan';
      default: return 'Standby';
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-5 shadow-sm h-full flex flex-col justify-between" id="agent-control-panel">
      {/* Upper Status Block */}
      <div id="agent-header-status">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${isScanning ? 'bg-teal-500 animate-spin text-white' : 'bg-slate-800 text-teal-400'}`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-xs md:text-sm">AuthMed AI Agent System</h3>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${agentStatus === 'Monitoring' ? 'bg-emerald-400 font-bold' : 'bg-amber-400'} animate-pulse`}></span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                  {getStatusLabelText(agentStatus)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleScanClick}
            disabled={isScanning || agentStatus !== 'Monitoring'}
            className={`cursor-pointer px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs transition-colors flex items-center space-x-1 text-teal-300 font-medium ${isScanning ? 'opacity-50' : ''}`}
            id="trigger-scan-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Sync Charts'}</span>
          </button>
        </div>

        {/* Scan Time Block */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] text-slate-400 flex items-center justify-between font-mono mb-4" id="agent-scan-timer">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>LAST CLINICAL SWEEP:</span>
          </div>
          <span className="text-teal-300 font-semibold">{formatTime(lastScanAt)}</span>
        </div>
      </div>

      {/* Terminal Live logs */}
      <div className="flex-1 flex flex-col min-h-[160px]" id="logs-container">
        <div className="flex items-center space-x-2 mb-2 text-slate-400 text-xs font-mono border-b border-slate-800 pb-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span>REAL-TIME INSPECTION TELEMETRY</span>
        </div>

        <div className="bg-slate-950 rounded-lg p-3 border border-slate-850 h-[170px] overflow-y-auto font-mono text-[11px] space-y-2 flex-grow scrollbar-thin scrollbar-thumb-slate-800" id="logs-feed-scroll">
          {logs.length === 0 ? (
            <div className="text-slate-600 text-center py-6">No telemetry logs found. Click Sync Charts to retrieve logs.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 hover:bg-slate-900/30 p-1 rounded transition-colors" id={`log-item-${log.id}`}>
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                    <span className="font-semibold text-slate-400 uppercase truncate max-w-[150px]">{log.departmentName}</span>
                    <span>{formatTime(log.timestamp)}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
