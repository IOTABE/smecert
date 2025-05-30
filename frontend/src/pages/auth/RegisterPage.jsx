// frontend/src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const { register, loading, error, setError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null); // Clear previous errors

        if (password !== passwordConfirm) {
            setError({ password: ['As senhas não coincidem.'] });
            return;
        }

        const userData = {
            username,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            // Role will be set to 'participant' by default in the backend serializer
        };

        try {
            await register(userData);
            // Registration successful, redirect to login page
            navigate('/login', { state: { message: 'Registro realizado com sucesso! Faça login para continuar.' } });
        } catch (err) {
            // Error is already set in AuthContext
            console.error("Register page error catch:", err);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Registrar Nova Conta</h2>
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                        <strong className="font-bold">Erro no Registro!</strong>
                        <ul className="list-disc list-inside ml-2">
                            {/* Display backend validation errors */} 
                            {Object.entries(error).map(([key, value]) => (
                                <li key={key}>{key}: {Array.isArray(value) ? value.join(', ') : value}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Nome:</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Sobrenome:</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label htmlFor="usernameReg" className="block text-sm font-medium text-gray-700 mb-1">Usuário:</label>
                    <input
                        type="text"
                        id="usernameReg"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoComplete="username"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="emailReg" className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                    <input
                        type="email"
                        id="emailReg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoComplete="email"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="passwordReg" className="block text-sm font-medium text-gray-700 mb-1">Senha:</label>
                    <input
                        type="password"
                        id="passwordReg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoComplete="new-password"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha:</label>
                    <input
                        type="password"
                        id="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoComplete="new-password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-200"
                >
                    {loading ? 'Registrando...' : 'Registrar'}
                </button>
                <p className="text-center text-sm text-gray-600 mt-4">
                    Já tem uma conta? <a href="/login" className="text-indigo-600 hover:underline">Faça login</a>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;

