// frontend/src/services/api.js
import axios from 'axios';

// Determine the base URL for the API
// In development, it might be http://localhost:8000/api/
// In production, it will be the deployed backend URL
const API_BASE_URL = 'http://localhost:8000/api'; // Use environment variable

const apiService = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// --- Axios Interceptors for JWT Token Handling --- 

// Request interceptor to add the Authorization header
apiService.interceptors.request.use(
    config => {
        // Retrieve the access token from local storage (or context/state management)
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor (optional): Handle token expiration or other global errors
apiService.interceptors.response.use(
    response => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return response;
    },
    async error => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors (e.g., token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark request to prevent infinite loops

            try {
                // Attempt to refresh the token
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    // No refresh token available, redirect to login
                    console.error("No refresh token, redirecting to login.");
                    // window.location.href = '/login'; // Or use React Router navigate
                    return Promise.reject(error);
                }

                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken
                });

                const newAccessToken = response.data.access;
                // const newRefreshToken = response.data.refresh; // Optional: update refresh token if rotated

                localStorage.setItem('access_token', newAccessToken);
                // if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);

                // Update the Authorization header for the original request
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Retry the original request
                return apiService(originalRequest);

            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                // Clear tokens and redirect to login if refresh fails
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                // window.location.href = '/login'; // Or use React Router navigate
                return Promise.reject(refreshError);
            }
        }

        // For other errors, just reject the promise
        return Promise.reject(error);
    }
);


// --- Specific Service Functions (can be moved to separate files like authService.js, eventService.js) ---

export const loginUser = async (credentials) => {
    try {
        const response = await apiService.post('/token/', credentials);
        // Save tokens upon successful login
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        // Fetch user profile after login
        // const userProfile = await fetchUserProfile(); 
        // return { user: userProfile, ...response.data };
        return response.data; // Return token data
    } catch (error) {
        console.error("Login failed:", error.response?.data);
        throw error; // Re-throw error to be handled by the component
    }
};

export const registerUser = async (userData) => {
    try {
        // The backend CustomUserViewSet handles creation
        const response = await apiService.post('/users/', userData);
        return response.data;
    } catch (error) {
        console.error("Registration failed:", error.response?.data);
        throw error;
    }
};

export const fetchUserProfile = async () => {
    try {
        const response = await apiService.get('/users/me/');
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user profile:", error.response?.data);
        throw error;
    }
};

export const logoutUser = () => {
    // Simple logout: just remove tokens from storage
    // For more security, implement token blacklisting on the backend
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Optionally call a backend logout endpoint if it exists (e.g., to blacklist refresh token)
};

// Add other functions for events, participants, attendance, certificates...
// Example:
export const fetchCertificates = async () => {
    try {
        const response = await apiService.get('/certificates/');
        return response.data.results || response.data; // Handle pagination
    } catch (error) {
        console.error("Failed to fetch certificates:", error.response?.data);
        throw error;
    }
};

export const downloadCertificatePdf = async (certificateId) => {
     try {
        const response = await apiService.get(`/certificates/${certificateId}/download_pdf/`, {
            responseType: 'blob', // Important for file download
        });
        return response.data; // Return the blob data
    } catch (error) {
        console.error("Failed to download certificate:", error.response?.data);
        throw error;
    }
};

export const validateCertificateCode = async (uniqueCode) => {
    try {
        const response = await apiService.post('/certificates/validate/', { unique_code: uniqueCode });
        return response.data;
    } catch (error) {
        console.error("Certificate validation failed:", error.response?.data);
        // Return a specific structure even on error for the component to handle
        throw error.response?.data || { error: 'Erro desconhecido na validação.' }; 
    }
};

export const performCheckin = async (checkinData) => {
    // checkinData should include { event_id, qr_code_data, latitude?, longitude? }
    try {
        const response = await apiService.post('/attendances/check-in/', checkinData);
        return response.data;
    } catch (error) {
        console.error("Check-in failed:", error.response?.data);
        throw error.response?.data || { error: 'Erro desconhecido no check-in.' };
    }
};

export const performCheckout = async (attendanceId) => {
    try {
        // Assuming checkout uses the detail route: /attendances/{id}/check-out/
        const response = await apiService.post(`/attendances/${attendanceId}/check-out/`);
        return response.data;
    } catch (error) {
        console.error("Check-out failed:", error.response?.data);
        throw error.response?.data || { error: 'Erro desconhecido no check-out.' };
    }
};


export default apiService; // Export the configured axios instance

