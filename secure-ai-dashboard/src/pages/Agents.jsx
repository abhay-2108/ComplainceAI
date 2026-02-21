import React, { useState } from 'react';
import {
    FileSearch,
    Activity,
    AlertOctagon,
    MessageSquareText,
    FileBarChart,
    CheckCircle2,
    Clock,
    ArrowRight,
    Database,
    BrainCircuit
} from 'lucide-react';
import Card from '../components/Card';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Agents = () => {
    const [selectedAgent, setSelectedAgent] = useState('policy');

    const agents = [
        {
            id: 'policy',
            title: 'Policy Extraction Agent',
            icon: FileSearch,
            color: 'bg-blue-500',
            description: 'Creates embeddings from policies and retrieves relevant compliance rules securely using RAG.',
            stats: { processed: '12 Parsing Jobs', vectors: '14.5k Vectors stored', status: 'Active' },
            tasks: [
                'Scans uploaded policy documents (PDF/Docx)',
                'Extracts text and metadata using OCR',
                'Generates vector embeddings for semantic search',
                'Indexes content into Vector Database'
            ],
            details: [
                { time: '10:45 AM', event: 'Parsed "GDPR_Data_Protection_v2.pdf"', status: 'Success' },
                { time: '10:42 AM', event: 'Generated 450 vector embeddings', status: 'Success' },
                { time: '09:15 AM', event: 'Synced with Vector DB (Pinecone)', status: 'Success' }
            ]
        },
        {
            id: 'monitoring',
            title: 'Monitoring Agent',
            icon: Activity,
            color: 'bg-sky-500',
            description: 'Continuously scans MongoDB for new/updated records and passes them downstream.',
            stats: { scanned: '45.2k Records', batchRate: '500/min', status: 'Running' },
            tasks: [
                'Connects to production databases (MongoDB/Postgres)',
                'Monitors transaction streams in real-time',
                'Detects schema changes or data drift',
                'Buffers records for compliance checks'
            ],
            details: [
                { time: '10:59 AM', event: 'Batch #8921 fetched (50 records)', status: 'Active' },
                { time: '10:58 AM', event: 'Detected 3 schema updates', status: 'Logged' },
                { time: '10:55 AM', event: 'Health Check: Latency 12ms', status: 'Healthy' }
            ]
        },
        {
            id: 'violation',
            title: 'Violation Detection Agent',
            icon: AlertOctagon,
            color: 'bg-amber-500',
            description: 'Runs ML risk scoring AND policy rule checks; flags if either threshold is crossed.',
            stats: { flagged: '142 Violations', accuracy: '99.4%', status: 'Active' },
            tasks: [
                'Applies deterministic rule sets (e.g., threshold limits)',
                'Runs ML models for anomaly detection',
                'Cross-references data against active policies',
                'Flags suspicious activities for review'
            ],
            details: [
                { time: '10:58 AM', event: 'Flagged TXN-2910 (Risk Score: 92)', status: 'High Risk' },
                { time: '10:57 AM', event: 'Cleared Batch #8920 (No violations)', status: 'Clean' },
                { time: '10:55 AM', event: 'Model Inference Time: 45ms', status: 'Optimal' }
            ]
        },
        {
            id: 'explanation',
            title: 'Explanation Agent',
            icon: MessageSquareText,
            color: 'bg-emerald-500',
            description: 'Prompts LLM to create a clear and audit-ready explanation that mentions the specific policy.',
            stats: { generated: '144 Explanations', avgTime: '1.2s', status: 'Standby' },
            tasks: [
                'Analyzes flagged violations for context',
                'Retrieves relevant policy clauses via RAG',
                'Generates human-readable reasoning using LLM',
                'Links specific evidence to violation reports'
            ],
            details: [
                { time: '10:59 AM', event: 'Generated explanation for TXN-2910', status: 'Completed' },
                { time: '10:59 AM', event: 'Retrieved context from Policy Article 4.2', status: 'RAG Hit' },
                { time: '10:45 AM', event: 'Token usage: 450 tokens', status: 'Logged' }
            ]
        },
        {
            id: 'reporting',
            title: 'Reporting Agent',
            icon: FileBarChart,
            color: 'bg-orange-500',
            description: 'Calculates compliance scores, summarizes findings by day, and sends results to be reviewed.',
            stats: { reports: '1 Daily Report', alerts: '5 sent', status: 'Scheduled' },
            tasks: [
                'Aggregates daily compliance metrics',
                'Generates PDF/HTML audit reports',
                'Sends automated alerts to stakeholders',
                'Archives compliance logs for retention'
            ],
            details: [
                { time: '08:00 AM', event: 'Generated "Daily_Compliance_Summary_2023-10-25.pdf"', status: 'Success' },
                { time: '08:01 AM', event: 'Emailed summary to compliance@securecorp.com', status: 'Sent' },
                { time: '00:00 AM', event: 'Reset daily counters', status: 'Success' }
            ]
        }
    ];

    const chartData = [
        { name: '08:00', tasks: 12 },
        { name: '09:00', tasks: 45 },
        { name: '10:00', tasks: 38 },
        { name: '11:00', tasks: 62 },
        { name: '12:00', tasks: 24 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg md:text-2xl font-bold text-slate-900">Agent Network Status</h2>
                    <p className="text-xs md:text-base text-slate-500 mt-0.5 md:mt-1">Real-time view of autonomous compliance agents</p>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 bg-green-50 text-green-700 rounded-full text-xs md:text-sm font-medium border border-green-200">
                    <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse" />
                    <span className="hidden md:inline">System Healthy</span>
                    <span className="md:hidden">Healthy</span>
                </div>
            </div>

            {/* Main Graph Visualization */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 relative">
                {agents.map((agent, index) => (
                    <React.Fragment key={agent.id}>
                        <button
                            onClick={() => setSelectedAgent(agent.id)}
                            className={clsx(
                                "relative z-10 flex flex-col items-center p-3 md:p-6 rounded-2xl border transition-all duration-300 group text-center h-full",
                                selectedAgent === agent.id
                                    ? "bg-white border-primary ring-2 ring-primary/20 shadow-xl scale-105"
                                    : "bg-white/60 border-slate-200 hover:border-slate-300 hover:shadow-md grayscale-[0.3] hover:grayscale-0"
                            )}
                        >
                            <div className={clsx("w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-2 md:mb-4 text-white shadow-lg", agent.color)}>
                                <agent.icon className="w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1 md:mb-2 text-xs md:text-base leading-tight">{agent.title}</h3>
                            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-3 hidden md:block">{agent.description}</p>

                            {/* Mobile-only status pill (simplified) */}
                            <div className="md:hidden mt-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                {agent.stats.status}
                            </div>

                            <div className="mt-auto pt-4 w-full hidden md:block">
                                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    {agent.stats.status}
                                </div>
                            </div>

                            {/* Connector Line (Desktop) */}
                            {index < agents.length - 1 && (
                                <div className="hidden lg:block absolute -right-[17px] top-1/2 -translate-y-1/2 z-0">
                                    <ArrowRight className="w-6 h-6 text-slate-300" />
                                </div>
                            )}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Selected Agent Detail View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Stats & Context */}
                <Card className="lg:col-span-2 border-primary/10 shadow-lg">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md", agents.find(a => a.id === selectedAgent)?.color)}>
                                {React.createElement(agents.find(a => a.id === selectedAgent)?.icon, { className: "w-6 h-6" })}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{agents.find(a => a.id === selectedAgent)?.title}</h3>
                                <p className="text-slate-500 text-sm">Deep Dive Analysis</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-500">Performance</p>
                            <p className="text-2xl font-bold text-slate-900">98.5%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
                        {Object.entries(agents.find(a => a.id === selectedAgent)?.stats || {}).map(([key, value]) => (
                            <div key={key} className="p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{key}</p>
                                <p className="text-sm md:text-lg font-bold text-slate-900 truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Agent Tasks List using CheckCircle2 for list items */}
                    <div className="mb-8">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Core Capabilities & Tasks
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {agents.find(a => a.id === selectedAgent)?.tasks.map((task, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    <span className="text-sm text-slate-700 leading-snug">{task}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-primary" />
                        Task Throughput (Last 4 Hours)
                    </h4>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="tasks" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Right Panel: Activity Log */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="font-semibold text-slate-900">Recent Activity Log</h4>
                        <Database className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="p-0 overflow-y-auto max-h-[400px]">
                        {agents.find(a => a.id === selectedAgent)?.details.map((log, idx) => (
                            <div key={idx} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {log.time}
                                    </span>
                                    <span className={clsx(
                                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                                        log.status === 'Success' || log.status === 'Clean' || log.status === 'Healthy' || log.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" :
                                            log.status === 'High Risk' ? "bg-red-50 text-red-700 border-red-200" :
                                                "bg-blue-50 text-blue-700 border-blue-200"
                                    )}>{log.status}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-medium group-hover:text-primary transition-colors">{log.event}</p>
                            </div>
                        ))}
                        <div className="p-4 text-center">
                            <button className="text-sm text-primary font-medium hover:underline">View All Logs</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Agents;
