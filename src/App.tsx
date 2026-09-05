import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OverviewPage } from './components/dashboard/OverviewPage';
import { PanelsPage } from './components/panels/PanelsPage';
import { PanelDetailPage } from './components/panels/PanelDetailPage';
import { PackagesPage } from './components/packages/PackagesPage';
import { ServicesPage } from './components/services/ServicesPage';
import { AddFundsPage } from './components/billing/AddFundsPage';
import { DispatchConfigPage } from './components/dispatch/DispatchConfigPage';
import { SubscriptionsPage } from './components/billing/SubscriptionsPage';
import { TransactionsPage } from './components/billing/TransactionsPage';
import { AiSupportPage } from './components/support/AiSupportPage';
import { AccountSecurityPage } from './components/profile/AccountSecurityPage';
import { AdminControlPage } from './components/admin/AdminControlPage';
import { AuthPages } from './components/auth/AuthPages';
import { ToastContainer } from './components/ui/Toast';
import { LiveChatWidget } from './components/support/LiveChatWidget';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const AdminRedirectLoader: React.FC<{ language: string }> = ({ language }) => {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-blue-500/20 animate-ping opacity-75 duration-1000" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center shadow-xl shadow-blue-500/30">
            <ShieldCheck className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {language === 'vi' ? 'Đang Kiểm Tra Quyền Quản Trị' : 'Verifying Admin Permissions'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {language === 'vi'
              ? 'Tài khoản của bạn không thuộc nhóm Quản trị viên (Admin). Đang chuyển hướng bạn về Bảng điều khiển...'
              : 'Your account does not have Admin privileges. Redirecting you to your user dashboard...'}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{language === 'vi' ? 'Đang chuyển hướng tới /dashboard...' : 'Redirecting to /dashboard...'}</span>
          </div>

          <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse w-full" />
          </div>
        </div>
      </div>
    </main>
  );
};

