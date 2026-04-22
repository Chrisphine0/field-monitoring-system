import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/src/lib/api.ts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Send, History, Calendar, TreePine, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function FieldDetails({ user }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [stage, setStage] = useState('');
  const [notes, setNotes] = useState('');

  async function loadData() {
    try {
      const currentField = await api.fields.get(Number(id));
      setField(currentField);
      setStage(currentField.current_stage);
      
      const updateData = await api.fields.getUpdates(Number(id));
      setUpdates(updateData);
    } catch (error) {
      toast.error('Failed to load field details');
      navigate('/fields');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.fields.addUpdate(Number(id), { stage, notes });
      toast.success('Field status updated');
      setNotes('');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-[#2d5a27] hover:bg-emerald-50">
        <ArrowLeft className="w-4 h-4" />
        Return to Registry
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bento-card p-0 overflow-hidden border-none shadow-xl shadow-emerald-900/5">
            <div className={`h-2 w-full ${field.status === 'Active' ? 'bg-emerald-500' : field.status === 'At Risk' ? 'bg-amber-500' : 'bg-slate-500'}`} />
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{field.name}</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Territorial Sector Protocol {String(field.id).padStart(3, '0')}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                  field.status === 'Active' ? 'status-active' :
                  field.status === 'At Risk' ? 'status-at-risk' :
                  'status-completed'
                }`}>
                  {field.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <InfoItem icon={<TreePine className="w-4 h-4" />} label="Classification" value={field.crop_type} />
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Planting Date" value={format(new Date(field.planting_date), 'MMM d, yyyy')} />
                <InfoItem icon={<History className="w-4 h-4" />} label="Bio Evolution" value={field.current_stage} primary />
              </div>
            </div>
          </div>

          <div className="bento-card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-[#2d5a27]" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Evolutionary History</p>
            </div>
            <div className="space-y-6">
              {updates.map((update, idx) => (
                <div key={update.id} className="relative pl-6 pb-6 last:pb-0">
                  {idx !== updates.length - 1 && (
                    <div className="absolute left-[3px] top-[14px] bottom-0 w-[2px] bg-slate-50" />
                  )}
                  <div className="absolute left-0 top-[10px] w-2 h-2 rounded-full bg-[#2d5a27] ring-4 ring-white shadow-sm" />
                  
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100/50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white border border-slate-100 text-slate-500">
                        {update.stage}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                        {format(new Date(update.timestamp), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                      "{update.notes || "System trace: Observation recorded without secondary notes."}"
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-[#2d5a27] text-[10px] flex items-center justify-center font-bold text-white uppercase">
                        {update.agent_name[0]}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Logged by {update.agent_name}</span>
                    </div>
                  </div>
                </div>
              ))}
              {updates.length === 0 && (
                <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest italic grow flex items-center justify-center">
                  Evolutionary logs are currently dormant
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bento-card border-emerald-100 shadow-xl shadow-emerald-900/5 sticky top-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Log Observation</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel Input Protocol</p>
            </div>
            <form onSubmit={handleAddUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="stage" className="text-[10px] font-bold uppercase text-slate-400">Bio Phase Detection</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 h-11 text-sm font-bold">
                    <SelectValue placeholder="Select bio phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Germination">Germination</SelectItem>
                    <SelectItem value="Seedling">Seedling</SelectItem>
                    <SelectItem value="Vegetative">Vegetative</SelectItem>
                    <SelectItem value="Flowering">Flowering</SelectItem>
                    <SelectItem value="Ripening">Ripening</SelectItem>
                    <SelectItem value="Tuber Formation">Tuber Formation</SelectItem>
                    <SelectItem value="Harvested">Harvested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-[10px] font-bold uppercase text-slate-400">Observational Field Notes</Label>
                <Textarea 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Detailed conditions, abnormalities, or sensor verification..."
                  className="h-40 rounded-xl bg-slate-50 border-slate-100 text-xs font-medium resize-none leading-relaxed"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#2d5a27] hover:bg-[#1a3a16] h-12 rounded-xl gap-2 font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-emerald-900/20" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Finalize Log</>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, primary }: { icon: React.ReactNode, label: string, value: string, primary?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-300">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className={`font-bold tracking-tight ${primary ? 'text-[#2d5a27] text-xl' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}
