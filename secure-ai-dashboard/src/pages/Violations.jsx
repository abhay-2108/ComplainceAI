import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import clsx from 'clsx';
import {
    Shield, Filter, Download, Search, AlertOctagon, BrainCircuit,
    ChevronDown, ChevronRight, ArrowUpRight, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getViolations } from '../services/api';

const riskColors = {
    HIGH: 'bg-red-50 text-red-700 border-red-200',
    CRITICAL: 'bg-purple-50 text-purple-700 border-purple-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const RiskBadge = ({ score }) => {
    const n = Number(score) || 0;
    const color = n >= 80 ? 'text-red-600 bg-red-50 border-red-200' :
        n >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' :
            'text-emerald-600 bg-emerald-50 border-emerald-200';
    const label = n >= 80 ? 'HIGH' : n >= 60 ? 'MEDIUM' : 'LOW';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ width: 60 }}>
                <div className="h-1.5 rounded-full" style={{ width: `${n}%`, backgroundColor: n >= 80 ? '#EF4444' : n >= 60 ? '#F59E0B' : '#10B981' }} />
            </div>
            <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full border', color)}>{label}</span>
        </div>
    );
};

const Violations = () => {
    const navigate = useNavigate();
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 15;

    useEffect(() => {
        const fetchViolations = async () => {
            try {
                const data = await getViolations();
                setViolations(data);
            } catch (e) {
                console.error('Violations fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchViolations();
        const id = setInterval(fetchViolations, 15000);
        return () => clearInterval(id);
    }, []);

    const filtered = violations.filter(v => {
        const matchSearch = search === '' ||
            (v.id || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.type || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.source || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || (v.status || '').toLowerCase() === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertOctagon className="w-6 h-6 text-red-500" />
                        Violations
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {loading ? 'Loading…' : `${violations.length} flagged transactions · refreshes every 15s`}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setLoading(true); getViolations().then(d => { setViolations(d); setLoading(false); }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                        <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-800 shadow-md">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Flagged', value: violations.length, color: 'text-red-600 bg-red-50', icon: AlertOctagon },
                    { label: 'High Risk', value: violations.filter(v => Number(v.riskScore) >= 80).length, color: 'text-red-600 bg-red-50', icon: AlertTriangle },
                    { label: 'Medium Risk', value: violations.filter(v => { const s = Number(v.riskScore); return s >= 60 && s < 80; }).length, color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
                    { label: 'Low Risk', value: violations.filter(v => Number(v.riskScore) < 60).length, color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
                ].map((s, i) => (
                    <Card key={i} className="flex items-center gap-3 border-none shadow-sm">
                        <div className={clsx('p-2.5 rounded-xl', s.color)}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                            <p className="text-xl font-bold text-slate-900">{loading ? '…' : s.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            type="text" placeholder="Search by ID, Type, or Account…"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'flagged', 'pending', 'resolved'].map(f => (
                            <button key={f} onClick={() => { setFilterStatus(f); setPage(1); }}
                                className={clsx(
                                    'px-3 py-2 rounded-lg text-sm font-semibold border capitalize transition-colors',
                                    filterStatus === f ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                )}>
                                {f === 'all' ? 'All' : f}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="w-8" />
                                {['Violation ID', 'Account', 'Type', 'Date', 'Risk Score', 'Status', 'Action'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="py-16 text-center text-slate-400">Loading violations from database…</td></tr>
                            ) : paged.length === 0 ? (
                                <tr><td colSpan={8} className="py-16 text-center text-slate-400">No violations found.</td></tr>
                            ) : paged.map(v => (
                                <React.Fragment key={v.id}>
                                    <tr className={clsx(
                                        'border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer',
                                        expandedId === v.id && 'bg-blue-50/30'
                                    )} onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                                        <td className="py-4 pl-4">
                                            {expandedId === v.id
                                                ? <ChevronDown className="w-4 h-4 text-primary" />
                                                : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                        </td>
                                        <td className="px-4 py-4 font-mono text-xs text-primary font-semibold">{v.id}</td>
                                        <td className="px-4 py-4 text-sm text-slate-600 font-medium">{v.source || 'N/A'}</td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{v.type || 'N/A'}</td>
                                        <td className="px-4 py-4 text-xs text-slate-500">
                                            {v.date ? String(v.date).slice(0, 10) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <RiskBadge score={v.riskScore} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={v.status || 'Flagged'} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <button onClick={e => { e.stopPropagation(); navigate(`/violations/${v.id}`); }}
                                                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                                                Details <ArrowUpRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Expanded AI Explanation */}
                                    {expandedId === v.id && (
                                        <tr className="bg-blue-50/20">
                                            <td colSpan={8} className="px-8 py-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                                                        <BrainCircuit className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-bold text-slate-800 text-sm">AI Compliance Reasoning</h4>
                                                            <span className="text-xs bg-blue-100 text-primary px-2 py-0.5 rounded-full font-semibold">Explanation Agent · Llama3</span>
                                                        </div>
                                                        <div className="bg-white border border-blue-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed shadow-sm">
                                                            {v.explanation || 'This transaction was flagged by the automated risk engine. Detailed AI analysis is pending for this record.'}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">Model: Ollama (Local)</span>
                                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">Audit-Ready: Yes</span>
                                                            <button onClick={() => navigate(`/violations/${v.id}`)}
                                                                className="ml-auto text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                                                Full Report <ArrowUpRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Showing <span className="font-bold text-slate-700">{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="font-bold text-slate-700">{filtered.length}</span>
                    </span>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50">← Prev</button>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50">Next →</button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Violations;
