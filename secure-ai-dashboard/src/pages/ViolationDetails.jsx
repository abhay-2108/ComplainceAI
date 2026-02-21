import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertOctagon, BrainCircuit, ShieldAlert, Cpu } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const ReasoningStep = ({ step, index }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), index * 800);
        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div className={clsx(
            "flex items-start gap-3 transition-all duration-500 ease-in-out",
            visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        )}>
            <div className={clsx(
                "mt-1 w-2 h-2 rounded-full shrink-0",
                step.status === 'safe' ? "bg-green-500" : step.status === 'risk' ? "bg-red-500 animate-pulse" : "bg-blue-500"
            )} />
            <div className="flex-1">
                <p className="text-sm font-mono text-slate-300">{step.text}</p>
                {step.detail && <p className="text-xs text-slate-500 mt-1">{step.detail}</p>}
            </div>
            {step.status === 'risk' && <span className="text-xs font-bold text-red-400 border border-red-900/30 px-2 py-0.5 rounded bg-red-900/10">FLAGGED</span>}
        </div>
    );
};

const ViolationDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [analyzing, setAnalyzing] = useState(false);

    // Get data from state (if clicked from list) or fallback
    const passedData = location.state?.violation || {};

    // Map violation types to specific policies/scenarios for realism
    const getPolicyContext = (type) => {
        switch (type) {
            case 'GDPR - PII Exposure': return { policy: 'GDPR Article 32: Security of Processing', account: 'CUST-8821', type: 'PII Exposure' };
            case 'Unencrypted Transfer': return { policy: 'InfoSec Policy 5.1: Data Transmission', account: 'PAY-9012', type: 'Unencrypted Data' };
            case 'Data Retention Exceeded': return { policy: 'Data Retention Policy 2.0', account: 'ARCH-1002', type: 'Retention Limit' };
            case 'Unauthorized Access': return { policy: 'Access Control Policy 3.4', account: 'ADMIN-001', type: 'Access Violation' };
            default: return { policy: 'AML Policy Section 4.2: Large Cash Transactions', account: 'XXXX-4587', type: 'Structuring / Smurfing' };
        }
    };

    const context = getPolicyContext(passedData.type || 'Structuring');

    const data = {
        id: id || passedData.id || 'TXN-1021',
        account: passedData.source || context.account,
        amount: '$92,000.00', // Mock amount for all
        time: passedData.date ? `${passedData.date} 14:32` : '2023-10-24 14:32',
        recipient: 'Offshore Holdings Ltd.',
        location: 'Cayman Islands',
        riskScore: passedData.riskScore || 92,
        violationType: passedData.type || context.type,
        policy: context.policy
    };

    // Mock AI Steps (Dynamic based on type)
    const reasoningSteps = [
        { text: `Analyzing Data Source (${data.account})...`, status: 'safe', detail: 'Source verified in internal registry.' },
        { text: `Checking Violation Pattern: "${data.violationType}"...`, status: 'risk', detail: 'Pattern matches known attack vector.' },
        { text: 'Analyzing Temporal Patterns...', status: 'risk', detail: '3 similar events detected in last 24h.' },
        { text: `Cross-referencing ${data.policy}...`, status: 'risk', detail: 'Confidence Score: 98.4%.' },
        { text: 'Generating final risk assessment...', status: 'info', detail: 'Recommendation: REJECT and Flag.' }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Violations
            </button>

            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Violation #{data.id}</h2>
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> CRITICAL RISK
                        </span>
                    </div>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm md:text-base">
                        Detected on {data.time} via <span className="flex items-center gap-1 font-medium text-slate-700"><Cpu className="w-3 h-3" /> Global_Monitor_Agent_01</span>
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all hover:scale-105">
                        <XCircle className="w-4 h-4" /> Reject & Block
                    </button>
                    <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all">
                        <CheckCircle className="w-4 h-4" /> Mark False Positive
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Transaction Data */}
                <div className="space-y-6">
                    <Card title="Transaction Payload">
                        <div className="space-y-4">
                            {[
                                { label: 'Amount', value: data.amount, highlight: true },
                                { label: 'Account', value: data.account },
                                { label: 'Recipient', value: data.recipient },
                                { label: 'Location', value: data.location },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-slate-500 text-sm">{item.label}</span>
                                    <span className={`font-mono ${item.highlight ? 'text-slate-900 text-lg font-bold' : 'text-slate-700'}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Graph Analysis">
                        <div className="relative h-40 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-100 to-slate-50"></div>
                            {/* Simple visual representation of connections */}
                            <div className="relative z-10 flex items-center gap-8">
                                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center font-bold text-blue-700 text-xs">Acc A</div>
                                <div className="h-px w-12 bg-red-400 relative">
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-bold">FAIL</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center font-bold text-red-700 text-xs animate-pulse">Ent B</div>
                            </div>
                        </div>
                        <p className="text-xs text-center text-slate-500 mt-2">Graph Linkage: Direct transfer to sanctioned entity</p>
                    </Card>
                </div>

                {/* Right Panel: AI Reasoning Console */}
                <div className="lg:col-span-2 space-y-6">
                    {/* The "Wow" Factor: Dark Mode AI Console */}
                    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <BrainCircuit className="w-6 h-6 text-emerald-400" />
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide text-sm md:text-base">AI AGENT ANALYSIS</h3>
                                    <p className="text-[10px] md:text-xs text-slate-400 font-mono">Model: Regulatory_LLM_v4.2 | Latency: 45ms</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl md:text-3xl font-bold text-red-500">{data.riskScore}/100</div>
                                <div className="text-[10px] md:text-xs text-red-400 font-bold uppercase tracking-wider">Risk Score</div>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 space-y-3 md:space-y-4 bg-slate-900/50 min-h-[250px] md:min-h-[300px]">
                            {reasoningSteps.map((step, idx) => (
                                <ReasoningStep key={idx} step={step} index={idx} />
                            ))}

                            {/* Final Conclusion Box (Appears last) */}
                            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in-up" style={{ animationDelay: '4s' }}>
                                <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                                    <ShieldAlert className="w-5 h-5" /> VIOLATION CONFIRMED
                                </h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    The transaction exhibits clear signs of <strong>{data.violationType}</strong>.
                                    The recipient location and transfer patterns trigger mandatory reporting requiremenets under
                                    <span className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded ml-1">{data.policy}</span>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card title="Historical Context (Similar Vectors)">
                        <DataTable
                            columns={[
                                { header: 'ID', accessor: 'id' },
                                { header: 'Date', accessor: 'date' },
                                { header: 'Type', accessor: 'type' },
                                { header: 'Action', accessor: 'action', render: () => <StatusBadge status="Rejected" /> }
                            ]}
                            data={[
                                { id: 'TXN-982', date: '2023-09-12', type: 'Structuring' },
                                { id: 'TXN-854', date: '2023-08-05', type: 'Structuring' },
                            ]}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ViolationDetails;
