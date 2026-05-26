import { useAuthStore } from '@/store/authStore';
import SeekerDashboard from './seeker/SeekerDashboard';
import ProviderDashboard from './provider/ProviderDashboard';
import TrainerDashboard from './trainer/TrainerDashboard';
import AdminDashboard from './admin/AdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'ROLE_JOB_SEEKER':
      return <SeekerDashboard />;
    case 'ROLE_JOB_PROVIDER':
      return <ProviderDashboard />;
    case 'ROLE_TRAINING_PROVIDER':
      return <TrainerDashboard />;
    case 'ROLE_ADMIN':
      return <AdminDashboard />;
    default:
      return <p className="text-gray-500">Loading...</p>;
  }
}
