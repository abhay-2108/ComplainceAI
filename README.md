# 🛡️ ComplianceAI — AI-Powered Anti-Money Laundering Platform

> Intelligent transaction monitoring using Machine Learning, RAG, and Gemini AI — with Human-in-the-Loop review.

---

## 📌 Problem Statement

Every year, over **$2 trillion** is laundered globally. Financial institutions spend $274 billion on compliance, yet **95% of money laundering goes undetected**. Current compliance systems rely on static, rule-based thresholds (e.g., "flag transactions over $10,000") that criminals easily evade through structuring and smurfing. When alerts do trigger, human analysts spend 30–45 minutes per case manually reviewing transactions, cross-referencing policies, and writing reports — creating massive backlogs and fatigue.

---

## 💡 Our Innovation

ComplianceAI replaces the entire manual compliance pipeline with an **end-to-end AI-powered system**:

### 🌳 ML-Based Detection (Not Rules)
A **Random Forest classifier** trained on 15 engineered features — including transaction velocity, cross-currency flags, implied exchange rates, and temporal patterns. Achieves **99% accuracy** on the IBM AML dataset, catching patterns that rule-based systems miss.

### 🧠 RAG-Grounded AI Explanations
Every flagged transaction gets a professional compliance explanation from **Google Gemini 2.5 Flash**, grounded in real AML policy documents via **Retrieval-Augmented Generation (RAG)** using ChromaDB. No hallucinations — every explanation is backed by actual regulatory policy.

### 👤 Human-in-the-Loop Review
AI recommends, humans decide. Compliance officers can **Resolve** or **Escalate** flagged violations with notes, creating a complete audit trail. The AI reduces analyst workload from 30 minutes to a quick review.

### ⚡ Distributed Processing
**Celery** task workers with **MongoDB Atlas** as the broker enable asynchronous batch processing. Each transaction is analyzed in ~3-5 seconds — ML prediction, policy retrieval, and LLM explanation — all in the background.

---

## 🏗️ Architecture

```
┌──────────────┐     REST API        ┌──────────────────┐
│  React + TW  │ ←─────────────────→ │  FastAPI Server  │
│   Frontend   │                     │  (Python)        │
└──────────────┘                     └────────┬─────────┘
                                              │
                              .delay()        │
                           (queue tasks)      ↓
                                     ┌──────────────────┐
                                     │  MongoDB Atlas   │
                                     │  (DB + Broker)   │
                                     └────────┬─────────┘
                                              │
                                    picks up  │  messages
                                              ↓
                                     ┌──────────────────┐
                                     │  Celery Worker   │
                                     │                  │
                                     │  1. ML Predict   │
                                     │  2. RAG Retrieve │
                                     │  3. Gemini API   │
                                     │  4. Save Results │
                                     └──────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS, Recharts, Lucide Icons |
| Backend | FastAPI (Python) |
| ML Model | Random Forest — scikit-learn (150 trees, 15 features) |
| LLM | Google Gemini 2.5 Flash |
| RAG | ChromaDB + Sentence-Transformers + Gemini Embeddings |
| Task Queue | Celery (solo pool) |
| Database | MongoDB Atlas |

---

## 📊 ML Model Details

- **Dataset:** IBM AML Transaction Dataset (`HI-Small_Patterns.txt`)
- **Algorithm:** Random Forest Classifier (150 estimators, max depth 20)
- **Accuracy:** 99.07% | Precision: 0.99 / 0.98 | Recall: 0.99 / 0.98

### Feature Engineering (15 features)
| Feature | Type |
|---------|------|
| `Log_Amount_Paid` / `Log_Amount_Received` | Log-transformed amounts |
| `Implied_Exchange_Rate` | Received / Paid ratio |
| `Is_Cross_Currency` | Boolean — different currencies |
| `Same_Bank_Transfer` | Boolean — same bank sender/receiver |
| `Sender_Tx_Frequency` / `Receiver_Tx_Frequency` | Account velocity |
| `DayOfWeek`, `Is_Weekend`, `Time_of_Day` | Temporal features |
| `From_Bank`, `To_Bank`, `Payment_Currency`, `Receiving_Currency`, `Payment_Format` | Label-encoded categoricals |

---

## 📂 Project Structure

```
ComplianceAI/
├── backend/
│   ├── agents/            # AI agents (monitoring, detection, explanation, RAG, reporting)
│   ├── api/routes/        # FastAPI endpoints (violations, agents, predictions, RAG)
│   ├── config/            # Settings and environment config
│   ├── core/              # Celery app and startup logic
│   ├── datasets/          # Transaction data files
│   ├── ml/                # Random Forest model + predictor
│   ├── models/            # Pydantic schemas
│   ├── notebooks/         # Training notebooks
│   ├── rag/               # Vector store + embedding model
│   ├── scripts/           # Data loading utilities
│   ├── security/          # Encryption helpers
│   ├── database.py        # MongoDB connection layer
│   ├── tasks.py           # Celery task definitions
│   ├── main.py            # FastAPI application entry
│   └── requirements.txt   # Python dependencies
├── secure-ai-dashboard/
│   └── src/
│       ├── pages/         # React pages (Dashboard, Agents, Violations, etc.)
│       ├── components/    # Reusable UI components
│       └── services/      # API service layer
├── .gitignore
└── README.md
```

---

## 🚀 Steps to Run the Project

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/abhay-2108/ComplainceAI.git
cd ComplainceAI
```

### 2. Backend Setup
```bash
# Create virtual environment
cd backend
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create `backend/.env`:
```env
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=Cluster0
DATABASE_NAME=compliance_ai
SECRET_KEY=<your-secret-key>
ENCRYPTION_KEY=<your-encryption-key>
GOOGLE_API_KEY=<your-gemini-api-key>
GEMINI_MODEL_NAME=gemini/gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
CELERY_BROKER_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/celery_db
CELERY_RESULT_BACKEND=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/celery_db
```

Create `secure-ai-dashboard/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Start the Backend Server
```bash
cd ..
python -m uvicorn backend.main:app --reload --port 8000
```

### 5. Start the Celery Worker (separate terminal)
```bash
backend\venv\Scripts\celery -A backend.core.celery_app worker --loglevel=info -P solo
```

### 6. Frontend Setup (separate terminal)
```bash
cd secure-ai-dashboard
npm install
npm run dev
```

### 7. Open the Application
Navigate to `http://localhost:5173` in your browser.

---

## 📸 Key Features

- **Dashboard** — Real-time KPIs, risk trends, violation charts
- **AI Agents** — 5 specialized agents + batch processing controls
- **Violations** — Flagged transactions with AI explanations
- **Human Review** — Resolve or Escalate with audit trail
- **RAG Policies** — Policy-grounded AI explanations
- **Predictions** — ML model output and confidence analysis
- **Audit Logs** — Complete activity history

---

## 👥 Team

- **Abhay Tiwari** — Full Stack Developer & AI Engineer

---

## 📄 License

This project was built for HackFest 2.0.
