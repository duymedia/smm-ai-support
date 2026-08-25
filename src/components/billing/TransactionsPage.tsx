import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Download,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { transactions, formatMoney, addToast, t } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'rent' | 'refund'>('all');

  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      tx.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Date,Description,Amount,Type,Status,PaymentMethod']
        .concat(
          transactions.map(
            (t) => `${t.id},${t.date},"${t.description}",${t.amount},${t.type},${t.status},${t.paymentMethod || ''}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'nexussmm_transactions_statement.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    addToast('success', 'Transaction ledger exported as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('transactions.title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('transactions.subtitle')}</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('transactions.downloadInvoice')}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction ID or description..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'deposit', 'rent', 'refund'].map((tp) => (
            <button
              key={tp}
              onClick={() => setFilterType(tp as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                filterType === tp
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Transaction ID</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Payment Method</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-right">Status</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTxs.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-700">{tx.id}</td>
                  <td className="py-3 text-slate-500 font-mono text-[11px]">
                    {new Date(tx.date).toLocaleString()}
                  </td>
                  <td className="py-3 font-medium text-slate-900">{tx.description}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{tx.paymentMethod || 'Wallet Balance'}</td>
                  <td
                    className={`py-3 text-right font-bold font-mono ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.amount > 0 ? `+${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => addToast('info', `Receipt downloaded for transaction ${tx.id}`)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
