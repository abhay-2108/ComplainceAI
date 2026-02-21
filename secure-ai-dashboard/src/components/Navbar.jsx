import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Play, Loader, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

import logo from '../assets/logo.svg';

const Navbar = ({ title = "Dashboard", onMenuClick }) => {
    const navigate = useNavigate();
    const [isSimulating, setIsSimulating] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSimulate = () => {
        setIsSimulating(true);
        setToast({ type: 'info', message: 'Simulating Live Traffic...', sub: 'Scanning high-velocity transactions' });

        // Simulate finding a violation
        setTimeout(() => {
            setToast({ type: 'danger', message: 'Critical Violation Detected!', sub: 'ID: TXN-9928 | Fraud Risk: 98%' });
        }, 3000);
    };

    const clearToast = () => {
        setIsSimulating(false);
        setToast(null);
        if (toast?.type === 'danger') {
            navigate('/violations/TXN-1021'); // Navigate to details on click/clear for demo flow
        }
    };

    return (
        <>
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-md lg:hidden"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    {/* Mobile Logo (only when sidebar is hidden/mobile) */}
                    <img src={logo} alt="ComplianceAI" className="w-8 h-8 lg:hidden object-contain" />
                    <h1 className="text-lg md:text-xl font-semibold text-slate-800 truncate hidden md:block">{title}</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Simulation Button */}
                    <button
                        onClick={handleSimulate}
                        disabled={isSimulating}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm",
                            isSimulating
                                ? "bg-amber-100 text-amber-700 border border-amber-200 cursor-wait"
                                : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                        )}
                    >
                        {isSimulating ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {isSimulating ? 'Scanning...' : 'Simulate Traffic'}
                    </button>

                    <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

                    <div className="relative hidden md:block">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all"
                        />
                    </div>

                    <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>
            </header>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 animate-bounce-in">
                    <div className={clsx(
                        "flex items-start gap-4 p-4 rounded-xl shadow-2xl border backdrop-blur-md w-96 cursor-pointer hover:scale-105 transition-transform",
                        toast.type === 'danger' ? "bg-red-50/95 border-red-200" : "bg-slate-900/95 text-white border-slate-700"
                    )} onClick={clearToast}>
                        <div className={clsx(
                            "p-2 rounded-full shrink-0",
                            toast.type === 'danger' ? "bg-red-100 text-red-600" : "bg-slate-800 text-blue-400"
                        )}>
                            {toast.type === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <Loader className="w-6 h-6 animate-spin" />}
                        </div>
                        <div className="flex-1">
                            <h4 className={clsx("font-bold text-sm", toast.type === 'danger' ? "text-red-900" : "text-white")}>{toast.message}</h4>
                            <p className={clsx("text-xs mt-1", toast.type === 'danger' ? "text-red-700" : "text-slate-400")}>{toast.sub}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); clearToast(); }} className="text-slate-400 hover:text-slate-200">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
