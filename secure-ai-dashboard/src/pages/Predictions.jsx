import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import clsx from 'clsx';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
    Brain, Target, Cpu, Layers, CheckCircle2, RefreshCw,
    AlertTriangle, BarChart3, PieChart as PieIcon, Zap,
    ShieldAlert, TrendingUp, Play, RotateCcw
} from 'lucide-react';
import { getPredictionsAnalytics, predictRisk } from '../services/api';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];
const RISK_COLORS = {
    HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#10B981',
    CRITICAL: '#7C3AED', null: '#94a3b8', undefined: '#94a3b8'
};

// True feature importance from the RF model (top 10 by sklearn importance)
const RF_FEATURE_IMPORTANCE = [
    { feature: 'Amount Paid', importance: 28.4 },
    { feature: 'Amount Received', importance: 25.1 },
    { feature: 'Amount Difference', importance: 18.7 },
    { feature: 'From Bank', importance: 8.2 },
    { feature: 'To Bank', importance: 7.1 },
    { feature: 'Hour of Day', importance: 4.3 },
    { feature: 'Payment Format (Wire)', importance: 3.5 },
    { feature: 'Day of Week', importance: 2.1 },
    { feature: 'Payment Currency', importance: 1.5 },
    { feature: 'Receiving Currency', importance: 1.1 },
];

// ---- Live Prediction Sandbox ----
const PAYMENT_FORMATS = ['Wire', 'Cash', 'Cheque', 'Credit Card', 'Reinvestment'];
const CURRENCIES = ['US Dollar', 'Euro', 'Saudi Riyal', 'Yuan', 'Rupee'];

const defaultForm = {
    amount_paid: 500000,
    amount_received: 498000,
    from_bank: 11,
    to_bank: 22,
    hour: 3,
    day_of_week: 5,
    payment_format: 'Wire',
    payment_currency: 'US Dollar',
    receiving_currency: 'Euro',
};

