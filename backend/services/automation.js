const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const IMAGE_MODEL = process.env.HUGGINGFACE_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell';

let cachedGoogleToken;
let googleTokenExpiry = 0;

export class AutomationInputError extends Error {}

export function resolveAutomationAction(body = {}) {
  const requested = String(body.action || '').trim().toLowerCase();
  const aliases = {
    otp: 'send_otp_email',
    welcome: 'send_welcome_email',
    stock_alert: 'low_stock_alert',
    summary: 'summarize_report',
  };
  if (requested) return aliases[requested] || requested;
  if (String(body.type || '').toUpperCase() === 'GROWTH_ADVICE') return 'growth_advice';
  if (body.otp && body.email) return 'send_otp_email';
  if (body.shop_name && body.email) return 'send_welcome_email';
  if (body.summary || body.aiExecutiveSummary) return 'summarize_report';
  return '';
}

export function findLowStockItems(items = [], threshold = 10) {
  return items.filter((item) => {
    const quantity = Number(item.stockQty ?? item.stock_qty ?? 0);
    return Number.isFinite(quantity) && quantity < threshold;
  }).map((item) => ({
    name: item.name || 'Unnamed item',
    stock_qty: Number(item.stockQty ?? item.stock_qty ?? 0),
  }));
}

export function formatInventoryAlert(items) {
  const products = items.map((item) => `• ${item.name} (${item.stock_qty} left)`).join('\n');
  return `⚠️ Low stock alert\n${products}\nPlease restock these products soon.`;
}

async function responseJson(response, service) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || response.statusText };
  }
  if (!response.ok) {
    throw new Error(`${service} request failed (${response.status}): ${data.error?.message || data.error || response.statusText}`);
  }
  return data;
}

async function googleAccessToken() {
  if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;
  if (cachedGoogleToken && Date.now() < googleTokenExpiry) return cachedGoogleToken;

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Set GOOGLE_ACCESS_TOKEN or the Google OAuth client ID, client secret, and refresh token.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await responseJson(response, 'Google OAuth');
  cachedGoogleToken = data.access_token;
  googleTokenExpiry = Date.now() + Math.max(0, (data.expires_in - 60) * 1000);
  return cachedGoogleToken;
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sendEmail({ to, subject, message }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to || '')) || !subject || !message) {
    throw new AutomationInputError('Email actions require a valid email address, subject, and message content.');
  }
  if (/[\r\n]/.test(subject)) throw new AutomationInputError('Email subject must not contain line breaks.');
  const token = await googleAccessToken();
  const raw = [
    `To: ${to}`,
    ...(process.env.GOOGLE_SENDER_EMAIL ? [`From: ${process.env.GOOGLE_SENDER_EMAIL}`] : []),
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    message,
  ].join('\r\n');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encodeBase64Url(raw) }),
  });
  return responseJson(response, 'Gmail');
}

async function generateText(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is required for AI workflow actions.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await responseJson(response, 'Gemini');
  const result = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!result) throw new Error('Gemini returned an empty response.');
  return result;
}

async function sendTelegramText(text) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required for Telegram actions.');
  }
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  });
  return responseJson(response, 'Telegram');
}

async function sendTelegramDocument(image, caption) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required for Telegram actions.');
  }
  const form = new FormData();
  form.set('chat_id', TELEGRAM_CHAT_ID);
  form.set('caption', caption.slice(0, 1024));
  form.set('document', new Blob([image], { type: 'image/png' }), 'finora-growth-advice.png');
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: form,
  });
  return responseJson(response, 'Telegram');
}

function documentId(value) {
  const match = String(value || '').match(/\/document\/d\/([\w-]+)/);
  return match ? match[1] : String(value || '').trim();
}

async function getGoogleDoc(id) {
  const token = await googleAccessToken();
  const response = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return responseJson(response, 'Google Docs');
}

async function appendGoogleDoc(id, text) {
  const token = await googleAccessToken();
  const response = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(id)}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ insertText: { endOfSegmentLocation: {}, text: `\n${text}\n` } }] }),
  });
  return responseJson(response, 'Google Docs');
}

