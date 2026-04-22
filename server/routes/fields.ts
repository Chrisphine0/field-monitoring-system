import express from 'express';
import { z } from 'zod';
import { getDb } from '../db.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { syncFieldStatus } from '../lib/statusHelper.ts';

const router = express.Router();

const fieldSchema = z.object({
  name: z.string().min(2),
  crop_type: z.string().min(2),
  planting_date: z.string(),
  current_stage: z.string()
});

const updateSchema = z.object({
  stage: z.string(),
  notes: z.string().optional()
});

// Get all fields (Admin sees all, Agent sees assigned)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();
  
  // Update all statuses in parallel before returning
  const allFieldIds = await db.all('SELECT id FROM fields');
  await Promise.all(allFieldIds.map((f: any) => syncFieldStatus(db, f.id)));

  if (req.user?.role === 'admin') {
    const fields = await db.all(`
      SELECT f.*, 
             u.name as agent_name, 
             u.id as agent_id
      FROM fields f
      LEFT JOIN assignments a ON f.id = a.field_id
      LEFT JOIN users u ON a.agent_id = u.id
    `);
    res.json(fields);
  } else {
    const fields = await db.all(`
      SELECT f.*
      FROM fields f
      JOIN assignments a ON f.id = a.field_id
      WHERE a.agent_id = ?
    `, [req.user?.id]);
    res.json(fields);
  }
});

// Get single field
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  
  await syncFieldStatus(db, id);

  const field = await db.get(`
    SELECT f.*, 
           u.name as agent_name, 
           u.id as agent_id
    FROM fields f
    LEFT JOIN assignments a ON f.id = a.field_id
    LEFT JOIN users u ON a.agent_id = u.id
    WHERE f.id = ?
  `, [id]);

  if (!field) {
    return res.status(404).json({ error: 'Field not found' });
  }

  // Check access for agents
  if (req.user?.role === 'agent') {
    const assigned = await db.get('SELECT id FROM assignments WHERE field_id = ? AND agent_id = ?', [id, req.user.id]);
    if (!assigned) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  res.json(field);
});

// Admin: Create Field
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, crop_type, planting_date, current_stage } = fieldSchema.parse(req.body);
    const db = getDb();
    const result = await db.run(
      'INSERT INTO fields (name, crop_type, planting_date, current_stage) VALUES (?, ?, ?, ?)',
      [name, crop_type, planting_date, current_stage]
    );
    await syncFieldStatus(db, result.lastID!);
    res.status(201).json({ id: result.lastID });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Update Field
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, crop_type, planting_date, current_stage } = fieldSchema.parse(req.body);
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.run(
      'UPDATE fields SET name = ?, crop_type = ?, planting_date = ?, current_stage = ? WHERE id = ?',
      [name, crop_type, planting_date, current_stage, id]
    );
    await syncFieldStatus(db, id);
    res.json({ message: 'Field updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Delete Field
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  try {
    await db.run('DELETE FROM fields WHERE id = ?', [id]);
    res.json({ message: 'Field deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Assign Agent
router.post('/:id/assign', authenticate, authorize(['admin']), async (req, res) => {
  const { agent_id } = req.body;
  const db = getDb();
  const fieldId = parseInt(req.params.id);
  try {
    await db.run('DELETE FROM assignments WHERE field_id = ?', [fieldId]);
    await db.run('INSERT INTO assignments (field_id, agent_id) VALUES (?, ?)', [fieldId, agent_id]);
    res.json({ message: 'Agent assigned' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Agent: Add Update
router.post('/:id/updates', authenticate, async (req: AuthRequest, res) => {
  try {
    const { stage, notes } = updateSchema.parse(req.body);
    const db = getDb();
    const fieldId = parseInt(req.params.id);
    const agentId = req.user?.id;
    
    // Check assignment
    const assignment = await db.get('SELECT id FROM assignments WHERE field_id = ? AND agent_id = ?', [fieldId, agentId]);
    if (!assignment && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Field not assigned to you' });
    }

    await db.run(
      'INSERT INTO field_updates (field_id, agent_id, stage, notes) VALUES (?, ?, ?, ?)',
      [fieldId, agentId, stage, notes]
    );
    
    // Update current stage in fields table
    await db.run('UPDATE fields SET current_stage = ? WHERE id = ?', [stage, fieldId]);

    await syncFieldStatus(db, fieldId);

    res.status(201).json({ message: 'Update recorded' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get Updates for a field
router.get('/:id/updates', authenticate, async (req, res) => {
  const db = getDb();
  const fieldId = parseInt(req.params.id);
  const updates = await db.all(`
    SELECT fu.*, u.name as agent_name
    FROM field_updates fu
    JOIN users u ON fu.agent_id = u.id
    WHERE fu.field_id = ?
    ORDER BY fu.timestamp DESC
  `, [fieldId]);
  res.json(updates);
});

// Get available agents (for admin assignment)
router.get('/agents/available', authenticate, authorize(['admin']), async (req, res) => {
  const db = getDb();
  const agents = await db.all("SELECT id, name, email FROM users WHERE role = 'agent'");
  res.json(agents);
});

export default router;
