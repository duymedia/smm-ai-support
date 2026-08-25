import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  Building2,
  Coins,
  DollarSign,
  QrCode,
  Copy,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const AddFundsPage: React.FC = () => {
  const { user, addFunds, formatMoney, currency, addToast, t } = useApp();

  const [amount, setAmount] = useState<number>(50);
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'vietqr' | 'paypal' | 'crypto'>('vietqr');
  const [loading, setLoading] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(true);

  const presets = [25, 50, 100, 250, 500];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      addToast('error', 'Please enter a valid deposit amount.');
      return;
    }

    setLoading(true);
    try {
      await addFunds(amount, selectedMethod);
      addToast('success', `Deposit of ${formatMoney(amount)} successfully credited.`);
    } catch (e) {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', t('common.copied'));
  };

  const bonusAmount = amount >= 100 ? amount * 0.05 : 0;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('addFunds.title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('addFunds.subtitle')}</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-slate-500 block">{t('addFunds.currentBalance')}</span>
          <span className="text-xl font-black text-slate-900">{formatMoney(user?.balance || 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form & Method Selection */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Deposit Amount Selector */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <label className="block text-xs font-bold text-slate-900">
              1. Choose Top-Up Amount
            </label>

            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    amount === p
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                $
              </span>
              <input
                type="number"
                min="5"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Custom amount (USD)"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Bonus Banner */}
            {amount >= 100 ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  5% High-Volume Bonus Applied
                </span>
                <span className="font-bold text-emerald-700">+{formatMoney(bonusAmount)} Free Credit</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Deposit $100 or more to receive an instant 5% bonus.
              </p>
            )}
          </div>

          {/* 2. Payment Method Selector */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <label className="block text-xs font-bold text-slate-900">
              2. Select Payment Gateway
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* VietQR */}
              <button
                type="button"
                onClick={() => setSelectedMethod('vietqr')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'vietqr'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 font-bold text-blue-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Instant 24/7
                  </span>
                </div>
                <span className="text-xs block">VietQR Bank Transfer</span>
                <span className="text-[10px] text-slate-500 font-normal">MB Bank, VCB, Techcombank</span>
              </button>

              {/* Stripe Credit Card */}
              <button
                type="button"
                onClick={() => setSelectedMethod('stripe')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'stripe'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 font-bold text-blue-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Global
                  </span>
                </div>
                <span className="text-xs block">Credit / Debit Card</span>
                <span className="text-[10px] text-slate-500 font-normal">Visa, Mastercard via Stripe</span>
              </button>

              {/* Crypto USDT */}
              <button
                type="button"
                onClick={() => setSelectedMethod('crypto')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'crypto'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 font-bold text-blue-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    0% Fee
                  </span>
                </div>
                <span className="text-xs block">Crypto (USDT / BTC)</span>
                <span className="text-[10px] text-slate-500 font-normal">TRC20, ERC20, BEP20</span>
              </button>

              {/* PayPal */}
              <button
                type="button"
                onClick={() => setSelectedMethod('paypal')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'paypal'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 font-bold text-blue-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <DollarSign className="w-5 h-5 text-blue-700" />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Secure
                  </span>
                </div>
                <span className="text-xs block">PayPal Express</span>
                <span className="text-[10px] text-slate-500 font-normal">Fast checkout worldwide</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Instant Transfer Instructions & QR Display */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Transfer Details</span>
              <span className="text-xs font-extrabold text-blue-600">{formatMoney(amount)}</span>
            </div>

            {/* VietQR View */}
            {selectedMethod === 'vietqr' && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                  {/* Clean SVG Mock QR */}
                  <div className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-slate-900" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 mt-2">Auto-Crediting VietQR</span>
                  <span className="text-[10px] text-slate-500">Scan via Vietcombank, MB, Momo, Techcombank</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">Bank:</span>
                    <span className="font-bold text-slate-900">MB Bank (Military Bank)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">Account No:</span>
                    <button
                      onClick={() => handleCopy('999888777666')}
                      className="font-mono font-bold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      999888777666 <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-500">Memo Code:</span>
                    <button
                      onClick={() => handleCopy(`NEXUS ${user?.id || '982'}`)}
                      className="font-mono font-bold text-emerald-600 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      NEXUS {user?.id || '982'} <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Crypto View */}
            {selectedMethod === 'crypto' && (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-700 block">USDT (TRC20 Network)</span>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 mt-2 font-mono text-[10px] break-all">
                    TQ8nUo2hXF2b4B5hM3mJ59Pz8kLqW7eRtY
                  </div>
                  <button
                    onClick={() => handleCopy('TQ8nUo2hXF2b4B5hM3mJ59Pz8kLqW7eRtY')}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy Address
                  </button>
                </div>
              </div>
            )}

            {/* Stripe / PayPal View */}
            {(selectedMethod === 'stripe' || selectedMethod === 'paypal') && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p>You will be securely routed through 256-bit encrypted checkout to complete this transaction.</p>
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Instant Wallet Settlement
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : `Confirm Deposit of ${formatMoney(amount)}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
