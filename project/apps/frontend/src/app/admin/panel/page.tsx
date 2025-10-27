import { AdminPanel } from '../../../components/features/AdminPanel';
import { AdminOnly } from '../../../components/guards/RouteGuard';

export default function AdminPanelPage() {
  return (
    <AdminOnly>
      <AdminPanel />
    </AdminOnly>
  );
}
