# Folder Upload Implementation Handoff - March 20, 2025

## Summary
Implemented the folder upload feature that allows users to upload multiple JPEG/MPO images at once, with a dropdown UI to select images that don't already have masks. Backend functionality is working well with tests passing, but frontend tests need debugging to accommodate the new component structure.

## Priority Development Requirements (PDR)
- **HIGH**: Fix frontend test mocks for the new ImageUploader component with useDisclosure and mockToast implementations
- **HIGH**: Update axios mock in API tests to return proper responses for the new endpoints
- **MEDIUM**: Add a visual feedback mechanism during batch uploads to show progress for each file
- **LOW**: Consider adding drag-and-drop support for folder uploads

## Discoveries
- The ImageUploader component now needs to handle both single file and batch uploads
- The test environment has issues with the useToast and useDisclosure hooks from Chakra UI
- Multiple image handling required refactoring the ImageContext to track available images
- MPO extraction is already working on the backend through the existing process_uploaded_image function

## Problems & Solutions
- **Problem**: Frontend tests fail with "mockToast is not defined" error
  **Solution**: Need to update the test setup to properly mock Chakra UI's useToast hook
  ```jsx
  // Current problematic mock
  vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return {
      ...actual,
      useToast: () => mockToast,  // mockToast is undefined
    };
  });
  
  // Should be updated to
  const mockToast = vi.fn();
  vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return {
      ...actual,
      useToast: () => mockToast,
      useDisclosure: () => ({
        isOpen: false,
        onOpen: vi.fn(),
        onClose: vi.fn(),
      }),
    };
  });
  ```

- **Problem**: API tests fail because axios mock returns undefined
  **Solution**: Update the axios mock to return proper responses
  ```js
  // Axios mock needs to be updated to return responses for all methods
  mockAxiosInstance.post.mockResolvedValue({ data: {...} });
  mockAxiosInstance.get.mockResolvedValue({ data: {...} });
  ```

## Work in Progress
- **Frontend Tests**: 20% - Need to update mocks and fix testing issues
- **Batch Progress Indication**: 0% - Should add visual feedback for batch uploads
- **Usability Enhancements**: 0% - Drag-and-drop for folders would improve UX

## Deviations
- Originally planned to show a simple list of images, but implemented a dropdown for better UX
- Made a small modification to the generate_paired_filename function to support prefixes for future extensibility

## References
- `frontend/src/components/ImageUploader.jsx` - Updated component with folder upload support
- `frontend/src/contexts/ImageContext.jsx` - Enhanced to track available images
- `frontend/src/services/api.js` - Added new API functions
- `backend/api/views.py` - Added new endpoints for fetching images and checking masks
- `backend/api/urls.py` - Updated URL routing for new endpoints
- `backend/api/utils/file_storage.py` - Modified generate_paired_filename to support prefixes