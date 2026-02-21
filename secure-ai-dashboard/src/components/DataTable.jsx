import React from 'react';
import { ChevronRight } from 'lucide-react';

const DataTable = ({ columns, data, onRowClick }) => {
    const [expandedRows, setExpandedRows] = React.useState({});

    const toggleRow = (e, idx) => {
        e.stopPropagation();
        setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                        {/* Mobile Expand Column Header */}
                        <th className="md:hidden px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Info
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {data.map((row, rowIdx) => (
                        <React.Fragment key={rowIdx}>
                            <tr
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`transition-colors duration-150 ${onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50"}`}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-4 py-3 text-sm text-slate-700 whitespace-nowrap ${col.className || ''}`}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                                {/* Mobile Expand Button */}
                                <td className="md:hidden px-4 py-3 text-right">
                                    <button
                                        onClick={(e) => toggleRow(e, rowIdx)}
                                        className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                                    >
                                        <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedRows[rowIdx] ? 'rotate-90' : ''}`} />
                                    </button>
                                </td>
                            </tr>

                            {/* Expanded Row for Mobile */}
                            {expandedRows[rowIdx] && (
                                <tr className="md:hidden bg-slate-50/50">
                                    <td colSpan={columns.length + 1} className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                                        <div className="grid grid-cols-2 gap-4">
                                            {columns.filter(col => col.className?.includes('hidden')).map((col, i) => (
                                                <div key={i} className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{col.header}</span>
                                                    <div className="text-sm font-medium text-slate-700 break-words">
                                                        {col.render ? col.render(row) : row[col.accessor]}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
