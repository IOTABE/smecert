// frontend/src/routes.js
import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation, Link, NavLink } from 'react-router-dom'; // Adicionado NavLink
import { useAuth } from './contexts/AuthContext'; 
import LoginPage from './pages/auth/LoginPage'; 
import RegisterPage from './pages/auth/RegisterPage';
import ParticipantCheckinPage from './pages/participant/ParticipantCheckinPage';
import ParticipantCertificatesPage from './pages/participant/ParticipantCertificatesPage';
import CertificateValidationPage from './pages/public/CertificateValidationPage';

// --- Admin Page Imports ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminParticipantsPage from './pages/admin/AdminParticipantsPage';
import AdminAttendancePage from './pages/admin/AdminAttendancePage';

// --- Layout Components ---
const PublicLayout = () => <div className="min-h-screen bg-gray-100"><Outlet /></div>;
const AuthLayout = () => <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-4"><Outlet /></div>;

const AdminLayout = () => {
    const { logout } = useAuth();
    const navLinkClasses = ({ isActive }) => 
        `block px-4 py-2 rounded-md hover:bg-red-600 transition-colors ${isActive ? 'bg-red-700 font-semibold' : 'bg-red-800'}`;

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-red-700 text-white p-4 shadow-md flex justify-between items-center">
                <Link to="/admin/dashboard" className="font-bold text-xl">Painel Admin</Link>
                <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm">Sair</button>
            </nav>
            <div className="flex flex-1">
                <aside className="w-64 bg-red-800 text-white p-4 space-y-2">
                    <NavLink to="/admin/dashboard" className={navLinkClasses}>Dashboard</NavLink>
                    <NavLink to="/admin/events" className={navLinkClasses}>Eventos</NavLink>
                    <NavLink to="/admin/participants" className={navLinkClasses}>Participantes</NavLink>
                    <NavLink to="/admin/attendance" className={navLinkClasses}>Frequência</NavLink>
                </aside>
                <main className="flex-1 p-6 bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const ParticipantLayout = () => {
    const { logout } = useAuth();
    // Adicione NavLink aqui também se desejar um estilo ativo para os links do participante
    const navLinkClasses = ({ isActive }) => 
        `block px-4 py-2 rounded-md hover:bg-green-600 transition-colors ${isActive ? 'bg-green-700 font-semibold' : ''}`;

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-green-700 text-white p-4 shadow-md flex justify-between items-center">
                <Link to="/participant/dashboard" className="font-bold text-xl">Área do Participante</Link>
                <button onClick={logout} className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm">Sair</button>
            </nav>
            <div className="flex flex-1">
                {/* Exemplo de barra lateral para Participante, se necessário */}
                {/* <aside className="w-64 bg-green-800 text-white p-4 space-y-2">
                    <NavLink to="/participant/dashboard" className={navLinkClasses}>Meu Painel</NavLink>
                    <NavLink to="/participant/events" className={navLinkClasses}>Meus Eventos</NavLink>
                    <NavLink to="/participant/certificates" className={navLinkClasses}>Meus Certificados</NavLink>
                </aside> */}
                <main className="flex-1 p-6 bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}; 

// --- Page Components ---
const HomePage = () => (
    <div className="text-center p-10">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Gerenciador de Eventos</h1>
        <p className="mb-4">Faça login ou registre-se para continuar.</p>
        <div className="space-x-4">
            <Link to="/login" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200">
                Login
            </Link>
            <Link to="/register" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200">
                Registrar
            </Link>
        </div>
    </div>
);

// Removidos os componentes inline AdminDashboard, AdminEventsPage, etc., pois agora são importados.
// const AdminDashboard = () => <h2 className="text-2xl font-semibold">Dashboard Admin</h2>;
// ... e os outros

const ParticipantDashboard = () => <h2 className="text-2xl font-semibold">Dashboard Participante</h2>; // Considere mover para src/pages/participant
const ParticipantEventsPage = () => <h2 className="text-2xl font-semibold">Meus Eventos (Participante)</h2>; // Considere mover para src/pages/participant


// --- ProtectedRoute Component ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation(); 

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>; 
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        console.warn(`Acesso negado para o papel: ${user?.role}. Requerido: ${allowedRoles.join(' ou ')}`);
        const redirectTo = user?.role === 'admin' ? '/admin/dashboard' : 
                           user?.role === 'participant' ? '/participant/dashboard' : '/';
        return <Navigate to={redirectTo} replace />;
    }
    return children;
};

// --- AppRoutes Definition ---
const AppRoutes = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Verificando autenticação...</p></div>;
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/validate-certificate" element={<CertificateValidationPage />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
                <Route 
                    path="/login" 
                    element={
                        isAuthenticated ? (
                            user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
                            user?.role === 'participant' ? <Navigate to="/participant/dashboard" replace /> :
                            <Navigate to="/" replace /> 
                        ) : (
                            <LoginPage />
                        )
                    } 
                />
                <Route 
                    path="/register" 
                    element={
                        isAuthenticated ? (
                            user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
                            user?.role === 'participant' ? <Navigate to="/participant/dashboard" replace /> :
                            <Navigate to="/" replace />
                        ) : (
                            <RegisterPage />
                        )
                    } 
                />
            </Route>

            {/* Admin Routes */}
            <Route 
                path="/admin" 
                element={(
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                )}
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="events" element={<AdminEventsPage />} />
                <Route path="participants" element={<AdminParticipantsPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} /> {/* Esta rota já existe */}
            </Route>

            {/* Participant Routes */}
            <Route 
                path="/participant" 
                element={(
                    <ProtectedRoute allowedRoles={['participant']}>
                        <ParticipantLayout />
                    </ProtectedRoute>
                )}
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ParticipantDashboard />} /> {/* Considere mover para src/pages/participant */}
                <Route path="events" element={<ParticipantEventsPage />} /> {/* Considere mover para src/pages/participant */}
                <Route path="check-in" element={<ParticipantCheckinPage />} />
                <Route path="certificates" element={<ParticipantCertificatesPage />} />
            </Route>

            {/* Catch-all for 404 Not Found */}
            <Route path="*" element={<div className="text-center p-10"><h1>404 - Página Não Encontrada</h1></div>} />
        </Routes>
    );
};

export default AppRoutes;

