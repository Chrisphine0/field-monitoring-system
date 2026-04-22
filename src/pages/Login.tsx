import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/src/lib/api.ts';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f2] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-14 h-14 bg-[#2d5a27] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20 mb-4 transition-transform hover:scale-110">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">SmartSeason</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Field Monitoring Command</p>
        </div>

        <div className="bento-card p-10 bg-white border-none shadow-2xl shadow-emerald-900/5">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800">System Access</h2>
            <p className="text-xs font-medium text-slate-400 mt-1">Personnel credentials required for uplink</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Correspondence</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="agent@smartseason.io" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-[#2d5a27] font-medium pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Security Key</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" />
                <Input 
                  id="password" 
                  type="password" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-[#2d5a27] font-medium pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#2d5a27] hover:bg-[#1a3a16] h-14 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 mt-4 transition-all active:scale-95" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Authorization"}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4">System Defaults (Development Mode)</p>
              <div className="grid grid-cols-1 gap-2 text-[10px] font-mono text-slate-500">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-50">
                  <span className="font-bold text-emerald-600">COORD:</span>
                  <span>admin@example.com / admin123</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-50">
                  <span className="font-bold text-emerald-600">AGENT:</span>
                  <span>agent1@example.com / agent123</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2026 SmartSeason Infrastructure
        </p>
      </div>
    </div>
  );
}
