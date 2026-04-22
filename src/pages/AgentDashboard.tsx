import React, { useEffect, useState } from 'react';
import { api } from '@/src/lib/api.ts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Map as MapIcon, ChevronRight, Activity, Loader2, ClipboardCheck, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function AgentDashboard() {
  const [data, setData] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardData, fieldsData] = await Promise.all([
          api.dashboard.get(),
          api.fields.list()
        ]);
        setData(dashboardData);
        setFields(fieldsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  const stats = data?.stats || {};
  const recentUpdates = data?.recentUpdates || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agent Command</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel Oversight</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bento-card bg-[#2d5a27] text-white border-none">
          <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">Active Territory Load</p>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-5xl font-bold">{stats.assigned_fields || 0}</h2>
            <MapIcon className="w-12 h-12 opacity-10" />
          </div>
        </div>
        <div className="bento-card border-l-4 border-l-emerald-500">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Monitoring Status</p>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-5xl font-bold text-slate-800">{stats.active_fields || 0}</h2>
            <Activity className="w-12 h-12 text-emerald-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
            <MapIcon className="w-3 h-3 text-emerald-600" />
            Allocated Fields
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {fields.map((field) => (
              <Link key={field.id} to={`/fields/${field.id}`}>
                <div className="bento-card flex-row items-center cursor-pointer group py-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#2d5a27] group-hover:text-white transition-all transform group-hover:scale-105">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 tracking-tight group-hover:text-[#2d5a27] transition-colors">{field.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{field.crop_type} • S-ID {field.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Status</p>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        field.status === 'Active' ? 'status-active' :
                        field.status === 'At Risk' ? 'status-at-risk' :
                        'status-completed'
                      }`}>
                        {field.status.toUpperCase()}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#2d5a27] transform group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
            {fields.length === 0 && (
              <div className="bento-card border-dashed bg-transparent items-center justify-center py-20">
                <p className="text-slate-400 font-bold uppercase text-xs">No active assignments</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
            <ClipboardCheck className="w-3 h-3 text-emerald-600" />
            Recent Field Logs
          </h2>
          <div className="space-y-4">
            {recentUpdates.map((update: any) => (
              <div key={update.id} className="bento-card p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-800 truncate pr-2">{update.field_name}</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase shrink-0">{format(new Date(update.timestamp), 'MMM d')}</p>
                </div>
                <div className="bg-slate-50 p-2 py-1.5 rounded-lg border border-slate-100 italic">
                  <p className="text-[11px] text-slate-600 line-clamp-3">"{update.notes}"</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">{update.stage}</span>
                </div>
              </div>
            ))}
            {recentUpdates.length === 0 && (
              <div className="text-center py-10 bento-card items-center justify-center bg-transparent border-dashed">
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Archive Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
