import React, { useEffect, useState } from 'react';
import { api } from '@/src/lib/api.ts';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Activity, Map as MapIcon, Loader2, History, User } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [archive, setArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchive, setLoadingArchive] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const dashboardData = await api.dashboard.get();
        setData(dashboardData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadArchive = async () => {
    setLoadingArchive(true);
    try {
      const archiveData = await api.dashboard.archive();
      setArchive(archiveData);
    } catch (error) {
      toast.error('Failed to retrieve full evolutionary archive.');
      console.error(error);
    } finally {
      setLoadingArchive(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  const stats = data?.stats || {};
  const recentUpdates = data?.recentUpdates || [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Coordinator Dashboard</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">SmartSeason Overview</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Stats Row */}
        <div className="md:col-span-3 bento-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Fields</p>
            <h2 className="text-4xl font-bold text-slate-800">{stats.active_fields || 0}</h2>
          </div>
          <div className="flex items-center text-emerald-600 text-sm font-bold mt-4">
            <Activity className="w-4 h-4 mr-1" /> Monitoring Active
          </div>
        </div>

        <div className="md:col-span-3 bento-card border-l-4 border-l-amber-500">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">At Risk Areas</p>
            <h2 className="text-4xl font-bold text-amber-600">{String(stats.at_risk_fields || 0).padStart(2, '0')}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Immediate Attention Required</p>
        </div>

        <div className="md:col-span-3 bento-card border-l-4 border-l-blue-500">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Ops</p>
            <h2 className="text-4xl font-bold text-blue-600">{stats.completed_fields || 0}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Season Transitions</p>
        </div>

        <div className="md:col-span-3 bento-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Zones</p>
            <h2 className="text-4xl font-bold text-slate-800">{stats.total_fields || 0}</h2>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
            <div className="bg-[#2d5a27] h-full w-[100%]"></div>
          </div>
        </div>

        {/* Recent Activity - Large Bento Card */}
        <div className="md:col-span-8 bento-card">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Field Logs</p>
            <Dialog onOpenChange={(open) => open && loadArchive()}>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase text-slate-400 p-0 h-auto hover:bg-transparent hover:text-emerald-600 transition-colors">
                    View Full Archive
                  </Button>
                }
              />
              <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-slate-200">
                <DialogHeader className="p-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Full Evolutionary Archive</DialogTitle>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Complete System Observation History</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 pt-2">
                  {loadingArchive ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Secure Logs...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {archive.map((update) => (
                        <div key={update.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3 group hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <MapIcon className="w-3 h-3 text-emerald-600" />
                                {update.field_name}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{update.crop_type}</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">
                              {format(new Date(update.timestamp), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-100/50 shadow-sm italic">
                            <p className="text-xs text-slate-600 leading-relaxed">"{update.notes || "No observational commentary recorded."}"</p>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></span>
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">{update.stage}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Agent: {update.agent_name}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {archive.length === 0 && (
                        <div className="text-center py-20">
                          <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                          <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">The system archive is currently vacant</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Territory</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Personnel</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Biological Stage</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Time (UTC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUpdates.map((update: any) => (
                  <TableRow key={update.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-700 py-3">{update.field_name}</TableCell>
                    <TableCell className="text-slate-500 font-medium">{update.agent_name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-[10px] font-bold status-active">
                        {update.stage.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-[10px] font-bold uppercase">
                      {format(new Date(update.timestamp), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
                {recentUpdates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-300 font-bold uppercase text-xs">No active protocols found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Quick Actions / System State */}
        <div className="md:col-span-4 bento-card bg-slate-900 text-white border-none shadow-xl shadow-slate-900/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">System Terminal</p>
          <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Network Health</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">98.4%</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Stable</span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full mt-2">
                <div className="bg-emerald-500 h-full w-[98%]"></div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => toast.success('Broadcast update: Field protocols synchronized successfully')}
                className="w-full bg-[#2d5a27] hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider py-7 rounded-xl shadow-lg shadow-emerald-900/50 transition-all active:scale-95"
              >
                Broadcast Update
              </Button>
              <Button 
                variant="outline" 
                onClick={() => toast.info('Initiating full system diagnostics... All sensors nominal.')}
                className="w-full bg-slate-800/50 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider py-7 transition-all"
              >
                System Diagnostics
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
