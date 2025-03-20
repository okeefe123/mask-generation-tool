import axios from 'axios';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Image upload endpoint
export const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  try {
    // Log to debug
    console.log('Uploading file:', imageFile.name, 'size:', imageFile.size);
    
    const response = await api.post('/images/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Get image by ID
export const getImage = async (imageId) => {
  try {
    const response = await api.get(`/images/${imageId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
};

// Save mask
export const saveMask = async (imageId, maskFile) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', maskFile);
    formData.append('image', imageId);
    
    // Debug info
    console.log('Saving mask with FormData:', {
      imageId,
      fileName: maskFile.name,
      fileSize: maskFile.size,
      fileType: maskFile.type
    });
    
    // Make sure we're not using the default content-type
    const response = await api.post('/masks/save/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Add request timeout and extra debugging
      timeout: 10000,
      onUploadProgress: (progressEvent) => {
        console.log('Upload progress:', Math.round((progressEvent.loaded * 100) / progressEvent.total));
      }
    });
    
    console.log('Mask save response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving mask:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

export default api;