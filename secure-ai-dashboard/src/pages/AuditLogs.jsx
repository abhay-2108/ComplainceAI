import React from 'react';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const AuditLogs = () => {
    const logs = Array.from({ length: 25 }).map((_, i) => ({
        id: i + 1,
        action: ['Policy Upload', 'Violation Rejected', 'System Config Change', 'Report Export', 'User Login', 'Rule Update'][i % 6],
        user: ['Admin User', 'Compliance Officer A', 'Manager B', 'Auditor C'][i % 4],
        time: new Date(Date.now() - i * 900000).toISOString().replace('T', ' ').substring(0, 16),
        status: i % 5 === 2 ? 'Failed' : 'Success',
    }));
    const columns = [
        { header: 'Action', accessor: 'action' },
        { header: 'User', accessor: 'user', className: 'hidden md:table-cell' },
        { header: 'Timestamp', accessor: 'time', className: 'hidden md:table-cell' },
        { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-slate-800">System Audit Logs</h2>
            </div>
            <Card noPadding>
                <DataTable columns={columns} data={logs} />
            </Card>
        </div>
    );
};

export default AuditLogs;
