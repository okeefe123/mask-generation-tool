import { VStack, Box, Heading, Divider } from '@chakra-ui/react';
import ImageUploader from '../ImageUploader';
import DrawingTools from './DrawingTools';
import ActionButtons from './ActionButtons';
import { useAppContext } from '../../contexts/AppContext';

const ToolPanel = () => {
  const { displayImage } = useAppContext();
  
  return (
    <VStack spacing={4} align="stretch" p={4}>
      <Box>
        <Heading size="md" mb={2}>Image</Heading>
        <ImageUploader />
      </Box>
      
      {displayImage && (
        <>
          <Divider />
          <Box>
            <Heading size="md" mb={2}>Drawing Tools</Heading>
            <DrawingTools />
          </Box>
          
          <Divider />
          <Box>
            <Heading size="md" mb={2}>Actions</Heading>
            <ActionButtons />
          </Box>
        </>
      )}
    </VStack>
  );
};

export default ToolPanel;