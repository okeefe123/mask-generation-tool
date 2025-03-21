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
  SimpleGrid,
  Flex,
} from '@chakra-ui/react';
import { useUIContext } from '../contexts/AppContexts';
import { useImageContext } from '../contexts/AppContexts';
import { uploadImage, uploadMultipleImages } from '../services/api';
import { fileToDataURL } from '../utils/imageProcessing';

/**
 * Component for uploading and selecting images.
 * 
 * @returns {JSX.Element} The rendered ImageUploader component
 */
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
    selectImage,
    previewImage,
    fetchAvailableImages,
    isLoadingImages,
    setSelectedImageIndex,
    setPreviewImage,
    setSavedStrokes,
    setInitialized,
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
    
    // Only set the preview image without loading it into the canvas
    if (index >= 0 && index < availableImages.length) {
      setSelectedImageIndex(index);
      const selectedImage = availableImages[index];
      // Only set preview image, not the actual canvas image
      setPreviewImage(selectedImage);
      
      toast({
        title: 'Image preview loaded',
        description: `${selectedImage.original_filename} selected. Click "Open in Canvas" to edit.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else if (index === -1) {
      // Clear selection
      setSelectedImageIndex(-1);
      setPreviewImage(null);
    }
  }, [availableImages, setPreviewImage, setSelectedImageIndex, toast]);

  // New function to handle opening the selected image in the canvas
  const handleOpenInCanvas = useCallback(() => {
    if (selectedImageIndex >= 0 && selectedImageIndex < availableImages.length) {
      console.log('Opening image in canvas, performing full reset first');

      // Clear any existing canvas drawings first - this is crucial
      // This ensures a fresh canvas for the new image
      setSavedStrokes([]);
      setInitialized(false);
      
      // Get access to the canvas directly if possible (for more immediate clearing)
      const canvasElement = document.querySelector('canvas[data-component="DrawingCanvas"]');
      if (canvasElement) {
        try {
          const ctx = canvasElement.getContext('2d');
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          console.log('Canvas cleared directly via DOM access');
        } catch (err) {
          console.warn('Could not clear canvas directly:', err);
        }
      }
      
      // Actually load the image into the canvas
      const selectedImage = availableImages[selectedImageIndex];
      selectImage(selectedImage);
      
      toast({
        title: 'Image loaded in canvas',
        description: `${selectedImage.original_filename} loaded and ready for annotation`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [availableImages, selectedImageIndex, selectImage, toast, setSavedStrokes, setInitialized]);

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
    <VStack spacing={5} align="stretch" width="100%">
      {/* Upload Section */}
      <Box>
        <SimpleGrid columns={2} spacing={3} mb={2}>
          <Box>
            <Button 
              as="label" 
              htmlFor="file-upload"
              size="md"
              width="full"
              colorScheme="blue"
              variant="outline"
              cursor="pointer"
              py={5}
            >
              Upload Image
            </Button>
            <Input
              id="file-upload"
              type="file"
              accept=".jpg,.jpeg,.mpo"
              onChange={handleFileChange}
              display="none"
            />
          </Box>
          
          <Box>
            <Button 
              as="label" 
              htmlFor="folder-upload"
              size="md"
              width="full"
              colorScheme="blue"
              variant="outline"
              cursor="pointer"
              py={5}
            >
              Upload Folder
            </Button>
            <Input
              id="folder-upload"
              type="file"
              accept=".jpg,.jpeg,.mpo"
              onChange={handleDirectoryChange}
              display="none"
              webkitdirectory="true"
              directory="true"
              multiple
            />
          </Box>
        </SimpleGrid>
        
        <Text fontSize="xs" color="gray.500" mb={3} textAlign="center">
          Supported formats: JPEG, MPO (first layer will be extracted)
        </Text>
        
        {selectedFile && (
          <Text fontSize="sm" mb={2}>
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </Text>
        )}
        
        {selectedFiles.length > 0 && (
          <Text fontSize="sm" mb={2}>
            Selected Folder: {selectedFiles.length} images found
          </Text>
        )}
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress value={uploadProgress} size="sm" colorScheme="blue" mb={3} />
        )}
        
        <SimpleGrid columns={2} spacing={3}>
          <Button
            colorScheme="blue"
            onClick={handleSingleUpload}
            isLoading={isLoading && !isDirectoryUpload}
            loadingText="Uploading..."
            isDisabled={!selectedFile || isDirectoryUpload || isLoading}
          >
            Confirm File <br></br> Upload
          </Button>
          
          <Button
            colorScheme="teal"
            onClick={handleBatchUpload}
            isLoading={isLoading && isDirectoryUpload}
            loadingText="Uploading..."
            isDisabled={selectedFiles.length === 0 || !isDirectoryUpload || isLoading}
          >
            Confirm Folder <br></br> Upload
          </Button>
        </SimpleGrid>
      </Box>
      
      <Divider />
      
      {/* Image Selection Section */}
      <Box>
        <FormControl mb={3}>
          <FormLabel fontSize="sm" fontWeight="medium">
            Select Image to Annotate
            {isLoadingImages && <Badge ml={2} colorScheme="blue">Loading...</Badge>}
          </FormLabel>
          <Select
            value={selectedImageIndex}
            onChange={handleImageSelect}
            placeholder="Select an image"
            isDisabled={availableImages.length === 0 || isLoadingImages}
            size="sm"
          >
            {availableImages.map((image, index) => (
              <option key={image.id} value={index}>
                {image.original_filename} ({image.width}x{image.height})
              </option>
            ))}
          </Select>
          {availableImages.length === 0 && !isLoadingImages && (
            <Text fontSize="xs" color="orange.500" mt={1}>
              No images available for annotation. Images with existing masks are filtered out.
            </Text>
          )}
        </FormControl>
        
        {/* Image Preview Section - Only show if we have a preview image */}
        {previewImage && (
          <Box 
            mb={4} 
            p={3} 
            borderWidth="1px" 
            borderRadius="md" 
            borderColor="gray.200"
            bg="gray.50"
            boxShadow="sm"
          >
            <Flex direction="column" alignItems="center">
              <Box 
                width="175px" 
                height="175px" 
                mb={3}
                position="relative"
                borderRadius="sm"
                overflow="hidden"
                bg="gray.100"
                boxShadow="inner"
              >
                <ChakraImage
                  src={previewImage.file}
                  alt={previewImage.original_filename || "Preview"}
                  objectFit="contain"
                  w="100%"
                  h="100%"
                  fallbackSrc="https://via.placeholder.com/120?text=Image"
                  onError={(e) => {
                    console.error("Error loading image preview");
                    e.target.src = getFullImageUrl(previewImage.file);
                  }}
                />
              </Box>
              <Box textAlign="center" width="100%" px={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" isTruncated maxWidth="100%">
                  {previewImage.original_filename}
                </Text>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {previewImage.width} × {previewImage.height} px
                </Text>
                
                {/* Add Open in Canvas button */}
                <Button
                  mt={3}
                  size="sm"
                  colorScheme="green"
                  width="100%"
                  onClick={handleOpenInCanvas}
                >
                  Open Selected Image
                </Button>
              </Box>
            </Flex>
          </Box>
        )}
      </Box>
      
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
    </VStack>
  );
};

export default ImageUploader;