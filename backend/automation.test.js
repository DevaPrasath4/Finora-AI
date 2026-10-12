import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AutomationInputError,
  executeAutomationAction,
  findLowStockItems,
  formatInventoryAlert,
  resolveAutomationAction,
} from './services/automation.js';

test('resolves explicit action aliases and Workbench payload shapes', () => {
  assert.equal(resolveAutomationAction({ action: 'otp' }), 'send_otp_email');
  assert.equal(resolveAutomationAction({ action: 'welcome' }), 'send_welcome_email');
  assert.equal(resolveAutomationAction({ type: 'GROWTH_ADVICE' }), 'growth_advice');
  assert.equal(resolveAutomationAction({ email: 'owner@example.com', otp: '123456' }), 'send_otp_email');
  assert.equal(resolveAutomationAction({}), '');
});

test('finds inventory below the Workbench threshold and normalizes fields', () => {
  const products = findLowStockItems([
    { name: 'Rice', stock_qty: 4 },
    { name: 'Oil', stockQty: 10 },
    { name: 'Tea', stock_qty: 'not a number' },
  ]);
  assert.deepEqual(products, [{ name: 'Rice', stock_qty: 4 }]);
  assert.match(formatInventoryAlert(products), /Rice \(4 left\)/);
});

test('low-stock action does not contact integrations when there are no alerts', async () => {
  const result = await executeAutomationAction('low_stock_alert', {}, {
    getInventory: async () => [{ name: 'Rice', stock_qty: 10 }],
  });
  assert.deepEqual(result, { message: 'No low-stock products found.', products: [] });
});

test('rejects an OTP email request without an OTP before making provider calls', async () => {
  await assert.rejects(
    executeAutomationAction('send_otp_email', { email: 'owner@example.com' }),
    AutomationInputError,
  );
});