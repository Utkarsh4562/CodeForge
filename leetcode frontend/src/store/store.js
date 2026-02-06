import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../authSlice';

export const store = configureStore({
    reducer:{
        auth: authReducer
    }
});

// we are just configuring the redux store