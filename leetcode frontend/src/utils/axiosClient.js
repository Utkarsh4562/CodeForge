import axios from "axios";

const axiosClient = axios.create({
   baseURL: 'https://codeforge-3nac.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor for adding auth token
axiosClient.interceptors.request.use(
    (config) => {
        // Try multiple sources for token
        let token = localStorage.getItem('token');
        
        if (!token) {
            // Try sessionStorage
            token = sessionStorage.getItem('token');
        }
        
        if (!token) {
            // Try cookies
            const tokenCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='));
            if (tokenCookie) {
                token = tokenCookie.split('=')[1];
            }
        }
        
        // Debug: Log if we found a token
        if (token) {
            console.log('✅ Token found, adding to headers');
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.log('❌ No token found in localStorage, sessionStorage, or cookies');
        }
        
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
axiosClient.interceptors.response.use(
    (response) => {
        console.log('✅ Response received:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });
        
        // Don't redirect on 401 for now, just show error
        if (error.response?.status === 401) {
            console.log('⚠️ 401 Unauthorized - Token might be invalid or expired');
            // Remove invalid token
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        }
        
        return Promise.reject(error);
    }
);

export default axiosClient;