export type ValidationStatus = 'LOW' | 'MODERATE' | 'CRITICAL';

export interface Patient {
  name: string;
  age: number;
  poids: number; // weight in kg
  allergies: string[];
  antecedents: string[];
}

export interface Issue {
  id: string;
  patientId: string; // maps to department/room ID
  medicamentNom: string;
  doseSoumise: string;
  statutValidation: ValidationStatus;
  scoreImpact: number; // e.g. -10, -20
  raisonnementDetaille: string; // detailed clinical reason
  mitigationSteps: string[];
  reportedAt: string;
  status: 'active' | 'mitigating' | 'resolved';
  category: 'Allergy' | 'Overdose' | 'Interaction' | 'Dosage' | 'Contraindication' | 'Other';
}

export interface Department {
  id: string; // room / station ID
  name: string; // Patient Name (matches core layout expectations)
  code: string; // Room Code e.g. "Room 101"
  iconName: string; // mapped to bedside icons (e.g. Bed, Activity)
  riskLevel: 'safe' | 'LOW' | 'MODERATE' | 'CRITICAL'; // clinical status
  safetyScore: number; // Clinical safety index 0-100
  issues: Issue[];
  patient: Patient;
  lastInspectedAt: string;
}

export interface AuditReport {
  id: string;
  patientId: string;
  medicamentNom: string;
  doseSoumise: string;
  statutValidation: ValidationStatus;
  scoreImpact: number;
  raisonnementDetaille: string;
  mitigationSteps: string[];
  timestamp: string;
  category: string;
}

export interface PatrolLog {
  id: string;
  timestamp: string;
  departmentId: string;
  departmentName: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
}
