import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../utils/axiosClient';

// Register user
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register', userData);
      
      // ✅ TOKEN SAVE
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('✅ Token saved after registration');
      }
      
      return response.data.user || userData;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/login',
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', loginData);
      
      // ✅ TOKEN SAVE
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('✅ Token saved to localStorage');
      } else {
        console.warn('⚠️ No token in response:', response.data);
      }
      
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Check auth
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/check');
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/user/logout');
      localStorage.removeItem('token');  // ✅ REMOVE TOKEN
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // register user cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })

      // login user cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })

      // check auth cases
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })

      // logout user cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export default authSlice.reducer;