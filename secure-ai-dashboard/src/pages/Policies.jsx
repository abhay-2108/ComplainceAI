import React, { useState } from 'react';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Upload, FileText, Trash2, Eye, Loader2 } from 'lucide-react';
import { getPolicies, uploadPolicy } from '../services/api';

const Policies = () => {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPoliciesData = async () => {
        try {
            const data = await getPolicies();
            setPolicies(data.map((p, i) => ({
                id: p.id || i,
                name: p.filename || 'Unknown Policy',
                date: p.upload_date || 'N/A',
                status: 'Active',
                size: p.size || 'N/A'
            })));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching policies:", error);
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPoliciesData();
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            await uploadPolicy(formData);
            setMessage("Policy processed and indexed successfully!");
            fetchPoliciesData(); // Refresh list
        } catch (error) {
            console.error("Upload error:", error);
            setMessage("Failed to upload policy.");
        } finally {
            setUploading(false);
        }
    };

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
                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-primary hover:bg-blue-50/50 transition-all cursor-pointer group relative">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            accept=".pdf"
                            disabled={uploading}
                        />
                        <div className="w-16 h-16 bg-blue-500/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            {uploading ? 'Processing AI Models...' : 'Upload New Policy'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-4">Drag and drop PDF files here, or click to browse</p>
                        {message && <p className="text-xs font-medium text-emerald-600 mb-2">{message}</p>}
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
