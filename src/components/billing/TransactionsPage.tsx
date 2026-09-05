import React, { useState, useEffect } from 'react';
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
  Wallet,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  X,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Transaction } from '../../types';

export const TransactionsPage: React.FC = () => {
  const { user, transactions, formatMoney, addToast, language, t } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [localTxs, setLocalTxs] = useState<Transaction[]>(transactions);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLocalTxs(data.data);
      }
    } catch (e) {
      console.error('Fetch transactions error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const effectiveTxs = localTxs.length > 0 ? localTxs : transactions;

  // Tính toán các chỉ số thống kê
  const totalDeposited = effectiveTxs
    .filter((tx) => tx.type === 'deposit' || tx.amount > 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalSpent = effectiveTxs
    .filter((tx) => tx.type === 'subscription' || tx.type === 'renewal' || (tx.amount < 0 && tx.type !== 'deposit'))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const filteredTxs = effectiveTxs.filter((tx) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      String(tx.id).toLowerCase().includes(query) ||
      (tx.code && tx.code.toLowerCase().includes(query)) ||
      (tx.description && tx.description.toLowerCase().includes(query)) ||
      (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(query)) ||
      (tx.referenceCode && tx.referenceCode.toLowerCase().includes(query));

    const matchesType =
      filterType === 'all' ||
      tx.type === filterType ||
      (filterType === 'rent' && tx.type === 'subscription') ||
      (filterType === 'deposit' && tx.type === 'deposit');

    return matchesSearch && matchesType;
  });

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['#ID,Mã code,Thời gian,Nội dung,Loại,Số dư trước,Biến động,Số dư sau,Phương thức,Trạng thái']
        .concat(
          effectiveTxs.map(
            (t) =>
              `#${t.id},"${t.code || ''}",${new Date(t.date).toLocaleString()},"\"${(t.description || '').replace(/"/g, '""')}\"",${t.type},${t.balanceBefore ?? ''},${t.amount},${t.balanceAfter},"\"${(t.paymentMethod || '').replace(/"/g, '""')}\"",${t.status}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lich_su_giao_dich_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addToast('success', language === 'vi' ? 'Đã xuất dữ liệu lịch sử giao dịch thành công.' : 'Transaction ledger exported as CSV.');
  };

  const handleCopyCode = (val: string | number) => {
    navigator.clipboard.writeText(String(val));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    addToast('info', language === 'vi' ? `Đã sao chép: ${val}` : `Copied: ${val}`);
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return language === 'vi' ? 'Nạp tiền' : 'Deposit';
      case 'rent':
      case 'subscription':
        return language === 'vi' ? 'Thuê gói' : 'Rent package';
      case 'renewal':
        return language === 'vi' ? 'Gia hạn' : 'Renewal';
      case 'trial':
        return language === 'vi' ? 'Trải nghiệm' : 'Trial';
      case 'refund':
        return language === 'vi' ? 'Hoàn tiền' : 'Refund';
      case 'adjustment':
        return language === 'vi' ? 'Điều chỉnh' : 'Adjustment';
      default:
        return type;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'rent':
      case 'subscription':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'renewal':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      case 'trial':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'refund':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/80';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 w-full min-w-0">
      {/* 1. Header & Export Button */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{language === 'vi' ? 'Lịch sử giao dịch & Biến động số dư' : 'Transaction History & Balance Ledger'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 font-mono">
                {effectiveTxs.length} {language === 'vi' ? 'giao dịch' : 'entries'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi'
                ? 'Theo dõi chi tiết các giao dịch nạp tiền, chi phí thuê gói và biến động số dư tài khoản.'
                : 'Detailed ledger of wallet deposits, subscription rentals, and balance changes.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title={language === 'vi' ? 'Làm mới' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{language === 'vi' ? 'Xuất CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'vi' ? 'Số dư hiện tại' : 'Current balance'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono text-slate-900">
            {formatMoney(user?.balance || 0)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {language === 'vi' ? 'Khả dụng thanh toán' : 'Available for orders'}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'vi' ? 'Tổng nạp vào' : 'Total deposits'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono text-emerald-600">
            +{formatMoney(totalDeposited)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {language === 'vi' ? 'Nạp tiền thành công' : 'Successfully deposited'}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'vi' ? 'Tổng chi tiêu' : 'Total spent'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono text-rose-600">
            -{formatMoney(totalSpent)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {language === 'vi' ? 'Thuê panel & gia hạn' : 'Subscriptions & renewals'}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'vi' ? 'Tổng giao dịch' : 'Total transactions'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <History className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono text-slate-900">
            {effectiveTxs.length}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {language === 'vi' ? 'Bản ghi trên hệ thống' : 'Total ledger entries'}
          </p>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'vi' ? 'Tìm theo #ID, nội dung...' : 'Search by #ID or description...'}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
            { id: 'deposit', label: language === 'vi' ? 'Nạp tiền' : 'Deposits' },
            { id: 'rent', label: language === 'vi' ? 'Thuê gói' : 'Rentals' },
            { id: 'renewal', label: language === 'vi' ? 'Gia hạn' : 'Renewals' },
            { id: 'refund', label: language === 'vi' ? 'Hoàn tiền' : 'Refunds' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">#ID</th>
                <th className="py-2.5 px-3">{language === 'vi' ? 'Thời gian' : 'Timestamp'}</th>
                <th className="py-2.5 px-3 min-w-[200px]">{language === 'vi' ? 'Nội dung giao dịch' : 'Description'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'vi' ? 'Loại' : 'Type'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'vi' ? 'Số dư trước' : 'Balance before'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'vi' ? 'Biến động' : 'Amount'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'vi' ? 'Số dư sau' : 'Balance after'}</th>
                <th className="py-2.5 px-3">{language === 'vi' ? 'Phương thức' : 'Method'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="py-2.5 px-3 text-center w-12">{language === 'vi' ? 'Chi tiết' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <EmptyState
                      icon={History}
                      title={language === 'vi' ? 'Không tìm thấy giao dịch nào' : 'No transactions found'}
                      description={
                        language === 'vi'
                          ? 'Các biến động số dư từ nạp tiền, thuê panel và gia hạn sẽ xuất hiện tại đây.'
                          : 'Deposits, panel rentals, renewals, and refunds will appear here.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => {
                  const isPositive = tx.amount > 0;
                  const isZero = tx.amount === 0;
                  const balanceBeforeVal = tx.balanceBefore !== undefined ? tx.balanceBefore : (tx.balanceAfter - tx.amount);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* #ID */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200/60">
                          #{tx.id}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        <div className="font-medium text-slate-800">{new Date(tx.date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Nội dung */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={tx.description}>
                          {tx.description}
                        </div>
                        {tx.code && tx.code !== String(tx.id) && (
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            Code: {tx.code}
                          </div>
                        )}
                      </td>

                      {/* Loại */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTypeBadgeClass(tx.type)}`}>
                          {getTypeText(tx.type)}
                        </span>
                      </td>

                      {/* Số tiền ban đầu (Balance Before) */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {formatMoney(balanceBeforeVal)}
                      </td>

                      {/* Biến động số dư (+ / - Amount) */}
                      <td
                        className={`py-2.5 px-3 text-right font-bold font-mono text-xs ${
                          isZero
                            ? 'text-purple-600'
                            : isPositive
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {isZero
                          ? '0 VNĐ'
                          : isPositive
                          ? `+${formatMoney(tx.amount)}`
                          : `-${formatMoney(Math.abs(tx.amount))}`}
                      </td>

                      {/* Số tiền sau khi thay đổi (Balance After) */}
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 text-[11px]">
                        {formatMoney(tx.balanceAfter)}
                      </td>

                      {/* Phương thức */}
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[120px] truncate" title={tx.paymentMethod || ''}>
                        {tx.paymentMethod || (language === 'vi' ? 'Số dư ví' : 'Wallet balance')}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          {tx.status === 'completed'
                            ? (language === 'vi' ? 'Hoàn thành' : 'Completed')
                            : tx.status === 'pending'
                            ? (language === 'vi' ? 'Đang xử lý' : 'Pending')
                            : (language === 'vi' ? 'Thất bại' : 'Failed')}
                        </span>
                      </td>

                      {/* Biên lai */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Xem biên lai' : 'View receipt'}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Chi Tiết Biên Lai Giao Dịch */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Biên lai giao dịch điện tử' : 'Official Transaction Receipt'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      #{selectedTx.id}
                    </span>
                    {selectedTx.code && selectedTx.code !== String(selectedTx.id) && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ({selectedTx.code})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Highlight Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {language === 'vi' ? 'Biến động số dư' : 'Amount transaction'}
                </span>
                <p
                  className={`text-xl font-black font-mono ${
                    selectedTx.amount > 0 ? 'text-emerald-600' : selectedTx.amount === 0 ? 'text-purple-600' : 'text-slate-900'
                  }`}
                >
                  {selectedTx.amount > 0
                    ? `+${formatMoney(selectedTx.amount)}`
                    : selectedTx.amount === 0
                    ? '0 VNĐ (Miễn phí)'
                    : `-${formatMoney(Math.abs(selectedTx.amount))}`}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeClass(
                    selectedTx.type
                  )}`}
                >
                  {getTypeText(selectedTx.type)} • {selectedTx.status.toUpperCase()}
                </span>
              </div>

              {/* Detail Rows */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Mã định danh (#ID):' : 'Transaction ID:'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">#{selectedTx.id}</span>
                    <button
                      onClick={() => handleCopyCode(`#${selectedTx.id}`)}
                      className="text-slate-400 hover:text-blue-600 cursor-pointer"
                      title="Copy #ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400 hover:text-blue-600" />}
                    </button>
                  </div>
                </div>

                {selectedTx.code && selectedTx.code !== String(selectedTx.id) && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'vi' ? 'Mã tham chiếu (Code):' : 'Reference Code:'}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-700 text-[11px]">{selectedTx.code}</span>
                      <button
                        onClick={() => handleCopyCode(selectedTx.code!)}
                        className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Copy Code"
                      >
                        <Copy className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Thời gian giao dịch:' : 'Timestamp:'}</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {new Date(selectedTx.date).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Nội dung giao dịch:' : 'Description:'}</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[240px]">
                    {selectedTx.description}
                  </span>
                </div>

                {/* Số dư trước */}
                <div className="flex justify-between py-1.5 border-b border-slate-100 bg-slate-50/70 px-2.5 rounded-lg">
                  <span className="text-slate-600 font-medium">{language === 'vi' ? 'Số dư trước giao dịch:' : 'Balance before:'}</span>
                  <span className="font-mono font-bold text-slate-700">
                    {formatMoney(selectedTx.balanceBefore !== undefined ? selectedTx.balanceBefore : selectedTx.balanceAfter - selectedTx.amount)}
                  </span>
                </div>

                {/* Số dư sau */}
                <div className="flex justify-between py-1.5 border-b border-slate-100 bg-blue-50/50 px-2.5 rounded-lg">
                  <span className="text-blue-900 font-bold">{language === 'vi' ? 'Số dư sau giao dịch:' : 'Balance after:'}</span>
                  <span className="font-mono font-extrabold text-blue-700">
                    {formatMoney(selectedTx.balanceAfter)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Phương thức thanh toán:' : 'Payment method:'}</span>
                  <span className="font-semibold text-slate-700">{selectedTx.paymentMethod || (language === 'vi' ? 'Số dư ví' : 'Wallet balance')}</span>
                </div>

                {selectedTx.referenceCode && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'vi' ? 'Mã đối soát:' : 'Reference code:'}</span>
                    <span className="font-mono font-semibold text-slate-700">{selectedTx.referenceCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'In biên lai' : 'Print'}</span>
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

