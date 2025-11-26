import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import HomePage from './pages/client/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CarsPage from './pages/CarsPage';
import ClientsPage from './pages/ClientsPage';
import RentalsPage from './pages/RentalsPage';
import PenaltiesPage from './pages/PenaltiesPage';
import ReportsPage from './pages/ReportsPage';
import SearchPage from './pages/SearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/admin/AdminPage';
import MyRentalsPage from './pages/user/MyRentalsPage';
import MyPenaltiesPage from './pages/user/MyPenaltiesPage';
import CarDetailsPage from './pages/CarDetailsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cars"
                element={
                  <ProtectedRoute>
                    <CarsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cars/:id"
                element={
                  <ProtectedRoute>
                    <CarDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rentals"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <RentalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/penalties"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <PenaltiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-rentals"
                element={
                  <ProtectedRoute>
                    <MyRentalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-penalties"
                element={
                  <ProtectedRoute>
                    <MyPenaltiesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