function plainTextFromDocument(document) {
  return (document.body?.content || []).flatMap((block) => block.paragraph?.elements || [])
    .map((element) => element.textRun?.content || '').join('').trim();
}

async function generateImage(prompt) {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error('HUGGINGFACE_API_TOKEN is required for growth-advice image generation.');
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${IMAGE_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Hugging Face request failed (${response.status}): ${detail || response.statusText}`);
  }
    if (!response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error('Hugging Face returned a non-image response. Check the image model configuration.');
    }
  return Buffer.from(await response.arrayBuffer());
}

export async function executeAutomationAction(action, body, { getInventory } = {}) {
  switch (action) {
    case 'send_otp_email': {
      if (!body.otp) throw new AutomationInputError('An OTP is required to send an OTP email.');
      const message = `Hello ${body.owner_name || 'there'},\n\nYour Finora login OTP is ${body.otp}. It is valid for 10 minutes. Do not share this code with anyone.`;
      await sendEmail({ to: body.email, subject: 'Finora login OTP', message });
      return { message: 'OTP email sent.' };
    }
    case 'send_welcome_email': {
      const message = `Welcome to Finora, ${body.owner_name || body.user_name || 'business owner'}!\n\nBusiness: ${body.shop_name || 'Not provided'}\nMobile: ${body.mobile_number || 'Not provided'}\nBusiness type: ${body.shop_type || 'Not provided'}\nUser ID: ${body.user_id || body.userId || 'Not provided'}\n\nYour business dashboard is ready.`;
      await sendEmail({ to: body.email, subject: 'Welcome to Finora', message });
      return { message: 'Welcome email sent.' };
    }
    case 'low_stock_alert': {
      if (!getInventory) throw new Error('Inventory access is not configured.');
      const items = findLowStockItems(await getInventory());
      if (!items.length) return { message: 'No low-stock products found.', products: [] };
      const alert = formatInventoryAlert(items);
      await sendTelegramText(alert);
      return { message: 'Low-stock alert sent.', products: items };
    }
    case 'summarize_report': {
      const summary = body.aiExecutiveSummary ?? body.summary;
      if (!summary) throw new AutomationInputError('Report summary data is required.');
      const period = body.period || body.summary?.period;
      if (!['Last 2 Days', 'Last 7 Days'].includes(period)) {
        throw new AutomationInputError('Period must be Last 2 Days or Last 7 Days.');
      }
      const documentSetting = period === 'Last 2 Days'
        ? process.env.GOOGLE_DOC_ID_LAST_2_DAYS
        : period === 'Last 7 Days'
          ? process.env.GOOGLE_DOC_ID_LAST_7_DAYS
          : '';
      if (!documentSetting) throw new Error('Set a supported period (Last 2 Days or Last 7 Days) and its Google Docs document ID.');
      const text = await generateText(`Convert this business report into a clear, concise message for a business owner. Do not output JSON.\n\n${JSON.stringify(summary)}`);
      await appendGoogleDoc(documentId(documentSetting), text);
      await sendTelegramText(text);
      return { message: 'Report summarized and delivered.', summary: text };
    }
    case 'growth_advice': {
      const source = body.aiGrowthAdvice;
      if (!source) throw new AutomationInputError('aiGrowthAdvice is required.');
      const docId = documentId(process.env.GOOGLE_GROWTH_DOC_ID);
      if (!docId) throw new Error('GOOGLE_GROWTH_DOC_ID is required for growth-advice actions.');
      const document = await getGoogleDoc(docId);
      const prompt = await generateText(`Create one professional, business-focused image-generation prompt using only these inputs. Return only the prompt.\n\nGrowth advice: ${JSON.stringify(source)}\n\nBusiness document: ${plainTextFromDocument(document)}`);
      const image = await generateImage(prompt);
      await sendTelegramDocument(image, 'Finora business growth advice');
      return { message: 'Growth-advice image generated and delivered.' };
    }
    default:
      throw new Error(`Unsupported automation action: ${action || '(missing)'}`);
  }
}