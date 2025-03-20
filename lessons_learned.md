# Mask Generator Tool - Lessons Learned

This document serves as a knowledge repository and learning journal for the Mask Generator Tool project. It will be updated as we implement each component and learn new concepts.

## React Concepts

### Vite for React Projects
- What it is: Vite is a modern build tool and development server that provides extremely fast hot module replacement (HMR) and optimized builds for production. It's designed to be a faster alternative to traditional bundlers like webpack.
- How we used it: We set up our frontend project using Vite's React template, which provided a streamlined development environment with instant server start and fast hot reloads.
- Key takeaways:
  - Vite uses native ES modules during development for faster refresh times
  - It provides an optimized build process for production
  - The development experience is significantly faster than with traditional bundlers
  - Configuration is simpler and more intuitive than webpack
- Additional resources:
  - [Vite Official Documentation](https://vitejs.dev/guide/)
  - [Why Vite](https://vitejs.dev/guide/why.html)
  - [Vite for React](https://vitejs.dev/guide/features.html#jsx)

### Context API for State Management
- What it is: React's Context API provides a way to share state across the component tree without having to pass props down manually at every level. It's a built-in state management solution for React applications.
- How we used it: We created an ImageContext to manage the state related to image uploading, display, and drawing. This context provides values and functions that can be accessed by any component in the application.
- Key takeaways:
  - Context API eliminates prop drilling (passing props through intermediate components)
  - It centralizes state management for related data
  - The useContext hook makes it easy to consume context values in functional components
  - For complex applications, Context API can be combined with useReducer for more predictable state updates
  - Context should be structured around specific domains (like images, auth, etc.)
- Additional resources:
  - [React Context API Documentation](https://react.dev/reference/react/createContext)
  - [How to use React Context effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
  - [When to use Context API vs. Redux](https://blog.logrocket.com/use-hooks-and-context-not-react-and-redux/)

### Canvas API for Drawing
- What it is: The HTML Canvas API provides a means for drawing graphics via JavaScript. It can be used for rendering graphs, game graphics, art, or other visual images on the fly.
- How we used it: We implemented a drawing canvas that overlays the uploaded image, allowing users to draw masks by marking areas on the image. The canvas captures mouse and touch events to create paths that represent the mask.
- Key takeaways:
  - Canvas provides low-level access to pixel-based drawing operations
  - It requires manual handling of drawing state (coordinates, brush settings, etc.)
  - The canvas context (2d) provides methods for drawing paths, shapes, and manipulating pixels
  - For responsive applications, canvas dimensions need to be managed carefully
  - Touch and mouse events need different handling for cross-device compatibility
- Additional resources:
  - [MDN Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
  - [Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
  - [HTML5 Canvas Deep Dive](https://joshondesign.com/p/books/canvasdeepdive/toc.html)

### Chakra UI Component Library
- What it is: Chakra UI is a simple, modular, and accessible component library that provides building blocks for creating React applications with a consistent design system.
- How we used it: We used Chakra UI components throughout our application for layout, buttons, forms, and feedback elements. The ChakraProvider was added to our main.jsx file to make Chakra styles available throughout the app.
- Key takeaways:
  - Chakra UI provides accessible components out of the box
  - It uses a prop-based styling system that's intuitive and flexible
  - The library includes responsive utilities that make mobile-friendly designs easier
  - Theme customization allows for consistent branding
  - The component API is consistent and well-documented
- Additional resources:
  - [Chakra UI Documentation](https://chakra-ui.com/docs/getting-started)
  - [Chakra UI Component Library](https://chakra-ui.com/docs/components)
  - [Styling with Chakra UI](https://chakra-ui.com/docs/styled-system/style-props)

## Django Concepts

### Django Project Structure
- What it is: Django follows a specific project structure with key components organized in a predictable way. This includes the project configuration files, apps, templates, static files, and more.
- How we used it: We set up our project with a clear separation between the main project configuration (`mask_generator/`) and our API app (`api/`). We also created a structured tests directory to support our TDD approach.
- Key takeaways:
  - Django encourages a modular, app-based structure that makes large projects maintainable
  - The settings.py file centralizes configuration for the entire project
  - Creating a dedicated app for the API helps with separation of concerns
- Additional resources:
  - [Django Project Structure Best Practices](https://docs.djangoproject.com/en/stable/intro/tutorial01/)
  - [Django Application Structure](https://docs.djangoproject.com/en/stable/ref/applications/)

### Django REST Framework
- What it is: Django REST Framework (DRF) is a powerful toolkit for building Web APIs on top of Django. It provides serialization, authentication, viewsets, and many other features to simplify API development.
- How we used it:
  - Added it to INSTALLED_APPS in settings.py
  - Configured default permissions and parsers in the REST_FRAMEWORK settings
  - Created serializers for our models to convert between Python objects and JSON
  - Used APIView classes to handle HTTP requests
  - Implemented validation for file uploads
  - Used Response objects to return proper status codes and data
- Key takeaways:
  - DRF extends Django with API-specific tools and patterns
  - The parser classes determine what types of request data your API can handle
  - Serializers handle validation and conversion between Django models and JSON
  - APIView classes provide a structured way to handle different HTTP methods
  - Status codes are important for RESTful API design (201 for created resources, 400 for bad requests)
  - Test-driven development helps ensure API endpoints work as expected
  - For file uploads, MultiPartParser is essential
- Additional resources:
  - [Django REST Framework Documentation](https://www.django-rest-framework.org/)
  - [DRF Tutorial](https://www.django-rest-framework.org/tutorial/quickstart/)
  - [DRF APIView](https://www.django-rest-framework.org/api-guide/views/)
  - [DRF Serializers](https://www.django-rest-framework.org/api-guide/serializers/)

### Django Models and Database
- What it is: Django models define the structure of your database tables using Python classes. They provide an Object-Relational Mapping (ORM) layer that translates Python objects to database records and vice versa.
- How we used it:
  - Created Image and Mask models to store our uploaded images and generated masks
  - Used model fields like ImageField, ForeignKey, and DateTimeField to define the data structure
  - Set up custom upload paths to organize files in the media directory
  - Implemented signals to handle file deletion when model instances are deleted
- Key takeaways:
  - Models define both the database schema and behavior of your data
  - ImageField requires the Pillow library and handles file uploads
  - ForeignKey establishes relationships between models (Mask belongs to Image)
  - Signal handlers can automate tasks like cleaning up files when records are deleted
  - Django's ORM abstracts away raw SQL queries, making database operations more Pythonic
- Additional resources:
  - [Django Model Field Reference](https://docs.djangoproject.com/en/stable/ref/models/fields/)
  - [Django Model Relationships](https://docs.djangoproject.com/en/stable/topics/db/models/#relationships)
  - [Django Signals Documentation](https://docs.djangoproject.com/en/stable/topics/signals/)

### Media File Handling in Django
- What it is: Django provides a framework for handling user-uploaded files (media files) which includes settings configuration, file storage backends, and URL routing to serve these files.
- How we used it:
  - Added MEDIA_URL and MEDIA_ROOT settings to configure where files are stored
  - Created separate directories for images and masks in our media storage
  - Implemented custom storage classes for secure file handling
  - Used Django's FileSystemStorage as a base for our custom storage
  - Configured proper file naming conventions with UUID-based filenames
- Key takeaways:
  - MEDIA_ROOT defines where on the filesystem uploaded files will be stored
  - MEDIA_URL is the URL prefix for serving these files
  - Custom storage classes provide more control over file handling
  - Secure file naming prevents path traversal and filename collisions
  - Django's file storage abstraction allows for switching storage backends without changing code
  - File validation should happen at multiple levels (model, view, storage)
- Additional resources:
  - [Django File Uploads Documentation](https://docs.djangoproject.com/en/stable/topics/files/)
  - [Django File Storage API](https://docs.djangoproject.com/en/stable/ref/files/storage/)
  - [Django Security: File Uploads](https://docs.djangoproject.com/en/stable/topics/security/#user-uploaded-content)

## Image Processing

### Image Scaling and Aspect Ratio
- How it works: Image scaling involves resizing an image while maintaining its aspect ratio to fit within a specific container or viewport. This ensures the image is displayed properly without distortion.
- Implementation details:
  - We calculate a scale factor based on the original image dimensions and the container dimensions
  - The scale factor is the minimum of the width ratio and height ratio, ensuring the image fits completely
  - We apply this scale factor to the image display using CSS
  - When generating the mask, we scale the drawing back to the original image dimensions
- Performance considerations:
  - Browser-based scaling is efficient for display purposes
  - For large images, consider using server-side resizing to reduce network load
  - Canvas operations can be expensive, so we optimize by only redrawing when necessary
  - We use requestAnimationFrame for smooth drawing operations

### MPO to JPEG Conversion
- How it works: MPO (Multi Picture Object) is a format used by some 3D cameras that contains multiple images in a single file. For our application, we need to extract the first image and convert it to JPEG.
- Implementation details:
  - This feature is planned but not yet implemented
  - We will use Pillow on the backend to detect MPO files and extract the first image
  - The extracted image will be saved as a standard JPEG for processing
- Performance considerations:
  - MPO processing should happen on the server to avoid browser compatibility issues
  - File size considerations are important as 3D images can be large
  - Caching converted images can improve performance for repeated access

### Drawing Canvas Implementation
- How it works: We use the HTML Canvas API to create an interactive drawing surface that overlays the displayed image. Users can draw on this canvas to mark areas for the mask.
- Implementation details:
  - We position a transparent canvas absolutely over the image
  - Mouse and touch events are captured to track drawing movements
  - Drawing is implemented by creating paths between points as the user moves
  - We support both drawing (white) and erasing (clearing) modes
  - The canvas is automatically resized when the window or container changes
- Performance considerations:
  - We optimize event handling to prevent too many draw operations
  - For mobile devices, we handle touch events differently than mouse events
  - We use requestAnimationFrame for smooth drawing when appropriate
  - The canvas size is matched to the displayed image size, not the original dimensions

### Mask Generation Algorithms
- How it works: After the user draws on the canvas, we convert their drawing to a binary mask (black and white image) that matches the original image dimensions.
- Implementation details:
  - We extract the drawing data from the canvas using getImageData()
  - Areas marked by the user are converted to white pixels, unmarked areas to black
  - We rescale the mask to match the original image dimensions
  - The final mask is converted to a PNG for saving
- Performance considerations:
  - Pixel manipulation can be CPU-intensive for large images
  - We use typed arrays for efficient pixel data handling
  - The rescaling algorithm balances quality and performance
  - For very large images, consider progressive processing or web workers

## General Development Practices

### Test-Driven Development
- Benefits:
  - Ensures code quality and correctness from the start
  - Provides automatic regression testing
  - Forces us to think about requirements and edge cases before implementation
  - Creates documentation through tests
  - Makes refactoring safer
- Implementation examples:
  - We wrote tests for models and each API endpoint before implementing them
  - Used Django's TestCase with APIClient for testing REST endpoints
  - Created separate test files for different components (models, views)
  - Used setUp and tearDown methods to prepare and clean test environments
- Best practices:
  - Write tests first, watch them fail
  - Implement minimal code to make tests pass
  - Refactor while keeping tests green
  - Use descriptive test method names
  - Test both happy path and error cases

### Frontend-Backend Integration
- Benefits:
  - Separates concerns between presentation and business logic
  - Allows for independent development and scaling of frontend and backend
  - Enables multiple client applications to use the same backend API
  - Provides a clear contract between frontend and backend through API endpoints
- Implementation examples:
  - We created a dedicated API service in the frontend to handle all backend communication
  - Used Axios for HTTP requests with consistent error handling
  - Implemented proper content type headers for different types of requests
  - Created serializers on the backend to format data for the frontend
  - Used proper HTTP status codes to communicate success/failure
- Best practices:
  - Use a consistent API URL structure
  - Handle loading states and errors gracefully in the UI
  - Implement proper validation on both client and server
  - Use appropriate HTTP methods (GET, POST, PUT, DELETE)
  - Keep API responses focused and minimal
  - Document API endpoints for easier integration

### File Organization
- Benefits:
  - Makes code more maintainable and easier to navigate
  - Separates concerns and enforces modularity
  - Follows established patterns for the framework
- Implementation examples:
  - Organized Django project with separate apps
  - Created dedicated directories for tests by category
  - Used Django's conventional structure
- Best practices:
  - Keep models, views, and serializers in separate files
  - Group related components together
  - Follow framework conventions
  - Don't mix business logic with presentation code

### Error Handling
- Benefits:
  - Provides better user experience
  - Makes debugging easier
  - Improves security
- Implementation examples:
  - Used HTTP status codes appropriately (201 for creation, 400 for bad requests, 404 for not found)
  - Returned descriptive error messages
  - Added validation for required fields
  - Used try-except blocks to handle exceptions gracefully
- Best practices:
  - Be specific about error messages
  - Use appropriate HTTP status codes
  - Never expose internal errors to clients
  - Log errors for debugging

### Performance Optimization
- Benefits:
  - Improves user experience with faster load times and responsiveness
  - Reduces server load and bandwidth usage
  - Enables handling larger images and more complex operations
  - Increases application scalability
- Implementation examples:
  - Used efficient canvas operations for drawing
  - Implemented proper scaling algorithms for images
  - Added loading states to provide feedback during operations
  - Used typed arrays for pixel manipulation
  - Optimized event handling to prevent excessive redraws
- Best practices:
  - Measure performance before optimizing (avoid premature optimization)
  - Use browser developer tools to identify bottlenecks
  - Consider both client and server-side optimizations
  - Implement lazy loading for resources when appropriate
  - Use appropriate data structures for the task
  - Consider web workers for CPU-intensive operations