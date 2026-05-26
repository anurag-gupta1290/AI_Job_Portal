import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

// Pages — auth
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import NotFound from '@/pages/NotFound';

// Pages — shared
import DashboardRouter from '@/pages/DashboardRouter';
import Layout from '@/components/layout/Layout';

// Pages — admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';

// Pages — seeker
import SeekerDashboard from '@/pages/seeker/SeekerDashboard';
import SeekerProfilePage from '@/pages/seeker/SeekerProfilePage';
import ApplicationsPage from '@/pages/seeker/ApplicationsPage';

// Pages — jobs (public + seeker)
import JobSearchPage from '@/pages/jobs/JobSearchPage';
import JobDetailPage from '@/pages/jobs/JobDetailPage';

// Pages — provider
import ProviderDashboard from '@/pages/provider/ProviderDashboard';
import CompanyProfilePage from '@/pages/provider/CompanyProfilePage';
import PostJobPage from '@/pages/provider/PostJobPage';
import ProviderJobsPage from '@/pages/provider/ProviderJobsPage';
import ApplicantsPage from '@/pages/provider/ApplicantsPage';
import CandidateSearchPage from '@/pages/provider/CandidateSearchPage';

// Pages — trainer
import TrainerDashboard from '@/pages/trainer/TrainerDashboard';
import CreateCoursePage from '@/pages/trainer/CreateCoursePage';
import TrainerCoursesPage from '@/pages/trainer/TrainerCoursesPage';
import CourseEnrolmentsPage from '@/pages/trainer/CourseEnrolmentsPage';
import LiveSessionPage from '@/pages/trainer/LiveSessionPage';
import AssessmentEditorPage from '@/pages/trainer/AssessmentEditorPage';

// Pages — courses (public + seeker)
import CoursesPage from '@/pages/seeker/CoursesPage';
import CourseDetailPage from '@/pages/seeker/CourseDetailPage';
import MyCoursesPage from '@/pages/seeker/MyCoursesPage';
import AssessmentPage from '@/pages/seeker/AssessmentPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* ── Public ──────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Dashboard root (role-routed) ─────────── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><DashboardRouter /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Admin ───────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <Layout><AdminUsers /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Seeker ──────────────────────────────── */}
          <Route
            path="/seeker/profile"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_SEEKER']}>
                <Layout><SeekerProfilePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_SEEKER']}>
                <Layout><ApplicationsPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Jobs (accessible to authenticated users) */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Layout><JobSearchPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <Layout><JobDetailPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Provider ─────────────────────────────── */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_PROVIDER']}>
                <Layout><ProviderDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/company"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_PROVIDER']}>
                <Layout><CompanyProfilePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/jobs/new"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_PROVIDER']}>
                <Layout><PostJobPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/jobs/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_PROVIDER']}>
                <Layout><PostJobPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/jobs"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_PROVIDER']}>
                <Layout><ProviderJobsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/jobs/:jobId/applications"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_PROVIDER']}>
                <Layout><ApplicantsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/candidates"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_PROVIDER']}>
                <Layout><CandidateSearchPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Trainer ──────────────────────────────── */}
          <Route
            path="/trainer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ROLE_TRAINING_PROVIDER']}>
                <Layout><TrainerDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/courses"
            element={
              <ProtectedRoute allowedRoles={['ROLE_TRAINING_PROVIDER']}>
                <Layout><TrainerCoursesPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/courses/new"
            element={
              <ProtectedRoute allowedRoles={['ROLE_TRAINING_PROVIDER']}>
                <Layout><CreateCoursePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/courses/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ROLE_TRAINING_PROVIDER']}>
                <Layout><CreateCoursePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/courses/:courseId/enrolments"
            element={
              <ProtectedRoute allowedRoles={['ROLE_TRAINING_PROVIDER']}>
                <Layout><CourseEnrolmentsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/courses/:courseId/sessions"
            element={
              <ProtectedRoute allowedRoles={['ROLE_TRAINING_PROVIDER']}>
                <Layout><LiveSessionPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/courses/:courseId/assessment"
            element={
              <ProtectedRoute allowedRoles={['ROLE_TRAINING_PROVIDER']}>
                <Layout><AssessmentEditorPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Courses (public browsing + seeker enrolment) ── */}
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Layout><CoursesPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <Layout><CourseDetailPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_SEEKER']}>
                <Layout><MyCoursesPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id/assessment"
            element={
              <ProtectedRoute allowedRoles={['ROLE_JOB_SEEKER']}>
                <Layout><AssessmentPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Fallbacks ───────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
