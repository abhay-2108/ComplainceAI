import React, { useState } from 'react';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getViolations } from '../services/api';

const Violations = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All');
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchViolationsData = async () => {
            try {
                const data = await getViolations();
                const mappedData = data.map(v => ({
                    id: v.id,
                    type: v.type,
                    source: v.source,
                    date: v.date,
                    riskScore: v.riskScore,
                    status: v.status
                }));
                setViolations(mappedData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching violations:", error);
                setLoading(false);
            }
        };
        fetchViolationsData();
    }, []);

    const columns = [
        { header: 'Violation ID', accessor: 'id' },
        { header: 'Type', accessor: 'type', className: 'hidden md:table-cell' },
        { header: 'Data Source', accessor: 'source' },
        { header: 'Date', accessor: 'date', className: 'hidden md:table-cell' },
        { header: 'Risk Score', accessor: 'riskScore', className: 'hidden md:table-cell' },
        {
            header: 'Status',
            accessor: 'status',
            className: 'hidden md:table-cell',
            render: (row) => <StatusBadge status={row.status} />
        },
        {
            header: 'Action', className: 'hidden md:table-cell', render: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/violations/${row.id}`); }}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                    Details
                </button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-slate-800">Violations</h2>
                <div className="flex gap-2 md:gap-3">
                    <button className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-slate-200 rounded-md text-slate-600 text-xs md:text-sm hover:bg-slate-50">
                        <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" /> Filter
                    </button>
                    <button className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white rounded-md text-xs md:text-sm hover:bg-blue-800">
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Export
                    </button>
                </div>
            </div>

            <Card className="p-3 md:p-4 border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Search Violations</label>
                        <input type="text" placeholder="Search by ID, Type, or Source..." className="w-full px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>

                    <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4">
                        {['Risk Level', 'Date Range', 'Status', 'Violation Type'].map((placeholder) => (
                            <div key={placeholder} className="min-w-[120px] md:min-w-[140px]">
                                <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider truncate">{placeholder}</label>
                                <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs md:text-sm rounded-lg p-1.5 md:p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer hover:bg-slate-100">
                                    <option>
                                        All {
                                            placeholder === 'Date Range' ? 'Dates' :
                                                placeholder === 'Status' ? 'Statuses' :
                                                    `${placeholder}s`
                                        }
                                    </option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card noPadding>
                <DataTable
                    columns={columns}
                    data={violations}
                    onRowClick={(row) => navigate(`/violations/${row.id}`, { state: { violation: row } })}
                />
                <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Showing 1-10 of 150</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 rounded-md text-sm disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-slate-200 rounded-md text-sm hover:bg-slate-50">Next</button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Violations;
