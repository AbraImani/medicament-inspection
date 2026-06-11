# AuthMed Mermaid Architecture Diagrams

## 1. System Context Diagram

This diagram shows the primary human actors, the AuthMed platform, and the Gemini AI agent that supports medication risk inspection and human-in-the-loop decision making.

```mermaid
flowchart LR
  Nurse[Nurse]
  Doctor[Doctor]
  Pharmacist[Pharmacist]
  RiskOfficer[Risk Officer]
  Admin[Hospital Administrator]
  JudgeUser[Judge Sandbox User]
  Platform[AuthMed Platform]
  Gemini[Gemini AI Agent]

  Nurse -->|Medication administration request| Platform
  Doctor -->|Clinical review input| Platform
  Pharmacist -->|Medication safety validation| Platform
  RiskOfficer -->|Risk review and escalation| Platform
  Admin -->|Dashboard and oversight| Platform
  JudgeUser -->|Sandbox evaluation cases| Platform

  Platform -->|Risk analysis request| Gemini
  Gemini -->|Risk assessment, explanation, recommendation| Platform

  Platform -->|Alerts, findings, audit views| Nurse
  Platform -->|Clinical escalations| Doctor
  Platform -->|Medication alerts| Pharmacist
  Platform -->|Risk escalations| RiskOfficer
  Platform -->|Operational dashboard| Admin
  Platform -->|Evaluation results| JudgeUser
```

## 2. High-Level Solution Architecture Diagram

This diagram shows the layered solution structure from the React frontend to the Express backend, Gemini AI integration, and the data layer holding patient records, audit logs, and risk assessments.

```mermaid
flowchart TB
  subgraph FrontendLayer[Frontend Layer]
    ReactApp[React Frontend\nTypeScript + Tailwind + Vite]
  end

  subgraph BackendLayer[Backend Layer]
    ExpressAPI[Express API]
  end

  subgraph AILayer[AI Layer]
    GeminiAgent[Gemini Risk Analysis Workflow]
    GeminiAPI[Gemini API]
  end

  subgraph DataLayer[Data Layer]
    PatientRecords[(Patient Records)]
    AuditLogs[(Audit Logs)]
    RiskAssessments[(Risk Assessments)]
  end

  ReactApp -->|REST APIs| ExpressAPI
  ExpressAPI -->|Inspection request| GeminiAgent
  GeminiAgent -->|GenAI call| GeminiAPI
  GeminiAPI -->|Structured analysis| GeminiAgent
  GeminiAgent -->|Risk result| ExpressAPI

  ExpressAPI --> PatientRecords
  ExpressAPI --> AuditLogs
  ExpressAPI --> RiskAssessments

  RiskAssessments --> ExpressAPI
  AuditLogs --> ExpressAPI
  PatientRecords --> ExpressAPI
```

## 3. Component Architecture Diagram

This diagram breaks the platform into frontend, backend, and AI components so the implementation boundary remains explicit for GitHub documentation and later UML modeling.

```mermaid
flowchart TB
  subgraph FrontendComponents[Frontend Components]
    Dashboard[Dashboard]
    AuditTool[Clinical Audit Tool]
    RiskView[Risk Assessment View]
    Telemetry[Telemetry Panel]
    Notifications[Notification Center]
  end

  subgraph BackendComponents[Backend Components]
    Gateway[API Gateway]
    InspectionSvc[Inspection Service]
    RiskEngine[Risk Engine]
    AuditSvc[Audit Service]
    NotificationSvc[Notification Service]
  end

  subgraph AIComponents[AI Components]
    GeminiAnalyzer[Gemini Risk Analyzer]
    PromptOrchestrator[Prompt Orchestrator]
    ExplanationGen[Explanation Generator]
  end

  Dashboard --> Gateway
  AuditTool --> Gateway
  RiskView --> Gateway
  Telemetry --> Gateway
  Notifications --> Gateway

  Gateway --> InspectionSvc
  Gateway --> RiskEngine
  Gateway --> AuditSvc
  Gateway --> NotificationSvc

  InspectionSvc --> PromptOrchestrator
  RiskEngine --> PromptOrchestrator
  PromptOrchestrator --> GeminiAnalyzer
  GeminiAnalyzer --> ExplanationGen
  ExplanationGen --> RiskEngine

  RiskEngine --> AuditSvc
  AuditSvc --> NotificationSvc
  NotificationSvc --> Notifications
  AuditSvc --> AuditTool
  RiskEngine --> RiskView
  InspectionSvc --> Dashboard
```

## 4. Clinical Inspection Workflow Diagram

This workflow shows the end-to-end clinical inspection path from request submission through risk scoring, explanation generation, audit creation, and return of the result to the user.

```mermaid
flowchart TD
  Start([Start]) --> Step1[1. User submits medication request]
  Step1 --> Step2[2. Backend receives request]
  Step2 --> Step3[3. Patient data retrieval]
  Step3 --> Step4[4. Allergy check]
  Step4 --> Step5[5. Dosage validation]
  Step5 --> Step6[6. Drug interaction analysis]
  Step6 --> Step7[7. Risk scoring]
  Step7 --> Step8[8. Explanation generation]
  Step8 --> Step9[9. Audit record creation]
  Step9 --> Step10[10. Result returned to user]
  Step10 --> End([End])
```

## 5. Sequence Diagram

This sequence diagram captures the nurse-led submission flow and the interactions between the frontend, backend, Gemini agent, and audit service.

