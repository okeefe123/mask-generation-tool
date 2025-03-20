import os
import tempfile
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

# Import the function we'll create later
from api.utils.image_processing import convert_mpo_to_jpeg, extract_image_metadata


class MPOConversionTests(TestCase):
    """Tests for MPO to JPEG conversion functionality."""

    def setUp(self):
        """Set up test environment."""
        # Create a temporary directory for test files
        self.temp_dir = tempfile.TemporaryDirectory()
        
        # Create a mock MPO file for testing
        self.mock_mpo_path = os.path.join(self.temp_dir.name, 'test.mpo')
        self.mock_jpeg_path = os.path.join(self.temp_dir.name, 'test.jpg')
        
        # We'll mock the actual MPO file since we can't create one easily in tests
        with open(self.mock_mpo_path, 'wb') as f:
            f.write(b'mock MPO data')

    def tearDown(self):
        """Clean up test environment."""
        self.temp_dir.cleanup()

    @patch('api.utils.image_processing.Image.open')
    def test_convert_mpo_to_jpeg(self, mock_image_open):
        """Test that MPO files are correctly converted to JPEG."""
        # Mock the PIL Image object
        mock_image = MagicMock()
        mock_image_open.return_value = mock_image
        mock_image.format = 'MPO'
        
        # Call the function with our mock MPO file
        with open(self.mock_mpo_path, 'rb') as f:
            mpo_file = SimpleUploadedFile('test.mpo', f.read(), content_type='image/mpo')
            
        result = convert_mpo_to_jpeg(mpo_file)
        
        # Assert that the conversion was attempted
        mock_image_open.assert_called_once()
        mock_image.save.assert_called_once()
        
        # Assert that the result is a JPEG file
        self.assertEqual(result.name.split('.')[-1].lower(), 'jpg')
        
    @patch('api.utils.image_processing.Image.open')
    def test_jpeg_file_not_converted(self, mock_image_open):
        """Test that JPEG files are not converted."""
        # Mock the PIL Image object
        mock_image = MagicMock()
        mock_image_open.return_value = mock_image
        mock_image.format = 'JPEG'
        
        # Create a JPEG file
        with open(self.mock_jpeg_path, 'wb') as f:
            f.write(b'mock JPEG data')
            
        # Call the function with a JPEG file
        with open(self.mock_jpeg_path, 'rb') as f:
            jpeg_file = SimpleUploadedFile('test.jpg', f.read(), content_type='image/jpeg')
            
        result = convert_mpo_to_jpeg(jpeg_file)
        
        # Assert that the file was not converted (returned as is)
        self.assertEqual(result, jpeg_file)
        mock_image.save.assert_not_called()
        
    @patch('api.utils.image_processing.Image.open')
    def test_extract_image_metadata(self, mock_image_open):
        """Test that image metadata is correctly extracted."""
        # Mock the PIL Image object
        mock_image = MagicMock()
        mock_image_open.return_value = mock_image
        mock_image.format = 'JPEG'
        mock_image.size = (1920, 1080)
        # Add width and height properties to match the actual implementation
        mock_image.width = 1920
        mock_image.height = 1080
        
        # Mock the EXIF data
        mock_exif = {
            '0th': {
                271: 'Camera Manufacturer',  # Make
                272: 'Camera Model',         # Model
            },
            'Exif': {
                36867: '2025:03:19 10:00:00',  # DateTimeOriginal
                33434: (1, 125),               # ExposureTime
                33437: (4, 1),                 # FNumber (f/4)
            }
        }
        mock_image._getexif = MagicMock(return_value=mock_exif)
        
        # Create a JPEG file
        with open(self.mock_jpeg_path, 'wb') as f:
            f.write(b'mock JPEG data')
            
        # Call the function with a JPEG file
        with open(self.mock_jpeg_path, 'rb') as f:
            jpeg_file = SimpleUploadedFile('test.jpg', f.read(), content_type='image/jpeg')
            
        metadata = extract_image_metadata(jpeg_file)
        
        # Assert that metadata was extracted
        self.assertIn('width', metadata)
        self.assertIn('height', metadata)
        self.assertEqual(metadata['width'], 1920)
        self.assertEqual(metadata['height'], 1080)
        self.assertIn('format', metadata)
        self.assertEqual(metadata['format'], 'JPEG')
        
        # Additional metadata might be included if available
        if 'exif' in metadata:
            self.assertIsInstance(metadata['exif'], dict)