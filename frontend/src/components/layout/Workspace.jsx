import { Flex, Box } from '@chakra-ui/react';
import { useImageContext } from '../../contexts/AppContexts';

const Workspace = ({ imageSettings, canvasArea, drawingTools }) => {
  const { displayImage } = useImageContext();
  
  return (
    <Flex 
      as="main" 
      flex="1" 
      h={{ base: 'calc(100vh - 180px)', md: 'calc(100vh - 200px)' }}
      direction={{ base: 'column', md: 'row' }}
    >
      {/* Left Column - Image Settings */}
      <Box
        w={{ base: '100%', md: '250px' }}
        h={{ base: displayImage ? '200px' : 'auto', md: '100%' }}
        borderRightWidth={{ base: 0, md: '1px' }}
        borderBottomWidth={{ base: displayImage ? '1px' : 0, md: 0 }}
        overflowY="auto"
        overflowX="hidden"
        p={3}
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
      >
        {canvasArea}
      </Box>
      
      {/* Right Column - Drawing Tools */}
      <Box
        w={{ base: '100%', md: '300px' }}
        h={{ base: 'auto', md: '100%' }}
        borderLeftWidth={{ base: 0, md: '1px' }}
        borderTopWidth={{ base: displayImage ? '1px' : 0, md: 0 }}
        overflowY="auto"
        overflowX="hidden"
        p={3}
      >
        {drawingTools}
      </Box>
    </Flex>
  );
};

export default Workspace;