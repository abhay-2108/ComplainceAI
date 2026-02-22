import React, { useState, useEffect, useCallback } from 'react';
import {
    FileSearch, Activity, AlertOctagon, MessageSquareText, FileBarChart,
    CheckCircle2, Clock, ArrowRight, Database, BrainCircuit, Play,
    Square, PlayCircle, ChevronDown, Zap, Cpu, Network,
    ShieldCheck, AlertTriangle, BarChart3, Layers, RefreshCw,
    Hash, BookOpen, Brain, FileText, Shield
} from 'lucide-react';
import Card from '../components/Card';
import clsx from 'clsx';
import {
    getAgentsStatus, runAgents, getMonitoringStatus,
    startMonitoring, stopMonitoring, getAgentActivity
} from '../services/api';

// ─── Static agent metadata ──────────────────────────────────────────────────────
const AGENT_META = {
    policy: {
        title: 'Policy RAG Agent',
        shortTitle: 'RAG',
        icon: FileSearch,
        gradient: 'from-blue-600 to-blue-400',
        accent: 'border-blue-400',
        ring: 'ring-blue-200',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Analyzes compliance policies and retrieves relevant clauses for flags.',
        capabilities: [
            'Vector retrieval from ChromaDB',
            'Policy clause matching',
            'Context injection for LLM'
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
        description: 'Continuously scans the transaction database for unprocessed records.',
        capabilities: [
            'Real-time DB polling',
            'Concurrent batching (5 threads)',
            'Autonomous loop control'
        ],
    },
    violation: {
        title: 'Risk Detector',
        shortTitle: 'Detector',
        icon: AlertOctagon,
        gradient: 'from-amber-600 to-orange-500',
        accent: 'border-amber-400',
        ring: 'ring-amber-200',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'ML model scoring transactions based on AML risk patterns.',
        capabilities: [
            'RandomForest Scoring',
            '20-feature analysis',
            'Anomaly detection'
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
        description: 'Gemini-powered reasoning providing deep narratives for flagging.',
        capabilities: [
            'Context-aware reasoning',
            'Multi-agent collaboration',
            'Gemini 1.5 Pro'
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
        description: 'Synthesizes agent outputs into final audit-ready records.',
        capabilities: [
            'Audit log generation',
            'Data aggregation',
            'Final verification'
        ],
    },
};

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

// ─── Component: Log Entry ────────────────────────────────────────────────────────
const LogRow = ({ log }) => (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50/60 transition-all duration-200 group last:border-0">
        <div className={clsx('mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110', statusDot[log.status])} />
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-black font-bold leading-snug">{log.event}</p>
                <span className={clsx('text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0', statusStyles[log.status])}>
                    {log.status}
                </span>
            </div>
            {log.details && (
                <div className="mt-2 text-[11px] text-slate-500 font-mono bg-slate-100/50 p-2 rounded-lg border border-slate-200/50 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {log.details}
                </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-slate-300" />{log.time}
            </p>
        </div>
    </div>
);

// ─── Component: Pipeline Node ────────────────────────────────────────────────────
const PipelineNode = ({ agentId, meta, isSelected, isMonitoring, liveStatus, onClick }) => {
    const isMonitoringAgent = agentId === 'monitoring';
    const status = liveStatus?.status || 'Idle';
    const alive = status !== 'Stopped' && status !== 'Idle';
    return (
        <button onClick={onClick}
            className={clsx(
                'relative flex flex-col items-center text-center group transition-all duration-300',
                isSelected ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
            )}>
            <div className={clsx(
                'absolute -inset-1 rounded-2xl blur-lg transition-opacity duration-300',
                isSelected ? `bg-gradient-to-br ${meta.gradient} opacity-25` : 'opacity-0'
            )} />
            <div className={clsx(
                'relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg border-2 transition-all duration-300',
                meta.gradient,
                isSelected ? `border-white shadow-2xl ${meta.ring} ring-4` : 'border-white/30'
            )}>
                <meta.icon className="w-7 h-7 md:w-9 md:h-9" />
                <span className={clsx(
                    'absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                    isMonitoringAgent
                        ? (isMonitoring ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-400')
                        : (alive ? 'bg-emerald-400' : 'bg-slate-400')
                )} />
            </div>
            <p className="mt-3 text-xs md:text-sm font-black text-black leading-tight tracking-tight">{meta.shortTitle}</p>
            <p className={clsx('text-[10px] font-bold mt-1 px-2.5 py-0.5 rounded-full border shadow-sm transition-colors', meta.badge)}>
                {isMonitoringAgent ? (isMonitoring ? 'Running' : 'Stopped') : status}
            </p>
        </button>
    );
};

// ─── Component: Live Stat Tile ───────────────────────────────────────────────────
const StatTile = ({ label, value }) => (
    <Card className="border-none shadow-sm text-center hover:shadow-md transition-shadow group">
        <p className="text-2xl font-black text-black group-hover:text-primary transition-colors">{value ?? '—'}</p>
        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">{label}</p>
    </Card>
);

// ─── Function: Helper to build agents stats ─────────────────────────────────────
const buildStats = (agentId, statusEntry, isMonitoring) => {
    if (!statusEntry) return [{ label: 'Status', value: 'Offline' }];
    switch (agentId) {
        case 'policy':
            return [
                { label: 'Policies Indexed', value: statusEntry.policies_indexed ?? 0 },
                { label: 'Total Chunks', value: (statusEntry.total_chunks ?? 0).toLocaleString() },
                { label: 'Embedding Model', value: 'Gemini-Text' },
                { label: 'Cloud RAG', value: 'Vertex ✓' },
            ];
        case 'monitoring':
            return [
                { label: 'Pending Records', value: (statusEntry.pending_transactions ?? 0).toLocaleString() },
                { label: 'Total Scanned', value: (statusEntry.processed_total ?? 0).toLocaleString() },
                { label: 'Batch Rate', value: 'Parallel (5)' },
                { label: 'Loop State', value: isMonitoring ? '● Active' : '● Idle' },
            ];
        case 'violation':
            return [
                { label: 'Total Violations', value: (statusEntry.total_violations ?? 0).toLocaleString() },
                { label: 'High Risk', value: (statusEntry.high_risk ?? 0).toLocaleString() },
                { label: 'Model', value: 'RandomForest' },
                { label: 'Concur', value: 'Async ✓' },
            ];
        case 'explanation':
            return [
                { label: 'Narratives Drafted', value: (statusEntry.explanations_generated ?? 0).toLocaleString() },
                { label: 'LLM', value: 'Gemini 1.5 Pro' },
                { label: 'RAG Context', value: 'Top-3 Chunks' },
                { label: 'Orchestrater', value: 'CrewAI' },
            ];
        case 'reporting':
            return [
                { label: 'Audit Records', value: (statusEntry.records_in_report ?? 0).toLocaleString() },
                { label: 'Storage', value: 'MongoDB Atlas' },
                { label: 'Export', value: 'CSV / JSON' },
                { label: 'Live Sync', value: 'Enabled' },
            ];
        default: return [];
    }
};

// ─── Main Page Component ──────────────────────────────────────────────────────────
const Agents = () => {
    const [selectedId, setSelectedId] = useState('monitoring');
    const [agentStatuses, setAgentStatuses] = useState([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [batchRunning, setBatchRunning] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
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
            const acts = await getAgentActivity(20, selectedId);
            setLiveActivity(acts);
        } catch (e) {
            console.error('Activity fetch error:', e);
        } finally {
            setLoadingActivity(false);
        }
    }, [selectedId]);

    useEffect(() => {
        fetchAll();
        fetchActivity();
        const id1 = setInterval(fetchAll, 5000);
        const id2 = setInterval(fetchActivity, 4000);
        return () => { clearInterval(id1); clearInterval(id2); };
    }, [fetchAll, fetchActivity]);

    const handleToggleMonitoring = async () => {
        try {
            if (isMonitoring) {
                await stopMonitoring();
                showToast('Parallel monitoring paused.', 'warn');
            } else {
                await startMonitoring();
                showToast('Concurrent monitoring started — scaling to 5 threads.', 'success');
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
            showToast('Parallel batch scan triggered (20 records).', 'info');
            setTimeout(() => { fetchAll(); fetchActivity(); }, 4000);
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

    const meta = AGENT_META[selectedId];
    const liveStat = getLiveStatus(selectedId);
    const stats = buildStats(selectedId, liveStat, isMonitoring);

    // Latest successful transaction with explanation for "Final Output"
    const latestResult = liveActivity.find(log => log.agent === 'reporting_agent' && log.explanation);

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toastMsg && (
                <div className={clsx(
                    'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold transition-all duration-500 animate-in slide-in-from-right-4',
                    toastMsg.type === 'success' && 'bg-emerald-600 text-white border-emerald-400',
                    toastMsg.type === 'warn' && 'bg-amber-500 text-white border-amber-300',
                    toastMsg.type === 'danger' && 'bg-red-600 text-white border-red-400',
                    toastMsg.type === 'info' && 'bg-blue-600 text-white border-blue-400',
                )}>
                    {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Clock className="w-5 h-5 shrink-0" />}
                    {toastMsg.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-black flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Network className="w-6 h-6 text-primary" />
                        </div>
                        Agent Network
                    </h2>
                    <p className="text-slate-500 mt-1.5 text-sm font-medium">
                        Concurrent Pipeline · <span className="text-primary font-bold">RandomForest + Gemini Pro</span> · Parallel Processing Enabled
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={handleToggleMonitoring}
                        className={clsx(
                            'flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95',
                            isMonitoring
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
                        )}>
                        {isMonitoring ? <><Square className="w-4 h-4 fill-current" /> Stop Loop</>
                            : <><PlayCircle className="w-4 h-4" /> Start Loop</>}
                    </button>

                    <button onClick={handleBatchScan} disabled={batchRunning}
                        className="flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-black hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm active:scale-95">
                        <RefreshCw className={clsx('w-4 h-4 text-primary', batchRunning && 'animate-spin')} />
                        {batchRunning ? 'Scaling…' : 'Batch Scaler (20)'}
                    </button>

                    <div className={clsx(
                        'flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-black border-2 transition-all',
                        isMonitoring ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'
                    )}>
                        <div className={clsx('w-2.5 h-2.5 rounded-full shadow-sm', isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
                        {isMonitoring ? 'Live Monitoring' : 'Offline'}
                    </div>
                </div>
            </div>

            {/* Fleet Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                    { label: 'Active Units', value: `${activeCount} Units`, icon: Cpu, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { label: 'Cloud Status', value: isMonitoring ? 'Connected' : 'Standby', icon: Activity, color: isMonitoring ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-500 bg-slate-50 border-slate-200' },
                    { label: 'Throughput', value: `${totalProcessed.toLocaleString()}`, icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'Intelligence', value: 'Gemini 1.5', icon: BrainCircuit, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                ].map((s, i) => (
                    <Card key={i} className={clsx('flex items-center gap-4 border-2 shadow-sm hover:shadow-md transition-shadow', s.color)}>
                        <div className="p-3 rounded-xl bg-white shadow-sm border border-inherit"><s.icon className="w-6 h-6" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{s.label}</p>
                            <p className="text-xl font-bold tracking-tight">{s.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pipeline Flow Area */}
            <Card className="overflow-visible border-2 border-slate-100 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <p className="text-[11px] font-black text-slate-400 upper-case tracking-[0.2em] flex items-center gap-3">
                        <Layers className="w-4 h-4 text-primary opacity-60" /> Distributed Pipeline Orchestration
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                        <div className="flex items-center gap-1.5 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Active</div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap"><div className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Idle / Wait</div>
                    </div>
                </div>
                <div className="relative">
                    <div className="flex items-center justify-between gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide px-2">
                        {Object.entries(AGENT_META).map(([id, m], idx, arr) => (
                            <React.Fragment key={id}>
                                <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
                                    <PipelineNode
                                        agentId={id} meta={m}
                                        isSelected={selectedId === id}
                                        isMonitoring={isMonitoring}
                                        liveStatus={getLiveStatus(id)}
                                        onClick={() => setSelectedId(id)}
                                    />
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className="flex-1 flex items-center justify-center min-w-[20px] md:min-w-[40px] mt-[-30px] md:mt-[-40px]">
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <div className="h-0.5 w-4 md:w-8 lg:w-16 bg-gradient-to-r from-slate-100 to-slate-200" />
                                            <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                                            <div className="h-0.5 w-4 md:w-8 lg:w-16 bg-gradient-to-r from-slate-200 to-slate-100" />
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Agent Detail Panel */}
            {meta && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Sidebar: Details & Stats (4 columns) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className={clsx('border-l-8 shadow-md py-6', meta.accent)}>
                            <div className="flex items-center gap-5 mb-6">
                                <div className={clsx('w-16 h-16 rounded-[24px] bg-gradient-to-br flex items-center justify-center text-white shadow-2xl shrink-0 ring-4 ring-white', meta.gradient)}>
                                    <meta.icon className="w-8 h-8" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-black tracking-tight truncate">{meta.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={clsx('text-[10px] font-black uppercase tracking-tighter px-2.5 py-0.5 rounded-lg border shadow-sm', meta.badge)}>
                                            {selectedId === 'monitoring' ? (isMonitoring ? 'Scanning' : 'Stopped') : (liveStat?.status || 'Active')}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">Agent ID: {selectedId}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-black leading-relaxed font-bold">{meta.description}</p>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((s, i) => <StatTile key={i} label={s.label} value={s.value} />)}
                        </div>

                        <Card title="Agent Intelligence & Capabilities" className="border-2 border-slate-100">
                            <ul className="space-y-4 mt-4">
                                {meta.capabilities.map((cap, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-black font-bold group">
                                        <div className="bg-emerald-50 p-1 rounded-lg border border-emerald-100 shrink-0 mt-0.5 transition-colors group-hover:bg-emerald-100">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        {cap}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>

                    {/* Main: Logs & Results (8 columns) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* High-Level Intelligence Summaries (Final Outputs) */}
                        {latestResult && (
                            <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <ShieldCheck className="w-32 h-32 text-primary rotate-12" />
                                </div>
                                <div className="flex items-center justify-between mb-5 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-primary text-white rounded-xl shadow-lg ring-4 ring-primary/10">
                                            <FileBarChart className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-black text-lg tracking-tight">Intelligence Output</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black text-primary bg-white px-2 py-0.5 rounded-lg border border-primary/20 shadow-sm">FINAL REPORT</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Verified by Reporting Agent</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{latestResult.time}</p>
                                        <p className="text-[11px] font-bold text-primary mt-0.5">Live Pipeline Output</p>
                                    </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-200/50 p-6 rounded-2xl relative z-10 shadow-inner group-hover:bg-white transition-colors duration-300 shadow-md">
                                    <p className="text-black text-sm leading-relaxed font-bold">
                                        {latestResult.explanation}
                                    </p>
                                </div>
                                <div className="mt-5 flex items-center justify-between relative z-10 px-1">
                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400">
                                        <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Gemini Reasoning</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> High Precision</span>
                                    </div>
                                    <button className="text-[11px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1.5 p-2 px-4 bg-white rounded-xl border border-primary/10 hover:shadow-md">
                                        Full Violation Audit <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </Card>
                        )}

                        {/* Telemetry/Log Feed */}
                        <Card noPadding className="overflow-hidden border-2 border-slate-100 shadow-md">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                        <Database className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-black tracking-tight">Agent Activity Feed</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time Pipeline Telemetry</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isMonitoring && (
                                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Event Stream Connected</span>
                                        </div>
                                    )}
                                    <button onClick={fetchActivity}
                                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm">
                                        <RefreshCw className={clsx('w-4 h-4 text-slate-400', loadingActivity && 'animate-spin')} />
                                    </button>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                {loadingActivity && liveActivity.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="inline-block p-4 rounded-full bg-primary/5 animate-pulse mb-4">
                                            <Zap className="w-8 h-8 text-primary/40" />
                                        </div>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">Connecting to intelligence stream…</p>
                                    </div>
                                ) : liveActivity.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
                                            <Database className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                                            No telemetry data available for <span className="text-slate-900 font-black">{selectedId}</span><br />
                                            <span className="text-[10px] opacity-60 mt-2 block font-medium uppercase">Start pipeline monitoring to generate live events</span>
                                        </p>
                                    </div>
                                ) : (
                                    liveActivity.map((log, i) => <LogRow key={i} log={log} />)
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-2 group cursor-help">
                                    <div className="p-1 bg-white border border-slate-200 rounded-md">
                                        <Brain className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Distributed Agent Reasoning · <span className="text-slate-400">Gemini 1.5 Pro</span>
                                    </span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                    FEED LOGS: {liveActivity.length}
                                </span>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agents;
