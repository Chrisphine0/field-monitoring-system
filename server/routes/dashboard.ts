import express from 'express';
import { getDb } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';
import { syncFieldStatus } from '../lib/statusHelper.ts';

const router = express.Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();
  
  try {
    // Sync all field statuses in parallel to ensure time-based risks are captured
    const allFieldIds = await db.all('SELECT id FROM fields');
    await Promise.all(allFieldIds.map((f: any) => syncFieldStatus(db, f.id)));

    if (req.user?.role === 'admin') {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_fields,
          COALESCE(SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END), 0) as active_fields,
          COALESCE(SUM(CASE WHEN status = 'At Risk' THEN 1 ELSE 0 END), 0) as at_risk_fields,
          COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) as completed_fields
        FROM fields
      `);

      const recentUpdates = await db.all(`
        SELECT fu.*, f.name as field_name, u.name as agent_name
        FROM field_updates fu
        JOIN fields f ON fu.field_id = f.id
        JOIN users u ON fu.agent_id = u.id
        ORDER BY fu.timestamp DESC
        LIMIT 5
      `);

      res.json({ stats, recentUpdates });
    } else {
      const stats = await db.get(`
        SELECT 
          COUNT(f.id) as assigned_fields,
          COALESCE(SUM(CASE WHEN f.status = 'Active' THEN 1 ELSE 0 END), 0) as active_fields
        FROM fields f
        JOIN assignments a ON f.id = a.field_id
        WHERE a.agent_id = ?
      `, [req.user?.id]);

      const myUpdates = await db.all(`
        SELECT fu.*, f.name as field_name
        FROM field_updates fu
        JOIN fields f ON fu.field_id = f.id
        WHERE fu.agent_id = ?
        ORDER BY fu.timestamp DESC
        LIMIT 5
      `, [req.user?.id]);

      res.json({ stats, recentUpdates: myUpdates });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full Archive - Retrieves all updates with field and agent info
router.get('/archive', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();
  try {
    if (req.user?.role === 'admin') {
      const archive = await db.all(`
        SELECT fu.*, f.name as field_name, u.name as agent_name
        FROM field_updates fu
        JOIN fields f ON fu.field_id = f.id
        JOIN users u ON fu.agent_id = u.id
        ORDER BY fu.timestamp DESC
      `);
      res.json(archive);
    } else {
      const archive = await db.all(`
        SELECT fu.*, f.name as field_name, u.name as agent_name
        FROM field_updates fu
        JOIN fields f ON fu.field_id = f.id
        JOIN users u ON fu.agent_id = u.id
        WHERE fu.agent_id = ?
        ORDER BY fu.timestamp DESC
      `, [req.user?.id]);
      res.json(archive);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
