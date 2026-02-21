import React, { useState, useEffect, useCallback } from 'react';
import {
    FileSearch, Activity, AlertOctagon, MessageSquareText, FileBarChart,
    CheckCircle2, Clock, ArrowRight, Database, BrainCircuit, Play,
    Square, PlayCircle, ChevronDown, Zap, Cpu, Network,
    ShieldCheck, AlertTriangle, BarChart3, Layers, RefreshCw,
    Hash, BookOpen, Brain
} from 'lucide-react';
import Card from '../components/Card';
import clsx from 'clsx';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
    getAgentsStatus, runAgents, getMonitoringStatus,
    startMonitoring, stopMonitoring, getAgentActivity
} from '../services/api';

// ─── Static agent metadata (descriptions, capabilities, colors) ────────────────
const AGENT_META = {
    policy: {
        title: 'Policy RAG Agent',
        shortTitle: 'RAG',
        icon: FileSearch,
        gradient: 'from-blue-600 to-blue-400',
        accent: 'border-blue-400',
        ring: 'ring-blue-200',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Responsible for ingesting compliance policy PDFs, generating SHA-256 deduplicated vector embeddings (nomic-embed-text via Ollama), and storing them in ChromaDB. On each violation, retrieves the top-3 most relevant policy chunks to provide legal context for the LLM explanation.',
        capabilities: [
            'Parses uploaded PDF policy documents',
            'SHA-256 content hash — embeddings generated only once per unique document',
            'Chunks text and encodes with nomic-embed-text (Ollama)',
            'Stores embeddings in ChromaDB vector store',
            'Semantic search to retrieve top-3 relevant chunks per transaction',
        ],
    },
    monitoring: {
        title: 'Transaction Monitor',
        shortTitle: 'Monitor',
        icon: Activity,
        gradient: 'from-sky-600 to-cyan-400',
        accent: 'border-sky-400',
        ring: 'ring-sky-200',
        badge: 'bg-sky-50 text-sky-700 border-sky-200',
        description: 'Continuously polls the MongoDB transactions collection for records where is_processed=False. Feeds each unprocessed transaction one at a time into the compliance pipeline, then sleeps 30s when the queue is empty. On-demand batch scan processes up to 20 records instantly.',
        capabilities: [
            'Polls MongoDB Atlas — targets is_processed: False',
            'Processes one transaction per cycle (memory-safe)',
            'Sleeps 30s when no pending records are found',
            'On-demand batch: processes 20 records in one trigger',
            'Auto-restarts on pipeline error — resilient loop',
        ],
    },
    violation: {
        title: 'Risk Detector',
        shortTitle: 'Detector',
        icon: AlertOctagon,
        gradient: 'from-amber-500 to-orange-400',
        accent: 'border-amber-400',
        ring: 'ring-amber-200',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Applies the trained RandomForest classifier (random_forest_model.pkl, 20 features) to score each transaction. Builds full feature vectors from bank IDs, amounts, timestamp (hour/day), payment format, and currency pair. Flags transactions with RF probability ≥ 0.7 as violations.',
        capabilities: [
            'Loads RandomForest model via joblib (random_forest_model.pkl)',
            'Builds 20-feature DataFrame: amounts, bank IDs, hour, day, format, currencies',
            'Uses predict_proba — class 1 probability = laundering risk score',
            'Threshold: RF score ≥ 0.70 → violation flag (HIGH)',
            'Risk levels: LOW (<0.40) · MEDIUM (0.40–0.70) · HIGH (≥0.70)',
        ],
    },
    explanation: {
        title: 'Explanation Agent',
        shortTitle: 'LLM',
        icon: MessageSquareText,
        gradient: 'from-emerald-600 to-teal-400',
        accent: 'border-emerald-400',
        ring: 'ring-emerald-200',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Triggered only for flagged violations. Retrieves top-3 relevant compliance policy chunks from ChromaDB via semantic search query, then constructs a structured prompt and calls the local Ollama LLM (llama3) to produce an audit-ready explanation. The reasoning is stored in the violations collection.',
        capabilities: [
            'Only activates on RF-flagged (HIGH risk) transactions',
            'Queries ChromaDB for top-3 policy chunks matching the transaction type',
            'Sends structured prompt to Ollama (POST /api/generate, stream=False)',
            'Produces professional compliance narrative for auditors',
            'Explanation persisted in MongoDB violations collection',
        ],
    },
    reporting: {
        title: 'Report Writer',
        shortTitle: 'Report',
        icon: FileBarChart,
        gradient: 'from-purple-600 to-pink-400',
        accent: 'border-purple-400',
        ring: 'ring-purple-200',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        description: 'Finalizes each violation record in the MongoDB violations collection, updates the transaction\'s is_processed flag, and aggregates data for Dashboard, Reports, Audit Logs, and Predictions analytics pages. All frontend pages refresh data from these aggregated collections every poll cycle.',
        capabilities: [
            'Sets is_processed=True on each scanned transaction',
            'Upserts violation records into violations collection',
            'Data drives Dashboard metrics, Reports charts, Audit Logs, and Predictions analytics',
            'Provides risk_level and risk_score fields used across all pages',
            'Violations stored with RF score, risk level, and AI explanation',
        ],
    },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const statusStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    idle: 'bg-slate-50 text-slate-500 border-slate-200',
};
const statusDot = {
    success: 'bg-emerald-500', danger: 'bg-red-500',
    warn: 'bg-amber-500', info: 'bg-blue-500', idle: 'bg-slate-400',
};

