
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BrainCircuit,
    AlertTriangle,
    FileText,
    BarChart3,
    ShieldAlert,
    Settings,
    LogOut,
    User,
    X
} from 'lucide-react';
import clsx from 'clsx';

import logo from '../assets/logo.svg';

const Sidebar = ({ isOpen, onClose }) => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: BrainCircuit, label: 'Agent Network', path: '/agents' },
        { icon: AlertTriangle, label: 'Violations', path: '/violations' },
        { icon: FileText, label: 'Policies', path: '/policies' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: ShieldAlert, label: 'Audit Logs', path: '/audit-logs' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className={clsx(
            "fixed left-0 top-0 z-30 h-screen w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="ComplianceAI" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
                    <span className="font-bold text-slate-900 text-lg tracking-tight">ComplianceAI</span>
                </div>
                <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => onClose && window.innerWidth < 1024 && onClose()}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-white shadow-md shadow-blue-900/20 translate-x-1"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                        <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">Admin User</p>
                        <p className="text-xs text-slate-500 truncate">admin@securecorp.com</p>
                    </div>
                    <button className="text-slate-400 hover:text-danger transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

