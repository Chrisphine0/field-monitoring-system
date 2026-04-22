import React, { useEffect, useState } from 'react';
import { api } from '@/src/lib/api.ts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Mail, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Agents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function loadData() {
    try {
      const data = await api.fields.getAvailableAgents();
      setAgents(data);
    } catch (error) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    };

    try {
      await api.auth.register(data);
      toast.success('User registered successfully');
      setIsCreateOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agent Personnel</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Staff Access Management</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button className="bg-[#2d5a27] hover:bg-[#1a3a16] h-11 px-6 rounded-xl gap-2 font-bold uppercase text-xs shadow-lg shadow-emerald-900/20 tracking-wider">
              <UserPlus className="w-4 h-4" />
              Authorize Staff
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle>Register New Personnel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" className="rounded-xl bg-slate-50 border-slate-100" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" className="rounded-xl bg-slate-50 border-slate-100" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input id="password" name="password" type="password" className="rounded-xl bg-slate-50 border-slate-100" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Security Role</Label>
                <Select name="role" defaultValue="agent">
                  <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Field Agent</SelectItem>
                    <SelectItem value="admin">Coordinator (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-[#2d5a27] hover:bg-emerald-800 rounded-xl h-12 font-bold uppercase tracking-widest text-xs">Finalize Authorization</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bento-card p-0 overflow-hidden border-none shadow-xl shadow-emerald-900/5">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-6">Personnel Name</TableHead>
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Correspondence</TableHead>
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">System Identity</TableHead>
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Access Protocol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-slate-700 py-5 pl-6">{agent.name}</TableCell>
                <TableCell className="text-slate-500 font-medium lowercase flex items-center gap-2 py-5">
                  <Mail className="w-3 h-3 text-slate-300" />
                  {agent.email}
                </TableCell>
                <TableCell>
                  <div className="px-2 py-1 inline-flex items-center rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold tracking-tighter">
                    ID-{String(agent.id).padStart(4, '0')}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1.5">
                    <Shield className="w-2.5 h-2.5" />
                    {agent.role === 'admin' ? 'Coordinator' : 'Field Agent'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {agents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs">
                  Active staff registry is currently unpopulated
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
