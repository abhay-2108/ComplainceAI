import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import clsx from 'clsx';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, Area, AreaChart, Legend
} from 'recharts';
import {
    FileText, Download, RefreshCw, TrendingUp, AlertTriangle, ShieldCheck,
    Users, Calendar, BarChart3, PieChart as PieIcon, ArrowUpRight, DollarSign,
    BrainCircuit, MessageSquare, Fingerprint, Activity
} from 'lucide-react';
import { getReports } from '../services/api';

const COLORS = ['#1E3A8A', '#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

const riskLevelColor = (level) => {
    const l = (level || '').toUpperCase();
    if (l === 'HIGH' || l === 'CRITICAL') return 'text-red-600 bg-red-50 border-red-200';
    if (l === 'MEDIUM') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetch = async () => {
            try {
                const d = await getReports();
                setData(d);
            } catch (e) {
                console.error('Reports fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
        const id = setInterval(fetch, 30000);
        return () => clearInterval(id);
    }, []);

    const totalViolations = (data?.risk_distribution || []).reduce((s, d) => s + d.value, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-black flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" /> Compliance Reports
                    </h2>
                    <p className="text-slate-600 text-sm mt-1 font-semibold">Live aggregated AML insights from your MongoDB database</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setLoading(true); getReports().then(d => { setData(d); setLoading(false); }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                        <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-800 shadow-md">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Violations', value: totalViolations || '—', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
                    { label: 'Avg Risk Score', value: data?.stats?.avg_risk_score ? `${data.stats.avg_risk_score}%` : '—', icon: Activity, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Pipeline Coverage', value: data?.stats?.pipeline_coverage || '—', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Records Scanned', value: data?.stats?.total_scanned?.toLocaleString() || '—', icon: Fingerprint, color: 'text-emerald-600 bg-emerald-50' },
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

            {/* Tab Bar */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: PieIcon },
                    { id: 'trend', label: 'Daily Trend', icon: TrendingUp },
                    { id: 'narratives', label: 'Agent Narratives', icon: MessageSquare },
                    { id: 'accounts', label: 'Top Accounts', icon: Users },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                            activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <Card title="Violation Type Distribution">
                        {loading ? <div className="h-64 flex items-center justify-center text-slate-400">Loading…</div> : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data?.risk_distribution || []} dataKey="value" nameKey="name"
                                            cx="50%" cy="50%" outerRadius={100} labelLine={false} label={<CustomLabel />}>
                                            {(data?.risk_distribution || []).map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                        <Legend iconType="circle" iconSize={10} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>

                    {/* Risk Level Bar */}
                    <Card title="Risk Level Breakdown">
                        {loading ? <div className="h-64 flex items-center justify-center text-slate-400">Loading…</div> : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.risk_levels || []} layout="vertical">
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis dataKey="level" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                                        <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                                            {(data?.risk_levels || []).map((entry, i) => {
                                                const l = (entry.level || '').toUpperCase();
                                                const color = l === 'HIGH' ? '#EF4444' : l === 'MEDIUM' ? '#F59E0B' : '#10B981';
                                                return <Cell key={i} fill={color} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Daily Trend Tab */}
            {activeTab === 'trend' && (
                <Card title="Violation Trend (Last 14 Days)">
                    {loading ? <div className="h-72 flex items-center justify-center text-slate-400">Loading…</div> : (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.daily_trend || []}>
                                    <defs>
                                        <linearGradient id="violGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                    <Area type="monotone" dataKey="violations" name="Violations" stroke="#EF4444"
                                        strokeWidth={3} fill="url(#violGrad)" dot={{ fill: '#EF4444', r: 4, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            )}

            {/* Top Accounts Tab */}
            {activeTab === 'accounts' && (
                <Card title="Top Flagged Accounts" noPadding>
                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-slate-400">Loading…</div>
                    ) : (data?.top_accounts || []).length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No account data yet.</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {['Account ID', 'Violations', 'Total Amount', 'Risk'].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-black text-black uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.top_accounts || []).map((acc, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-primary font-black">{acc.account || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-sm font-black border border-red-100">
                                                {acc.violations}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-black font-black text-sm">
                                            ${((acc.total_amount || 0) / 1000).toFixed(1)}K
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-bold border',
                                                acc.violations > 10 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                            )}>
                                                {acc.violations > 10 ? 'CRITICAL' : 'HIGH'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}

            {/* Agent Narratives Tab */}
            {activeTab === 'narratives' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <BrainCircuit className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-black text-black">Master Reporting Hub</p>
                            <p className="text-sm text-slate-600 font-semibold">Consolidated final responses from the Compliance Reporting Agent</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <Card key={i} className="animate-pulse h-48 bg-slate-50" />
                            ))
                        ) : (data?.recent_narratives || []).length === 0 ? (
                            <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No agent narratives generated yet.</p>
                            </div>
                        ) : (data?.recent_narratives || []).map((n, i) => (
                            <Card key={i} className="group border-slate-100 hover:border-primary/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                            AI
                                        </div>
                                        <span className="font-black text-black text-sm">{n.transaction_id}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(n.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-black text-sm leading-relaxed font-semibold italic">
                                        "{n.explanation?.length > 250 ? n.explanation.substring(0, 250) + '...' : n.explanation}"
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Report Finalized
                                    </span>
                                    <button className="text-xs text-primary font-black hover:underline flex items-center gap-1">
                                        Read Full Report <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </Card>
                        ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
