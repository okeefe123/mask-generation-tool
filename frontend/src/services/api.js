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

// Multiple image upload endpoint
export const uploadMultipleImages = async (imageFiles) => {
  try {
    const uploadPromises = Array.from(imageFiles).map(file => {
      const formData = new FormData();
      formData.append('file', file);
      
      return api.post('/images/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }).then(response => response.data);
    });
    
    const results = await Promise.allSettled(uploadPromises);
    
    // Get successful uploads
    const successfulUploads = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
      
    // Get failed uploads
    const failedUploads = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        fileName: imageFiles[index].name,
        error: result.reason
      }));
    
    return {
      successful: successfulUploads,
      failed: failedUploads,
      totalSuccessful: successfulUploads.length,
      totalFailed: failedUploads.length
    };
  } catch (error) {
    console.error('Error in batch upload:', error);
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

// Get all available images
export const getAllImages = async () => {
  try {
    const response = await api.get('/images/');
    return response.data;
  } catch (error) {
    console.error('Error fetching all images:', error);
    throw error;
  }
};

// Get all masks to check which images have masks
export const getAllMasks = async () => {
  try {
    const response = await api.get('/masks/');
    return response.data;
  } catch (error) {
    console.error('Error fetching masks:', error);
    throw error;
  }
};

// Check if an image has a saved mask
export const checkImageHasMask = async (imageFileName) => {
  try {
    const response = await api.get(`/masks/check/${imageFileName}/`);
    return response.data.hasMask;
  } catch (error) {
    console.error(`Error checking if image ${imageFileName} has mask:`, error);
    return false; // Assume no mask on error
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