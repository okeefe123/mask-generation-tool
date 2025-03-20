"""
Tests for file storage utilities.
"""
import os
import tempfile
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings

from api.utils.file_storage import (
    SecureFileStorage, 
    ImageStorage, 
    MaskStorage,
    generate_paired_filename,
    validate_file_type,
    safe_filename
)


class SecureFileStorageTests(TestCase):
    """Tests for the SecureFileStorage class."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.storage = SecureFileStorage(
            location=self.temp_dir.name,
            file_types=['.jpg', '.png']
        )
    
    def tearDown(self):
        """Clean up test environment."""
        self.temp_dir.cleanup()
    
    def test_get_valid_name(self):
        """Test that get_valid_name returns a secure filename."""
        filename = 'test.jpg'
        valid_name = self.storage.get_valid_name(filename)
        
        # Check that the name has changed
        self.assertNotEqual(valid_name, filename)
        
        # Check that the extension is preserved
        self.assertTrue(valid_name.endswith('.jpg'))
        
        # Check that the name is a valid UUID
        name_part = valid_name[:-4]  # Remove extension
        self.assertEqual(len(name_part), 32)  # UUID hex is 32 chars
    
    def test_invalid_file_type(self):
        """Test that invalid file types are rejected."""
        with self.assertRaises(ValueError):
            self.storage.get_valid_name('test.gif')


class ImageStorageTests(TestCase):
    """Tests for the ImageStorage class."""
    
    def test_initialization(self):
        """Test that ImageStorage is initialized with correct settings."""
        storage = ImageStorage()
        
        # Check location
        expected_location = os.path.join(settings.MEDIA_ROOT, 'images')
        self.assertEqual(storage.location, expected_location)
        
        # Check allowed file types
        self.assertIn('.jpg', storage.file_types)
        self.assertIn('.jpeg', storage.file_types)
        self.assertIn('.png', storage.file_types)


class MaskStorageTests(TestCase):
    """Tests for the MaskStorage class."""
    
    def test_initialization(self):
        """Test that MaskStorage is initialized with correct settings."""
        storage = MaskStorage()
        
        # Check location
        expected_location = os.path.join(settings.MEDIA_ROOT, 'masks')
        self.assertEqual(storage.location, expected_location)
        
        # Check allowed file types
        self.assertIn('.png', storage.file_types)
        self.assertIn('.jpg', storage.file_types)
        self.assertIn('.jpeg', storage.file_types)


class FilenameFunctionTests(TestCase):
    """Tests for filename utility functions."""
    
    def test_generate_paired_filename(self):
        """Test that generate_paired_filename creates related filenames."""
        original = 'test_image.jpg'
        paired = generate_paired_filename(original, prefix='mask_')
        
        # Check that the prefix is added
        self.assertTrue(paired.startswith('mask_'))
        
        # Check that the extension is preserved
        self.assertTrue(paired.endswith('.jpg'))
    
    def test_validate_file_type(self):
        """Test that validate_file_type correctly validates file types."""
        # Create a mock file
        file = MagicMock()
        file.content_type = 'image/jpeg'
        
        # Test with allowed type
        self.assertTrue(validate_file_type(file, ['image/jpeg']))
        
        # Test with disallowed type
        self.assertFalse(validate_file_type(file, ['image/png']))
    
    def test_safe_filename(self):
        """Test that safe_filename sanitizes filenames."""
        # Test with unsafe characters
        unsafe = 'test/file with spaces & special chars.jpg'
        safe = safe_filename(unsafe)
        
        # Check that unsafe characters are removed
        self.assertNotIn('/', safe)
        self.assertNotIn(' ', safe)
        self.assertNotIn('&', safe)
        
        # Check that the extension is preserved
        self.assertTrue(safe.endswith('.jpg'))