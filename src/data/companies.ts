// ABOUTME: Derives company data from orders
// ABOUTME: Aggregates order counts, totals, and last order dates

import type { Company } from '../types';
import { orders } from './orders';

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

// Build companies from orders
const companyMap = new Map<string, {
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
    // Find company name from order
    const companyName = getCompanyNameFromOrder(order.companyId);
    companyMap.set(order.companyId, {
      name: companyName,
      orderCount: 1,
      totalValueCents: order.valueCents,
      lastOrderDate: order.startDate,
    });
  }
}

function getCompanyNameFromOrder(id: string): string {
  const companyNames = [
    '160 Driving Academy', '3 Generations Surfacing Corp.', 'A. Vincent', 'Acra Properties LLC',
    'AE Building LLC', 'American Utility Company', 'APA Solar', 'Aqua Underground', 'Arch Solar',
    'Azure Signature Concepts', 'BASS Engineering', 'Big State Electric', 'Borell Excavation',
    'C&C Electrical Service', 'Chemtrade Logistics', 'Colorado State University', 'CWA Enterprises',
    'Danella', 'Dannic Solutions', 'Design Build Inter-American', 'DMS Facility Services',
    'Electrical Engineering Enterprises', 'Empire Access', 'Freedom Forever', 'Fugro', 'GAC LLC',
    'Gomel Capital Partners', 'Gravity Haus', 'Guild GC', 'Harrop USA', 'Hemet Unified School District',
    'Highland Resources', 'Hing Builder', 'HM Rentals', 'Infinite City Construction',
    'Kampgrounds of America', 'Kempner Family', 'Kinetic Construction', 'KO Storage',
    'L&Aconsultingpro.com', 'Lake Shastina Community Services District', 'Little Arrow',
    'M&H Telecom', 'MAG Construction', 'MS Signs, INC', "Newman's Electricals",
    'Nguyen Doan Landscaping', 'Olympus Property', 'PDC Companies', 'Piveli Contractors',
    'Play Surface Specialties', 'Playspace Services', 'Powerserve Technologies', 'PYE Barker',
    'Rental n Depot', 'Riverbirch Remodeling', 'Rodrigue Sons', 'S&P Erectors', 'Schwob Energy',
    'Settlers Point Luxury Resort', 'SG Heating & Air Conditioning', 'SGO Construction',
    'SubX Earthworks', 'Talon Drilling Company', 'TB Landmark', 'Tech Construction', 'Terra Lumen',
    'Texas Sprinkler System', 'The Comtran Group', 'The Styles Group', 'Trackline Construction',
    'Tricor LLC', 'Triton Services', 'True North Steel', 'U.S. Department of Agriculture',
    'University of North Dakota', 'Walnut Creek Property Management', 'William R. Nash',
    'Wm. S. Trimble Company'
  ];

  for (const name of companyNames) {
    if (companyId(name) === id) {
      return name;
    }
  }
  return 'Unknown';
}

export const companies: Company[] = Array.from(companyMap.entries()).map(([id, data]) => ({
  id,
  name: data.name,
  orderCount: data.orderCount,
  totalValueCents: data.totalValueCents,
  lastOrderDate: data.lastOrderDate,
})).sort((a, b) => b.totalValueCents - a.totalValueCents);

export function getCompanyById(id: string): Company | undefined {
  return companies.find(c => c.id === id);
}

export function getOrdersForCompany(companyId: string) {
  return orders.filter(o => o.companyId === companyId).sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}
