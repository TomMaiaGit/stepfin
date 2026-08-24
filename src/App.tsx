import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Loading } from "./components/Ui";
import { useAuth } from "./state/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TransactionsPage, NewTransactionPage } from "./pages/TransactionsPage";
import { SimpleModulePage } from "./pages/SimpleModulePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { AiAssistantPage } from "./pages/AiAssistantPage";
function Protected() {
  const { user, membership, loading } = useAuth(); const location = useLocation();
  if (loading) return <Loading/>; if (!user) return <Navigate to="/login" state={{from:location}} replace/>;
  if (!membership && !["/onboarding","/accept-invite"].includes(location.pathname)) return <Navigate to="/onboarding" replace/>;
  return <AppShell/>;
}
export function App() { return <Routes>
  <Route path="/login" element={<LoginPage/>}/><Route element={<Protected/>}>
    <Route path="/onboarding" element={<OnboardingPage/>}/><Route path="/accept-invite" element={<AcceptInvitePage/>}/>
    <Route path="/dashboard" element={<DashboardPage/>}/><Route path="/transactions" element={<TransactionsPage/>}/>
    <Route path="/transactions/new" element={<NewTransactionPage/>}/><Route path="/cards" element={<SimpleModulePage module="cards"/>}/>
    <Route path="/fixed-expenses" element={<SimpleModulePage module="fixed-expenses"/>}/><Route path="/bills" element={<SimpleModulePage module="bills"/>}/>
    <Route path="/caixinhas" element={<SimpleModulePage module="caixinhas"/>}/><Route path="/caixinhas/:id" element={<SimpleModulePage module="caixinha-detail"/>}/>
    <Route path="/reports" element={<SimpleModulePage module="reports"/>}/><Route path="/members" element={<SimpleModulePage module="members"/>}/>
    <Route path="/notifications" element={<SimpleModulePage module="notifications"/>}/><Route path="/import-spreadsheet" element={<SimpleModulePage module="import"/>}/>
    <Route path="/ai-assistant" element={<AiAssistantPage/>}/><Route path="/settings" element={<SettingsPage/>}/>
  </Route><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes>; }
