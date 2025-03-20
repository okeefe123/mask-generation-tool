import { VStack, Box, Heading, Divider, Badge } from '@chakra-ui/react';
import ImageUploader from '../ImageUploader';
import DrawingTools from './DrawingTools';
import ActionButtons from './ActionButtons';
import { useAppContext } from '../../contexts/AppContext';

const ToolPanel = () => {
  const { displayImage } = useAppContext();
  
  return (
    <VStack
      spacing={6}
      align="stretch"
      p={5}
      bg="white"
      boxShadow="sm"
      borderRadius="md"
      height="100%"
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
      
      {displayImage && (
        <>
          <Divider borderColor="gray.200" />
          <Box>
            <Heading
              size="md"
              mb={3}
              color="gray.700"
              fontWeight="semibold"
            >
              Drawing Tools
            </Heading>
            <DrawingTools />
          </Box>
          
          <Divider borderColor="gray.200" />
          <Box>
            <Heading
              size="md"
              mb={3}
              color="gray.700"
              fontWeight="semibold"
            >
              Actions
            </Heading>
            <ActionButtons />
          </Box>
        </>
      )}
    </VStack>
  );
};

export default ToolPanel;