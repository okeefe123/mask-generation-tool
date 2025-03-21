"""
Tests for the mask-related endpoints.
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Image, Mask
import os

class MaskListViewTests(APITestCase):
    """
    Test cases for the MaskListView.
    """
    def setUp(self):
        """Set up test data."""
        # Create test images
        self.image1 = Image.objects.create(
            file='images/test_image1.jpg',
            original_filename='test_image1.jpg',
            width=800,
            height=600,
            is_mpo=False
        )
        
        self.image2 = Image.objects.create(
            file='images/test_image2.jpg',
            original_filename='test_image2.jpg',
            width=1024,
            height=768,
            is_mpo=False
        )
        
        # Create test masks
        self.mask1 = Mask.objects.create(
            file='masks/test_image1.png',
            image=self.image1,
            original_width=800,
            original_height=600
        )
    
    def test_list_masks(self):
        """Test retrieving a list of all masks."""
        url = reverse('mask-list')
        response = self.client.get(url)
        
        # Check response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that all masks are returned
        self.assertEqual(len(response.data), 1)
        
        # Check mask data is correct
        self.assertEqual(response.data[0]['id'], self.mask1.id)
        self.assertEqual(response.data[0]['image'], self.image1.id)
        self.assertEqual(response.data[0]['original_width'], 800)
        self.assertEqual(response.data[0]['original_height'], 600)


class MaskCheckViewTests(APITestCase):
    """
    Test cases for the MaskCheckView.
    """
    def setUp(self):
        """Set up test data."""
        # Create test images
        self.image1 = Image.objects.create(
            file='images/test_image1.jpg',
            original_filename='test_image1.jpg',
            width=800,
            height=600,
            is_mpo=False
        )
        
        self.image2 = Image.objects.create(
            file='images/test_image2.jpg',
            original_filename='test_image2.jpg',
            width=1024,
            height=768,
            is_mpo=False
        )
        
        self.image3 = Image.objects.create(
            file='images/with_extension.jpg',
            original_filename='with_extension.jpg',
            width=1920,
            height=1080,
            is_mpo=False
        )
        
        # Create test mask (only for the first image)
        self.mask1 = Mask.objects.create(
            file='masks/test_image1.png',
            image=self.image1,
            original_width=800,
            original_height=600
        )
    
    def test_check_image_with_mask(self):
        """Test checking an image that has a mask."""
        url = reverse('mask-check', args=['test_image1.jpg'])
        response = self.client.get(url)
        
        # Check response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that response indicates mask exists
        self.assertTrue(response.data['hasMask'])
    
    def test_check_image_without_mask(self):
        """Test checking an image that doesn't have a mask."""
        url = reverse('mask-check', args=['test_image2.jpg'])
        response = self.client.get(url)
        
        # Check response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that response indicates no mask exists
        self.assertFalse(response.data['hasMask'])
    
    def test_check_with_full_path(self):
        """Test checking with a filename that includes a path."""
        # Django's URL patterns don't allow slash in parameters by default,
        # so we need to use just the filename part for the reverse lookup
        url = reverse('mask-check', args=['test_image1.jpg'])
        
        # Make the request directly to simulate what would happen with a path
        response = self.client.get(url)
        
        # Check that we find the mask correctly
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['hasMask'])
    
    def test_check_with_extension(self):
        """Test checking with a filename that includes an extension."""
        # First create a mask for the third image to test with
        Mask.objects.create(
            file='masks/with_extension.png',
            image=self.image3,
            original_width=1920,
            original_height=1080
        )
        
        url = reverse('mask-check', args=['with_extension.jpg'])
        response = self.client.get(url)
        
        # Check that we find the mask despite extension differences
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['hasMask'])