# Medulate Procedural Simulation Ecosystem — Master AI Architecture Index

This document provides a holistic architectural map of the four repositories comprising the Medulate procedural training and assessment system.

---

## 1. System Topology & Inter-Service Communications

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PHYSICAL HARDWARE LAYER                                │
│                                                                                        │
│   [ Polhemus Patriot ]        [ Arduino / V2 Board ]           [ Overhead Camera ]      │
│   (US probe & needle 6-DOF)   (syringe pressure, wire depth)   (tool tray tracking)     │
└────────────────┬─────────────────────────┬──────────────────────────────┬──────────────┘
                 │                         │                              │
                 ▼                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ REPO 1: Near-Shore-Design/sophia-remake (Python Hardware Server Daemon & Launcher)      │
│                                                                                        │
│  • PDI.dll (ctypes) 6-DOF tracking  • PySerial sensor reading  • YOLOv8 CV inference   │
│  • Normalizes offsets & packs UDP frame: "Probe:[0] [...];Probe:[1] [...];..."         │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           │ UDP Broadcast (port 8000 TX, 8001 RX)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ REPO 2: Near-Shore-Design/unity_sophia_remake (Integrated Procedural Simulator)        │
│                                                                                        │
│  ┌─ Native Unity 6 Procedural Simulation (DHRT/) ───────────────────────────────────┐  │
│  │  • Real-time 3D anatomy (internal jugular vein, carotid artery, clavicle, lung)  │  │
│  │  • Needle puncture physics, ultrasound slicing, flash visualization, ECG monitor │  │
│  │  • Scoring engine: NeedlePerformance.cs, CatheterPerformance.cs                  │  │
│  │  • Local Server: WebShellBridge.cs (Hosts HTTP + WebSocket on 127.0.0.1:8750)    │  │
│  └───────────────────────────────────▲──────────────────────────────────────────────┘  │
│                                      │                                                 │
│                                      │ WebSocket (ws://127.0.0.1:8750)                 │
│                                      │ Commands: case:start/restart/end                │
│                                      │ Telemetry: case:complete (CrossSceneInfo JSON)  │
│                                      │                                                 │
│  ┌─ Embedded React Shell (WebUI/) ───▼──────────────────────────────────────────────┐  │
│  │  • Rendered inside Unity via UnityWebBrowser (UWB)                               │  │
│  │  • Trainee login, patient case selection, skill mastery progression             │  │
│  │  • Posts completed telemetry to Medulate API (prevents double-posting)          │  │
│  └───────────────────────────────────┬──────────────────────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────────────────────┘
                                       │
                                       │ HTTPS REST (JWT Bearer Auth)
                                       │ Base: https://medulate-api.onrender.com/api
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌──────────────────────────────────────┐┌────────────────────────────────────────────────┐
│ REPO 3: Near-Shore-Design/           ││ REPO 4: Near-Shore-Design/                     │
│         medulate-api                 ││         medulate-sync-dashboard               │
│                                      ││         (local dir: sophia-dashboard)          │
│ (Django REST Cloud Backend)          ││                                                │
│                                      ││ (Institutional Web Admin & Educator Dashboard) │
│ • Multi-tenant isolation             ││                                                │
│ • Case catalog (gated progression)   ││ • Educator / coordinator interface             │
│ • Trainee mastery tracking           ││ • Cohort progress & student roster management  │
│ • Telemetry rating & feedback scores ││ • Patient case deduplication                   │
│ • PostgreSQL on Render               ││ • Deployed to Vercel (account.medulate.com)   │
└──────────────────────────────────────┘└────────────────────────────────────────────────┘
```

---

## 2. Repository Overview Matrix

| Repository Name | Local Directory | Tech Stack | Primary Responsibilities |
|---|---|---|---|
| **`medulate-api`** | `/home/seth/medulate-api` | Python, Django, DRF, PostgreSQL, SimpleJWT | Central database, authentication, multi-tenant institutional scoping, patient cases, procedural scoring. |
| **`medulate-sync-dashboard`** | `/home/seth/sophia-dashboard` | React 18, Vite, TypeScript, Tailwind, shadcn/ui | Administrative dashboard for hospital coordinators & educators to view cohorts and credentialing. |
| **`unity_sophia_remake`** | `/home/seth/unity_sophia_remake` & `C:\Users\smw57\sophia_unity` | Unity 6 C#, UWB, React 18, TypeScript, Tailwind | Real-time procedural simulation client + embedded trainee web shell connected via localhost WebSocket. |
| **`sophia-remake`** | `/home/seth/sophia-remake` | Python 3.8+, YOLOv8, PyTorch, ctypes, PyInstaller | Hardware driver for Polhemus Patriot & Arduino/V2 board; streams spatial UDP telemetry to Unity. |

---

## 3. Cross-Repository Data Contracts & Network Ports

### A. Hardware -> Unity (UDP)
- **Host**: `127.0.0.1`
- **Port**: `8000` (Python TX -> Unity RX), `8001` (Unity TX -> Python RX)
- **Format**: `Probe:[0] [x,y,z,a,e,r];Probe:[1] [x,y,z,a,e,r];Probe:[3] [x,y,z,0,0,0]`
  - Sensor `0`: Ultrasound probe (6-DOF)
  - Sensor `1`: Introducer needle (6-DOF)
  - Sensor `3`: Guidewire feed depth reference

### B. Unity Native -> Embedded Web Shell (WebSocket)
- **Host**: `127.0.0.1:8750` (`WebShellBridge.cs` in `DHRT/`)
- **Messages**:
  - `case:start` payload: `{ caseId: number, mode: "practice" | "test" }`
  - `case:complete` payload: Serialized `CrossSceneInfo` JSON containing accuracy metrics, entry angles, redial attempts, vessel puncture confirmation, and overall score.

### C. Web Shell / Dashboard -> Medulate API (HTTPS REST)
- **Base URL**: `https://medulate-api.onrender.com/api`
- **Authentication**: `Authorization: Bearer <access_token>`
- **Key Routes**:
  - `POST /api/auth/login/` & `POST /api/auth/token/refresh/`
  - `GET /api/cases/patient-cases/` (filtered by tenant and unlocked difficulty)
  - `GET /api/trainees/me/dashboard/`
  - `POST /api/trainees/me/lessons/{key}/complete/`
  - `POST /api/rating/needle-feedback/` (procedural scorecard submission)

---

## 4. Developer & AI Agent Guidelines

1. **Never Assume Single-Repo Context**: When editing code in any of the 4 repos, verify whether changes affect the shared schema (e.g. adding a new lesson key, changing case IDs, altering telemetry fields).
2. **Double-Post Rule**: When running inside Unity (`WebShellBridge.ShellActive == true`), Unity suppresses its standalone POST request; the embedded React shell handles posting to `medulate-api`.
3. **Environment Parity**:
   - `medulate-api`: Render PostgreSQL.
   - `unity_sophia_remake/WebUI`: `.env` needs `VITE_MEDULATE_API_URL` and `VITE_UNITY_WS_URL="ws://127.0.0.1:8750"`.
   - `medulate-sync-dashboard`: `.env` needs `VITE_API_URL="https://medulate-api.onrender.com/api"`.
   - `sophia-remake`: `src/config/config.json` controls COM ports, YOLO weights, and sensor scenarios.
