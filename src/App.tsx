import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/src/components/Layout.tsx';
import { Login } from '@/src/pages/Login.tsx';
import { AdminDashboard } from '@/src/pages/AdminDashboard.tsx';
import { AgentDashboard } from '@/src/pages/AgentDashboard.tsx';
import { Fields } from '@/src/pages/Fields.tsx';
import { FieldDetails } from '@/src/pages/FieldDetails.tsx';
import { Agents } from '@/src/pages/Agents.tsx';
import { api } from '@/src/lib/api.ts';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.auth.me();
        setUser(user);
      } catch (error) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  if (!user) return <Navigate to="/login" />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <Layout user={user}>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardDispatcher />
          </ProtectedRoute>
        } />

        <Route path="/fields" element={
          <ProtectedRoute>
            <FieldsContainer />
          </ProtectedRoute>
        } />

        <Route path="/fields/:id" element={
          <ProtectedRoute>
            <FieldDetailsContainer />
          </ProtectedRoute>
        } />

        <Route path="/agents" element={
          <ProtectedRoute requiredRole="admin">
            <Agents />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

function DashboardDispatcher() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'admin' ? <AdminDashboard /> : <AgentDashboard />;
}

function FieldsContainer() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <Fields user={user} />;
}

function FieldDetailsContainer() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <FieldDetails user={user} />;
}
