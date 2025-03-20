import { UIProvider } from './UIContext';
import { CanvasProvider } from './CanvasContext';
import { AppProvider } from './AppContext';

// Re-export all context hooks for convenience
export { useUIContext } from './UIContext';
export { useCanvasContext } from './CanvasContext';
export { useAppContext } from './AppContext';

/**
 * Combined provider component that wraps all context providers
 * This makes it easier to use all contexts in the application
 * without having to nest multiple providers
 */
export const AllProvidersWrapper = ({ children }) => (
  <AppProvider>
    <UIProvider>
      <CanvasProvider>
        {children}
      </CanvasProvider>
    </UIProvider>
  </AppProvider>
);