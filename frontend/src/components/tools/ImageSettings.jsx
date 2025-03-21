import { VStack, Box } from '@chakra-ui/react';
import { useImageContext } from '../../contexts/AppContexts';
import ImageUploader from '../ImageUploader';

/**
 * Component for handling image upload settings and configuration.
 * 
 * @returns {JSX.Element} The rendered ImageSettings component
 */
const ImageSettings = () => {
  const { displayImage } = useImageContext();
  
  return (
    <VStack
      spacing={6}
      align="stretch"
      height="100%"
      width="100%"
      pt={4}
    >
      <Box>
        <ImageUploader />
      </Box>
      
      {/* Additional image settings could be added here later */}
    </VStack>
  );
};

export default ImageSettings; 