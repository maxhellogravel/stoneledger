// ABOUTME: Data fetching hook for StoneLedger
// ABOUTME: Fetches companies, orders, and contacts from API

import { useState, useEffect, createContext, useContext } from 'react';

export interface Order {
  id: string;
  companyId: string;
  companyName: string;
  orderName: string;
  valueCents: number;
  clickupLink: string;
  startDate: string;
  dueDate: string;
}

export interface Company {
  id: string;
  name: string;
  orderCount: number;
  totalValueCents: number;
  lastOrderDate: string;
}

export interface Contact {
  id: string;
  companyId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  phoneRaw: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Static users for now - will move to database later
export const users: User[] = [
  {
    id: 'max-cannon',
    name: 'Max Cannon',
    email: 'max@hellogravel.com',
    role: 'admin',
  },
];

export const currentUser = users[0];

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function getUserByName(name: string): User | undefined {
  return users.find(u => u.name.toLowerCase() === name.toLowerCase());
}

export interface Note {
  id: string;
  companyId: string;
  companyName: string;
  contact: string;
  content: string;
  date: string;
  author: string;
}

interface DataState {
  companies: Company[];
  orders: Order[];
  contacts: Contact[];
  notes: Note[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

export function useDataProvider() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setCompanies(data.companies || []);
      setOrders(data.orders || []);
      setContacts(data.contacts || []);
      setNotes(data.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    companies,
    orders,
    contacts,
    notes,
    loading,
    error,
    refresh: fetchData,
    DataContext,
  };
}

export { DataContext };
