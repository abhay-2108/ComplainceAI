import React from 'react';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Upload, FileText, Trash2, Eye } from 'lucide-react';

const Policies = () => {
    const policies = [
        { id: 1, name: 'AML_Compliance_2024_v2.pdf', date: '2023-11-01', status: 'Active', size: '2.4 MB' },
        { id: 2, name: 'KYC_Procedures_Global.pdf', date: '2023-10-15', status: 'Active', size: '1.8 MB' },
        { id: 3, name: 'Sanctions_List_EU.pdf', date: '2023-11-10', status: 'Processing', size: '4.1 MB' },
        { id: 4, name: 'Internal_Code_of_Conduct.pdf', date: '2023-01-20', status: 'Inactive', size: '0.9 MB' },
        { id: 5, name: 'Data_Privacy_GDPR.pdf', date: '2023-12-01', status: 'Active', size: '3.2 MB' },
        { id: 6, name: 'Anti_Bribery_Policy.pdf', date: '2023-09-22', status: 'Active', size: '1.5 MB' },
        { id: 7, name: 'Transaction_Monitoring_Rules.pdf', date: '2023-11-05', status: 'Active', size: '2.8 MB' },
        { id: 8, name: 'Customer_Risk_Rating_Model.pdf', date: '2023-10-30', status: 'Processing', size: '5.6 MB' },
        { id: 9, name: 'Vendor_Due_Diligence.pdf', date: '2023-08-14', status: 'Inactive', size: '1.2 MB' },
        { id: 10, name: 'Whistleblower_Protection.pdf', date: '2023-07-01', status: 'Active', size: '0.8 MB' },
        { id: 11, name: 'Cybersecurity_Incident_Response.pdf', date: '2023-11-20', status: 'Active', size: '4.5 MB' },
        { id: 12, name: 'Trade_Finance_Controls.pdf', date: '2023-10-05', status: 'Active', size: '2.1 MB' },
    ];

    const columns = [
        {
            header: 'Policy Name', accessor: 'name', render: (row) => (
                <div className="flex items-center">
                    <FileText className="w-4 h-4 text-primary mr-2" />
                    <span className="font-medium text-slate-700 truncate max-w-[150px] md:max-w-none">{row.name}</span>
                </div>
            )
        },
        { header: 'Slze', accessor: 'size', className: 'hidden md:table-cell' },
        { header: 'Upload Date', accessor: 'date', className: 'hidden md:table-cell' },
        { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
        {
            header: 'Actions', className: 'hidden md:table-cell', render: () => (
                <div className="flex gap-2">
                    <button className="p-1.5 text-slate-500 hover:text-primary rounded hover:bg-slate-50 transition-colors">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:text-danger rounded hover:bg-slate-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2" noPadding>
                    <div className="flex justify-between items-center p-4 md:p-6 mb-0">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800">Policy Documents</h2>
                    </div>
                    <DataTable columns={columns} data={policies} />
                </Card>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-primary hover:bg-blue-50/50 transition-all cursor-pointer group">
                        <div className="w-16 h-16 bg-blue-500/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">Upload New Policy</h3>
                        <p className="text-slate-500 text-sm mb-4">Drag and drop PDF files here, or click to browse</p>
                        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
                            Select Files
                        </button>
                    </div>

                    <Card title="Policy Engine Status" className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-lg mb-1 text-white">RAG Engine Online</h4>
                                <p className="text-slate-400 text-xs">Index updated 2 mins ago</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-emerald-400">99.9%</div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Uptime</p>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Vector Embeddings</span>
                                <span className="font-mono text-white">14,205</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Queries Processed</span>
                                <span className="font-mono text-white">1,204</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Policies;
