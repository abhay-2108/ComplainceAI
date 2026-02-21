import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Violations from './pages/Violations';
import ViolationDetails from './pages/ViolationDetails';
import Policies from './pages/Policies';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Agents from './pages/Agents';
import Predictions from './pages/Predictions';
import Settings from './pages/Settings';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="violations" element={<Violations />} />
          <Route path="violations/:id" element={<ViolationDetails />} />
          <Route path="policies" element={<Policies />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
