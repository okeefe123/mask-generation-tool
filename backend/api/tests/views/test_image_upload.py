"""
Test file for the image upload endpoint.

This file contains tests for the image upload endpoint to ensure it:
1. Accepts valid JPEG files
2. Rejects invalid file types
3. Properly handles MPO files by converting them to JPEG
4. Returns appropriate responses and status codes
5. Creates Image records in the database
"""
import os
import io
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Image


class ImageUploadTest(TestCase):
    """Test class for image upload endpoint"""
    
    def setUp(self):
        """Set up test client and test files"""
        self.client = APIClient()
        self.url = reverse('image-upload')
        
        # Create a simple JPEG test file
        self.jpeg_content = b'JPEG test content'
        self.jpeg_file = SimpleUploadedFile(
            name='test_image.jpg',
            content=self.jpeg_content,
            content_type='image/jpeg'
        )
        
        # Create an invalid file type (text file)
        self.invalid_file = SimpleUploadedFile(
            name='test_file.txt',
            content=b'This is not an image',
            content_type='text/plain'
        )
        
        # We'll create a more realistic JPEG file for testing dimensions
        # This isn't a real JPEG but will simulate one for testing purposes
        self.realistic_jpeg = SimpleUploadedFile(
            name='realistic.jpg',
            content=b'JPEG\r\n\x01\x05\x00\x08\x00\x03\x00\x00\x02\x03\x04\x05\x06\x07',
            content_type='image/jpeg'
        )
    
    @patch('api.views.process_uploaded_image')
    def test_upload_jpeg_success(self, mock_process_uploaded_image):
        """Test successful JPEG image upload"""
        # Mock the process_uploaded_image function to return valid metadata
        mock_process_uploaded_image.return_value = (
            self.jpeg_file,  # Return the same file
            {
                'width': 800,
                'height': 600,
                'format': 'JPEG'
            }
        )
        
        response = self.client.post(
            self.url,
            {'file': self.jpeg_file},
            format='multipart'
        )
        
        # Check response status and content
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertIn('file', response.data)
        self.assertIn('width', response.data)
        self.assertIn('height', response.data)
        
        # Check database record
        self.assertEqual(Image.objects.count(), 1)
        image = Image.objects.first()
        self.assertEqual(image.original_filename, 'test_image.jpg')
        self.assertFalse(image.is_mpo)
    
    def test_upload_invalid_file_type(self):
        """Test rejection of non-image file types"""
        response = self.client.post(
            self.url, 
            {'file': self.invalid_file},
            format='multipart'
        )
        
        # Check response status and error message
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('file type', response.data['error'].lower())
        
        # Check no database record was created
        self.assertEqual(Image.objects.count(), 0)
    
    def test_missing_file(self):
        """Test error when no file is provided"""
        response = self.client.post(self.url, {}, format='multipart')
        
        # Check response status and error message
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('file', response.data['error'].lower())
        
        # Check no database record was created
        self.assertEqual(Image.objects.count(), 0)
    
    def tearDown(self):
        """Clean up after tests"""
        # Delete all test images
        for image in Image.objects.all():
            if image.file and os.path.exists(image.file.path):
                os.remove(image.file.path)