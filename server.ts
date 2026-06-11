import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Define Types locally for server safety
interface Patient {
  name: string;
  age: number;
  poids: number; // in kg
  allergies: string[];
  antecedents: string[];
}

interface Issue {
  id: string;
  patientId: string; // maps to departmentId
  medicamentNom: string;
  doseSoumise: string;
  statutValidation: 'LOW' | 'MODERATE' | 'CRITICAL';
  scoreImpact: number; // e.g. -10, -25
  raisonnementDetaille: string;
  mitigationSteps: string[];
  reportedAt: string;
  status: 'active' | 'mitigating' | 'resolved';
  category: 'Allergy' | 'Overdose' | 'Interaction' | 'Dosage' | 'Contraindication' | 'Other';
}

interface Department {
  id: string; // "CH-101" etc.
  name: string; // Patient Name
  code: string; // Bed / Room code
  iconName: string; // mapped on client
  riskLevel: 'safe' | 'LOW' | 'MODERATE' | 'CRITICAL';
  safetyScore: number; // Clinical safety index 0-100
  issues: Issue[];
  patient: Patient;
  lastInspectedAt: string;
}

interface PatrolLog {
  id: string;
  timestamp: string;
  departmentId: string;
  departmentName: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
}

// In-memory clinical state database
const serverState = {
  departments: [] as Department[],
  patrolLogs: [] as PatrolLog[],
  agentStatus: 'Monitoring' as 'Monitoring' | 'Auditing' | 'Scanning' | 'Standby',
  lastScanAt: new Date().toISOString()
};

