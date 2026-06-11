import React, { useState } from 'react';
import { Department } from '../types';
import { Send, FileText, AlertCircle, Sparkles, ShieldCheck, Check } from 'lucide-react';

interface HazardAuditToolProps {
  departments: Department[];
  selectedDepartmentId: string;
  onAuditCompleted: (report: any, updatedDepartments: Department[], updatedLogs: any[]) => void;
  onSetAgentStatus: (status: 'Monitoring' | 'Auditing' | 'Scanning' | 'Standby') => void;
}

const PRESET_ISSUES = [
  {
    label: "Case 1: Penicillin Allergy / Amoxicillin",
    text: "Oral administration of Amoxicillin 500 mg to a patient with a declared allergy to Penicillin."
  },
  {
    label: "Case 2: Paracetamol Overdose",
    text: "IV infusion of Paracetamol 1000 mg for a 5-year-old child weighing 18 kg."
  },
  {
    label: "Case 3: Severe Asthma / Ketoprofen",
    text: "Prescription of Ketoprofen (NSAID) 100 mg for joint pain in a patient with a documented history of severe asthma."
  },
  {
    label: "Case 4: Oral Anticoagulant / Aspirin Interaction",
    text: "Co-administration of Aspirin 160 mg to a patient actively receiving Xarelto (Direct Oral Anticoagulant) therapy for Atrial Fibrillation."
  }
];

