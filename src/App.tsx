import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DemoProvider } from '@/context/DemoContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Public pages
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import AuthCallbackPage from '@/pages/public/AuthCallbackPage';
import ParticipantFormPage from '@/pages/public/ParticipantFormPage';
import SubmissionSuccessPage from '@/pages/public/SubmissionSuccessPage';

// App pages
import DashboardPage from '@/pages/app/DashboardPage';
import FormsPage from '@/pages/app/FormsPage';
import FormBuilderPage from '@/pages/app/FormBuilderPage';
import AiFormBuilderPage from '@/pages/app/AiFormBuilderPage';
import FormPreviewPage from '@/pages/app/FormPreviewPage';
import FormSharePage from '@/pages/app/FormSharePage';
import ResponsesPage from '@/pages/app/ResponsesPage';
import ParticipantProfilePage from '@/pages/app/ParticipantProfilePage';
import DocumentsPage from '@/pages/app/DocumentsPage';
import EmailCenterPage from '@/pages/app/EmailCenterPage';
import TemplatesPage from '@/pages/app/TemplatesPage';
import AnalyticsPage from '@/pages/app/AnalyticsPage';
import TeamPage from '@/pages/app/TeamPage';
import SettingsPage from '@/pages/app/SettingsPage';
import ProfilePage from '@/pages/app/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/f/:slug" element={<ParticipantFormPage />} />
              <Route path="/submission-success/:responseId" element={<SubmissionSuccessPage />} />

              {/* Convenience direct redirect */}
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />

              {/* Protected app routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="forms" element={<FormsPage />} />
                <Route path="forms/ai" element={<AiFormBuilderPage />} />
                <Route path="forms/new" element={<FormBuilderPage />} />
                <Route path="forms/:formId/edit" element={<FormBuilderPage />} />
                <Route path="forms/:formId/preview" element={<FormPreviewPage />} />
                <Route path="forms/:formId/share" element={<FormSharePage />} />
                <Route path="responses" element={<ResponsesPage />} />
                <Route path="responses/:responseId" element={<ParticipantProfilePage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="email" element={<EmailCenterPage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </DemoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