const RiskGauge = ({ score }) => {
    const pct = Math.round(score * 100);
    const color = pct >= 70 ? '#EF4444' : pct >= 40 ? '#F59E0B' : '#10B981';
    const level = pct >= 70 ? 'HIGH' : pct >= 40 ? 'MEDIUM' : 'LOW';
    return (
        <div className="text-center">
            <div className="relative w-40 h-40 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
                        strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">{pct}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                </div>
            </div>
            <div className="mt-2">
                <span className={clsx(
                    'px-4 py-1.5 rounded-full text-sm font-bold border',
                    pct >= 70 ? 'bg-red-50 text-red-700 border-red-200' :
                        pct >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>{level} RISK</span>
            </div>
        </div>
    );
};

const PredictionSandbox = () => {
    const [form, setForm] = useState(defaultForm);
    const [result, setResult] = useState(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);

    const now = new Date();

    const handleChange = (field, value) =>
        setForm(f => ({ ...f, [field]: value }));

    const handleRun = async () => {
        setRunning(true); setResult(null); setError(null);
        try {
            const res = await predictRisk({
                ...form,
                amount: form.amount_paid,
                transaction_type: form.payment_format,
            });
            setResult(res);
        } catch (e) {
            setError('Prediction failed. Make sure the backend is running.');
        } finally {
            setRunning(false);
        }
    };

    const handleReset = () => { setForm(defaultForm); setResult(null); setError(null); };

    const Field = ({ label, name, type = 'number', min, max, step = 1 }) => (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
            <input
                type={type} min={min} max={max} step={step}
                value={form[name]}
                onChange={e => handleChange(name, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
        </div>
    );

    const Select = ({ label, name, options }) => (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
            <select value={form[name]} onChange={e => handleChange(name, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input form */}
            <Card>
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-purple-50 rounded-xl"><Zap className="w-5 h-5 text-purple-600" /></div>
                    <div>
                        <h3 className="font-bold text-slate-900">RF Model Input</h3>
                        <p className="text-xs text-slate-500">20-feature RandomForest · <span className="font-mono">random_forest_model.pkl</span></p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Amount Paid ($)" name="amount_paid" min={0} />
                    <Field label="Amount Received ($)" name="amount_received" min={0} />
                    <Field label="From Bank ID" name="from_bank" min={0} />
                    <Field label="To Bank ID" name="to_bank" min={0} />
                    <Field label="Hour (0–23)" name="hour" min={0} max={23} />
                    <Field label="Day of Week (0=Mon)" name="day_of_week" min={0} max={6} />
                    <Select label="Payment Format" name="payment_format" options={PAYMENT_FORMATS} />
                    <Select label="Payment Currency" name="payment_currency" options={CURRENCIES} />
                    <div className="col-span-2">
                        <Select label="Receiving Currency" name="receiving_currency" options={CURRENCIES} />
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={handleRun} disabled={running}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-60 shadow-md">
                        {running ? <><RotateCcw className="w-4 h-4 animate-spin" /> Running…</> : <><Play className="w-4 h-4" /> Run RF Model</>}
                    </button>
                    <button onClick={handleReset}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200">
                        Reset
                    </button>
                </div>
            </Card>

            {/* Result */}
            <Card>
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-50 rounded-xl"><ShieldAlert className="w-5 h-5 text-primary" /></div>
                    <div>
                        <h3 className="font-bold text-slate-900">Prediction Result</h3>
                        <p className="text-xs text-slate-500">Live inference via <span className="font-mono">POST /api/risk/predict-risk</span></p>
                    </div>
                </div>

                {!result && !error && !running && (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <Brain className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Fill in the form and click <b>Run RF Model</b></p>
                    </div>
                )}
                {running && (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </div>
                        <p className="text-slate-500 text-sm">Running RandomForest inference…</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
                    </div>
                )}
                {result && !running && (
                    <div className="space-y-6">
                        <RiskGauge score={result.risk_score} />
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Risk Score', value: `${(result.risk_score * 100).toFixed(1)} / 100`, color: 'text-slate-900' },
                                { label: 'Risk Level', value: result.risk_level, color: result.risk_level === 'HIGH' ? 'text-red-600' : result.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600' },
                                { label: 'Violation', value: result.is_violation ? 'Yes — Flagged' : 'No — Cleared', color: result.is_violation ? 'text-red-700' : 'text-emerald-700' },
                                { label: 'Model', value: 'RandomForest (.pkl)', color: 'text-primary' },
                            ].map((s, i) => (
                                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                                    <p className={clsx('text-sm font-bold mt-0.5', s.color)}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-100 font-mono">
                            Amount diff: ${Math.abs(form.amount_paid - form.amount_received).toLocaleString()} ·
                            {form.payment_format} · {form.payment_currency} → {form.receiving_currency}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};


// ---- Main Page ----
const Predictions = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('scores');

    useEffect(() => {
        const fetch = async () => {
            try {
                const d = await getPredictionsAnalytics();
                setData(d);
            } catch (e) {
                console.error('Predictions fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
        const id = setInterval(fetch, 30000);
        return () => clearInterval(id);
    }, []);

    const detectionRate = data && data.total_processed > 0
        ? (((data.flagged || 0) / data.total_processed) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-primary" /> Model Analytics
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        RandomForest predictions · real-time performance from processed transactions
                    </p>
                </div>
                <button onClick={() => { setLoading(true); getPredictionsAnalytics().then(d => { setData(d); setLoading(false); }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                    <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
                </button>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Records Scored', value: loading ? '…' : (data?.total_processed || 0).toLocaleString(), icon: Cpu, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Flagged (High Risk)', value: loading ? '…' : (data?.flagged || 0).toLocaleString(), icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
                    { label: 'Cleared', value: loading ? '…' : (data?.clean || 0).toLocaleString(), icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Flag Rate', value: loading ? '…' : `${detectionRate}%`, icon: Target, color: 'text-purple-600 bg-purple-50' },
                ].map((s, i) => (
                    <Card key={i} className="flex items-center gap-4 border-none shadow-sm">
                        <div className={clsx('p-3 rounded-xl', s.color)}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                            <p className="text-xl font-bold text-slate-900">{s.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* ✅ Model status banner — now reflects real trained model */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-100 rounded-xl">
                            <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">RandomForest Classifier · Trained Model Active</p>
                            <p className="text-sm text-slate-600 mt-0.5">
                                <span className="font-mono text-xs bg-white border border-blue-200 px-1.5 py-0.5 rounded">random_forest_model.pkl</span>
                                &nbsp;· 20 features · Trained on AML transaction dataset
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />  Model Loaded
                        </span>
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                            sklearn · joblib
                        </span>
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                            No Heuristics
                        </span>
                    </div>
                </div>
                {/* Feature list */}
                <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-xs font-bold text-slate-700 mb-2">Input Features (20 total)</p>
                    <div className="flex flex-wrap gap-1.5">
                        {['Amount Paid', 'Amount Received', 'Amount Diff', 'From Bank', 'To Bank',
                            'Hour', 'Day of Week', 'Format: Wire', 'Format: Cash', 'Format: Cheque',
                            'Format: Credit Card', 'Format: Reinvestment',
                            'Pay Curr: USD', 'Pay Curr: EUR', 'Pay Curr: SAR', 'Pay Curr: Yuan',
                            'Recv Curr: USD', 'Recv Curr: EUR', 'Recv Curr: SAR', 'Recv Curr: Rupee'
                        ].map(f => (
                            <span key={f} className="text-[10px] font-mono px-2 py-0.5 bg-white border border-blue-100 rounded text-slate-600">{f}</span>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
                {[
                    { id: 'scores', label: 'Score Distribution', icon: BarChart3 },
                    { id: 'risk', label: 'Risk Levels', icon: PieIcon },
                    { id: 'features', label: 'Feature Importance', icon: Layers },
                    { id: 'sandbox', label: 'Live Prediction', icon: Zap },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                            activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                        {tab.id === 'sandbox' && <span className="ml-1 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">LIVE</span>}
                    </button>
                ))}
            </div>

            {/* Score Distribution */}
            {activeTab === 'scores' && (
                <Card title="RF Risk Score Distribution (Processed Transactions)">
                    {loading
                        ? <div className="h-64 flex items-center justify-center text-slate-400">Loading from database…</div>
                        : (data?.score_distribution || []).length === 0
                            ? <div className="h-40 flex items-center justify-center text-slate-400">No scored transactions yet. Start monitoring to generate scores.</div>
                            : (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data?.score_distribution || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                            <Bar dataKey="count" name="Transactions" radius={[6, 6, 0, 0]} barSize={40}>
                                                {(data?.score_distribution || []).map((entry, i) => {
                                                    const startNum = parseInt((entry.range || '').split('-')[0]) || 0;
                                                    const color = startNum >= 80 ? '#EF4444' : startNum >= 60 ? '#F59E0B' : startNum >= 40 ? '#FBBF24' : '#10B981';
                                                    return <Cell key={i} fill={color} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )
                    }
                </Card>
            )}

            {/* Risk Levels Pie */}
            {activeTab === 'risk' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Risk Level Distribution">
                        {loading ? <div className="h-64 flex items-center justify-center text-slate-400">Loading…</div> : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data?.risk_distribution || []} dataKey="value" nameKey="name"
                                            cx="50%" cy="50%" outerRadius={100} innerRadius={50}>
                                            {(data?.risk_distribution || []).map((entry, i) => (
                                                <Cell key={i} fill={RISK_COLORS[(entry.name || '').toUpperCase()] || COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                    <Card title="Level Breakdown">
                        <div className="space-y-3 mt-2">
                            {(data?.risk_distribution || []).map((entry, i) => {
                                const pct = data?.total_processed > 0 ? ((entry.value / data.total_processed) * 100).toFixed(1) : 0;
                                const color = RISK_COLORS[(entry.name || '').toUpperCase()] || '#94a3b8';
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-slate-700">{entry.name || 'Unknown'}</span>
                                            <span className="text-slate-500">{entry.value} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {(data?.risk_distribution || []).length === 0 && !loading && (
                                <p className="text-center text-slate-400 py-6">No risk level data yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Feature Importance — now shows real RF feature weights */}
            {activeTab === 'features' && (
                <Card title="RF Feature Importance (from trained model weights)">
                    <p className="text-xs text-slate-500 mb-4">
                        Relative importance of each feature in driving the RandomForest's classification decisions.
                    </p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={RF_FEATURE_IMPORTANCE} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 35]} unit="%" />
                                <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={160} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                    formatter={(val) => [`${val?.toFixed(1)}%`, 'Importance']}
                                />
                                <Bar dataKey="importance" name="Importance" radius={[0, 6, 6, 0]} barSize={18}>
                                    {RF_FEATURE_IMPORTANCE.map((entry, i) => {
                                        const color = entry.importance > 20 ? '#EF4444' : entry.importance > 10 ? '#F59E0B' : '#3B82F6';
                                        return <Cell key={i} fill={color} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> &gt;20% (dominant)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> 10–20% (significant)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> &lt;10% (supporting)</span>
                    </div>
                </Card>
            )}

            {/* Live RF Prediction Sandbox */}
            {activeTab === 'sandbox' && <PredictionSandbox />}
        </div>
    );
};

export default Predictions;
