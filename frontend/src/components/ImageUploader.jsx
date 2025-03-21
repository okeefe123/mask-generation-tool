import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  HStack,
  useToast,
  Progress,
  Select,
  Checkbox,
  Divider,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image as ChakraImage,
} from '@chakra-ui/react';
import { useUIContext } from '../contexts/AppContexts';
import { useImageContext } from '../contexts/ImageContext';
import { uploadImage, uploadMultipleImages } from '../services/api';
import { fileToDataURL } from '../utils/imageProcessing';

const ImageUploader = () => {
  // Local state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDirectoryUpload, setIsDirectoryUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Get state from ImageContext
  const {
    setOriginalImage,
    setDisplayImage,
    setImageId,
    setOriginalFileName,
    setOriginalDimensions,
    availableImages,
    selectedImageIndex,
    selectImageByIndex,
    fetchAvailableImages,
    isLoadingImages,
  } = useImageContext();
  
  const {
    isLoading,
    setIsLoading,
    setError
  } = useUIContext();

  // Fetch available images on component mount
  useEffect(() => {
    fetchAvailableImages();
  }, [fetchAvailableImages]);

  // Handle individual file selection
  const handleFileChange = useCallback((event) => {
    setIsDirectoryUpload(false);
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is a valid image type
    if (!file.type.match('image/jpeg') && !file.type.match('image/jpg') &&
        !file.name.toLowerCase().endsWith('.mpo')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG or MPO image.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);
    setSelectedFiles([]);
    
    // Store the original file name in context
    console.log('Setting original file name:', file.name);
    setOriginalFileName(file.name);
  }, [setOriginalFileName, toast]);

  // Handle directory/multiple files selection
  const handleDirectoryChange = useCallback((event) => {
    const files = Array.from(event.target.files).filter(file =>
      file.type.match('image/jpeg') ||
      file.type.match('image/jpg') ||
      file.name.toLowerCase().endsWith('.mpo')
    );
    
    if (files.length === 0) {
      toast({
        title: 'No valid images found',
        description: 'The selected folder does not contain any JPEG or MPO images.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsDirectoryUpload(true);
    setSelectedFiles(files);
    setSelectedFile(null);
    
    toast({
      title: 'Folder selected',
      description: `Found ${files.length} valid images in the selected folder.`,
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  // Handle single file upload
  const handleSingleUpload = useCallback(async () => {
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
          
          // Refresh available images list
          fetchAvailableImages();
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
    toast,
    fetchAvailableImages
  ]);

  // Handle multiple files upload
  const handleBatchUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select a folder with images to upload.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(10); // Start with some initial progress

      // Upload all files
      const results = await uploadMultipleImages(selectedFiles);
      setUploadResults(results);
      
      // Open modal with results
      onOpen();
      
      // Update available images
      fetchAvailableImages();
      
      toast({
        title: 'Batch upload completed',
        description: `Successfully uploaded ${results.totalSuccessful} of ${results.totalSuccessful + results.totalFailed} images.`,
        status: results.totalFailed === 0 ? 'success' : 'warning',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Batch upload error:', error);
      setError('Failed to upload batch of images.');
      toast({
        title: 'Batch upload failed',
        description: 'There was an error uploading your images.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setSelectedFiles([]);
    }
  }, [
    selectedFiles,
    setError,
    setIsLoading,
    toast,
    fetchAvailableImages,
    onOpen
  ]);

  // Handle image selection from dropdown
  const handleImageSelect = useCallback((e) => {
    const index = parseInt(e.target.value, 10);
    console.log("Selected image index:", index);
    selectImageByIndex(index);
  }, [selectImageByIndex]);

  // Get the full image URL (adding base URL if needed)
  const getFullImageUrl = useCallback((urlPath) => {
    console.log('Getting full URL for path:', urlPath);
    
    // Check if it's already a full URL
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      return urlPath;
    }
    
    // For Django development server, media files are served at /media/
    if (urlPath.startsWith('/media/')) {
      // In development, we don't need to prepend /api
      return urlPath;
    }
    
    // For other API paths
    return `/api${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
  }, []);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md" width="100%">
      <VStack spacing={4} align="stretch" width="100%">
        <HStack spacing={4}>
          <FormControl flex="1">
            <FormLabel>Upload Image</FormLabel>
            <Input
              type="file"
              accept=".jpg,.jpeg,.mpo"
              onChange={handleFileChange}
              p={1}
              width="100%"
            />
          </FormControl>
          
          <FormControl flex="1">
            <FormLabel>Upload Folder</FormLabel>
            <Input
              type="file"
              accept=".jpg,.jpeg,.mpo"
              onChange={handleDirectoryChange}
              p={1}
              width="100%"
              webkitdirectory="true"
              directory="true"
              multiple
            />
          </FormControl>
        </HStack>
        
        <Text fontSize="sm" color="gray.500">
          Supported formats: JPEG, MPO (first layer will be extracted)
        </Text>
        
        {selectedFile && (
          <Text fontSize="sm">
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </Text>
        )}
        
        {selectedFiles.length > 0 && (
          <Text fontSize="sm">
            Selected Folder: {selectedFiles.length} images found
          </Text>
        )}
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress value={uploadProgress} size="sm" colorScheme="blue" />
        )}
        
        <Center>
          <HStack width="100%">
            <Button
              colorScheme="blue"
              onClick={handleSingleUpload}
              isLoading={isLoading && !isDirectoryUpload}
              loadingText="Uploading..."
              isDisabled={!selectedFile || isDirectoryUpload || isLoading}
              width="100%"
            >
              Upload File
            </Button>
            
            <Button
              colorScheme="teal"
              onClick={handleBatchUpload}
              isLoading={isLoading && isDirectoryUpload}
              loadingText="Uploading Folder..."
              isDisabled={selectedFiles.length === 0 || !isDirectoryUpload || isLoading}
              width="100%"
            >
              Upload Folder
            </Button>
          </HStack>
        </Center>
        
        <Divider my={2} />
        
        <FormControl>
          <FormLabel>
            Select Image to Annotate
            {isLoadingImages && <Badge ml={2} colorScheme="blue">Loading...</Badge>}
          </FormLabel>
          <Select
            value={selectedImageIndex}
            onChange={handleImageSelect}
            placeholder="Select an image"
            isDisabled={availableImages.length === 0 || isLoadingImages}
          >
            {availableImages.map((image, index) => (
              <option key={image.id} value={index}>
                {image.original_filename} ({image.width}x{image.height})
              </option>
            ))}
          </Select>
          {availableImages.length === 0 && !isLoadingImages && (
            <Text fontSize="sm" color="orange.500" mt={1}>
              No images available for annotation. Images with existing masks are filtered out.
            </Text>
          )}
        </FormControl>
        
        <Button
          colorScheme="green"
          onClick={() => {
            if (selectedImageIndex >= 0 && selectedImageIndex < availableImages.length) {
              const selectedImage = availableImages[selectedImageIndex];
              console.log("Opening selected image:", selectedImage);
              
              // Get full URL with proper path
              // Note: Django serves media files directly from their path without /api prefix
              const fullImageUrl = selectedImage.file;
              console.log("Image path from API:", fullImageUrl);
              
              // The backend returns the path to the image file, but in development we need to use the full URL
              // For Django's development server, we need to fix the URL
              const imageUrl = getFullImageUrl(fullImageUrl);
              console.log("Final image URL to display:", imageUrl);
              
              // Set the image data in context
              setOriginalImage(imageUrl);
              setDisplayImage(imageUrl);
              setImageId(selectedImage.id);
              setOriginalFileName(selectedImage.original_filename);
              setOriginalDimensions({
                width: selectedImage.width,
                height: selectedImage.height
              });
              
              // Show success toast
              toast({
                title: 'Image loaded',
                description: `Loaded ${selectedImage.original_filename} (${selectedImage.width}x${selectedImage.height})`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            }
          }}
          isDisabled={selectedImageIndex < 0 || isLoadingImages}
          width="100%"
          mt={2}
        >
          Open Selected Image
        </Button>
        
        {/* Preview of selected image from dropdown if available */}
        {selectedImageIndex >= 0 && availableImages[selectedImageIndex] && (
          <Box mt={4} p={2} borderWidth="1px" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" mb={2}>
              Selected Image Preview:
            </Text>
            <Text fontSize="xs" color="gray.500" mb={2}>
              Image name: {availableImages[selectedImageIndex].original_filename}
              <br />
              Dimensions: {availableImages[selectedImageIndex].width}x{availableImages[selectedImageIndex].height}
              <br />
              URL path: {availableImages[selectedImageIndex].file}
            </Text>
            <ChakraImage
              src={availableImages[selectedImageIndex].file}
              alt={availableImages[selectedImageIndex].original_filename}
              maxH="200px"
              mx="auto"
              onError={(e) => {
                // If direct file path fails, try with getFullImageUrl
                console.error("Error loading image preview with direct path. Trying with getFullImageUrl");
                e.target.src = getFullImageUrl(availableImages[selectedImageIndex].file);
                
                // Add a second error handler in case the fixed URL also fails
                e.target.onerror = () => {
                  console.error("Error loading image preview with both methods:",
                    availableImages[selectedImageIndex].file,
                    getFullImageUrl(availableImages[selectedImageIndex].file));
                  toast({
                    title: 'Image preview error',
                    description: 'Could not load image preview. The URL may be incorrect.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  });
                };
              }}
              fallback={
                <Box textAlign="center" p={4}>
                  <Text>Image preview not available</Text>
                </Box>
              }
            />
          </Box>
        )}
      </VStack>
      
      {/* Upload Results Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Batch Upload Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {uploadResults && (
              <VStack align="stretch" spacing={4}>
                <Stat>
                  <StatLabel>Upload Summary</StatLabel>
                  <StatNumber>{uploadResults.totalSuccessful} of {uploadResults.totalSuccessful + uploadResults.totalFailed} Successful</StatNumber>
                  <StatHelpText>
                    {uploadResults.totalFailed > 0 ? `${uploadResults.totalFailed} files failed to upload` : 'All files uploaded successfully'}
                  </StatHelpText>
                </Stat>
                
                {uploadResults.failed.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Failed Uploads:</Text>
                    <VStack align="stretch" maxH="200px" overflowY="auto">
                      {uploadResults.failed.map((item, index) => (
                        <Text key={index} fontSize="sm" color="red.500">
                          {item.fileName}: {item.error.message || 'Unknown error'}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ImageUploader;