// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService, { loginUser, registerUser, logoutUser, fetchUserProfile } from '../services/api'; // Assuming api.js exports these

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Check initial auth status
    const [error, setError] = useState(null);

    // Check authentication status on initial load
    useEffect(() => {
        const checkAuthStatus = async () => {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (accessToken && refreshToken) {
                try {
                    // Verify token validity by fetching user profile
                    const profile = await fetchUserProfile();
                    setUser(profile);
                } catch (err) {
                    console.error("Auth check failed:", err);
                    // Token might be invalid or expired, try refreshing or clear
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        checkAuthStatus();
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            await loginUser({ username, password });
            // After successful login, fetch user profile to update state
            const profile = await fetchUserProfile();
            setUser(profile);
            setLoading(false);
            return profile; // Return user profile on success
        } catch (err) {
            console.error("Login context error:", err);
            setError(err.response?.data || { detail: 'Falha no login. Verifique suas credenciais.' });
            setUser(null);
            setLoading(false);
            throw err; // Re-throw for the component
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            // Assuming registerUser just creates the user
            const newUser = await registerUser(userData);
            // Optionally log the user in automatically after registration
            // await login(userData.username, userData.password);
            setLoading(false);
            return newUser; // Return newly created user data
        } catch (err) {
            console.error("Register context error:", err);
            setError(err.response?.data || { detail: 'Falha no registro.' });
            setLoading(false);
            throw err; // Re-throw for the component
        }
    };

    const logout = () => {
        logoutUser(); // Clears tokens from storage via apiService
        setUser(null);
        // Redirect to login or home page using navigate from react-router-dom if needed
    };

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        logout,
        setError // Allow components to clear errors
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};

