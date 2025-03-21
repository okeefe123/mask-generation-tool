import { Flex, Box } from '@chakra-ui/react';
import { useImageContext } from '../../contexts/AppContexts';

/**
 * Main workspace component with three-column layout.
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.imageSettings - The image settings component
 * @param {React.ReactNode} props.canvasArea - The canvas area component
 * @param {React.ReactNode} props.drawingTools - The drawing tools component
 * @returns {JSX.Element} The rendered Workspace component
 */
const Workspace = ({ imageSettings, canvasArea, drawingTools }) => {
  const { displayImage } = useImageContext();
  
  return (
    <Flex 
      as="main" 
      flex="1" 
      h={{ base: 'calc(100vh - 180px)', md: 'calc(100vh - 200px)' }}
      direction={{ base: 'column', md: 'row' }}
      bg="gray.50"
      px={{ base: 2, md: 4 }}
      py={4}
      gap={{ base: 3, md: 5 }}
    >
      {/* Left Column - Image Settings */}
      <Box
        w={{ base: '100%', md: '280px' }}
        h={{ base: displayImage ? '200px' : 'auto', md: '100%' }}
        overflowY="auto"
        overflowX="hidden"
        p={4}
        bg="white"
        borderRadius="md"
        boxShadow="sm"
      >
        {imageSettings}
      </Box>
      
      {/* Middle Column - Canvas Area */}
      <Box 
        flex="1" 
        h="100%" 
        overflowY="auto"
        display="flex"
        flexDirection="column"
        minW={{ base: "100%", md: "400px" }}
        bg="white"
        borderRadius="md"
        boxShadow="sm"
        p={2}
      >
        {canvasArea}
      </Box>
      
      {/* Right Column - Drawing Tools */}
      <Box
        w={{ base: '100%', md: '320px' }}
        h={{ base: 'auto', md: '100%' }}
        overflowY="auto"
        overflowX="hidden"
        p={4}
        bg="white"
        borderRadius="md"
        boxShadow="sm"
      >
        {drawingTools}
      </Box>
    </Flex>
  );
};

export default Workspace;