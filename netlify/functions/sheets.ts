// ABOUTME: Netlify Function to fetch data from Google Sheets
// ABOUTME: Returns orders, contacts, and notes data from configured sheets

import { google } from 'googleapis';
import type { Handler } from '@netlify/functions';

const ORDERS_SHEET_ID = '1W9mqlDCNvICWOrd78JR7OMgvleUDWzyM0QqymC2syck';
const STONELEDGER_DATA_SHEET_ID = '128uU-hzHYyUemdvoxSICRQyBpRTD5N0L38lximZ_Qhg';

async function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return auth;
}

async function fetchSheet(sheetId: string, range: string) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  return response.data.values || [];
}

function parseCurrency(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  // Handle if Google Sheets returns a number directly
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  // Handle string values (with or without $ and commas)
  const cleaned = String(value).replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

function generateId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function companyId(name: string): string {
  return generateId(name.toLowerCase().trim());
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Debug mode - return raw data
  const debug = event.queryStringParameters?.debug === 'true';

  try {
    // Fetch orders from "Orders" tab, columns A-F
    const ordersData = await fetchSheet(ORDERS_SHEET_ID, debug ? 'Orders!A1:F10' : 'Orders!A2:F500');

    if (debug) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ rawOrders: ordersData }, null, 2),
      };
    }
    const orders = ordersData.map((row: (string | number)[]) => {
      // Column A: Company, B: Value, C: Order ID, D: Clickup Link, E: Start Date, F: Due Date
      const [company, value, orderName, clickupLink, startDate, dueDate] = row;
      const companyStr = String(company || '').trim();
      const orderNameStr = String(orderName || '').trim();
      const clickupLinkStr = String(clickupLink || '').trim();
      const startDateStr = String(startDate || '').trim();
      const dueDateStr = String(dueDate || '').trim();
      return {
        id: generateId(clickupLinkStr || orderNameStr),
        companyId: companyId(companyStr),
        companyName: companyStr,
        orderName: orderNameStr,
        valueCents: parseCurrency(value),
        clickupLink: clickupLinkStr,
        startDate: parseDate(startDateStr),
        dueDate: parseDate(dueDateStr),
      };
    }).filter((o) => o.companyName);

    // Fetch contacts from "Contacts" tab in StoneLedger Data sheet
    // A: ID, B: Company, C: First Name, D: Last Name, E: Email, F: Phone
    const contactsData = await fetchSheet(STONELEDGER_DATA_SHEET_ID, 'Contacts!A2:F500');
    const contacts = contactsData.map((row: (string | number)[]) => {
      const [id, company, firstName, lastName, email, phone] = row;
      const idStr = String(id || '').trim();
      const companyStr = String(company || '').trim();
      const firstNameStr = String(firstName || '').trim();
      const lastNameStr = String(lastName || '').trim();
      const emailStr = String(email || '').trim();
      const phoneStr = String(phone || '').trim();
      const fullNameStr = `${firstNameStr} ${lastNameStr}`.trim();
      return {
        id: idStr || generateId(emailStr || phoneStr || `${companyStr}-${firstNameStr}`),
        companyId: companyId(companyStr),
        companyName: companyStr,
        firstName: firstNameStr,
        lastName: lastNameStr,
        fullName: fullNameStr,
        email: emailStr,
        phone: phoneStr,
        phoneRaw: phoneStr,
      };
    }).filter((c) => c.companyName);

    // Fetch notes from "Notes" tab in StoneLedger Data sheet
    // A: ID, B: Company, C: Contact, D: Date, E: Author, F: Content
    const notesData = await fetchSheet(STONELEDGER_DATA_SHEET_ID, 'Notes!A2:F500');
    const notes = notesData.map((row: (string | number)[]) => {
      const [id, company, contact, date, author, content] = row;
      const idStr = String(id || '').trim();
      const companyStr = String(company || '').trim();
      const contactStr = String(contact || '').trim();
      const dateStr = String(date || '').trim();
      const authorStr = String(author || '').trim();
      const contentStr = String(content || '').trim();
      return {
        id: idStr || generateId(`${companyStr}-${dateStr}-${contentStr.slice(0, 20)}`),
        companyId: companyId(companyStr),
        companyName: companyStr,
        contact: contactStr,
        date: parseDate(dateStr),
        author: authorStr,
        content: contentStr,
      };
    }).filter((n) => n.companyName && n.content);

    // Build companies from orders
    const companyMap = new Map<string, {
      id: string;
      name: string;
      orderCount: number;
      totalValueCents: number;
      lastOrderDate: string;
    }>();

    for (const order of orders) {
      const existing = companyMap.get(order.companyId);
      if (existing) {
        existing.orderCount += 1;
        existing.totalValueCents += order.valueCents;
        if (order.startDate > existing.lastOrderDate) {
          existing.lastOrderDate = order.startDate;
        }
      } else {
        companyMap.set(order.companyId, {
          id: order.companyId,
          name: order.companyName,
          orderCount: 1,
          totalValueCents: order.valueCents,
          lastOrderDate: order.startDate,
        });
      }
    }

    const companies = Array.from(companyMap.values())
      .sort((a, b) => b.totalValueCents - a.totalValueCents);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ companies, orders, contacts, notes }),
    };
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch data from sheets' }),
    };
  }
};
