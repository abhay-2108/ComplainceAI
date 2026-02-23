import React, { useState } from 'react';
import Card from '../components/Card';
import {
    User,
    Lock,
    Bell,
    Shield,
    Save,
    Mail,
    Building,
    Globe,
    Moon,
    Sun
} from 'lucide-react';
import clsx from 'clsx';

const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4">
        <div className="pr-4">
            <p className="text-sm font-semibold text-black">{label}</p>
            {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                checked ? 'bg-primary' : 'bg-slate-200'
            )}
        >
            <span
                className={clsx(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
                    checked ? 'translate-x-6' : 'translate-x-1'
                )}
            />
        </button>
    </div>
);

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        monthly: true,
        updates: false
    });

    const [security, setSecurity] = useState({
        mfa: true,
        sessionTimeout: '30'
    });

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'security', label: 'Security & Access', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Sun },
    ];

    return (
        <div className="space-y-6 animate-fade-in px-4 sm:px-6 lg:px-0">
            <h2 className="text-xl sm:text-2xl font-black text-black">
                System Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="p-2 lg:sticky lg:top-6">
                        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-primary text-white shadow-md shadow-blue-500/20"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <tab.icon
                                        className={clsx(
                                            "w-4 h-4",
                                            activeTab === tab.id
                                                ? "text-white"
                                                : "text-slate-400"
                                        )}
                                    />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <Card title="Profile Information" className="shadow-lg p-4 sm:p-6">

                            {/* Avatar Section */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/20">
                                    AU
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-black">
                                        Admin User
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        Super Administrator
                                    </p>
                                    <button className="mt-2 text-primary text-xs font-medium hover:underline">
                                        Change Avatar
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                defaultValue="Admin User"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            />
                                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                defaultValue="admin@securecorp.com"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            />
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Role
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                defaultValue="Super Admin"
                                                disabled
                                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-sm cursor-not-allowed"
                                            />
                                            <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Department
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                defaultValue="IT Security"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            />
                                            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <Card title="Security Preferences" className="p-4 sm:p-6">
                            <div className="divide-y divide-slate-100">

                                <Toggle
                                    label="Two-Factor Authentication (2FA)"
                                    description="Require 2FA for all sign-ins"
                                    checked={security.mfa}
                                    onChange={(v) =>
                                        setSecurity({ ...security, mfa: v })
                                    }
                                />

                                <div className="py-4">
                                    <label className="block text-sm font-semibold text-black mb-1">
                                        Session Timeout
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Auto logout after inactivity
                                    </p>

                                    <select
                                        value={security.sessionTimeout}
                                        onChange={(e) =>
                                            setSecurity({
                                                ...security,
                                                sessionTimeout: e.target.value
                                            })
                                        }
                                        className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="60">1 Hour</option>
                                        <option value="240">4 Hours</option>
                                    </select>
                                </div>

                                <div className="pt-6">
                                    <h4 className="text-sm font-medium text-red-600 mb-2">
                                        Danger Zone
                                    </h4>
                                    <button className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100">
                                        Sign out of all devices
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <Card title="Notification Preferences" className="p-4 sm:p-6">
                            <div className="divide-y divide-slate-100">

                                <Toggle
                                    label="Email Notifications"
                                    description="Daily summaries and alerts"
                                    checked={notifications.email}
                                    onChange={(v) =>
                                        setNotifications({ ...notifications, email: v })
                                    }
                                />

                                <Toggle
                                    label="Push Notifications"
                                    description="Real-time browser alerts"
                                    checked={notifications.push}
                                    onChange={(v) =>
                                        setNotifications({ ...notifications, push: v })
                                    }
                                />

                                <Toggle
                                    label="Monthly Compliance Report"
                                    description="Detailed monthly PDF report"
                                    checked={notifications.monthly}
                                    onChange={(v) =>
                                        setNotifications({ ...notifications, monthly: v })
                                    }
                                />

                                <Toggle
                                    label="Product Updates"
                                    description="News about new features"
                                    checked={notifications.updates}
                                    onChange={(v) =>
                                        setNotifications({ ...notifications, updates: v })
                                    }
                                />
                            </div>
                        </Card>
                    )}

                    {/* APPEARANCE TAB */}
                    {activeTab === 'appearance' && (
                        <Card title="Appearance Settings" className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                <button className="p-4 border-2 border-primary bg-blue-50/50 rounded-xl flex flex-col items-center gap-3">
                                    <div className="w-full h-24 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                                        <Sun className="w-8 h-8 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-primary">
                                        Light Mode
                                    </span>
                                </button>

                                <button className="p-4 border border-slate-200 rounded-xl flex flex-col items-center gap-3 opacity-50 cursor-not-allowed">
                                    <div className="w-full h-24 bg-slate-900 rounded-lg border border-slate-700 shadow-sm flex items-center justify-center">
                                        <Moon className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500">
                                        Dark Mode (Pro)
                                    </span>
                                </button>

                                <button className="p-4 border border-slate-200 rounded-xl flex flex-col items-center gap-3 opacity-50 cursor-not-allowed">
                                    <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                                        <Globe className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500">
                                        System
                                    </span>
                                </button>

                            </div>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;