export default function HazardAuditTool({ departments, selectedDepartmentId, onAuditCompleted, onSetAgentStatus }: HazardAuditToolProps) {
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<any | null>(null);

  // Custom states for hackathon judges direct sandbox
  const [judgePatientName, setJudgePatientName] = useState('');
  const [judgePatientAge, setJudgePatientAge] = useState('');
  const [judgePatientPoids, setJudgePatientPoids] = useState('');
  const [judgeAllergiesAndAntecedents, setJudgeAllergiesAndAntecedents] = useState('');
  const [judgeMedNom, setJudgeMedNom] = useState('');
  const [judgeDose, setJudgeDose] = useState('');

  // Find selected department name
  const currentDept = departments.find(d => d.id === selectedDepartmentId);
  const deptName = currentDept ? currentDept.patient.name : "Select a bed";

  const triggerAudit = async (noteToSend: string) => {
    if (!noteToSend.trim()) return;
    setLoading(true);
    onSetAgentStatus('Auditing');
    setActiveReport(null);

    try {
      const res = await fetch("/api/hospital/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          observation: noteToSend,
          departmentId: selectedDepartmentId
        })
      });

      if (!res.ok) throw new Error("Clinical prescription evaluation failed.");

      const data = await res.json();
      setActiveReport(data.report);
      onAuditCompleted(data.report, data.departments, data.logs);
    } catch (err) {
      console.error("Clinical audit error:", err);
    } finally {
      setLoading(false);
      onSetAgentStatus('Monitoring');
    }
  };

  const triggerSandboxAudit = async () => {
    if (
      !judgePatientName.trim() ||
      !judgePatientAge.trim() ||
      !judgePatientPoids.trim() ||
      !judgeMedNom.trim() ||
      !judgeDose.trim()
    ) return;

    setLoading(true);
    onSetAgentStatus('Auditing');
    setActiveReport(null);

    try {
      const res = await fetch("/api/hospital/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customPatient: {
            name: judgePatientName,
            age: parseInt(judgePatientAge) || 45,
            poids: parseInt(judgePatientPoids) || 70,
            allergies: judgeAllergiesAndAntecedents,
            antecedents: judgeAllergiesAndAntecedents
          },
          customPrescription: {
            medicamentNom: judgeMedNom,
            doseSoumise: judgeDose
          }
        })
      });

      if (!res.ok) throw new Error("Interactive clinical diagnostic failed.");

      const data = await res.json();
      setActiveReport(data.report);
      onAuditCompleted(data.report, data.departments, data.logs);
    } catch (err) {
      console.error("Clinical custom sandbox audit error:", err);
    } finally {
      setLoading(false);
      onSetAgentStatus('Monitoring');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudit(observation);
  };

  const getValidationColorStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CRITICAL': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'MODERATE': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm" id="hazard-audit-container">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
        <Sparkles className="w-5 h-5 text-teal-600 animate-pulse animate-duration-1000" />
        <div>
          <h3 className="font-semibold text-slate-800 text-sm md:text-base">Clinical Risk Auditor</h3>
          <p className="text-xs text-slate-500">Evaluate prescription safety in real time powered by AuthMed AI.</p>
        </div>
      </div>

      {/* Target Department Selection Indicator */}
      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-4 text-xs text-slate-600 flex justify-between items-center" id="audit-dept-indicator">
        <span>Target patient:</span>
        <strong className="text-slate-800 font-bold uppercase font-mono">{deptName} ({currentDept?.code || "Bed"})</strong>
      </div>

      {/* Preset Buttons */}
      <div className="mb-4" id="presets-container">
        <label className="text-[10px] font-mono tracking-wide uppercase font-bold text-slate-400 block mb-2">Clinical test case simulators:</label>
        <div className="grid grid-cols-1 gap-1.5" id="presets-selectors">
          {PRESET_ISSUES.map((p, idx) => (
            <button
              key={idx}
              id={`preset-btn-${idx}`}
              type="button"
              onClick={() => {
                setObservation(p.text);
                triggerAudit(p.text);
              }}
              disabled={loading}
              className="cursor-pointer text-[11px] text-left px-3 py-2 border border-slate-100 hover:border-teal-300 bg-slate-50 hover:bg-teal-50/10 rounded-lg text-slate-700 transition-colors font-medium truncate"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3" id="audit-form-element">
        <div className="relative">
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            disabled={loading}
            placeholder={`Type a drug administration order manually... (e.g., "Administer Ibuprofen 400mg to Luc")`}
            rows={3}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 resize-none font-sans"
            id="audit-text-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !observation.trim()}
          className="cursor-pointer w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium hover:text-teal-300 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          id="audit-submit-btn"
        >
          {loading ? (
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-teal-300 animate-spin"></span>
              <span>Autonomous clinical analysis...</span>
            </div>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Launch Clinical Audit</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="border-t border-slate-100 my-5 pt-5" id="judges-sandbox-separator"></div>

      {/* Judges Interactive Testing Section */}
      <div className="space-y-3" id="judges-sandbox-container">
        <div className="flex items-center space-x-1.5 mb-2">
          <span className="text-xs font-mono font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded">🧪 Judges Evaluation Console: Direct Live Audit</span>
        </div>

        <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100" id="sandbox-form">
          {/* Nom du Patient */}
          <div>
            <label className="text-[10px] font-mono tracking-wide uppercase font-bold text-slate-500 block mb-1">Patient Name:</label>
            <input
              type="text"
              value={judgePatientName}
              onChange={(e) => setJudgePatientName(e.target.value)}
              disabled={loading}
              placeholder="Ex: Alice Smith"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 font-sans"
              id="sandbox-patient-name"
            />
          </div>

          {/* Âge et Poids (Côte à côte) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-wide uppercase font-bold text-slate-500 block mb-1">Age:</label>
              <input
                type="text"
                value={judgePatientAge}
                onChange={(e) => setJudgePatientAge(e.target.value)}
                disabled={loading}
                placeholder="Ex: 34"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 font-sans"
                id="sandbox-patient-age"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-wide uppercase font-bold text-slate-500 block mb-1">Weight:</label>
              <input
                type="text"
                value={judgePatientPoids}
                onChange={(e) => setJudgePatientPoids(e.target.value)}
                disabled={loading}
                placeholder="Ex: 68"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 font-sans"
                id="sandbox-patient-weight"
              />
            </div>
          </div>

          {/* Allergies & Antécédents */}
          <div>
            <label className="text-[10px] font-mono tracking-wide uppercase font-bold text-slate-500 block mb-1">Allergies & Clinical History:</label>
            <input
              type="text"
              value={judgeAllergiesAndAntecedents}
              onChange={(e) => setJudgeAllergiesAndAntecedents(e.target.value)}
              disabled={loading}
              placeholder="Ex: Penicillin, Asthma"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 font-sans"
              id="sandbox-patient-allergies"
            />
          </div>

          {/* Médicament à tester & Dose prévue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-wide uppercase font-bold text-slate-500 block mb-1">Medication to test:</label>
              <input
                type="text"
                value={judgeMedNom}
                onChange={(e) => setJudgeMedNom(e.target.value)}
                disabled={loading}
                placeholder="Ex: Augmentin"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 font-sans"
                id="sandbox-med-name"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-wide uppercase font-bold text-slate-500 block mb-1">Planned Dose:</label>
              <input
                type="text"
                value={judgeDose}
                onChange={(e) => setJudgeDose(e.target.value)}
                disabled={loading}
                placeholder="Ex: 1000mg"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 font-sans"
                id="sandbox-med-dose"
              />
            </div>
          </div>

          {/* Big action button */}
          <button
            type="button"
            onClick={triggerSandboxAudit}
            disabled={
              loading ||
              !judgePatientName.trim() ||
              !judgePatientAge.trim() ||
              !judgePatientPoids.trim() ||
              !judgeMedNom.trim() ||
              !judgeDose.trim()
            }
            className="cursor-pointer w-full mt-2 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-850 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            id="sandbox-submit-btn"
          >
            {loading ? (
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                <span>Live cognitive analysis...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-100" />
                <span>Launch Live Audit via Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Report Output Display */}
      {activeReport && (
        <div className="mt-5 p-4 rounded-xl border border-dashed border-teal-200 bg-teal-50/5/5 shadow-inner animate-fadeIn" id="audit-report-output">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-[10px] font-mono text-teal-600 flex items-center space-x-1 font-semibold uppercase">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Generated Audit Report
            </span>
            <span className="text-[9px] font-mono text-slate-400 font-medium">
              {activeReport.isMockSimulated ? 'Local Emergency Engine' : 'Cognitive Analytics active'}
            </span>
          </div>

          <div className="flex items-start justify-between mb-2 gap-2">
            <h4 className="font-semibold text-slate-800 text-xs md:text-sm leading-tight">{activeReport.title}</h4>
            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border rounded-full shrink-0 ${getValidationColorStyle(activeReport.statutValidation || activeReport.riskLevel)}`}>
              {activeReport.statutValidation || activeReport.riskLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 text-[10px] text-slate-500 font-mono mb-3" id="report-stats">
            <div>Risk Category: <strong className="text-slate-800 font-bold">{activeReport.category}</strong></div>
            <div>Impact score: <strong className="text-rose-500 font-black">{activeReport.scoreImpact} pts</strong></div>
          </div>

          {/* Clinical Critique */}
          <div className="mb-4">
            <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">Clinical Rationale & Mechanism</label>
            <p className="text-[11px] text-slate-700 leading-relaxed font-sans">{activeReport.detailedAnalysis}</p>
          </div>

          {/* Action Checklist */}
          <div>
            <label className="text-[9px] font-mono font-bold text-slate-400 block mb-2 uppercase">Actionable Mitigation Protocols</label>
            <ul className="space-y-1.5 text-xs animate-slideDown" id="report-steps">
              {activeReport.mitigationSteps?.map((step: string, sIdx: number) => (
                <li key={sIdx} className="flex items-start space-x-2 text-slate-700" id={`step-${sIdx}`}>
                  <span className="w-4 h-4 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-[10px] font-bold text-teal-600 mt-0.5 shrink-0">
                    {sIdx + 1}
                  </span>
                  <span className="leading-relaxed text-[11px] font-sans">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
