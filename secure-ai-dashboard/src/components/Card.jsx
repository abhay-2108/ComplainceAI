import React from 'react';
import clsx from 'clsx';

const Card = ({ title, action, children, className, noPadding = false }) => {
    return (
        <div className={clsx("bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 transition-all hover:shadow-md overflow-hidden", className)}>
            {(title || action) && (
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={noPadding ? "p-0" : "p-6"}>
                {children}
            </div>
        </div>
    );
};

export default Card;
