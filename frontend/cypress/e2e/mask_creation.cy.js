describe('Mask Creation Workflow', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('http://localhost:5173');
    
    // Mock the API endpoints
    cy.intercept('POST', '/api/images/upload/', {
      statusCode: 201,
      body: {
        id: 1,
        file: '/media/images/test-image.jpg',
        original_filename: 'test.jpg',
        width: 1920,
        height: 1080,
        uploaded_at: '2025-03-19T10:00:00Z',
        is_mpo: false,
        image_url: '/media/images/test-image.jpg',
      },
    }).as('uploadImage');
    
    cy.intercept('POST', '/api/masks/save/', {
      statusCode: 201,
      body: {
        id: 1,
        file: '/media/masks/mask_test-image.png',
        image: 1,
        created_at: '2025-03-19T10:05:00Z',
        original_width: 1920,
        original_height: 1080,
      },
    }).as('saveMask');
  });

  it('should upload an image, draw a mask, and save it', () => {
    // Check that the app title is displayed
    cy.contains('h1', 'Mask Generator Tool').should('be.visible');
    
    // Upload an image
    cy.fixture('test.jpg', { encoding: null }).as('testImage');
    cy.get('input[type="file"]').selectFile('@testImage', { force: true });
    cy.contains('button', 'Upload').click();
    
    // Wait for the upload to complete
    cy.wait('@uploadImage');
    
    // Check that the image is displayed
    cy.get('img[alt="Uploaded image"]').should('be.visible');
    
    // Draw on the canvas
    const canvas = () => cy.get('canvas');
    
    // Draw a simple shape
    canvas().then($canvas => {
      const canvasElement = $canvas[0];
      const ctx = canvasElement.getContext('2d');
      
      // Start drawing
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(200, 100);
      ctx.lineTo(200, 200);
      ctx.lineTo(100, 200);
      ctx.closePath();
      ctx.fill();
      
      // Trigger events to simulate drawing
      cy.wrap(canvasElement)
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 200, clientY: 100 })
        .trigger('mousemove', { clientX: 200, clientY: 200 })
        .trigger('mousemove', { clientX: 100, clientY: 200 })
        .trigger('mousemove', { clientX: 100, clientY: 100 })
        .trigger('mouseup');
    });
    
    // Switch to erase mode
    cy.contains('button', 'Erase').click();
    
    // Erase a small part
    canvas().then($canvas => {
      const canvasElement = $canvas[0];
      
      cy.wrap(canvasElement)
        .trigger('mousedown', { clientX: 150, clientY: 150 })
        .trigger('mousemove', { clientX: 160, clientY: 160 })
        .trigger('mouseup');
    });
    
    // Adjust brush size
    cy.get('input[type="range"]').invoke('val', 20).trigger('change');
    
    // Switch back to draw mode
    cy.contains('button', 'Draw').click();
    
    // Draw another shape
    canvas().then($canvas => {
      const canvasElement = $canvas[0];
      
      cy.wrap(canvasElement)
        .trigger('mousedown', { clientX: 300, clientY: 100 })
        .trigger('mousemove', { clientX: 400, clientY: 100 })
        .trigger('mousemove', { clientX: 400, clientY: 200 })
        .trigger('mousemove', { clientX: 300, clientY: 200 })
        .trigger('mousemove', { clientX: 300, clientY: 100 })
        .trigger('mouseup');
    });
    
    // Save the mask
    cy.contains('button', 'Save Mask').click();
    
    // Wait for the save to complete
    cy.wait('@saveMask');
    
    // Check for success message
    cy.contains('Mask saved').should('be.visible');
  });

  it('should handle validation errors', () => {
    // Try to upload an invalid file type
    cy.fixture('test.txt', { encoding: null }).as('invalidFile');
    cy.get('input[type="file"]').selectFile('@invalidFile', { force: true });
    cy.contains('button', 'Upload').click();
    
    // Check for error message
    cy.contains('Invalid file type').should('be.visible');
    
    // Try to save without an image
    cy.contains('button', 'Save Mask').should('be.disabled');
  });

  it('should handle API errors', () => {
    // Mock API error
    cy.intercept('POST', '/api/images/upload/', {
      statusCode: 500,
      body: {
        error: 'Server error',
      },
    }).as('uploadError');
    
    // Upload an image
    cy.fixture('test.jpg', { encoding: null }).as('testImage');
    cy.get('input[type="file"]').selectFile('@testImage', { force: true });
    cy.contains('button', 'Upload').click();
    
    // Wait for the upload to fail
    cy.wait('@uploadError');
    
    // Check for error message
    cy.contains('Upload failed').should('be.visible');
  });
});