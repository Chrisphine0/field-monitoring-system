const RISK_KEYWORDS = [
  'wilt', 'pest', 'disease', 'risk', 'warning', 
  'emergency', 'damage', 'critical', 'fail', 
  'died', 'drooping', 'yellow', 'brown', 'stunted'
];

const RESOLUTION_KEYWORDS = [
  'solved', 'resolved', 'fixed', 'cleared', 'healthy', 
  'recovered', 'stable', 'normal', 'improving', 'better'
];

export async function computeFieldStatus(db: any, fieldId: number): Promise<'Active' | 'At Risk' | 'Completed'> {
  const field = await db.get('SELECT current_stage FROM fields WHERE id = ?', [fieldId]);
  if (!field) return 'Active';

  if (field.current_stage === 'Harvested') {
    return 'Completed';
  }

  // Get most recent update
  const latestUpdate = await db.get(`
    SELECT timestamp, notes 
    FROM field_updates 
    WHERE field_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `, [fieldId]);

  if (latestUpdate) {
    const lastUpdateDate = new Date(latestUpdate.timestamp);
    const daysSinceLastUpdate = (Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24);

    // If no update for 5 days, mark as At Risk
    if (daysSinceLastUpdate > 5) {
      return 'At Risk';
    }

    // Check notes for risk keywords
    if (latestUpdate.notes) {
      const lowerNotes = latestUpdate.notes.toLowerCase();
      
      // If the note explicitly mentions a resolution, treat it as healthy
      // unless it contains strong negation like "not solved"
      const hasResolution = RESOLUTION_KEYWORDS.some(keyword => lowerNotes.includes(keyword));
      const hasRisk = RISK_KEYWORDS.some(keyword => lowerNotes.includes(keyword));

      if (hasRisk && !hasResolution) {
        return 'At Risk';
      }
    }
  } else {
    // If no updates yet, check if planting was long ago
    const fieldData = await db.get('SELECT planting_date FROM fields WHERE id = ?', [fieldId]);
    if (fieldData) {
      const plantingDate = new Date(fieldData.planting_date);
      const daysSincePlanting = (Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePlanting > 14) { // No updates within 2 weeks of planting is risky
        return 'At Risk';
      }
    }
  }

  return 'Active';
}

export async function syncFieldStatus(db: any, fieldId: number) {
  const status = await computeFieldStatus(db, fieldId);
  await db.run('UPDATE fields SET status = ? WHERE id = ?', [status, fieldId]);
}