```mermaid
sequenceDiagram
  autonumber
  actor Nurse
  participant Frontend
  participant Backend
  participant Gemini as Gemini Agent
  participant Audit as Audit Service

  Nurse->>Frontend: Submit medication administration request
  Frontend->>Backend: POST /inspections
  Backend->>Audit: Create request audit event
  Audit-->>Backend: Audit ID
  Backend->>Gemini: Analyze medication risk
  Gemini-->>Backend: Risk score, explanation, recommendation
  Backend->>Audit: Store AI result and final decision
  Audit-->>Backend: Audit confirmation
  Backend-->>Frontend: Return clinical risk assessment
  Frontend-->>Nurse: Display result and next actions
```

## 6. Data Model Diagram

This conceptual ER diagram shows the core MVP entities and their relationships without moving into physical schema design.

```mermaid
erDiagram
  USER ||--o{ AUDITLOG : creates
  USER ||--o{ NOTIFICATION : receives
  PATIENT ||--o{ PRESCRIPTION : has
  MEDICATION ||--o{ PRESCRIPTION : appears_in
  PRESCRIPTION ||--o{ RISKASSESSMENT : evaluated_by
  PATIENT ||--o{ RISKASSESSMENT : associated_with
  RISKASSESSMENT ||--o{ AUDITLOG : recorded_in
  RISKASSESSMENT ||--o{ NOTIFICATION : triggers

  USER {
    string userId
    string name
    string role
  }

  PATIENT {
    string patientId
    string fullName
    string medicalRecordNumber
  }

  MEDICATION {
    string medicationId
    string name
    string strength
  }

  PRESCRIPTION {
    string prescriptionId
    string dosage
    string route
    string frequency
  }

  RISKASSESSMENT {
    string assessmentId
    string riskLevel
    string explanation
    string recommendation
  }

  AUDITLOG {
    string auditId
    string actionType
    string timestamp
  }

  NOTIFICATION {
    string notificationId
    string channel
    string status
  }
```

## 7. Deployment Diagram

This deployment view shows the runtime path from the browser to the React application, Express server, Gemini API, database, and monitoring layer.

```mermaid
flowchart TB
  subgraph Client[Client Side]
    Browser[User Browser]
  end

  subgraph AppLayer[Application Layer]
    ReactApp[React Application]
    ExpressServer[Express Server]
  end

  subgraph ExternalAI[External AI]
    GeminiAPI[Gemini API]
  end

  subgraph DataInfra[Data Layer]
    Database[(Database)]
  end

  subgraph Observability[Monitoring Layer]
    Monitor[Metrics, Logs, Traces]
  end

  Browser --> ReactApp
  ReactApp --> ExpressServer
  ExpressServer --> GeminiAPI
  ExpressServer --> Database
  ExpressServer --> Monitor
  GeminiAPI --> Monitor
  Database --> Monitor
```

## 8. Security Architecture Diagram

This diagram captures the primary security controls around authentication, request validation, prompt validation, audit logging, role-based access control, and secure Gemini communication.

```mermaid
flowchart LR
  User[User]
  Auth[User Authentication]
  RBAC[Role-Based Access Control]
  APIVal[API Validation]
  PromptVal[Prompt Validation]
  Audit[Audit Logging]
  GeminiCall[Secure Gemini Calls]
  Backend[AuthMed Backend]

  User --> Auth
  Auth --> RBAC
  RBAC --> Backend
  Backend --> APIVal
  APIVal --> PromptVal
  PromptVal --> GeminiCall
  GeminiCall --> Backend
  Backend --> Audit
  Audit --> User
```

## 9. Agent Workflow Diagram

This diagram shows the Gemini reasoning pipeline from raw input through contextual analysis, scoring, explanation generation, and the final verdict.

```mermaid
flowchart TD
  Input[Input] --> PatientAnalysis[Patient Context Analysis]
  PatientAnalysis --> Allergy[Allergy Analysis]
  Allergy --> Dosage[Dosage Validation]
  Dosage --> Interaction[Drug Interaction Analysis]
  Interaction --> Scoring[Risk Scoring]
  Scoring --> Explanation[Explanation Generation]
  Explanation --> Recommendation[Recommendation]
  Recommendation --> Verdict[Final Verdict]
```

## 10. End-to-End Architecture Diagram

This final architecture diagram combines the full MVP path from users to dashboard, including the frontend, backend, Gemini AI, audit layer, notifications, and data storage.

```mermaid
flowchart TB
  subgraph Users[Users]
    Nurse[Nurse]
    Doctor[Doctor]
    Pharmacist[Pharmacist]
    RiskOfficer[Risk Officer]
    Admin[Hospital Administrator]
  end

  subgraph Frontend[Frontend]
    UI[React UI]
    Dashboard[Dashboard]
  end

  subgraph Backend[Backend]
    API[Express APIs]
    Inspection[Inspection Service]
    RiskEngine[Risk Engine]
    AuditSvc[Audit Layer]
    NotifySvc[Notifications]
  end

  subgraph AI[AI]
    Gemini[Gemini]
  end

  subgraph Storage[Data Storage]
    DB[(Clinical Data Store)]
    AuditDB[(Audit Store)]
    RiskDB[(Risk Assessments)]
  end

  Nurse --> UI
  Doctor --> UI
  Pharmacist --> UI
  RiskOfficer --> Dashboard
  Admin --> Dashboard

  UI --> API
  Dashboard --> API

  API --> Inspection
  API --> RiskEngine
  Inspection --> Gemini
  RiskEngine --> Gemini
  Gemini --> RiskEngine
  RiskEngine --> AuditSvc
  AuditSvc --> NotifySvc

  API --> DB
  AuditSvc --> AuditDB
  RiskEngine --> RiskDB

  NotifySvc --> Nurse
  NotifySvc --> Doctor
  NotifySvc --> Pharmacist
  NotifySvc --> RiskOfficer
  NotifySvc --> Admin
```
