import React, { useEffect, useState } from 'react';
import { api } from '@/src/lib/api.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, UserPlus, Trash2, MoreVertical, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function Fields({ user }: { user: any }) {
  const [fields, setFields] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);

  const isAdmin = user?.role === 'admin';

  async function loadData() {
    try {
      const fieldData = await api.fields.list();
      setFields(fieldData);
      if (isAdmin) {
        const agentData = await api.fields.getAvailableAgents();
        setAgents(agentData);
      }
    } catch (error) {
      toast.error('Failed to load fields');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateField = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      crop_type: formData.get('crop_type'),
      planting_date: formData.get('planting_date'),
      current_stage: formData.get('current_stage'),
    };

    try {
      await api.fields.create(data);
      toast.success('Field created successfully');
      setIsCreateOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAssignAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const agentId = Number(formData.get('agent_id'));

    try {
      await api.fields.assign(selectedField.id, agentId);
      toast.success('Agent assigned successfully');
      setIsAssignOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleDeleteField = async (id: number) => {
    try {
      await api.fields.delete(id);
      toast.success('Field deleted');
      setDeleteConfirmId(null);
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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Fields Registry</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Territorial Inventory</p>
        </div>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button className="bg-[#2d5a27] hover:bg-[#1a3a16] gap-2 rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20">
                <Plus className="w-4 h-4 shadow-sm" />
                Initialize Field
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle>Add New Field</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateField} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Field Name</Label>
                  <Input id="name" name="name" placeholder="e.g. North Side Valley" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crop_type">Crop Type</Label>
                  <Input id="crop_type" name="crop_type" placeholder="e.g. Corn, Soybeans" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planting_date">Planting Date</Label>
                  <Input id="planting_date" name="planting_date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_stage">Initial Stage</Label>
                  <Select name="current_stage" required defaultValue="Germination">
                    <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 h-11">
                      <SelectValue placeholder="Select current stage" />
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
                <DialogFooter>
                  <Button type="submit" className="w-full bg-[#2d5a27] hover:bg-emerald-800 rounded-xl h-12 font-bold uppercase tracking-widest text-xs">Authorize Operation</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bento-card p-0 overflow-hidden border-none shadow-xl shadow-emerald-900/5">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50 transition-none">
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-6">Territory Name</TableHead>
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Crop Classification</TableHead>
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chronology (Planted)</TableHead>
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Bio Phase</TableHead>
              <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">System Status</TableHead>
              {isAdmin && <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Assigned Staff</TableHead>}
              <TableHead className="py-4 text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-slate-700 py-4 pl-6">
                  <Link to={`/fields/${field.id}`} className="hover:text-[#2d5a27] transition-colors decoration-emerald-500/30 underline decoration-2 underline-offset-4">
                    {field.name}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-500 italic font-medium">{field.crop_type}</TableCell>
                <TableCell className="text-slate-400 font-bold text-[11px] uppercase">
                  {format(new Date(field.planting_date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-tight">
                    {field.current_stage}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    field.status === 'Active' ? 'status-active' :
                    field.status === 'At Risk' ? 'status-at-risk' :
                    'status-completed'
                  }`}>
                    {field.status.toUpperCase()}
                  </span>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                      {field.agent_name || <span className="text-slate-300 font-normal">Idle</span>}
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAdmin && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-[#2d5a27] hover:bg-emerald-50 rounded-lg"
                          onClick={() => {
                            setSelectedField(field);
                            setIsAssignOpen(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        <Dialog open={deleteConfirmId === field.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                          <DialogTrigger render={
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteConfirmId(field.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          } />
                          <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle>Confirm Deletion</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-slate-500">
                                This will permanently delete <span className="font-bold text-slate-900">{field.name}</span> and all associated records. This action cannot be undone.
                              </p>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="rounded-xl">Cancel</Button>
                              <Button 
                                onClick={() => handleDeleteField(field.id)}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20"
                              >
                                Delete Field
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    <Link to={`/fields/${field.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-32 text-slate-300 font-bold uppercase tracking-widest text-xs underline decoration-emerald-200 decoration-wavy underline-offset-8">
                  Registry holds no active operational records
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Agent</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignAgent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Field: <span className="text-slate-900 font-bold">{selectedField?.name}</span></Label>
              <Select name="agent_id" defaultValue={selectedField?.agent_id?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Confirm Assignment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
