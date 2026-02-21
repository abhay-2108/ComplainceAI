import React from 'react';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { getDashboardMetrics, getViolations } from '../services/api';

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
    const [liveStats, setLiveStats] = React.useState(null);
    const [violations, setViolations] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsData, violationsData] = await Promise.all([
                    getDashboardMetrics(),
                    getViolations()
                ]);
                setLiveStats(metricsData);
                // Only show top 5 on dashboard
                setViolations(violationsData.slice(0, 5).map(v => ({
                    id: v.id,
                    type: v.type,
                    source: v.source,
                    time: v.date,
                    status: v.status
                })));
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const data = [
        { name: '01 Oct', active: 4000, risk: 240 },
        { name: '02 Oct', active: 3000, risk: 139 },
        { name: '03 Oct', active: 2000, risk: 980 },
        { name: '04 Oct', active: 2780, risk: 390 },
        { name: '05 Oct', active: 1890, risk: 480 },
        { name: '06 Oct', active: 2390, risk: 380 },
        { name: '07 Oct', active: 3490, risk: 430 },
        { name: '08 Oct', active: 4200, risk: 520 },
        { name: '09 Oct', active: 3100, risk: 310 },
        { name: '10 Oct', active: 2500, risk: 650 },
        { name: '11 Oct', active: 2900, risk: 410 },
        { name: '12 Oct', active: 3800, risk: 290 },
        { name: '13 Oct', active: 4100, risk: 180 },
        { name: '14 Oct', active: 3600, risk: 320 },
    ];

    const stats = [
        { title: 'Total Data Records', value: liveStats?.total_records || '500,000', change: '+0%', icon: Activity, color: 'bg-blue-500' },
        { title: 'AI Scanned Progress', value: liveStats?.records_scanned || '0', change: 'Live', icon: CheckCircle, color: 'bg-green-500' },
        { title: 'Policy Violations', value: liveStats?.total_violations || '0', change: '0', icon: AlertTriangle, color: 'bg-amber-500' },
        { title: 'Data Health Score', value: liveStats?.health_score || '100%', change: '+0%', icon: ShieldAlert, color: 'bg-red-500' },
    ];


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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                    <MetricCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        trend={stat.change.startsWith('+') ? 'up' : 'down'}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-6">
                <Card title="Risk Trend Analysis" className="w-full">
                    <div className="h-64 md:h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={liveStats?.trend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                />
                                <Line type="monotone" dataKey="active" stroke="#1E3A8A" strokeWidth={3} dot={true} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="risk" stroke="#DC2626" strokeWidth={3} dot={true} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Recent Violations" action={<button onClick={() => navigate('/violations')} className="text-sm text-primary font-medium hover:underline">View All</button>} className="w-full" noPadding>
                    <DataTable columns={columns} data={violations} />
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
