import React from 'react';
import { ChevronRight } from 'lucide-react';

const DataTable = ({ columns, data, onRowClick, expandable = false, renderExpansion }) => {
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
                        {expandable && <th className="px-4 py-3 w-10"></th>}
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {data.map((row, rowIdx) => (
                        <React.Fragment key={rowIdx}>
                            <tr
                                onClick={() => expandable ? toggleRow({ stopPropagation: () => { } }, rowIdx) : (onRowClick && onRowClick(row))}
                                className={`transition-colors duration-150 ${onRowClick || expandable ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50"}`}
                            >
                                {expandable && (
                                    <td className="px-4 py-3 text-center">
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${expandedRows[rowIdx] ? 'rotate-90' : ''}`} />
                                    </td>
                                )}
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-4 py-3 text-sm text-slate-700 whitespace-nowrap ${col.className || ''}`}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>

                            {/* Expanded Row Content */}
                            {expandedRows[rowIdx] && (
                                <tr className="bg-slate-50/50">
                                    <td colSpan={columns.length + (expandable ? 1 : 0)} className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                                        {renderExpansion ? renderExpansion(row) : (
                                            <div className="text-sm text-slate-600 italic">No additional details available.</div>
                                        )}
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
