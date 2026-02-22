import React, { useState } from 'react';
import Card from '../components/Card';
import { User, Lock, Bell, Shield, Save, Mail, Building, Globe, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4">
        <div>
            <p className="text-sm font-black text-black">{label}</p>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
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
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-black">System Settings</h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <Card className="p-2 sticky top-6">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                        activeTab === tab.id
                                            ? "bg-primary text-white shadow-md shadow-blue-500/20"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-white" : "text-slate-400")} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {activeTab === 'profile' && (
                        <Card title="Profile Information" className="borer-none shadow-lg">
                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/20">
                                    AU
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-black">Admin User</h3>
                                    <p className="text-slate-500 text-sm">Super Administrator</p>
                                    <button className="mt-2 text-primary text-xs font-medium hover:underline">Change Avatar</button>
                                </div>
                            </div>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                                        <div className="relative">
                                            <input type="text" defaultValue="Admin User" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                                        <div className="relative">
                                            <input type="email" defaultValue="admin@securecorp.com" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Role</label>
                                        <div className="relative">
                                            <input type="text" defaultValue="Super Admin" disabled className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-sm cursor-not-allowed" />
                                            <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Department</label>
                                        <div className="relative">
                                            <input type="text" defaultValue="IT Security" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="button" className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                                        <Save className="w-4 h-4" /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card title="Security Preferences">
                            <div className="divide-y divide-slate-100">
                                <Toggle
                                    label="Two-Factor Authentication (2FA)"
                                    description="Require 2FA for all sign-ins to this account"
                                    checked={security.mfa}
                                    onChange={(v) => setSecurity({ ...security, mfa: v })}
                                />
                                <div className="py-4">
                                    <label className="block text-sm font-black text-black mb-1">Session Timeout</label>
                                    <p className="text-xs text-slate-500 mb-3">Automatically log out after a period of inactivity</p>
                                    <select
                                        value={security.sessionTimeout}
                                        onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                                        className="w-full md:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    >
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="60">1 Hour</option>
                                        <option value="240">4 Hours</option>
                                    </select>
                                </div>
                                <div className="pt-6">
                                    <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
                                    <button className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                                        Sign out of all devices
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card title="Notification Preferences">
                            <div className="divide-y divide-slate-100">
                                <Toggle
                                    label="Email Notifications"
                                    description="Receive daily summaries and critical alerts via email"
                                    checked={notifications.email}
                                    onChange={(v) => setNotifications({ ...notifications, email: v })}
                                />
                                <Toggle
                                    label="Push Notifications"
                                    description="Receive real-time alerts in the browser"
                                    checked={notifications.push}
                                    onChange={(v) => setNotifications({ ...notifications, push: v })}
                                />
                                <Toggle
                                    label="Monthly Compliance Report"
                                    description="Receive a detailed PDF report at the end of each month"
                                    checked={notifications.monthly}
                                    onChange={(v) => setNotifications({ ...notifications, monthly: v })}
                                />
                                <Toggle
                                    label="Product Updates"
                                    description="Receive news about new features and improvements"
                                    checked={notifications.updates}
                                    onChange={(v) => setNotifications({ ...notifications, updates: v })}
                                />
                            </div>
                        </Card>
                    )}

                    {activeTab === 'appearance' && (
                        <Card title="Appearance Settings">
                            <div className="grid grid-cols-3 gap-4">
                                <button className="p-4 border-2 border-primary bg-blue-50/50 rounded-xl flex flex-col items-center gap-3 active">
                                    <div className="w-full h-24 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                                        <Sun className="w-8 h-8 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-primary">Light Mode</span>
                                </button>
                                <button className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center gap-3 opacity-50 cursor-not-allowed">
                                    <div className="w-full h-24 bg-slate-900 rounded-lg border border-slate-700 shadow-sm flex items-center justify-center">
                                        <Moon className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500">Dark Mode (Pro)</span>
                                </button>
                                <button className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center gap-3 opacity-50 cursor-not-allowed">
                                    <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                                        <Globe className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500">System</span>
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
