import React from 'react';
import clsx from 'clsx';

const StatusBadge = ({ status, type = 'default' }) => {
    const getStyles = (s) => {
        const lower = s.toLowerCase();
        if (lower.includes('high') || lower.includes('danger') || lower.includes('failed') || lower.includes('critical')) {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        if (lower.includes('medium') || lower.includes('warning') || lower.includes('review') || lower.includes('monitor')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        if (lower.includes('low') || lower.includes('success') || lower.includes('cleared') || lower.includes('approved')) {
            return 'bg-green-50 text-green-700 border-green-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <span className={clsx(
            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
            getStyles(status)
        )}>
            {status}
        </span>
    );
};

export default StatusBadge;
