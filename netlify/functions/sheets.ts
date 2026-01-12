// ABOUTME: Netlify Function to fetch data from Google Sheets
// ABOUTME: Returns orders and contacts data from configured sheets

import { google } from 'googleapis';
import type { Handler } from '@netlify/functions';

const ORDERS_SHEET_ID = '1W9mqlDCNvICWOrd78JR7OMgvleUDWzyM0QqymC2syck';
const CONTACTS_SHEET_ID = '1PXUsDE16nUx7FusxtsSKdIrtmDyFDnMy4x_V_QHYBQY';

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

  try {
    // Fetch orders
    const ordersData = await fetchSheet(ORDERS_SHEET_ID, 'A2:G200');
    const orders = ordersData.map((row: (string | number)[]) => {
      const [company, value, orderName, clickupLink, startDate, dueDate, turnaround] = row;
      const companyStr = String(company || '');
      const orderNameStr = String(orderName || '');
      const clickupLinkStr = String(clickupLink || '');
      const startDateStr = String(startDate || '');
      const dueDateStr = String(dueDate || '');
      return {
        id: generateId(clickupLinkStr || orderNameStr),
        companyId: companyId(companyStr),
        companyName: companyStr,
        orderName: orderNameStr,
        valueCents: parseCurrency(value),
        clickupLink: clickupLinkStr,
        startDate: parseDate(startDateStr),
        dueDate: parseDate(dueDateStr),
        turnaroundDays: parseInt(String(turnaround)) || 0,
      };
    }).filter((o) => o.companyName);

    // Fetch contacts
    const contactsData = await fetchSheet(CONTACTS_SHEET_ID, 'A2:I200');
    const contacts = contactsData.map((row: string[]) => {
      const [email, phone, company, , firstName, lastName, fullName, phoneRaw] = row;
      return {
        id: generateId(email || ''),
        companyId: companyId(company || ''),
        companyName: company || '',
        firstName: firstName || '',
        lastName: lastName || '',
        fullName: fullName || `${firstName || ''} ${lastName || ''}`.trim(),
        email: email || '',
        phone: phone || '',
        phoneRaw: phoneRaw || phone || '',
      };
    }).filter((c: { companyName: string }) => c.companyName);

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
      body: JSON.stringify({ companies, orders, contacts }),
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
