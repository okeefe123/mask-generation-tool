import { Flex, Box } from '@chakra-ui/react';
import { useImageContext } from '../../contexts/AppContexts';

const Workspace = ({ toolPanel, canvasArea }) => {
  const { displayImage } = useImageContext();
  
  return (
    <Flex 
      as="main" 
      flex="1" 
      h={{ base: 'calc(100vh - 180px)', md: 'calc(100vh - 200px)' }}
      direction={{ base: 'column', md: 'row' }}
    >
      {/* Tool Panel - collapsible on mobile */}
      <Box
        w={{ base: '100%', md: '350px' }}
        h={{ base: displayImage ? '200px' : 'auto', md: '100%' }}
        borderRightWidth={{ base: 0, md: '1px' }}
        borderBottomWidth={{ base: displayImage ? '1px' : 0, md: 0 }}
        overflowY="auto"
        overflowX="hidden"
      >
        {toolPanel}
      </Box>
      
      {/* Canvas Area - expands to fill available space */}
      <Box flex="1" h="100%" overflowY="auto">
        {canvasArea}
      </Box>
    </Flex>
  );
};

export default Workspace;