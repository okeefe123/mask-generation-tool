# Mask Generator Tool - User Guide

## Introduction

The Mask Generator Tool is a web application that allows you to upload images and manually create masks by drawing on those images. This guide will walk you through the basic usage of the application.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Images in JPEG format (the application will automatically convert MPO files to JPEG)

### Launching the Application

1. Start the backend server:
   ```bash
   cd backend
   uv run python manage.py runserver
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to the URL shown in the frontend terminal (typically http://localhost:5173)

## Using the Application

### Uploading an Image

1. On the main page, you'll see an image upload section.
2. Click the "Choose File" button to select an image from your computer.
3. Select a JPEG image file (or an MPO file, which will be automatically converted).
4. Click the "Upload" button to upload the image.
5. Wait for the upload to complete. You'll see a progress indicator during the upload.

### Drawing a Mask

1. Once the image is uploaded, it will be displayed in the editor area.
2. The image will be automatically scaled to fit your screen while maintaining its aspect ratio.
3. Use the toolbar at the bottom of the editor to select drawing tools:
   - **Draw**: Click to select the draw tool (selected by default)
   - **Erase**: Click to select the erase tool to remove parts of your drawing
   - **Brush Size**: Adjust the slider to change the size of the drawing/erasing brush
   - **Clear**: Click to clear all drawing and start over

4. To draw on the image:
   - Click and drag on the image to draw
   - Release the mouse button to stop drawing
   - If you make a mistake, switch to the erase tool and erase the unwanted parts
   - You can switch between draw and erase tools as needed

### Saving the Mask

1. When you're satisfied with your mask, click the "Save Mask" button in the toolbar.
2. The application will:
   - Convert your drawing to a binary mask (white marks on black background)
   - Rescale the mask to match the original image dimensions
   - Save the mask on the server
   - Show a success confirmation when the save is complete

3. The mask will be saved in the server's masks directory with a filename that corresponds to the original image.

## Tips and Best Practices

- For the best results, use high-resolution images.
- Draw carefully around the edges of the areas you want to mask.
- Use a smaller brush size for detailed areas and a larger brush size for filling in larger areas.
- Save your work frequently, especially when working on complex masks.
- If you need to make significant changes, it might be easier to clear the canvas and start over rather than trying to erase large areas.

## Troubleshooting

- If the image doesn't upload, check that it's in JPEG format or MPO format.
- If the drawing tools don't work, try refreshing the page and uploading the image again.
- If the mask doesn't save, check that the backend server is running.
- For any other issues, check the browser console for error messages.

## Technical Details

- The frontend is built with React, using Chakra UI for the interface components.
- The backend is built with Django and Django REST Framework.
- Images are stored in the `media/images` directory on the server.
- Masks are stored in the `media/masks` directory on the server.
- The application uses the HTML Canvas API for drawing functionality.