// ABOUTME: Company list page with search and sorting
// ABOUTME: Main landing page showing all companies

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { companies } from '../data/companies';
import { formatCurrency, formatDate } from '../utils/format';

type SortField = 'name' | 'orderCount' | 'totalValueCents' | 'lastOrderDate';
type SortDirection = 'asc' | 'desc';

export function CompanyList() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalValueCents');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredCompanies = useMemo(() => {
    let result = companies;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(lowerSearch));
    }

    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'orderCount') {
        comparison = a.orderCount - b.orderCount;
      } else if (sortField === 'totalValueCents') {
        comparison = a.totalValueCents - b.totalValueCents;
      } else if (sortField === 'lastOrderDate') {
        comparison = new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const totalValue = companies.reduce((sum, c) => sum + c.totalValueCents, 0);
  const totalOrders = companies.reduce((sum, c) => sum + c.orderCount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-500 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">StoneLedger</span>
            <span className="text-brand-100 text-sm">Hello Gravel CRM</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Companies</div>
            <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Company <SortIcon field="name" />
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('orderCount')}
                >
                  Orders <SortIcon field="orderCount" />
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalValueCents')}
                >
                  Total Value <SortIcon field="totalValueCents" />
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastOrderDate')}
                >
                  Last Order <SortIcon field="lastOrderDate" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/company/${company.id}`}
                      className="text-brand-500 hover:text-brand-700 font-medium"
                    >
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {company.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {formatCurrency(company.totalValueCents)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatDate(company.lastOrderDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCompanies.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No companies found matching "{search}"
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredCompanies.length} of {companies.length} companies
        </div>
      </div>
    </div>
  );
}