function initializeState() {
  serverState.departments = [
    {
      id: "ED-A",
      name: "John Doe",
      code: "Room 101-A",
      iconName: "Activity",
      riskLevel: "CRITICAL",
      safetyScore: 75,
      lastInspectedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      patient: {
        name: "John Doe",
        age: 68,
        poids: 74,
        allergies: ["Penicillin", "Aspirin"],
        antecedents: ["Arterial hypertension", "Moderate renal impairment"]
      },
      issues: [
        {
          id: "iss-1",
          patientId: "ED-A",
          medicamentNom: "Aspirin protect",
          doseSoumise: "160 mg",
          statutValidation: "CRITICAL",
          scoreImpact: -25,
          raisonnementDetaille: "Safety Audit: Critical allergy alert. The patient has a documented severe allergy to Aspirin (at risk of anaphylactic shock and life-threatening bronchospasm). Immediate administration is blocked by the AuthMed agent.",
          mitigationSteps: [
            "Retract the prescription entry from Room 101-A's administration plan.",
            "Notify the presiding physician for an alternative treatment (e.g., Clopidogrel).",
            "Monitor clinical vitals and oxygen saturation within 2 hours as a precaution."
          ],
          reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          status: "active",
          category: "Allergy"
        }
      ]
    },
    {
      id: "ICU-B",
      name: "Mary Smith",
      code: "Room 102-B",
      iconName: "Bed",
      riskLevel: "MODERATE",
      safetyScore: 85,
      lastInspectedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      patient: {
        name: "Mary Smith",
        age: 42,
        poids: 58,
        allergies: ["Sulfa drugs"],
        antecedents: ["Severe asthma", "Pregnancy (2nd trimester)"]
      },
      issues: [
        {
          id: "iss-2",
          patientId: "ICU-B",
          medicamentNom: "Ketoprofen (NSAID)",
          doseSoumise: "100 mg",
          statutValidation: "MODERATE",
          scoreImpact: -15,
          raisonnementDetaille: "Intolerance Audit: Risk of severe NSAID-induced asthma exacerbation. Administering non-steroidal anti-inflammatory agents to a patient with severe asthma can trigger severe acute bronchospasm via leukotriene synthesis diversion.",
          mitigationSteps: [
            "Substitute with a clinical-grade neutral analgesic such as Paracetamol or Tramadol.",
            "If NSAID use is verified as vital, ensure rapid-acting rescue bronchodilators are available at bedside.",
            "Update the bedside respiratory warning sign and alert nursing staff."
          ],
          reportedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          status: "active",
          category: "Contraindication"
        }
      ]
    },
    {
      id: "OR-C",
      name: "Luke Vance",
      code: "Room 103-C",
      iconName: "Bed",
      riskLevel: "safe",
      safetyScore: 100,
      lastInspectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      patient: {
        name: "Luke Vance",
        age: 75,
        poids: 82,
        allergies: [],
        antecedents: ["Atrial fibrillation", "Chronic digestive ulcer disease"]
      },
      issues: []
    },
    {
      id: "PH-D",
      name: "Sophie Bernard",
      code: "Room 104-D",
      iconName: "FileSpreadsheet",
      riskLevel: "safe",
      safetyScore: 100,
      lastInspectedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      patient: {
        name: "Sophie Bernard",
        age: 29,
        poids: 61,
        allergies: ["Ibuprofen"],
        antecedents: ["Mild hepatic insufficiency"]
      },
      issues: []
    },
    {
      id: "SPD-E",
      name: "Anthony Miller",
      code: "Room 105-E",
      iconName: "Shield",
      riskLevel: "CRITICAL",
      safetyScore: 70,
      lastInspectedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      patient: {
        name: "Anthony Miller",
        age: 5,
        poids: 18,
        allergies: [],
        antecedents: ["Moderate childhood asthma"]
      },
      issues: [
        {
          id: "iss-3",
          patientId: "SPD-E",
          medicamentNom: "Paracetamol IV infusion",
          doseSoumise: "1000 mg",
          statutValidation: "CRITICAL",
          scoreImpact: -30,
          raisonnementDetaille: "Dosage Audit: Severe pediatric overdose risk detected. For a 5-year-old child weighing 18 kg, the maximum single unit dosage is 270 mg (15mg/kg limit). Administering 1000 mg causes a critical hazard of acute hepatotoxicity.",
          mitigationSteps: [
            "Immediately cancel the 1g intravenous infusion order.",
            "Recalculate target dosage to 270 mg (15 mg/kg) for safe pediatric administration.",
            "Confirm order adjustment with clinical pharmacy advisor and recalibrate pump limits."
          ],
          reportedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          status: "active",
          category: "Overdose"
        }
      ]
    }
  ];

  serverState.patrolLogs = [
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      departmentId: "SPD-E",
      departmentName: "Room 105 - Anthony Miller",
      type: "alert",
      message: "[AUTH-MED] Intercepted pediatric overdose risk for Anthony Miller: IV Paracetamol suspended."
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      departmentId: "ED-A",
      departmentName: "Room 101 - John Doe",
      type: "warning",
      message: "[GEMINI-AGENT] Preventive block: Intention to prescribe Aspirin to John Doe (allergic diagnostic)."
    },
    {
      id: "log-3",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      departmentId: "OR-C",
      departmentName: "Room 103 - Luke Vance",
      type: "success",
      message: "[AUTH-MED] Clinical checklist review for Luke Vance completed. Prescriptions are 100% safe."
    },
    {
      id: "log-4",
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      departmentId: "SYSTEM",
      departmentName: "Global Clinic",
      type: "info",
      message: "[SYSTEM] AuthMed Medical Administration Hazard Inspection Agent initialized. Clinical database loaded."
    }
  ];
}

initializeState();

// recalculate clinical index
function recalculateScore(dept: Department) {
  let score = 100;
  dept.issues.forEach(iss => {
    if (iss.status === 'active') {
      score += iss.scoreImpact;
    } else if (iss.status === 'mitigating') {
      score += Math.round(iss.scoreImpact * 0.4);
    }
  });
  dept.safetyScore = Math.max(0, Math.min(100, score));

  if (dept.safetyScore >= 95) dept.riskLevel = 'safe';
  else if (dept.safetyScore >= 85) dept.riskLevel = 'LOW';
  else if (dept.safetyScore >= 70) dept.riskLevel = 'MODERATE';
  else dept.riskLevel = 'CRITICAL';
}

