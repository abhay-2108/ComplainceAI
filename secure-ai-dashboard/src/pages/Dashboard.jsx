import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, ShieldAlert, CheckCircle, DollarSign, Database, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { getDashboardMetrics, getViolations, runAgents } from '../services/api';

const MetricCard = ({ title, value, change, trend = 'up', icon: Icon, color }) => (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] p-3 md:p-5">
        <div className="flex justify-between items-start mb-2 md:mb-4">
            <div className={clsx("p-2 md:p-3 rounded-2xl text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300", color)}>
                {Icon ? <Icon className="w-4 h-4 md:w-6 md:h-6" /> : <Activity className="w-4 h-4 md:w-6 md:h-6" />}
            </div>
            <div className={clsx("flex items-center text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border",
                trend === 'up'
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
            )}>
                {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> : <ArrowDownRight className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />}
                {change}
            </div>
        </div>
        <div>
            <h4 className="text-slate-500 text-xs md:text-sm font-medium truncate">{title}</h4>
            <div className="text-xl md:text-3xl font-bold text-slate-900 mt-0.5 md:mt-1 tracking-tight">{value}</div>
            <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1 font-medium">vs last 7 days</p>
        </div>
        {/* Decorative background element */}
        <div className={clsx("absolute -bottom-6 -right-6 w-20 h-20 md:w-32 md:h-32 rounded-full opacity-5 blur-3xl group-hover:opacity-10 transition-opacity duration-500", color)} />
    </Card>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [liveStats, setLiveStats] = useState(null);
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [batchRunning, setBatchRunning] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsData, violationsData] = await Promise.all([
                    getDashboardMetrics(),
                    getViolations()
                ]);
                setLiveStats(metricsData);
                setViolations(violationsData.slice(0, 5).map(v => ({
                    id: v.id,
                    type: v.type,
                    source: v.source,
                    time: v.date,
                    status: v.status
                })));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleBatchScan = async () => {
        setBatchRunning(true);
        try { await runAgents(); } catch (e) { console.error(e); } finally { setBatchRunning(false); }
    };



    const stats = [
        { title: 'Total Monitored Vol', value: liveStats?.total_volume || '$0', change: '+2.5%', trend: 'up', icon: DollarSign, color: 'bg-indigo-600' },
        { title: 'Confirmed Violations', value: liveStats?.total_violations ?? '0', change: 'Live', trend: 'down', icon: ShieldAlert, color: 'bg-red-600' },
        { title: 'Records Scanned', value: liveStats?.records_scanned || '0', change: 'Active', trend: 'up', icon: Activity, color: 'bg-blue-500' },
        { title: 'Network Health', value: liveStats?.health_score || '100%', change: '+0.2%', trend: 'up', icon: CheckCircle, color: 'bg-emerald-500' },
    ];

    const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];


    const columns = [
        { header: 'Transaction ID', accessor: 'id' },
        { header: 'Violation Type', accessor: 'type', className: 'hidden md:table-cell' },
        { header: 'Data Source', accessor: 'source' },
        { header: 'Time', accessor: 'time', className: 'hidden md:table-cell' },
        {
            header: 'Status',
            accessor: 'status',
            className: 'hidden md:table-cell',
            render: (row) => <StatusBadge status={row.status} />
        },
        {
            header: 'Action', render: (row) => (
                <button
                    onClick={() => navigate(`/violations/${row.id}`)}
                    className="text-primary hover:text-blue-700 text-xs font-medium"
                >
                    View
                </button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">AML Command Center</h2>
                    <p className="text-slate-500 text-sm mt-1">Live database metrics · auto-refreshes every 15s</p>
                </div>
                <button onClick={handleBatchScan} disabled={batchRunning}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-800 shadow-md disabled:opacity-60">
                    <Database className={clsx('w-4 h-4', batchRunning && 'animate-pulse')} />
                    {batchRunning ? 'Scanning…' : 'Scan Entire Database'}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                    <MetricCard
                        key={index}
                        title={stat.title}
                        value={loading ? '…' : stat.value}
                        change={stat.change}
                        trend={stat.trend}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Transaction & Risk Trend (Live from DB)" className="w-full">
                        {loading || !liveStats?.trend?.length ? (
                            <div className="h-64 md:h-80 flex items-center justify-center text-slate-400 text-sm">
                                {loading ? 'Loading trend data…' : 'No trend data yet. Start monitoring to generate data.'}
                            </div>
                        ) : (
                            <div className="h-64 md:h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={liveStats.trend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                        />
                                        <Line type="monotone" dataKey="active" name="Total" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 3, fill: '#1E3A8A', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                        <Line type="monotone" dataKey="risk" name="Violations" stroke="#DC2626" strokeWidth={3} dot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>

                    <Card title="Payment Format Distribution" className="w-full">
                        <div className="h-64 md:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={liveStats?.format_distribution || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {(liveStats?.format_distribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <Card title="Recent Violations" action={<button onClick={() => navigate('/violations')} className="text-sm text-primary font-medium hover:underline">View All</button>} className="w-full" noPadding>
                    <DataTable columns={columns} data={violations} />
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
