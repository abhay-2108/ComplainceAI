import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import clsx from 'clsx';
import {
    Upload, FileText, Loader2, CheckCircle2, AlertCircle,
    Info, Database, Layers, RefreshCw, Cpu, ShieldCheck,
    Clock, Hash, Archive, Sparkles
} from 'lucide-react';
import { getPolicies, uploadPolicy } from '../services/api';

// ---- Upload status banner ----
const UploadBanner = ({ result, onDismiss }) => {
    if (!result) return null;
    const isSkipped = result.status === 'skipped';
    const isError = result.status === 'error';
    return (
        <div className={clsx(
            'flex items-start gap-3 p-4 rounded-xl border text-sm font-medium transition-all',
            isSkipped ? 'bg-amber-50 border-amber-200 text-amber-800' :
                isError ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-emerald-50 border-emerald-200 text-emerald-800'
        )}>
            {isSkipped ? <Info className="w-5 h-5 shrink-0 mt-0.5" /> :
                isError ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> :
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
            <div className="flex-1">
                <p className="font-bold">
                    {isSkipped ? 'Already Indexed — Skipped'
                        : isError ? 'Upload Failed'
                            : 'Policy Indexed Successfully'}
                </p>
                <p className="font-normal mt-0.5 opacity-80">{result.message}</p>
            </div>
            <button onClick={onDismiss} className="opacity-50 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
    );
};

// ---- Individual policy card ----
const PolicyCard = ({ policy }) => {
    const uploadDate = policy.date
        ? String(policy.date).slice(0, 16).replace('T', ' ')
        : 'N/A';
    const chunks = policy.chunks_count ?? 0;

    return (
        <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all group">
            <div className="p-3 bg-blue-50 rounded-xl shrink-0 group-hover:bg-blue-100 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm truncate">{policy.name || 'Unknown Policy'}</p>
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5" /> Active
                    </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {uploadDate}
                    </span>
                    <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-400" />
                        <span className="font-semibold text-slate-700">{chunks}</span> chunks indexed
                    </span>
                    <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-purple-400" />
                        Deduplicated
                    </span>
                </div>
                {/* Chunk progress bar */}
                {chunks > 0 && (
                    <div className="mt-2">
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-1 bg-gradient-to-r from-blue-400 to-primary rounded-full"
                                style={{ width: `${Math.min((chunks / 200) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{chunks} vector embeddings stored in ChromaDB</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---- Main Page ----
const Policies = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dragging, setDragging] = useState(false);

    const fetchPolicies = async () => {
        try {
            const data = await getPolicies();
            setPolicies(data);
        } catch (e) {
            console.error('Policies fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPolicies(); }, []);

    const handleUpload = async (file) => {
        if (!file || !file.name.endsWith('.pdf')) {
            setUploadResult({ status: 'error', message: 'Only PDF files are supported.' });
            return;
        }
        setUploading(true);
        setUploadResult(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await uploadPolicy(formData);
            setUploadResult(res);
            if (res.status !== 'error') fetchPolicies();
        } catch (e) {
            setUploadResult({ status: 'error', message: 'Upload failed. Check server logs.' });
        } finally {
            setUploading(false);
        }
    };

    const onFileChange = (e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); };
    const onDrop = (e) => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
    };

    // Derived stats
    const totalChunks = policies.reduce((sum, p) => sum + (p.chunks_count || 0), 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="w-6 h-6 text-primary" /> Policy Management
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        PDF policies are chunked, embedded once, and indexed into the RAG vector store
                    </p>
                </div>
                <button onClick={fetchPolicies} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                    <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
                </button>
            </div>

            {/* Upload Result Banner */}
            {uploadResult && <UploadBanner result={uploadResult} onDismiss={() => setUploadResult(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ---- LEFT: Policy Document Cards ---- */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-lg">
                            Policy Documents
                            <span className="ml-2 text-sm font-normal text-slate-400">({loading ? '…' : policies.length} indexed)</span>
                        </h3>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Each document embedded only once
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <FileText className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">No policies indexed yet</p>
                            <p className="text-slate-400 text-sm mt-1">Upload a PDF policy to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {policies.map((policy, i) => (
                                <PolicyCard key={i} policy={policy} />
                            ))}
                        </div>
                    )}

                    {/* Deduplication Info Box */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600">
                            <p className="font-semibold text-slate-800">Content-Based Deduplication Active</p>
                            <p className="mt-0.5">Each PDF is fingerprinted with a <span className="font-mono text-xs bg-white border border-slate-200 px-1 py-0.5 rounded">SHA-256</span> hash of its full text. Uploading the same document again — even with a different filename — is instantly detected and <strong>skipped without re-generating embeddings</strong>.</p>
                        </div>
                    </div>
                </div>

                {/* ---- RIGHT: Upload + Engine Status ---- */}
                <div className="space-y-5">
                    {/* Upload Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={clsx(
                            'relative bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer group',
                            dragging ? 'border-primary bg-blue-50 scale-[1.01]' : 'border-slate-300 hover:border-primary hover:bg-blue-50/50'
                        )}
                    >
                        <input
                            type="file" accept=".pdf" disabled={uploading}
                            onChange={onFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className={clsx(
                            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform',
                            uploading ? 'bg-blue-100' : 'bg-blue-50 group-hover:scale-110'
                        )}>
                            {uploading
                                ? <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                : <Upload className="w-8 h-8 text-primary" />}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">
                            {uploading ? 'Generating Embeddings…' : 'Upload Policy PDF'}
                        </h3>
                        <p className="text-slate-400 text-xs">
                            {uploading
                                ? 'Chunking and embedding document into vector store…'
                                : 'Drag & drop or click to browse · PDF only'}
                        </p>
                        {uploading && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-primary font-semibold">
                                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                            </div>
                        )}
                    </div>

                    {/* Upload pipeline steps */}
                    <Card className="border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-3 text-sm">Upload Pipeline</h4>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Extract text from PDF', icon: FileText, color: 'text-blue-500 bg-blue-50' },
                                { label: 'SHA-256 deduplication check', icon: Hash, color: 'text-purple-500 bg-purple-50' },
                                { label: 'Chunk text into segments', icon: Layers, color: 'text-indigo-500 bg-indigo-50' },
                                { label: 'Generate vector embeddings', icon: Cpu, color: 'text-amber-500 bg-amber-50' },
                                { label: 'Store in ChromaDB + MongoDB', icon: Database, color: 'text-emerald-500 bg-emerald-50' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={clsx('p-1.5 rounded-lg shrink-0', step.color)}>
                                        <step.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs text-slate-600 font-medium">{step.label}</span>
                                    {i === 1 && (
                                        <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* RAG Engine Live Stats */}
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <Cpu className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">RAG Engine</h4>
                                <p className="text-xs text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online · Ollama (Local)
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Documents Indexed', value: loading ? '…' : policies.length },
                                { label: 'Total Chunks', value: loading ? '…' : totalChunks.toLocaleString() },
                                { label: 'Embedding Model', value: 'nomic-embed-text' },
                                { label: 'Vector Store', value: 'ChromaDB (local)' },
                                { label: 'Deduplication', value: 'SHA-256 ✓' },
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span className="text-slate-400">{s.label}</span>
                                    <span className="font-mono font-bold text-white">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Policies;
