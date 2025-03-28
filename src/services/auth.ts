import api from './api';
import { User } from '../types';

export const handleCallback = async (code: string): Promise<{token: string, app_user_id: string}> => {
  try {
    // Try to exchange code for token using the correct endpoint
    const response = await api.post('/auth/token', { code });
    const { access_token, app_user_id } = response.data;
    
    // Store the token and user ID
    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('instagram_user_id', app_user_id);
    
    return { token: access_token, app_user_id };
  } catch (error) {
    console.warn('Token exchange failed:', error);
    
    // If direct token exchange fails, the code might already be processed by the backend
    // Store the code for potential use in the callback handler
    localStorage.setItem('instagram_code', code);
    
    throw error;
  }
};

export const getAuthUser = async (): Promise<User> => {
  try {
    // Use the correct endpoint for getting user profile
    const response = await api.get('auth/instagram/user/me');
    
    // Format the user data to match our User type
    const userData: User = {
      id: response.data.id || '',
      username: response.data.username || 'Instagram User',
      profile_picture: response.data.profile_picture_url // Backend returns profile_picture_url
    };
    
    return userData;
  } catch (error) {
    console.warn('Error getting user profile:', error);
    
    // Create a fallback user with stored ID
    const fallbackUser: User = {
      id: localStorage.getItem('instagram_user_id') || 'unknown',
      username: 'Instagram User'
    };
    
    return fallbackUser;
  }
};