const MainRouter: React.FC = () => {
  const { currentRoute, setCurrentRoute, selectedPanelForDetail, panels, user, authLoading, language, addToast } = useApp();

  // 1. Kiểm tra Token từ localStorage auth_session
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('auth_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    } catch {
      return null;
    }
  };

  const token = getAuthToken();
  const isAuthenticated = Boolean(token);

  // 2. Danh sách các Public Routes (Cho phép xem khi chưa đăng nhập)
  const isLandingRoute =
    currentRoute === '/' ||
    currentRoute.startsWith('/#') ||
    currentRoute === '/features' ||
    currentRoute === '/pricing' ||
    currentRoute === '/ai-support' ||
    currentRoute === '/operations' ||
    currentRoute === '/faq';

  const isAuthRoute =
    currentRoute === '/login' ||
    currentRoute === '/register' ||
    currentRoute === '/forgot-password' ||
    currentRoute === '/reset-password' ||
    currentRoute.startsWith('/reset-password');

  // HIỆU ỨNG ĐIỀU HƯỚNG TỰ ĐỘNG (AUTOMATIC ROUTE GUARDS)
  React.useEffect(() => {
    if (authLoading) return;

    // A. NẾU ĐÃ ĐĂNG NHẬP (isAuthenticated = true)
    if (isAuthenticated) {
      // 1. Khi truy cập Landing page hoặc Auth page -> Tự động chuyển hướng vào Trang chủ (/dashboard)
      if (isLandingRoute || isAuthRoute) {
        setCurrentRoute('/dashboard');
        return;
      }

      // 2. Không chuyển hướng khi đổi ngôn ngữ / tiền tệ hoặc khi đang thao tác trên admin
      if (currentRoute === '/admin' || currentRoute.startsWith('/admin')) {
        // Cho phép truy cập và thao tác mọi tính năng trên admin
      }
    } else {
      // B. NẾU CHƯA ĐĂNG NHẬP (isAuthenticated = false)
      // Khi truy cập các trang nội bộ (không phải landing & không phải auth) -> Tự động chuyển về /login
      if (!isLandingRoute && !isAuthRoute) {
        setCurrentRoute('/login');
      }
    }
  }, [currentRoute, user, isAuthenticated, authLoading, isLandingRoute, isAuthRoute]);

  // Khi đang tải xác thực ban đầu với token đã lưu -> Giữ màn hình khởi động mượt mà, hiển thị Loading...
  if (authLoading && isAuthenticated && !isLandingRoute && !isAuthRoute) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3.5 animate-in fade-in duration-150">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <RefreshCw className="w-5 h-5 animate-spin text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-600 tracking-wider">
            {language === 'vi' ? 'Loading...' : 'Loading...'}
          </span>
        </div>
      </main>
    );
  }

  // 1. NẾU CHƯA ĐĂNG NHẬP (isAuthenticated = false)
  if (!isAuthenticated) {
    if (isLandingRoute) {
      return (
        <main className="min-h-screen bg-white">
          <LandingPage />
          <LiveChatWidget />
          <ToastContainer />
        </main>
      );
    }

    if (currentRoute === '/register') {
      return (
        <main className="min-h-screen bg-slate-50">
          <AuthPages mode="register" />
          <LiveChatWidget />
          <ToastContainer />
        </main>
      );
    }

    if (currentRoute === '/forgot-password') {
      return (
        <main className="min-h-screen bg-slate-50">
          <AuthPages mode="forgot" />
          <LiveChatWidget />
          <ToastContainer />
        </main>
      );
    }

    if (currentRoute === '/reset-password' || currentRoute.startsWith('/reset-password')) {
      return (
        <main className="min-h-screen bg-slate-50">
          <AuthPages mode="reset" />
          <LiveChatWidget />
          <ToastContainer />
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-slate-50">
        <AuthPages mode="login" />
        <LiveChatWidget />
        <ToastContainer />
      </main>
    );
  }

  let content = <OverviewPage />;
  let activeTab = 'overview';

  if (currentRoute === '/admin' || currentRoute.startsWith('/admin')) {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return <AdminRedirectLoader language={language} />;
    }
    return (
      <>
        <AdminControlPage />
        <ToastContainer />
      </>
    );
  } else if (currentRoute === '/panels' || currentRoute === '/my-panels') {
    activeTab = 'panels';
    content = <PanelsPage />;
  } else if (currentRoute.startsWith('/panels/') || currentRoute === '/panel-detail') {
    activeTab = 'panels';
    const panelIdFromRoute = currentRoute.startsWith('/panels/')
      ? currentRoute.replace('/panels/', '')
      : selectedPanelForDetail?.id || panels[0]?.id || 'pnl-alpha-01';
    content = <PanelDetailPage panelId={panelIdFromRoute} />;
  } else if (currentRoute === '/packages' || currentRoute === '/plans') {
    activeTab = 'packages';
    content = <PackagesPage />;
  } else if (currentRoute === '/services') {
    activeTab = 'services';
    content = <ServicesPage />;
  } else if (currentRoute === '/add-funds' || currentRoute === '/deposit') {
    activeTab = 'billing';
    content = <AddFundsPage />;
  } else if (currentRoute === '/dispatch' || currentRoute === '/orders') {
    activeTab = 'dispatch';
    content = <DispatchConfigPage />;
  } else if (currentRoute === '/subscriptions') {
    activeTab = 'subscriptions';
    content = <SubscriptionsPage />;
  } else if (currentRoute === '/transactions' || currentRoute === '/invoices') {
    activeTab = 'transactions';
    content = <TransactionsPage />;
  } else if (currentRoute === '/support' || currentRoute === '/ai-support' || currentRoute === '/tickets') {
    activeTab = 'support';
    content = <AiSupportPage />;
  } else if (currentRoute === '/profile' || currentRoute === '/account') {
    activeTab = 'profile';
    content = <AccountSecurityPage />;
  }

  return (
    <DashboardLayout activeTab={activeTab}>
      {content}
      <LiveChatWidget />
      <ToastContainer />
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
