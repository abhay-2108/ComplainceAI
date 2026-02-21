import React from 'react';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Calendar } from 'lucide-react';

const Reports = () => {
    const barData = [
        { name: 'Jan', violations: 45 },
        { name: 'Feb', violations: 52 },
        { name: 'Mar', violations: 38 },
        { name: 'Apr', violations: 65 },
        { name: 'May', violations: 48 },
        { name: 'Jun', violations: 59 },
        { name: 'Jul', violations: 42 },
        { name: 'Aug', violations: 55 },
        { name: 'Sep', violations: 63 },
        { name: 'Oct', violations: 71 },
        { name: 'Nov', violations: 58 },
        { name: 'Dec', violations: 49 },
    ];

    const pieData = [
        { name: 'GDPR Violation', value: 400 },
        { name: 'Data Leakage', value: 300 },
        { name: 'Access Control', value: 100 },
        { name: 'False Positive', value: 150 },
        { name: 'Retention Policy', value: 80 },
    ];

    const COLORS = ['#16A34A', '#F59E0B', '#DC2626', '#3B82F6', '#8B5CF6'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-slate-800">Compliance Reports</h2>
                <div className="flex gap-2 md:gap-3">
                    <button className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 bg-white border border-slate-200 rounded-md text-slate-600 text-xs md:text-sm hover:bg-slate-50">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden md:inline">Last 6 Months</span><span className="md:hidden">6 Months</span>
                    </button>
                    <button className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 bg-white border border-slate-200 rounded-md text-slate-600 text-xs md:text-sm hover:bg-slate-50">
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden md:inline">Export PDF</span><span className="md:hidden">Export</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Violation Trends (Monthly)">
                    <div className="h-60 md:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="violations" fill="#1E3A8A" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Risk Distribution">
                    <div className="h-60 md:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card title="Key Insights">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">Most Common Violation</h4>
                        <p className="text-xl font-bold text-slate-900">Structuring</p>
                        <p className="text-xs text-slate-500 mt-1">+12% vs last month</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">Avg. Resolution Time</h4>
                        <p className="text-xl font-bold text-slate-900">4.2 Hours</p>
                        <p className="text-xs text-green-600 mt-1">-10% vs last month</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">Department Risk</h4>
                        <p className="text-xl font-bold text-slate-900">Forex Trading</p>
                        <p className="text-xs text-slate-500 mt-1">High volume area</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Reports;
