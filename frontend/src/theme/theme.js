import { extendTheme } from '@chakra-ui/react';

// Color palette
const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#1a9dff',
    500: '#0080ff', // Primary brand color
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },
  gray: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#868e96',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  success: {
    500: '#38b2ac',
  },
  warning: {
    500: '#f6ad55',
  },
  error: {
    500: '#e53e3e',
  },
};

// Typography
const fonts = {
  body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

// Component-specific theme overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : `${props.colorScheme}.600`,
        },
      }),
      outline: (props) => ({
        border: '1px solid',
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
      }),
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'semibold',
    },
  },
};

// Global styles
const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
  },
};

// Create the theme configuration
const theme = extendTheme({
  colors,
  fonts,
  components,
  styles,
});

export default theme;