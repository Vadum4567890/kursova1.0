import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RentalChatSocketProvider } from './context/RentalChatSocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/client/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import TermsPage from './pages/TermsPage';
import DashboardPage from './pages/DashboardPage';
import CarsPage from './pages/CarsPage';
import RentalsPage from './pages/RentalsPage';
import DisputesPage from './pages/DisputesPage';
import PenaltiesPage from './pages/PenaltiesPage';
import ReportsPage from './pages/ReportsPage';
import SearchPage from './pages/SearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/admin/AdminPage';
import MyRentalsPage from './pages/user/MyRentalsPage';
import MyPenaltiesPage from './pages/user/MyPenaltiesPage';
import MyCarsPage from './pages/owner/MyCarsPage';
import CarDetailsPage from './pages/CarDetailsPage';
import CarChatPage from './pages/CarChatPage';
import ChatsHubPage from './pages/ChatsHubPage';
import TermsAndRulesPage from './pages/TermsAndRulesPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RentalChatSocketProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="terms-and-rules" element={<TermsAndRulesPage />} />
            </Route>

            <Route element={<Layout />}>
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
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
                path="/chats"
                element={
                  <ProtectedRoute>
                    <ChatsHubPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cars/:id/chat"
                element={
                  <ProtectedRoute>
                    <CarChatPage />
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
                path="/my-cars"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'both', 'admin', 'manager']}>
                    <MyCarsPage />
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
                path="/disputes"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <DisputesPage />
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
            </Route>
          </Routes>
        </Router>
        </RentalChatSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
