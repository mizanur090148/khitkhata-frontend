import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  HomePage,
  AuthPage,
  FactoryLayout,
  FactoryDashboardPage,
  FactoryOrdersPage,
  FactoryOrderDetailPage,
  FactoryNewOrderPage,
  FactoryPartyPage,
  FactoryJobCardPage,
  FactoryProductionEntryPage,
  FactoryQcPage,
  FactoryReadyFabricPage,
  FactoryChallanPage,
  FactoryYarnPage,
  FactoryStorePage,
  FactoryBillPage,
  FactoryLedgerPage,
  FactoryAccountsPage,
  FactoryAttendancePage,
  FactoryMessagesPage,
  FactoryFreeMachinesPage,
  VendorOrdersPage,
  VendorReportPage,
  FactoryUsersPage,
  FactoryWhatsAppReportPage,
  FactoryPartnerPage,
  FactoryProfilePage,
  SupplierPortalPage,
} from '@/pages';
import { Toast } from '@/components/common/Toast';
import { CallModal } from '@/components/common/CallModal';
import { PrintDialog } from '@/components/common/PrintDialog';
import '@/styles/knitkhata.css';

export const ViewRedirect: React.FC = () => {
  const { view, id } = useParams<{ view?: string; id?: string }>();
  if (!view) return <Navigate to="/dashboard" replace />;
  const target = id ? `/dashboard/${view}/${id}` : `/dashboard/${view}`;
  return <Navigate to={target} replace />;
};

export const AppContent: React.FC = () => {
  const {
    toasts,
    dismissToast,
    callModal,
    closeCallModal,
    printModal,
    closePrintModal,
  } = useApp();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />

        {/* Dedicated Modern Modular Pages for Factory & Vendor Portal under FactoryLayout */}
        <Route path="/dashboard" element={<FactoryLayout />}>
          <Route index element={<FactoryDashboardPage />} />
          <Route path="dash" element={<FactoryDashboardPage />} />
          <Route path="orders" element={<FactoryOrdersPage />} />
          <Route path="orders/:id" element={<FactoryOrderDetailPage />} />
          <Route path="neworder" element={<FactoryNewOrderPage />} />
          <Route path="party" element={<FactoryPartyPage />} />
          <Route path="jobcard" element={<FactoryJobCardPage />} />
          <Route path="jobcard/:id" element={<FactoryJobCardPage />} />
          <Route path="entry" element={<FactoryProductionEntryPage />} />
          <Route path="qc" element={<FactoryQcPage />} />
          <Route path="fready" element={<FactoryReadyFabricPage />} />
          <Route path="challan" element={<FactoryChallanPage />} />
          <Route path="yarn" element={<FactoryYarnPage />} />
          <Route path="store" element={<FactoryStorePage />} />
          <Route path="bill" element={<FactoryBillPage />} />
          <Route path="billdoc" element={<FactoryBillPage />} />
          <Route path="ledger" element={<FactoryLedgerPage />} />
          <Route path="acc" element={<FactoryAccountsPage />} />
          <Route path="att" element={<FactoryAttendancePage />} />
          <Route path="fmsg" element={<FactoryMessagesPage />} />
          <Route path="freem" element={<FactoryFreeMachinesPage />} />
          <Route path="vorders" element={<VendorOrdersPage />} />
          <Route path="vreport" element={<VendorReportPage />} />
          <Route path="users" element={<FactoryUsersPage />} />
          <Route path="wa" element={<FactoryWhatsAppReportPage />} />
          <Route path="pdash" element={<FactoryPartnerPage />} />
          <Route path="profile" element={<FactoryProfilePage />} />
          <Route path="detail" element={<FactoryOrderDetailPage />} />
          <Route path="detail/:id" element={<FactoryOrderDetailPage />} />
        </Route>

        {/* Backward Compatibility & Convenience Redirects */}
        <Route path="/orders" element={<Navigate to="/dashboard/orders" replace />} />
        <Route path="/factory" element={<Navigate to="/dashboard" replace />} />
        <Route path="/factory/:view" element={<ViewRedirect />} />
        <Route path="/factory/:view/:id" element={<ViewRedirect />} />
        <Route path="/vendor" element={<Navigate to="/dashboard/vorders" replace />} />
        <Route path="/vendor/:view" element={<ViewRedirect />} />
        <Route path="/vendor/:view/:id" element={<ViewRedirect />} />
        <Route path="/supplier" element={<SupplierPortalPage />} />
        <Route path="/supplier/:view" element={<SupplierPortalPage />} />

        {/* Authentication */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Dialogs & Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <CallModal
        isOpen={callModal.isOpen}
        onClose={closeCallModal}
        title={callModal.title}
        subtitle={callModal.subtitle}
        phone={callModal.phone}
        whatsapp={callModal.whatsapp}
        name={callModal.name}
      />

      <PrintDialog
        isOpen={printModal.isOpen}
        onClose={closePrintModal}
        title={printModal.title}
        documentType={printModal.documentType}
        data={printModal.data}
      />
    </>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
