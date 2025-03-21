import { VStack, Box, Heading, Badge } from '@chakra-ui/react';
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
      spacing={4}
      align="stretch"
      height="100%"
      width="100%"
    >
      <Box>
        <Heading
          size="md"
          mb={3}
          color="gray.700"
          fontWeight="semibold"
          display="flex"
          alignItems="center"
        >
          Image
          {!displayImage && (
            <Badge ml={2} colorScheme="orange" variant="subtle">
              Required
            </Badge>
          )}
        </Heading>
        <ImageUploader />
      </Box>
      
      {/* Additional image settings could be added here later */}
    </VStack>
  );
};

export default ImageSettings; 