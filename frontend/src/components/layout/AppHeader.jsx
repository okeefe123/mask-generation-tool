import { Box, Heading, Flex, Text, Badge, HStack, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useImageContext } from '../../contexts/AppContexts';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaImages } from 'react-icons/fa';

/**
 * Application header component with centered title and subtitle.
 * 
 * @returns {JSX.Element} The rendered AppHeader component
 */
const AppHeader = () => {
  const { availableImages, imagesWithMasks } = useImageContext();
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Calculate number of images left to annotate
  const imagesLeft = availableImages?.length || 0;
  const imagesAnnotated = imagesWithMasks?.length || 0;
  const totalImages = imagesLeft + imagesAnnotated;
  
  // Calculate completion percentage
  const completionPercentage = totalImages > 0 
    ? Math.round((imagesAnnotated / totalImages) * 100) 
    : 0;
  
  // Show celebration animation when progress is made
  useEffect(() => {
    if (imagesAnnotated > 0 && imagesLeft > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [imagesAnnotated, imagesLeft]);
  
  // Animation keyframes
  const pulseKeyframes = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  `;
  
  const bounceKeyframes = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  `;
  
  const glowKeyframes = keyframes`
    0%, 100% { box-shadow: 0 0 5px 2px rgba(124, 58, 237, 0.3); }
    50% { box-shadow: 0 0 15px 5px rgba(124, 58, 237, 0.5); }
  `;
  
  // Animation styles
  const pulseAnimation = `${pulseKeyframes} 2s infinite ease-in-out`;
  const bounceAnimation = `${bounceKeyframes} 1s infinite ease-in-out`;
  const glowAnimation = `${glowKeyframes} 2s infinite`;
  
  // Colors
  const badgeBg = useColorModeValue('purple.500', 'purple.300');
  const badgeColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box as="header" py={5} borderBottomWidth="1px">
      <Flex justify="center" align="center" direction="column" position="relative">
        <Heading as="h1" size="xl" textAlign="center">Mask Generator Tool</Heading>
        <Text color="gray.600" fontSize="sm" textAlign="center" mt={1}>
          Create precise masks for your images
        </Text>
        
        {/* Countdown Display */}
        <Tooltip 
          label={`You've completed ${imagesAnnotated} out of ${totalImages} images (${completionPercentage}%)!`} 
          hasArrow
        >
          <HStack 
            position="absolute" 
            right="10px" 
            top="50%" 
            transform="translateY(-50%)" 
            spacing={2}
            animation={showCelebration ? pulseAnimation : undefined}
          >
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              position="relative" 
            >
              <FaImages 
                size="1.2em" 
                color="#2B6CB0" 
                style={{ 
                  opacity: 0.8,
                  animation: showCelebration ? bounceAnimation : undefined
                }}
              />
              {completionPercentage === 100 && (
                <Box 
                  position="absolute" 
                  right="-5px" 
                  bottom="-5px"
                  color="green.500"
                >
                  <FaCheckCircle size="1.2em" />
                </Box>
              )}
            </Box>
            
            <Badge 
              colorScheme={
                completionPercentage === 100 ? "green" : 
                completionPercentage >= 75 ? "teal" : 
                completionPercentage >= 50 ? "blue" : 
                completionPercentage >= 25 ? "yellow" : 
                "purple"
              }
              fontSize="sm" 
              py={1} 
              px={3} 
              borderRadius="full"
              animation={showCelebration ? glowAnimation : undefined}
              bg={badgeBg}
              color={badgeColor}
              boxShadow="md"
            >
              {imagesLeft === 0 ? (
                "All Done! 🎉"
              ) : (
                `${imagesLeft} image${imagesLeft !== 1 ? 's' : ''} left`
              )}
            </Badge>
          </HStack>
        </Tooltip>
      </Flex>
    </Box>
  );
};

export default AppHeader;