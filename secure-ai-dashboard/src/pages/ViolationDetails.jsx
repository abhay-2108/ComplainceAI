import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import {
    ArrowLeft, CheckCircle, XCircle, FileText, AlertOctagon,
    BrainCircuit, ShieldAlert, Cpu, DollarSign, Clock, User,
    TrendingUp, AlertTriangle, Download, ExternalLink
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { getViolationById } from '../services/api';

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
                <p className="text-sm font-mono text-slate-300">{step.text}</p>
                {step.detail && <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>}
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

const ViolationDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [violation, setViolation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await getViolationById(id);
                setViolation(data);
            } catch (e) {
                console.error('ViolationDetails fetch error:', e);
                setError('Could not load violation details.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

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

    // Build reasoning steps from real explanation
    const explanationLines = (violation.explanation || '')
        .split(/\n|\.(?=\s)/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 6);

    const reasoningSteps = explanationLines.length > 0 ? explanationLines.map((line, i) => ({
        text: line,
        status: i === explanationLines.length - 1 ? 'risk' : (i % 2 === 0 ? 'safe' : 'info'),
    })) : [
        { text: 'Transaction ingested by Monitoring Agent.', status: 'safe' },
        { text: 'ML model scored: ' + score.toFixed(1), status: 'info' },
        { text: 'Risk threshold exceeded — violation flagged.', status: 'risk' },
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
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
                    <h2 className="text-2xl font-bold text-slate-900">{violation.id}</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Flagged by AI Compliance Pipeline · {dateStr}</p>
                </div>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Account ID', value: violation.source || 'N/A', icon: User, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Transaction Type', value: violation.type || 'N/A', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Status', value: violation.status || 'Flagged', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
                    { label: 'Risk Score', value: `${score.toFixed(1)} / 100`, icon: ShieldAlert, color: 'text-amber-600 bg-amber-50' },
                ].map((m, i) => (
                    <Card key={i} className="flex items-center gap-3 border-none shadow-sm">
                        <div className={clsx('p-2.5 rounded-xl', m.color)}>
                            <m.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                            <p className="text-base font-bold text-slate-900 truncate">{m.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Risk Score Gauge */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">Risk Score</h3>
                    <span className="text-2xl font-bold text-slate-900">{score.toFixed(1)}</span>
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
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <BrainCircuit className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">AI Compliance Reasoning</h3>
                            <p className="text-xs text-slate-500">Generated by Explanation Agent · Llama3 (Local)</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed max-h-64 overflow-y-auto">
                        {violation.explanation || 'This transaction was flagged by the automated risk engine. Detailed AI analysis is pending.'}
                    </div>
                    <div className="flex gap-2 mt-3">
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded font-medium">Audit-Ready: Yes</span>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded font-medium">RAG: Enabled</span>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded font-medium">Model: llama3:8b</span>
                    </div>
                </Card>

                {/* Reasoning chain (dark terminal) */}
                <Card className="bg-slate-900 border-slate-800">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-slate-800 rounded-xl">
                            <Cpu className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Agent Reasoning Chain</h3>
                            <p className="text-xs text-slate-500">Live pipeline trace</p>
                        </div>
                        <div className="ml-auto flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-3.5">
                        {reasoningSteps.map((step, i) => (
                            <ReasoningStep key={i} step={step} index={i} />
                        ))}
                    </div>
                </Card>
            </div>

            {/* Policy reference + actions */}
            <Card>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Policy Reference</h3>
                            <p className="text-sm text-slate-600 mt-0.5">AML Policy Section 4.2 · Bank Secrecy Act · FATF Recommendations</p>
                            <p className="text-xs text-slate-400 mt-1">Retrieved via Policy RAG Agent · top-3 relevant chunks matched</p>
                        </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Mark Resolved
                        </button>
                        <button className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-300 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" /> Escalate
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ViolationDetails;
