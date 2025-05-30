// frontend/src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, setError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/"; // Get redirect path or default to home

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null); // Clear previous errors
        try {
            const user = await login(username, password);
            // Redirect based on role after successful login
            const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/participant/dashboard';
            navigate(redirectTo, { replace: true });
            // navigate(from, { replace: true }); // Or redirect back to the page they were trying to access
        } catch (err) {
            // Error is already set in AuthContext, but we catch to prevent unhandled promise rejection
            console.error("Login page error catch:", err);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                        <strong className="font-bold">Erro!</strong>
                        <ul className="list-disc list-inside ml-2">
                            {Object.entries(error).map(([key, value]) => (
                                <li key={key}>{Array.isArray(value) ? value.join(', ') : value}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mb-4">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Usuário:
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoComplete="username"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha:
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-200"
                >
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <p className="text-center text-sm text-gray-600 mt-4">
                    Não tem uma conta? <a href="/register" className="text-indigo-600 hover:underline">Registre-se</a>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;

