import { Router } from 'express';
import { db } from '../db.js';
import { AutomationInputError, executeAutomationAction, resolveAutomationAction } from '../services/automation.js';

const router = Router();
const SUPPORTED_ACTIONS = new Set([
  'send_otp_email',
  'send_welcome_email',
  'low_stock_alert',
  'summarize_report',
  'growth_advice',
]);

router.post('/', async (req, res) => {
  const action = resolveAutomationAction(req.body);
  if (!SUPPORTED_ACTIONS.has(action)) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported or missing action.',
      supportedActions: [...SUPPORTED_ACTIONS],
    });
  }

  try {
    const result = await executeAutomationAction(action, req.body, {
      getInventory: () => db.fetchScoped('inventory', req.shopId),
    });
    return res.json({ success: true, action, ...result });
  } catch (error) {
    const status = error instanceof AutomationInputError ? 400 : 502;
    return res.status(status).json({ success: false, action, error: error.message });
  }
});

export default router;