import { useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Center, 
  FormControl, 
  FormLabel, 
  Input, 
  Text, 
  VStack,
  useToast,
  Progress
} from '@chakra-ui/react';
import { useAppContext, useUIContext } from '../contexts/AppContexts';
import { uploadImage } from '../services/api';
import { fileToDataURL } from '../utils/imageProcessing';

const ImageUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const toast = useToast();
  
  // Get state setters from contexts
  const {
    setOriginalImage,
    setDisplayImage,
    setImageId,
    setOriginalFileName,
    setOriginalDimensions,
  } = useAppContext();
  
  const {
    setIsLoading,
    setError
  } = useUIContext();

  // Handle file selection
  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is a valid image type
    if (!file.type.match('image/jpeg') && !file.type.match('image/jpg')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG image.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);
    
    // Store the original file name in context
    console.log('Setting original file name:', file.name);
    setOriginalFileName(file.name);
  }, [setOriginalFileName, toast]);

  // Handle file upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);

      // Convert file to data URL for preview
      const dataUrl = await fileToDataURL(selectedFile);
      
      // Create an image to get dimensions
      const img = new Image();
      img.onload = async () => {
        // Store original dimensions
        setOriginalDimensions({
          width: img.width,
          height: img.height
        });

        // Set display image for preview
        setDisplayImage(dataUrl);
        
        // Upload to server
        try {
          // Call the uploadImage function from the API service
          const response = await uploadImage(selectedFile);
          
          console.log('Upload response:', response);
          
          // Check for image URL in the response
          if (!response || !response.image_url) {
            console.error('No image URL in response:', response);
            throw new Error('Server did not return an image URL');
          }
          
          // Set the original image URL and ID from the server response
          setOriginalImage(response.image_url);
          setImageId(response.id);
          console.log('Setting original image URL:', response.image_url);
          console.log('Setting image ID:', response.id);
          
          toast({
            title: 'Upload successful',
            description: 'Your image has been uploaded successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Upload error:', error);
          const errorMessage = error.message || 'Failed to upload image to server.';
          setError(errorMessage);
          
          // Show more detailed error message to help debugging
          toast({
            title: 'Upload failed',
            description: `Error: ${errorMessage}. Please try again.`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      img.onerror = () => {
        setIsLoading(false);
        setError('Failed to load image preview.');
        toast({
          title: 'Preview failed',
          description: 'There was an error loading the image preview.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      };
      
      img.src = dataUrl;
    } catch (error) {
      console.error('File processing error:', error);
      setIsLoading(false);
      setError('Failed to process the selected file.');
      toast({
        title: 'Processing failed',
        description: 'There was an error processing your image.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [
    selectedFile, 
    setDisplayImage, 
    setError, 
    setImageId, 
    setIsLoading, 
    setOriginalDimensions, 
    setOriginalImage, 
    toast
  ]);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md" width="100%">
      <VStack spacing={4} align="stretch" width="100%">
        <FormControl>
          <FormLabel>Upload Image</FormLabel>
          <Input
            type="file"
            accept=".jpg,.jpeg"
            onChange={handleFileChange}
            p={1}
            width="100%"
          />
          <Text fontSize="sm" color="gray.500" mt={1}>
            Supported formats: JPEG
          </Text>
        </FormControl>
        
        {selectedFile && (
          <Text fontSize="sm">
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </Text>
        )}
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress value={uploadProgress} size="sm" colorScheme="blue" />
        )}
        
        <Center>
          <Button
            colorScheme="blue"
            onClick={handleUpload}
            isLoading={uploadProgress > 0 && uploadProgress < 100}
            loadingText="Uploading..."
            isDisabled={!selectedFile}
            width="100%"
          >
            Upload
          </Button>
        </Center>
      </VStack>
    </Box>
  );
};

export default ImageUploader;