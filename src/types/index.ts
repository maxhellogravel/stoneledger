// ABOUTME: Core type definitions for StoneLedger
// ABOUTME: Defines Company, Order, and Note structures

export interface Order {
  id: string;
  companyId: string;
  orderName: string;
  valueCents: number;
  clickupLink: string;
  startDate: string;
  dueDate: string;
  turnaroundDays: number;
}

export interface Company {
  id: string;
  name: string;
  orderCount: number;
  totalValueCents: number;
  lastOrderDate: string;
}

export interface Note {
  id: string;
  companyId: string;
  authorId: string;
  authorName: string;
  noteType: 'call' | 'meeting' | 'internal' | 'follow_up';
  content: string;
  occurredAt: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  companyId: string;
  eventType: 'order' | 'note';
  eventAt: string;
  summary: string;
  referenceId: string;
}