const LogRow = ({ log }) => (
    <div className="flex items-start gap-3 px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50/60 transition-colors last:border-0">
        <div className={clsx('mt-1.5 w-2 h-2 rounded-full shrink-0', statusDot[log.status])} />
        <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 font-medium leading-snug">{log.event}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />{log.time}
            </p>
        </div>
        <span className={clsx('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 mt-0.5', statusStyles[log.status])}>
            {log.status}
        </span>
    </div>
);

// ─── Pipeline Node ─────────────────────────────────────────────────────────────
const PipelineNode = ({ agentId, meta, isSelected, isMonitoring, liveStatus, onClick }) => {
    const isMonitoringAgent = agentId === 'monitoring';
    const status = liveStatus?.status || 'Idle';
    const alive = status !== 'Stopped' && status !== 'Idle';
    return (
        <button onClick={onClick}
            className={clsx(
                'relative flex flex-col items-center text-center group transition-all duration-300',
                isSelected ? 'scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
            )}>
            <div className={clsx(
                'absolute inset-0 rounded-2xl blur-lg transition-opacity duration-300',
                isSelected ? `bg-gradient-to-br ${meta.gradient} opacity-20` : 'opacity-0'
            )} />
            <div className={clsx(
                'relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg border-2 transition-all duration-300',
                meta.gradient,
                isSelected ? `border-white shadow-2xl ${meta.ring} ring-4` : 'border-white/30'
            )}>
                <meta.icon className="w-7 h-7 md:w-9 md:h-9" />
                <span className={clsx(
                    'absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white',
                    isMonitoringAgent
                        ? (isMonitoring ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400')
                        : (alive ? 'bg-emerald-400' : 'bg-slate-400')
                )} />
            </div>
            <p className="mt-2.5 text-xs md:text-sm font-bold text-slate-800 leading-tight">{meta.shortTitle}</p>
            <p className={clsx('text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded-full border', meta.badge)}>
                {isMonitoringAgent ? (isMonitoring ? 'Running' : 'Stopped') : status}
            </p>
        </button>
    );
};

// ─── Live Stat Tile from API ───────────────────────────────────────────────────
const StatTile = ({ label, value }) => (
    <Card className="border-none shadow-sm text-center">
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </Card>
);

// ─── Build live stats tiles per agent from /status response ───────────────────
const buildStats = (agentId, statusEntry, isMonitoring) => {
    if (!statusEntry) return [{ label: 'Status', value: 'Offline' }];
    switch (agentId) {
        case 'policy':
            return [
                { label: 'Policies Indexed', value: statusEntry.policies_indexed ?? 0 },
                { label: 'Total Chunks', value: (statusEntry.total_chunks ?? 0).toLocaleString() },
                { label: 'Embedding Model', value: 'nomic-embed-text' },
                { label: 'Dedup', value: 'SHA-256 ✓' },
            ];
        case 'monitoring':
            return [
                { label: 'Pending Records', value: (statusEntry.pending_transactions ?? 0).toLocaleString() },
                { label: 'Total Scanned', value: (statusEntry.processed_total ?? 0).toLocaleString() },
                { label: 'Batch Rate', value: '1 / cycle' },
                { label: 'Loop State', value: isMonitoring ? '● Running' : '● Idle' },
            ];
        case 'violation':
            return [
                { label: 'Total Violations', value: (statusEntry.total_violations ?? 0).toLocaleString() },
                { label: 'High Risk', value: (statusEntry.high_risk ?? 0).toLocaleString() },
                { label: 'Model', value: 'RandomForest' },
                { label: 'Threshold', value: 'Score ≥ 0.70' },
            ];
        case 'explanation':
            return [
                { label: 'Explanations Generated', value: (statusEntry.explanations_generated ?? 0).toLocaleString() },
                { label: 'LLM', value: 'llama3 (Ollama)' },
                { label: 'RAG Top-K', value: '3 chunks' },
                { label: 'Trigger', value: 'HIGH risk only' },
            ];
        case 'reporting':
            return [
                { label: 'Records in Report', value: (statusEntry.records_in_report ?? 0).toLocaleString() },
                { label: 'Storage', value: 'MongoDB Atlas' },
                { label: 'Feeds', value: 'Dashboard · Audit · Reports' },
                { label: 'Retention', value: 'Unlimited' },
            ];
        default: return [];
    }
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const Agents = () => {
    const [selectedId, setSelectedId] = useState('monitoring');
    const [agentStatuses, setAgentStatuses] = useState([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [batchRunning, setBatchRunning] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [activeTab, setActiveTab] = useState('log');
    const [liveActivity, setLiveActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 3500);
    };

    const fetchAll = useCallback(async () => {
        try {
            const [statusData, monStatus] = await Promise.all([
                getAgentsStatus(),
                getMonitoringStatus(),
            ]);
            setAgentStatuses(statusData);
            setIsMonitoring(monStatus.is_running);
        } catch (e) {
            console.error('Agents status error:', e);
        }
    }, []);

    const fetchActivity = useCallback(async () => {
        setLoadingActivity(true);
        try {
            const acts = await getAgentActivity(16);
            setLiveActivity(acts);
        } catch (e) {
            console.error('Activity fetch error:', e);
        } finally {
            setLoadingActivity(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        fetchActivity();
        const id1 = setInterval(fetchAll, 5000);
        const id2 = setInterval(fetchActivity, 10000);
        return () => { clearInterval(id1); clearInterval(id2); };
    }, [fetchAll, fetchActivity]);

    const handleToggleMonitoring = async () => {
        try {
            if (isMonitoring) {
                await stopMonitoring();
                showToast('Monitoring loop stopped.', 'warn');
            } else {
                await startMonitoring();
                showToast('Monitoring loop started — scanning DB every 30s.', 'success');
            }
            fetchAll();
        } catch (e) {
            showToast('Failed to toggle monitoring.', 'danger');
        }
    };

    const handleBatchScan = async () => {
        setBatchRunning(true);
        try {
            await runAgents();
            showToast('Batch scan triggered — 20 transactions queued for RF scoring.', 'info');
            setTimeout(() => { fetchAll(); fetchActivity(); }, 3000);
        } catch (e) {
            showToast('Batch scan failed.', 'danger');
        } finally {
            setBatchRunning(false);
        }
    };

    const getLiveStatus = (id) => agentStatuses.find(s => s.id === id);
    const activeCount = agentStatuses.filter(s => s.status !== 'Stopped' && s.status !== 'Idle').length;
    const totalProcessed = getLiveStatus('monitoring')?.processed_total || 0;
    const totalPending = getLiveStatus('monitoring')?.pending_transactions || 0;
    const totalTxns = totalProcessed + totalPending;
    const scannedPct = totalTxns > 0 ? Math.round((totalProcessed / totalTxns) * 100) : 0;

    const meta = AGENT_META[selectedId];
    const liveStat = getLiveStatus(selectedId);
    const stats = buildStats(selectedId, liveStat, isMonitoring);

    // Filter activity log for the selected agent
    const agentActivity = liveActivity.filter(a =>
        !a.agent || a.agent === selectedId ||
        (selectedId === 'monitoring' && !a.agent) ||
        (selectedId === 'violation') ||
        (selectedId === 'explanation' && a.agent === 'explanation')
    ).slice(0, 10);

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toastMsg && (
                <div className={clsx(
                    'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300',
                    toastMsg.type === 'success' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    toastMsg.type === 'warn' && 'bg-amber-50 text-amber-800 border-amber-200',
                    toastMsg.type === 'danger' && 'bg-red-50 text-red-800 border-red-200',
                    toastMsg.type === 'info' && 'bg-blue-50 text-blue-800 border-blue-200',
                )}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {toastMsg.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Network className="w-6 h-6 text-primary" /> Agent Network
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">
                        5-agent AML pipeline · RandomForest → RAG → Ollama LLM → MongoDB
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={handleToggleMonitoring}
                        className={clsx(
                            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200',
                            isMonitoring
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/20'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
                        )}>
                        {isMonitoring ? <><Square className="w-4 h-4 fill-current" /> Stop Monitoring</>
                            : <><PlayCircle className="w-4 h-4" /> Start Monitoring</>}
                    </button>

                    <button onClick={handleBatchScan} disabled={batchRunning}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm">
                        <RefreshCw className={clsx('w-4 h-4', batchRunning && 'animate-spin')} />
                        {batchRunning ? 'Scanning…' : 'Batch Scan (20)'}
                    </button>

                    <div className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border',
                        isMonitoring ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    )}>
                        <Activity className={clsx('w-4 h-4', isMonitoring && 'animate-pulse')} />
                        {isMonitoring ? 'Live' : 'Idle'}
                    </div>
                </div>
            </div>

            {/* Fleet Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Agents Online', value: `${activeCount} / 5`, icon: Cpu, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Monitoring', value: isMonitoring ? 'Active' : 'Stopped', icon: Activity, color: isMonitoring ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50' },
                    { label: 'Scanned', value: totalProcessed.toLocaleString(), icon: Zap, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Pipeline', value: 'RF + RAG + LLM', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
                ].map((s, i) => (
                    <Card key={i} className="flex items-center gap-4 border-none shadow-sm">
                        <div className={clsx('p-3 rounded-xl', s.color)}><s.icon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                            <p className="text-xl font-bold text-slate-900">{s.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pipeline Flow */}
            <Card className="overflow-visible">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Compliance Pipeline · Click an agent to inspect
                </p>
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                    {Object.entries(AGENT_META).map(([id, m], idx, arr) => (
                        <React.Fragment key={id}>
                            <PipelineNode
                                agentId={id} meta={m}
                                isSelected={selectedId === id}
                                isMonitoring={isMonitoring}
                                liveStatus={getLiveStatus(id)}
                                onClick={() => setSelectedId(id)}
                            />
                            {idx < arr.length - 1 && (
                                <div className="flex-1 flex items-center justify-center min-w-[20px]">
                                    <div className="flex items-center gap-1">
                                        <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-slate-300 hidden md:block" style={{ minWidth: 20 }} />
                                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                                        <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-300 to-slate-200 hidden md:block" style={{ minWidth: 20 }} />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </Card>

            {/* Detail Panel */}
            {meta && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Left — Identity + Live Stats + Capabilities */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Identity card */}
                        <Card className={clsx('border-2', meta.accent)}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={clsx('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-xl shrink-0', meta.gradient)}>
                                    <meta.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{meta.title}</h3>
                                    <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full border', meta.badge)}>
                                        {selectedId === 'monitoring'
                                            ? (isMonitoring ? '● Running' : '● Stopped')
                                            : (liveStat?.status || 'Idle')}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{meta.description}</p>
                        </Card>

                        {/* Live metric tiles */}
                        <div className="grid grid-cols-2 gap-3">
                            {stats.map((s, i) => <StatTile key={i} label={s.label} value={s.value} />)}
                        </div>

                        {/* Capabilities */}
                        <Card title="Core Capabilities">
                            <ul className="space-y-2.5 mt-2">
                                {meta.capabilities.map((cap, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        {cap}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>

                    {/* Right — Activity Log + Monitoring Controls */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* Activity Log */}
                        <Card noPadding className="overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-slate-400" />
                                    Live Activity Log
                                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 ml-1">RF Scored</span>
                                </h4>
                                <button onClick={fetchActivity}
                                    className="text-xs text-slate-400 hover:text-primary flex items-center gap-1 font-semibold">
                                    <RefreshCw className={clsx('w-3 h-3', loadingActivity && 'animate-spin')} /> Refresh
                                </button>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                                {loadingActivity && liveActivity.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">Loading live activity from DB…</div>
                                ) : agentActivity.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No processed transactions yet. Click <b>Batch Scan</b> or <b>Start Monitoring</b> to begin.
                                    </div>
                                ) : (
                                    agentActivity.map((log, i) => <LogRow key={i} log={log} />)
                                )}
                            </div>
                            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-400">
                                    Powered by <span className="font-mono text-slate-600">random_forest_model.pkl</span>
                                </span>
                                <span className="text-xs text-slate-400">{liveActivity.length} recent events</span>
                            </div>
                        </Card>

                        {/* Monitoring Agent — control panel */}
                        {selectedId === 'monitoring' && (
                            <Card className={clsx('border-2 transition-colors', isMonitoring ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200')}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-900">Autonomous Loop Control</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {isMonitoring
                                                ? 'Loop is active — polling MongoDB every 30s. Each record runs through RF → RAG → LLM.'
                                                : 'Loop is inactive. Start monitoring or use Batch Scan (20 records).'}
                                        </p>
                                    </div>
                                    <button onClick={handleToggleMonitoring}
                                        className={clsx(
                                            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
                                            isMonitoring ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        )}>
                                        {isMonitoring ? <Square className="w-4 h-4 fill-current" /> : <PlayCircle className="w-4 h-4" />}
                                        {isMonitoring ? 'Stop' : 'Start'}
                                    </button>
                                </div>
                                {/* Real scanned % progress */}
                                <div className="mt-5 space-y-2">
                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                        <span>DB Scan Progress</span>
                                        <span>{totalProcessed.toLocaleString()} / {totalTxns.toLocaleString()} ({scannedPct}%)</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={clsx('h-2.5 rounded-full transition-all duration-700', isMonitoring ? 'bg-emerald-500' : 'bg-slate-400')}
                                            style={{ width: `${scannedPct}%` }} />
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {totalPending.toLocaleString()} pending · {totalProcessed.toLocaleString()} processed
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* Policy RAG Agent — index summary */}
                        {selectedId === 'policy' && (
                            <Card className="border-2 border-blue-100 bg-blue-50/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <Hash className="w-5 h-5 text-primary" />
                                    <h4 className="font-bold text-slate-900">SHA-256 Deduplication Active</h4>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Each PDF's full text is hashed before embedding. Re-uploading the same document is instantly detected — no duplicate embeddings are generated. Only new or changed content triggers the Ollama embedding pipeline.
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-blue-100">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-slate-900">{getLiveStatus('policy')?.policies_indexed ?? 0}</p>
                                        <p className="text-xs text-slate-500">Policies Unique</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-slate-900">{(getLiveStatus('policy')?.total_chunks ?? 0).toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">Vectors in ChromaDB</p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Risk Detector — RF model info */}
                        {selectedId === 'violation' && (
                            <Card className="border-2 border-amber-100 bg-amber-50/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <Brain className="w-5 h-5 text-amber-600" />
                                    <h4 className="font-bold text-slate-900">RandomForest Model Details</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {[
                                        ['Model File', 'random_forest_model.pkl'],
                                        ['Loader', 'sklearn · joblib'],
                                        ['Features', '20 (numeric + one-hot)'],
                                        ['Output', 'predict_proba class 1'],
                                        ['Trained On', 'AML transactions dataset'],
                                        ['Threshold', 'prob ≥ 0.70 → violation'],
                                    ].map(([k, v]) => (
                                        <div key={k} className="bg-white border border-amber-100 rounded-lg p-2">
                                            <p className="text-slate-400 font-medium">{k}</p>
                                            <p className="font-mono text-slate-700 font-bold truncate">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Explanation Agent — RAG + LLM info */}
                        {selectedId === 'explanation' && (
                            <Card className="border-2 border-emerald-100 bg-emerald-50/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <BookOpen className="w-5 h-5 text-emerald-600" />
                                    <h4 className="font-bold text-slate-900">RAG + LLM Pipeline</h4>
                                </div>
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                                        Query ChromaDB: semantic search with transaction type
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                                        Retrieve top-3 policy chunks (cosine similarity)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                                        Send structured prompt to Ollama (llama3, stream=False)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">4</span>
                                        Store generated explanation in violations collection
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agents;
