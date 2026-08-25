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
import { SystemSettingsPage } from './components/settings/SystemSettingsPage';
import { AdminControlPage } from './components/admin/AdminControlPage';
import { AuthPages } from './components/auth/AuthPages';
import { ToastContainer } from './components/ui/Toast';

const MainRouter: React.FC = () => {
  const { currentRoute, selectedPanelForDetail, panels } = useApp();

  // Public / Landing / Auth routes
  if (currentRoute === '/' || currentRoute === '/features' || currentRoute === '/pricing' || currentRoute === '/faq') {
    return (
      <main className="min-h-screen bg-white">
        <LandingPage />
        <ToastContainer />
      </main>
    );
  }

  if (currentRoute === '/login') {
    return (
      <main className="min-h-screen bg-slate-50">
        <AuthPages mode="login" />
        <ToastContainer />
      </main>
    );
  }

  if (currentRoute === '/register') {
    return (
      <main className="min-h-screen bg-slate-50">
        <AuthPages mode="register" />
        <ToastContainer />
      </main>
    );
  }

  if (currentRoute === '/forgot-password') {
    return (
      <main className="min-h-screen bg-slate-50">
        <AuthPages mode="forgot" />
        <ToastContainer />
      </main>
    );
  }

  if (currentRoute === '/reset-password' || currentRoute.startsWith('/reset-password')) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AuthPages mode="reset" />
        <ToastContainer />
      </main>
    );
  }

  // Determine active tab for Dashboard Layout
  let activeTab = 'dashboard';
  let content = <OverviewPage />;

  if (currentRoute === '/dashboard') {
    activeTab = 'dashboard';
    content = <OverviewPage />;
  } else if (currentRoute === '/panels') {
    activeTab = 'panels';
    content = <PanelsPage />;
  } else if (currentRoute.startsWith('/panels/') || currentRoute === '/panel-detail') {
    activeTab = 'panels';
    const panelIdFromRoute = currentRoute.startsWith('/panels/')
      ? currentRoute.replace('/panels/', '')
      : selectedPanelForDetail?.id || panels[0]?.id || 'pnl-alpha-01';
    content = <PanelDetailPage panelId={panelIdFromRoute} />;
  } else if (currentRoute === '/packages') {
    activeTab = 'packages';
    content = <PackagesPage />;
  } else if (currentRoute === '/services') {
    activeTab = 'services';
    content = <ServicesPage />;
  } else if (currentRoute === '/dispatch' || currentRoute === '/order-dispatch') {
    activeTab = 'dispatch';
    content = <DispatchConfigPage />;
  } else if (currentRoute === '/add-funds') {
    activeTab = 'add-funds';
    content = <AddFundsPage />;
  } else if (currentRoute === '/subscriptions') {
    activeTab = 'subscriptions';
    content = <SubscriptionsPage />;
  } else if (currentRoute === '/transactions') {
    activeTab = 'transactions';
    content = <TransactionsPage />;
  } else if (currentRoute === '/support' || currentRoute === '/ai-support') {
    activeTab = 'support';
    content = <AiSupportPage />;
  } else if (currentRoute === '/profile' || currentRoute === '/account') {
    activeTab = 'profile';
    content = <AccountSecurityPage />;
  } else if (currentRoute === '/settings' || currentRoute === '/system-settings') {
    activeTab = 'settings';
    content = <SystemSettingsPage />;
  } else if (currentRoute === '/admin' || currentRoute.startsWith('/admin')) {
    return (
      <>
        <AdminControlPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab}>
      {content}
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