// Fallback dynamic generator matching schema
function generateSimulatedAudit(medicamentNom: string, doseSoumise: string, patient: Patient) {
  const med = medicamentNom.toLowerCase();
  const allergies = patient.allergies.map(a => a.toLowerCase());
  const antecedents = patient.antecedents.map(a => a.toLowerCase());

  // Allergies Check
  for (let allergy of allergies) {
    if (med.includes(allergy) || (allergy.includes("penicillin") && med.includes("amox"))) {
      return {
        title: `Contraindication: Severe allergenic conflict (${medicamentNom})`,
        riskLevel: "CRITICAL" as const,
        statutValidation: "CRITICAL" as const,
        category: "Allergy" as const,
        scoreImpact: -25,
        detailedAnalysis: `Clinical Safety Audit: Potential anaphylactic shock hazard. The patient's clinical file notes a recorded allergy to (${patient.allergies.join(", ")}). The administration of ${medicamentNom} is immediately blocked by the AuthMed agent.`,
        mitigationSteps: [
          "Initiate immediate suspension of the administration and secure the syringe.",
          "Notify the prescribing physician for safe clinical alternative selection.",
          "Ensure an anaphylactic emergency cart is stationed near the patient bedside."
        ]
      };
    }
  }

  // Dosage check
  const doseNum = parseFloat(doseSoumise);
  if (doseSoumise.includes("g") || doseNum > 900 || (med.includes("para") && (doseNum >= 1000 || doseSoumise.includes("1g")) && patient.age < 12)) {
    return {
      title: `Overdose Alert: Excessive dosage suspected (${doseSoumise})`,
      riskLevel: "CRITICAL" as const,
      statutValidation: "CRITICAL" as const,
      category: "Overdose" as const,
      scoreImpact: -20,
      detailedAnalysis: `Dosage Audit: Potential toxicosomatic exposure. For a patient weighing ${patient.poids} kg and aged ${patient.age} years, the submitted medication dose (${doseSoumise}) exceeds recommended margins, risking critical hepatic or systemic damage.`,
      mitigationSteps: [
        "Suspend the therapeutic order pending official pediatric/weight-based dose verification.",
        "Adjust unit dose precisely matching the 15 mg/kg safety threshold.",
        "Establish an hourly clinical surveillance plan targeting hepatic biomarkers."
      ]
    };
  }

  // Contraindications / asthma
  if (med.includes("ibuprofen") || med.includes("ketoprofen") || med.includes("aspirin") || med.includes("voltaren") || med.includes("profenid")) {
    if (antecedents.some(ant => ant.includes("asthma") || ant.includes("pregnancy") || ant.includes("ulcer"))) {
      return {
        title: `Major Contraindication: High Risk of Bronchospasm / Gastric Lesion`,
        riskLevel: "MODERATE" as const,
        statutValidation: "MODERATE" as const,
        category: "Contraindication" as const,
        scoreImpact: -15,
        detailedAnalysis: `Medical Audit: Pathophysiological conflict. The patient's background of (${patient.antecedents.join(", ")}) exposes them to serious cox-inhibitor (NSAID) induced bronchospasms or severe mucosal hemorrhaging.`,
        mitigationSteps: [
          "Consider prescribing non-steroidal neutral analgesics as safer options.",
          "Arrange continuous respiratory screening and pulse-oximetry if NSAIDs are unavoidable.",
          "Incorporate a cytoprotective agent (proton pump inhibitor) to offset gastric risks."
        ]
      };
    }
  }

  // General low risk
  return {
    title: `Approved Administration: Standard safety profile (${medicamentNom})`,
    riskLevel: "LOW" as const,
    statutValidation: "LOW" as const,
    category: "Dosage" as const,
    scoreImpact: -5,
    detailedAnalysis: `Administration Audit: Validation successful. AuthMed's safety inspection detected no active allergenic threats or critical historical contradictions matching the patient's record (${patient.antecedents.join(", ") || "no restrictions"}).`,
    mitigationSteps: [
      "Approve oral or intravenous administration under standard nursing observation.",
      "Log the AuthMed autonomous safety clearance in the electronic health record.",
      "Maintain default vital sign logging intervals per standard ward protocols."
    ]
  };
}

