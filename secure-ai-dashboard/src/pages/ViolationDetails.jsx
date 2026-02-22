import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import {
    ArrowLeft, CheckCircle, XCircle, FileText, AlertOctagon,
    BrainCircuit, ShieldAlert, Cpu, DollarSign, Clock, User,
    TrendingUp, AlertTriangle, Download, ExternalLink, UserCheck,
    Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { getViolationById, getViolationActivities, reviewViolation } from '../services/api';
import { Database, Zap, Binary, Code } from 'lucide-react';

const ReasoningStep = ({ step, index }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), index * 600);
        return () => clearTimeout(t);
    }, [index]);
    return (
        <div className={clsx(
            'flex items-start gap-3 transition-all duration-500',
            visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        )}>
            <div className={clsx('mt-1.5 w-2 h-2 rounded-full shrink-0',
                step.status === 'safe' ? 'bg-emerald-400' :
                    step.status === 'risk' ? 'bg-red-400 animate-pulse' : 'bg-blue-400'
            )} />
            <div className="flex-1">
                <p className="text-sm font-mono text-slate-100 font-medium leading-relaxed">{step.text}</p>
                {step.detail && step.detail !== 'None' && <p className="text-[11px] text-slate-100/70 mt-1 font-mono">{step.detail}</p>}
            </div>
            {step.status === 'risk' && (
                <span className="text-[10px] font-bold text-red-400 border border-red-900/30 px-2 py-0.5 rounded bg-red-900/10">FLAGGED</span>
            )}
        </div>
    );
};

