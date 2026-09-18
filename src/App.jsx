import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WorkOrders from './pages/WorkOrders.jsx';
import WorkOrderDetail from './pages/WorkOrderDetail.jsx';
import ReportFault from './pages/ReportFault.jsx';
import EquipmentList from './pages/EquipmentList.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Parts from './pages/Parts.jsx';
import Users from './pages/Users.jsx';
import Profile from './pages/Profile.jsx';
import FaultCategories from './pages/FaultCategories.jsx';

export default function App() {
  const { user, booting } = useAuth();

  if (booting) {
    return <div className="boot"><span className="spinner" /> Restoring your session…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="equipment" element={<EquipmentList />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="profile" element={<Profile />} />

          {/* Role-scoped routes. The server enforces the same rules; this only
              stops a user from landing on a page that would 403 anyway. */}
          <Route element={<ProtectedRoute roles={['head', 'admin']} />}>
            <Route path="report" element={<ReportFault />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin', 'tech']} />}>
            <Route path="parts" element={<Parts />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="users" element={<Users />} />
            <Route path="fault-categories" element={<FaultCategories />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