// Initializing server-side Gemini client
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini client initialized for AuthMed Medical Risk Inspection.");
  } else {
    console.warn("GEMINI_API_KEY is not defined. Using rule-based fallback audit engine.");
  }
} catch (err) {
  console.error("Failed to setup Gemini client in server.ts:", err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/hospital", (req, res) => {
    res.json({
      departments: serverState.departments,
      logs: serverState.patrolLogs,
      agentStatus: serverState.agentStatus,
      lastScanAt: serverState.lastScanAt
    });
  });

  // Main Audit API using Gemini 3.5 Flash
  app.post("/api/hospital/audit", async (req, res) => {
    const { observation, departmentId, customPatient, customPrescription } = req.body;
    
    let isCustomMode = !!customPatient;
    let patient: Patient;
    let mainObservation = observation;
    let targetDeptId = departmentId || "ED-A";
    let deptNameText = "";

    if (isCustomMode) {
      patient = {
        name: customPatient.name || "Virtual Patient",
        age: parseInt(customPatient.age) || 45,
        poids: parseInt(customPatient.poids) || 70,
        allergies: Array.isArray(customPatient.allergies) 
          ? customPatient.allergies 
          : (customPatient.allergies ? String(customPatient.allergies).split(",").map(all => all.trim()).filter(Boolean) : []),
        antecedents: Array.isArray(customPatient.antecedents)
          ? customPatient.antecedents
          : (customPatient.antecedents ? String(customPatient.antecedents).split(",").map(ant => ant.trim()).filter(Boolean) : [])
      };
      const medName = customPrescription?.medicamentNom || "Unknown Drug";
      const dose = customPrescription?.doseSoumise || "Dose not specified";
      mainObservation = `Prescribing ${medName} at a dose of ${dose}`;
      deptNameText = `VIP Bed - ${patient.name}`;

      // Insert starting log immediately for telemetric display
      const initialLog: PatrolLog = {
        id: `log-user-start-${Date.now()}`,
        timestamp: new Date().toISOString(),
        departmentId: "USER-SANDBOX",
        departmentName: `TEST ZONE - ${patient.name}`,
        type: "info",
        message: `[USER-AUDIT] Submitting custom prescription of [${medName} - ${dose}] for patient [${patient.name}, ${patient.age}yo, ${patient.poids}kg] to Gemini v3.5 agent.`
      };
      serverState.patrolLogs.unshift(initialLog);
    } else {
      const dept = serverState.departments.find(d => d.id === targetDeptId);
      if (!dept) {
        return res.status(404).json({ error: "Patient / Room not located." });
      }
      patient = dept.patient;
      deptNameText = `Room ${dept.code.split(" ")[1] ?? dept.id} - ${patient.name}`;
    }

    if (!mainObservation) {
      return res.status(400).json({ error: "The drug administration intent or clinical entry is mandatory." });
    }

    console.log(`[AUTH-MED] Inspecting clinical risk for: ${patient.name}. Input: "${mainObservation}"`);
    serverState.agentStatus = 'Auditing';

    let auditResult;
    let isMock = true;

    if (ai) {
      try {
        const prompt = `You are the Autonomous AuthMed Clinical Audit Agent. Analyze the following drug administration intent against the patient clinical profile.
Patient: ${patient.name}
Age: ${patient.age} years old
Weight: ${patient.poids} kg
Documented Allergies: ${patient.allergies.join(", ") || "None known"}
Medical History / Antecedents: ${patient.antecedents.join(", ") || "None known"}

Submitted Drug Administration Intent: "${mainObservation}"

Perform a thorough 3-step clinical reasoning:
1. Allergy Audit (risk of immediate anaphylaxis, hypersensitivity, or active-ingredient cross-reactivity).
2. Dosage Audit (dosage verification of overdose, pediatric caution, weight limits, or hepatic/renal adjustments).
3. Contraindications & Clinical Interactions (verify against specified pathophysiological history).

Produce your strict medical audit in JSON format. Set the proper validation status: "CRITICAL" (High Risk block), "MODERATE" (Warning/Action needed), or "LOW" (nominal/approved). Formulate a 2-3 sentence clear diagnostic summary, and list exactly 3 actionable, sequential mitigation steps to protect the patient. Return everything in English.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are a professional, autonomous clinical risk inspection agent. You tolerate zero patient safety compromises. Your validation verdict (statutValidation) MUST be exactly 'LOW', 'MODERATE', or 'CRITICAL'. The category must be exactly one of: 'Allergy', 'Overdose', 'Interaction', 'Dosage', 'Contraindication', 'Other'. All fields must be returned in English.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Short clinical title of the detected risk (e.g. 'Severe Allergenic Cross-Reactivity' or 'Sub-therapeutic Pediatric Dosing')."
                },
                riskLevel: {
                  type: Type.STRING,
                  description: "Must be exactly 'LOW', 'MODERATE', or 'CRITICAL' corresponding to the risk assessment."
                },
                statutValidation: {
                  type: Type.STRING,
                  description: "Must be exactly 'LOW', 'MODERATE', or 'CRITICAL'."
                },
                category: {
                  type: Type.STRING,
                  description: "Must be exactly one of: 'Allergy', 'Overdose', 'Interaction', 'Dosage', 'Contraindication', 'Other'."
                },
                scoreImpact: {
                  type: Type.INTEGER,
                  description: "Negative impact value for the safety score (a negative integer between -5 and -30)."
                },
                detailedAnalysis: {
                  type: Type.STRING,
                  description: "Justified clinical summary explaining pathophysiological risks and clinical mechanism."
                },
                mitigationSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 3 distinct emergency or precautionary actions required immediately."
                }
              },
              required: ["title", "riskLevel", "statutValidation", "category", "scoreImpact", "detailedAnalysis", "mitigationSteps"]
            }
          }
        });

        const rawText = response.text;
        if (rawText) {
          auditResult = JSON.parse(rawText.trim());
          isMock = false;
        } else {
          throw new Error("Empty text response from Gemini model.");
        }
      } catch (err) {
        console.error("Gemini API error, reverting to local rule-based fallback engine:", err);
        auditResult = generateSimulatedAudit(customPrescription?.medicamentNom || mainObservation, customPrescription?.doseSoumise || "Free text entry", patient);
      }
    } else {
      auditResult = generateSimulatedAudit(customPrescription?.medicamentNom || mainObservation, customPrescription?.doseSoumise || "Free text entry", patient);
    }

    serverState.agentStatus = 'Monitoring';

    // Constrain negative score
    const negativeImpact = Math.abs(auditResult.scoreImpact) * -1;
    const resolvedRisk = (auditResult.riskLevel || 'MODERATE') as any;

    const newIssue: Issue = {
      id: `iss-${Date.now()}`,
      patientId: targetDeptId,
      medicamentNom: customPrescription?.medicamentNom || mainObservation,
      doseSoumise: customPrescription?.doseSoumise || "Free text entry",
      statutValidation: (auditResult.statutValidation || 'MODERATE') as any,
      scoreImpact: negativeImpact,
      raisonnementDetaille: auditResult.detailedAnalysis || auditResult.title,
      mitigationSteps: auditResult.mitigationSteps || [
        "Suspend the active administration order immediately.",
        "Request formal review from clinical supervising pharmacist.",
        "Document alternate pharmacological choices."
      ],
      reportedAt: new Date().toISOString(),
      status: 'active',
      category: (auditResult.category || "Other") as any,
      // map legacy fields for UI compatibility
      ...{
        title: auditResult.title,
        description: `Administration of: ${mainObservation}`,
        riskLevel: resolvedRisk,
      } as any
    };

    if (!isCustomMode) {
      const dept = serverState.departments.find(d => d.id === targetDeptId);
      if (dept) {
        dept.issues.push(newIssue);
        recalculateScore(dept);
      }
    }

    // Logs creation
    const logType = newIssue.statutValidation === 'CRITICAL' ? 'alert' : newIssue.statutValidation === 'MODERATE' ? 'warning' : 'info';
    const triggerLog: PatrolLog = {
      id: `log-audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      departmentId: targetDeptId,
      departmentName: isCustomMode ? `TEST ZONE - ${patient.name}` : deptNameText,
      type: logType,
      message: `[GEMINI-AGENT] Therapeutic risk intercepted: "${auditResult.title}" (${newIssue.category}). Status: ${newIssue.statutValidation}. Estimated impact: ${negativeImpact} points.`
    };
    serverState.patrolLogs.unshift(triggerLog);

    res.json({
      report: {
        ...auditResult,
        id: `rep-${Date.now()}`,
        patientId: targetDeptId,
        timestamp: new Date().toISOString(),
        isMockSimulated: isMock
      },
      departments: serverState.departments,
      logs: serverState.patrolLogs
    });
  });

  // Resolve/mitigate an issue
  app.post("/api/hospital/resolve-issue", (req, res) => {
    const { departmentId, issueId, newStatus } = req.body;
    if (!departmentId || !issueId || !newStatus) {
      return res.status(400).json({ error: "Missing required parameters: departmentId, issueId, newStatus." });
    }

    const dept = serverState.departments.find(d => d.id === departmentId);
    if (!dept) {
      return res.status(404).json({ error: "Patient room not found." });
    }

    const issue = dept.issues.find(i => i.id === issueId);
    if (!issue) {
      return res.status(404).json({ error: "Clinical finding not found." });
    }

    const previousStatus = issue.status;
    issue.status = newStatus;
    recalculateScore(dept);

    const checkLog: PatrolLog = {
      id: `log-res-${Date.now()}`,
      timestamp: new Date().toISOString(),
      departmentId,
      departmentName: `Room ${dept.code.split(" ")[1]} - ${dept.patient.name}`,
      type: newStatus === 'resolved' ? 'success' : 'info',
      message: `[AUTH-MED] Corrective action captured: Prescription "${issue.medicamentNom}" shifted from ${previousStatus.toUpperCase()} to ${newStatus.toUpperCase()}.`
    };
    serverState.patrolLogs.unshift(checkLog);

    res.json({
      success: true,
      departments: serverState.departments,
      logs: serverState.patrolLogs
    });
  });

  // Simulated system scanner sweep
  app.post("/api/hospital/trigger-scan", (req, res) => {
    serverState.agentStatus = 'Scanning';
    serverState.lastScanAt = new Date().toISOString();

    serverState.departments.forEach(dept => {
      dept.lastInspectedAt = new Date().toISOString();
    });

    const checkLog: PatrolLog = {
      id: `log-scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      departmentId: "ALL",
      departmentName: "General Safety Sweep",
      type: "success",
      message: "[AUTH-MED] Global clinical scanning completed: Resynchronized active prescription charts for all 5 occupied beds."
    };
    serverState.patrolLogs.unshift(checkLog);

    serverState.agentStatus = 'Monitoring';

    res.json({
      departments: serverState.departments,
      logs: serverState.patrolLogs,
      agentStatus: serverState.agentStatus,
      lastScanAt: serverState.lastScanAt
    });
  });



  // Vite static/development serving middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AuthMed Core server listening on host 0.0.0.0:${PORT}`);
  });
}

startServer();
