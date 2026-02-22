import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import clsx from 'clsx';
import {
    ClipboardList, RefreshCw, Download, Search, Filter,
    CheckCircle, AlertTriangle, XCircle, Clock, ChevronDown
} from 'lucide-react';
import { getAuditLogs } from '../services/api';

const riskColor = (level) => {
    const l = (level || '').toUpperCase();
    if (l === 'HIGH' || l === 'CRITICAL') return 'bg-red-50 text-red-700 border-red-200';
    if (l === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (l === 'LOW') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-50 text-slate-500 border-slate-200';
};

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterFlag, setFilterFlag] = useState('all');
    const [limit, setLimit] = useState(100);

    const fetchLogs = async (lim = limit) => {
        setLoading(true);
        try {
            const data = await getAuditLogs(lim);
            setLogs(data);
        } catch (e) {
            console.error('Audit logs fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filtered = logs.filter(log => {
        const matchSearch = search === '' ||
            (log.id || '').toLowerCase().includes(search.toLowerCase()) ||
            (log.account || '').toLowerCase().includes(search.toLowerCase()) ||
            (log.type || '').toLowerCase().includes(search.toLowerCase());
        const matchFlag = filterFlag === 'all' ||
            (filterFlag === 'flagged' && log.flagged) ||
            (filterFlag === 'clean' && !log.flagged);
        return matchSearch && matchFlag;
    });

    const flaggedCount = logs.filter(l => l.flagged).length;
    const cleanCount = logs.filter(l => !l.flagged).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-black flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        Audit Logs
                    </h2>
                    <p className="text-slate-600 text-sm mt-1 font-semibold">Immutable record of all AI-processed transactions</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => fetchLogs()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                        <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-800 shadow-md">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Logged', value: logs.length, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Flagged', value: flaggedCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
                    { label: 'Cleared', value: cleanCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                ].map((s, i) => (
                    <Card key={i} className="flex items-center gap-4 border-none shadow-sm">
                        <div className={clsx('p-3 rounded-xl', s.color)}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{s.label}</p>
                            <p className="text-2xl font-black text-black">{loading ? '…' : s.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            type="text" placeholder="Search by ID, Account, or Type…"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'flagged', label: '⚠ Flagged' },
                            { id: 'clean', label: '✓ Cleared' },
                        ].map(f => (
                            <button key={f.id} onClick={() => setFilterFlag(f.id)}
                                className={clsx(
                                    'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors',
                                    filterFlag === f.id
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                )}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <select value={limit} onChange={e => { setLimit(Number(e.target.value)); fetchLogs(Number(e.target.value)); }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none">
                        <option value={50}>Last 50</option>
                        <option value={100}>Last 100</option>
                        <option value={250}>Last 250</option>
                    </select>
                </div>
            </Card>

            {/* Log Table */}
            <Card noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                            <tr>
                                {['Transaction ID', 'Account', 'Type', 'Amount', 'Risk Score', 'Risk Level', 'Result', 'Timestamp'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Loading audit logs from database…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No logs found.</td></tr>
                            ) : filtered.map((log, i) => (
                                <tr key={i} className={clsx(
                                    'border-b border-slate-50 hover:bg-slate-50 transition-colors text-sm',
                                    log.flagged && 'bg-red-50/30'
                                )}>
                                    <td className="px-4 py-3 font-mono text-xs text-primary font-black">{log.id}</td>
                                    <td className="px-4 py-3 text-black font-bold">{log.account || 'N/A'}</td>
                                    <td className="px-4 py-3 text-black font-black">{log.type || 'N/A'}</td>
                                    <td className="px-4 py-3 text-black font-black">
                                        ${typeof log.amount === 'number' ? log.amount.toLocaleString() : log.amount || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-black text-black">{log.risk_score != null ? `${Number(log.risk_score).toFixed(1)}` : '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-bold border', riskColor(log.risk_level))}>
                                            {log.risk_level || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.flagged
                                            ? <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><AlertTriangle className="w-3 h-3" /> Flagged</span>
                                            : <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle className="w-3 h-3" /> Clean</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                                        {log.timestamp ? String(log.timestamp).slice(0, 16).replace('T', ' ') : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Showing <span className="font-bold text-slate-700">{filtered.length}</span> of <span className="font-bold text-slate-700">{logs.length}</span> records
                    </span>
                    <span className="text-xs text-slate-400">Auto-refreshes every 30s · Immutable ledger</span>
                </div>
            </Card>
        </div>
    );
};

export default AuditLogs;