const riskColor = (score) => {
    const n = Number(score) || 0;
    if (n >= 80) return { bar: '#EF4444', badge: 'bg-red-50 text-red-700 border-red-200', label: 'HIGH RISK' };
    if (n >= 60) return { bar: '#F59E0B', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'MEDIUM RISK' };
    return { bar: '#10B981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'LOW RISK' };
};

const reviewStatusConfig = {
    pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Review', icon: Clock },
    resolved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resolved', icon: CheckCircle },
    escalated: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Escalated', icon: AlertTriangle },
};

const ViolationDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [violation, setViolation] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewing, setReviewing] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [showReviewPanel, setShowReviewPanel] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vData, aData] = await Promise.all([
                getViolationById(id),
                getViolationActivities(id)
            ]);
            setViolation(vData);
            setActivities(aData);
        } catch (e) {
            console.error('ViolationDetails fetch error:', e);
            setError('Could not load violation details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleReview = async (action) => {
        setReviewing(true);
        try {
            await reviewViolation(id, action, 'Compliance Officer', reviewNotes || null);
            await fetchData(); // Refresh data to show new status
            setShowReviewPanel(false);
            setReviewNotes('');
        } catch (e) {
            console.error('Review error:', e);
        } finally {
            setReviewing(false);
        }
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 w-64 bg-slate-100 rounded-xl" />
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
            </div>
            <div className="h-40 bg-slate-100 rounded-xl" />
        </div>
    );

    if (error || !violation) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertOctagon className="w-12 h-12 text-red-300" />
            <p className="text-slate-500">{error || 'Violation not found.'}</p>
            <button onClick={() => navigate('/violations')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold">
                Back to Violations
            </button>
        </div>
    );

    const risk = riskColor(violation.riskScore);
    const score = Number(violation.riskScore) || 0;
    const dateStr = violation.date ? String(violation.date).slice(0, 16).replace('T', ' ') : 'N/A';
    const reviewCfg = reviewStatusConfig[violation.review_status] || reviewStatusConfig.pending;

    const reasoningSteps = activities.length > 0 ? activities.map((log) => ({
        text: log.event,
        status: log.status === 'success' ? 'safe' : (log.status === 'warn' ? 'risk' : 'info'),
        detail: log.details && log.details !== 'None' ? log.details : null
    })) : [
        { text: 'Transaction ingested by Monitoring Agent.', status: 'safe' },
        { text: 'ML model scored: ' + score.toFixed(1), status: 'info' },
        { text: 'Risk analysis in progress...', status: 'risk' },
    ];

    return (
        <div className="space-y-6">
            {/* Back button + ID header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <button onClick={() => navigate('/violations')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Violations
                </button>
                <div className="flex items-center gap-3">
                    <span className={clsx('px-3 py-1.5 rounded-xl text-sm font-bold border flex items-center gap-1.5', reviewCfg.color)}>
                        <reviewCfg.icon className="w-3.5 h-3.5" />
                        {reviewCfg.label}
                    </span>
                    <span className={clsx('px-3 py-1.5 rounded-xl text-sm font-bold border', risk.badge)}>
                        {risk.label}
                    </span>
                </div>
            </div>

            {/* Title */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-2xl">
                    <AlertOctagon className="w-7 h-7 text-red-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-black">{violation.id}</h2>
                    <p className="text-slate-600 text-sm mt-0.5 font-medium">Flagged by AI Compliance Pipeline · {dateStr}</p>
                </div>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Account ID', value: violation.source || violation.from_bank || 'N/A', icon: User, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Payment Type', value: violation.payment_format || violation.type || 'N/A', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Amount', value: violation.amount_paid ? `$${Number(violation.amount_paid).toLocaleString()}` : 'N/A', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Risk Score', value: `${score.toFixed(1)} / 100`, icon: ShieldAlert, color: 'text-amber-600 bg-amber-50' },
                ].map((m, i) => (
                    <Card key={i} className="flex items-center gap-3 border-none shadow-sm">
                        <div className={clsx('p-2.5 rounded-xl', m.color)}>
                            <m.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{m.label}</p>
                            <p className="text-base font-black text-black truncate">{m.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Risk Score Gauge */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-black">Risk Score</h3>
                    <span className="text-2xl font-bold text-black">{score.toFixed(1)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${score}%`, backgroundColor: risk.bar }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-medium">
                    <span>0</span>
                    <span className="text-emerald-600">Low &lt; 60</span>
                    <span className="text-amber-600">Medium 60–79</span>
                    <span className="text-red-600">High ≥ 80</span>
                    <span>100</span>
                </div>
            </Card>

            {/* Two columns: AI Explanation + Reasoning Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Explanation */}
                <Card className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <BrainCircuit className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-black text-black">AI Compliance Reasoning</h3>
                            <p className="text-xs text-slate-500">Professional Compliance Report</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-black font-semibold leading-relaxed flex-1 overflow-y-auto min-h-[220px] whitespace-pre-wrap">
                        {violation.explanation}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold border border-slate-200">GEMINI-FLASH</span>
                        <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold border border-slate-200">RAG-ENABLED</span>
                        <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold border border-slate-200">AUDIT_STAMP: {violation.id.slice(-6).toUpperCase()}</span>
                    </div>
                </Card>

                {/* Reasoning chain (dark terminal — uses raw div, not Card, to avoid bg-white override) */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-slate-800 rounded-xl">
                            <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Agent Reasoning Chain</h3>
                            <p className="text-[10px] text-blue-400/80 uppercase tracking-widest font-black">Live Pipeline Trace</p>
                        </div>
                        <div className="ml-auto hidden sm:flex gap-1.5 opacity-50">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        </div>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] scrollbar-hide pr-2">
                        {reasoningSteps.map((step, i) => (
                            <ReasoningStep key={i} step={step} index={i} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Transaction Data Blueprint */}
            <Card className="overflow-hidden border-2 border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-100 rounded-xl">
                        <Binary className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-black text-black">Transaction Blueprint</h3>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Raw Payload Data</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
                        <p className="text-[10px] font-black text-slate-500 mb-3 tracking-widest uppercase">Entity Information</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                                <span className="text-slate-600 font-bold">Account ID</span>
                                <span className="text-black font-mono font-black bg-white px-2 py-0.5 rounded border border-slate-200">{violation.source || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-bold">Transaction Type</span>
                                <span className="text-black font-black uppercase">{violation.type || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
                        <p className="text-[10px] font-black text-slate-500 mb-3 tracking-widest uppercase">Financial Metrics</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                                <span className="text-slate-600 font-bold">Amount</span>
                                <span className="text-black font-black text-base">$ {violation.amount_paid ? Number(violation.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-bold">Risk Level</span>
                                <span className="text-black font-black">{score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 lg:col-span-1 md:col-span-2">
                        <p className="text-[10px] font-black text-slate-500 mb-3 tracking-widest uppercase">Payment Details</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                                <span className="text-slate-600 font-bold">Currency</span>
                                <span className="text-black font-black">{violation.payment_currency || 'USD'} → {violation.receiving_currency || 'USD'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-bold">Format</span>
                                <span className="text-black font-black uppercase">{violation.payment_format || violation.type || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Human Review Panel */}
            <Card className={clsx(
                'border-2 transition-all duration-300',
                violation.review_status === 'resolved' ? 'border-emerald-200 bg-emerald-50/30' :
                    violation.review_status === 'escalated' ? 'border-red-200 bg-red-50/30' :
                        'border-indigo-200 bg-indigo-50/10'
            )}>
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className={clsx('p-3 rounded-2xl shrink-0',
                            violation.review_status === 'resolved' ? 'bg-emerald-100' :
                                violation.review_status === 'escalated' ? 'bg-red-100' : 'bg-indigo-100/50'
                        )}>
                            <UserCheck className={clsx('w-6 h-6',
                                violation.review_status === 'resolved' ? 'text-emerald-600' :
                                    violation.review_status === 'escalated' ? 'text-red-600' : 'text-indigo-600'
                            )} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-black">Human Review</h3>
                                <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border', reviewCfg.color)}>
                                    {reviewCfg.label}
                                </span>
                            </div>
                            {violation.review_status === 'pending' ? (
                                <p className="text-sm text-slate-600 font-semibold">
                                    This violation requires human verification. Review the AI analysis above and decide whether to resolve or escalate this case.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-sm text-black font-semibold">
                                        {violation.review_status === 'resolved' ? '✅ Case resolved' : '⚠️ Case escalated to senior auditor'}
                                        {violation.reviewed_by && ` by ${violation.reviewed_by}`}
                                    </p>
                                    {violation.review_notes && (
                                        <p className="text-sm text-slate-600 italic">"{violation.review_notes}"</p>
                                    )}
                                    {violation.review_timestamp && (
                                        <p className="text-xs text-slate-400 font-mono mt-1">
                                            {String(violation.review_timestamp).slice(0, 19).replace('T', ' ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {violation.review_status === 'pending' && (
                        <>
                            {showReviewPanel && (
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                    <label className="text-sm font-bold text-slate-700">Review Notes (optional)</label>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add notes about your decision..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
                                        rows={2}
                                    />
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => showReviewPanel ? handleReview('resolve') : setShowReviewPanel(true)}
                                    disabled={reviewing}
                                    className="px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Resolve Case
                                </button>
                                <button
                                    onClick={() => showReviewPanel ? handleReview('escalate') : setShowReviewPanel(true)}
                                    disabled={reviewing}
                                    className="px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                                    Escalate to Auditor
                                </button>
                                {showReviewPanel && (
                                    <button
                                        onClick={() => { setShowReviewPanel(false); setReviewNotes(''); }}
                                        className="px-6 py-3 bg-white text-slate-700 border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Policy reference */}
            <Card className="border-2 border-slate-100/50 bg-slate-50/30">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100/50 rounded-2xl shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-black">Policy Reference</h3>
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-600 text-white rounded-full font-black uppercase tracking-tighter">Verified</span>
                        </div>
                        <p className="text-sm text-black font-semibold leading-relaxed">
                            AML Policy Section 4.2 · Bank Secrecy Act (BSA) · FATF Recommendations for Digital Transfers
                        </p>
                        <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 italic font-bold">
                            <Code className="w-3 h-3" /> Retrieved via RAG Agent · ChromaDB Vector Search
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ViolationDetails;
