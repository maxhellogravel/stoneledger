// ABOUTME: Company detail page with order timeline
// ABOUTME: Shows company info, orders, and contacts

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData, Order, Note } from '../hooks/useData';
import { formatCurrency, formatDate, formatShortDate } from '../utils/format';

type TimelineItem =
  | { type: 'order'; date: string; data: Order }
  | { type: 'note'; date: string; data: Note };

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const { companies, orders, contacts, notes, loading, error, refresh } = useData();

  const company = useMemo(
    () => companies.find(c => c.id === id),
    [companies, id]
  );

  const companyOrders = useMemo(
    () => orders.filter(o => o.companyId === id),
    [orders, id]
  );

  const companyNotes = useMemo(
    () => notes.filter(n => n.companyId === id),
    [notes, id]
  );

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [
      ...companyOrders.map(o => ({ type: 'order' as const, date: o.startDate, data: o })),
      ...companyNotes.map(n => ({ type: 'note' as const, date: n.date, data: n })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [companyOrders, companyNotes]);

  const companyContacts = useMemo(
    () => contacts.filter(c => c.companyId === id),
    [contacts, id]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-brand-500 text-white px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <span className="text-xl font-bold">StoneLedger</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-brand-500 text-white px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <span className="text-xl font-bold">StoneLedger</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error: {error}</div>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-brand-500 text-white px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <span className="text-xl font-bold">StoneLedger</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
            <Link to="/" className="text-brand-500 hover:text-brand-700">
              ← Back to Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-500 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-bold hover:text-brand-100">StoneLedger</Link>
            <span className="text-brand-100 text-sm">Hello Gravel CRM</span>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-1 text-sm bg-brand-600 hover:bg-brand-700 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/" className="text-brand-500 hover:text-brand-700 text-sm mb-4 inline-block">
          ← Back to Companies
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-500 mt-1">
            {company.orderCount} orders · {formatCurrency(company.totalValueCents)} total
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main timeline area */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-gray-900">Timeline</h2>
                <button className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600">
                  + Add Note
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {timeline.map(item => (
                  <div key={item.data.id} className="px-4 py-4 hover:bg-gray-50">
                    {item.type === 'order' ? (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                              Order
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatShortDate(item.data.startDate)}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-900 font-medium">{item.data.orderName}</p>
                          <div className="mt-1 text-sm text-gray-600">
                            {formatCurrency(item.data.valueCents)}
                          </div>
                        </div>
                        <a
                          href={item.data.clickupLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-500 hover:text-brand-700 font-medium"
                        >
                          ClickUp →
                        </a>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Note
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatShortDate(item.data.date)}
                          </span>
                          {item.data.contact && (
                            <span className="text-sm text-gray-500">
                              · {item.data.contact}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-gray-900">{item.data.content}</p>
                        <div className="mt-1 text-sm text-gray-500">
                          — {item.data.author}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {timeline.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No activity yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total Orders</dt>
                  <dd className="text-gray-900 font-medium">{company.orderCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total Value</dt>
                  <dd className="text-gray-900 font-medium">{formatCurrency(company.totalValueCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Avg Order</dt>
                  <dd className="text-gray-900 font-medium">
                    {formatCurrency(Math.round(company.totalValueCents / company.orderCount))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Last Order</dt>
                  <dd className="text-gray-900 font-medium">{formatDate(company.lastOrderDate)}</dd>
                </div>
              </dl>
            </div>

            {/* Contacts */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">Contacts</h3>
                <button className="text-sm text-brand-500 hover:text-brand-700 font-medium">+ Add</button>
              </div>
              {companyContacts.length > 0 ? (
                <div className="space-y-3">
                  {companyContacts.map(contact => (
                    <div key={contact.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="font-medium text-gray-900">{contact.fullName}</div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm text-brand-500 hover:text-brand-700 flex items-center gap-1 mt-1"
                      >
                        <span>📞</span> {contact.phoneRaw}
                      </a>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm text-gray-500 hover:text-gray-700 block mt-0.5 truncate"
                      >
                        {contact.email}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No contacts yet</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  Log a Call
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  Schedule Follow-up
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  Add Internal Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
