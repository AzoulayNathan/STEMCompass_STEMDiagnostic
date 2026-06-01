import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Learners from './pages/Learners';
import LearnerProfile from './pages/LearnerProfile';
import NewDiagnostic from './pages/NewDiagnostic';
import DiagnosticSession from './pages/DiagnosticSession';
import DiagnosticResults from './pages/DiagnosticResults';
import TeacherDiagnosticOverview from './pages/TeacherDiagnosticOverview';
import SessionEntry from './pages/SessionEntry';
import DiagnosticSessionComplete from './pages/DiagnosticSessionComplete';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const ProtectedRoutes = () => {
  const { isLoadingAuth, isAuthenticated, authChecked, navigateToLogin } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/learners" element={<Learners />} />
        <Route path="/learners/:learnerId" element={<LearnerProfile />} />
        <Route path="/diagnostics/new" element={<NewDiagnostic />} />
        <Route path="/diagnostics/:diagnosticId/results" element={<DiagnosticResults />} />
        <Route path="/diagnostics/:diagnosticId/overview" element={<TeacherDiagnosticOverview />} />
        <Route path="/session/complete" element={<DiagnosticSessionComplete />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/session/:token" element={<SessionEntry />} />
            <Route path="/diagnostics/:diagnosticId/session" element={<DiagnosticSession />} />
            <Route path="/*" element={<ProtectedRoutes />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App
