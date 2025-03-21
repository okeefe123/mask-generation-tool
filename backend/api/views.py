"""
Views for the mask_generator API.

These views handle the HTTP requests for our API endpoints.
"""
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Image, Mask
from .serializers import ImageSerializer, MaskSerializer
from .utils.image_processing import process_uploaded_image
import os
import json
from django.conf import settings
import glob
from PIL import Image as PILImage

# Helper functions for filesystem-based image and mask tracking
def get_all_images_from_filesystem():
    """Get all images from the filesystem."""
    image_dir = os.path.join(settings.MEDIA_ROOT, 'images')
    image_files = []
    
    # Ensure directory exists
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)
    
    # Get all image files
    for ext in ['*.jpg', '*.jpeg', '*.png']:
        image_files.extend(glob.glob(os.path.join(image_dir, ext)))
    
    images = []
    for img_path in image_files:
        filename = os.path.basename(img_path)
        try:
            # Get image dimensions
            with PILImage.open(img_path) as img:
                width, height = img.size
            
            # Create image dict that mimics the model serializer output
            images.append({
                'id': filename,  # Use filename as ID
                'file': f"/media/images/{filename}",
                'original_filename': filename,
                'width': width,
                'height': height,
                'uploaded_at': os.path.getctime(img_path),  # Creation time as upload time
                'is_mpo': filename.lower().endswith('.mpo')
            })
        except Exception as e:
            print(f"Error processing image {filename}: {e}")
    
    return images

def get_all_masks_from_filesystem():
    """Get all masks from the filesystem."""
    mask_dir = os.path.join(settings.MEDIA_ROOT, 'masks')
    mask_files = []
    
    # Ensure directory exists
    if not os.path.exists(mask_dir):
        os.makedirs(mask_dir)
    
    # Get all mask files
    for ext in ['*.jpg', '*.jpeg', '*.png']:
        mask_files.extend(glob.glob(os.path.join(mask_dir, ext)))
    
    masks = []
    for mask_path in mask_files:
        filename = os.path.basename(mask_path)
        try:
            # Get mask dimensions
            with PILImage.open(mask_path) as img:
                width, height = img.size
            
            # Create mask dict that mimics the model serializer output
            masks.append({
                'id': filename,  # Use filename as ID
                'file': f"/media/masks/{filename}",
                'image_filename': filename,  # Same base name as the image
                'original_width': width,
                'original_height': height,
                'created_at': os.path.getctime(mask_path)  # Creation time
            })
        except Exception as e:
            print(f"Error processing mask {filename}: {e}")
    
    return masks

def check_mask_exists_for_image(image_filename):
    """Check if a mask exists for a given image filename."""
    # Get base filename without extension
    base_filename = os.path.splitext(os.path.basename(image_filename))[0]
    
    # Check if any mask file exists with the same base name
    mask_dir = os.path.join(settings.MEDIA_ROOT, 'masks')
    
    # Ensure directory exists
    if not os.path.exists(mask_dir):
        return False
    
    # Look for any mask with the same base name
    for ext in ['.jpg', '.jpeg', '.png']:
        if os.path.exists(os.path.join(mask_dir, f"{base_filename}{ext}")):
            return True
    
    return False

class ImageUploadView(APIView):
    """
    View for handling image uploads.
    
    This endpoint accepts image files, validates them,
    saves them to the media directory, and returns the image data.
    
    Allowed file types: JPEG, MPO (will be converted to JPEG)
    """
    def post(self, request, format=None):
        # Check if a file was uploaded
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        uploaded_file = request.FILES['file']
        
        # Validate file type
        if not (uploaded_file.content_type.startswith('image/jpeg') or
                uploaded_file.name.lower().endswith('.mpo')):
            return Response({'error': 'Invalid file type. Only JPEG and MPO images are supported.'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Process the uploaded file - convert MPO to JPEG if needed and extract metadata
            processed_file, metadata = process_uploaded_image(uploaded_file)
            
            # Check if the file was originally MPO
            is_mpo = uploaded_file.name.lower().endswith('.mpo') or (
                'format' in metadata and metadata['format'] == 'MPO'
            )
            
            # Create the image object with the processed file and extracted metadata
            # COMMENTED: Database operation
            """
            image = Image.objects.create(
                file=processed_file,
                original_filename=uploaded_file.name,
                width=metadata['width'],
                height=metadata['height'],
                is_mpo=is_mpo,
            )
            
            # Store the metadata
            image.set_metadata(metadata)
            image.save()
            """
            
            # Instead, save the file directly to the filesystem
            image_dir = os.path.join(settings.MEDIA_ROOT, 'images')
            if not os.path.exists(image_dir):
                os.makedirs(image_dir)
                
            # Save the file
            filename = os.path.basename(processed_file.name)
            with open(os.path.join(image_dir, filename), 'wb+') as destination:
                for chunk in processed_file.chunks():
                    destination.write(chunk)
            
            # Create a response that mimics the serializer output
            response_data = {
                'id': filename,  # Use filename as ID
                'file': f"/media/images/{filename}",
                'image_url': f"/media/images/{filename}",  # For backward compatibility
                'original_filename': uploaded_file.name,
                'width': metadata['width'],
                'height': metadata['height'],
                'uploaded_at': os.path.getctime(os.path.join(image_dir, filename)),
                'is_mpo': is_mpo
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Handle any errors during processing or saving
            print(f"Error processing/saving image: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ImageListView(APIView):
    """
    View for listing all images.
    
    This endpoint returns a list of all images stored in the system,
    including their URLs, dimensions, and other metadata.
    """
    def get(self, request, format=None):
        # COMMENTED: Database operation
        """
        # Get all images
        images = Image.objects.all()
        
        # Serialize the images
        serializer = ImageSerializer(images, many=True)
        
        # Return the serialized data
        return Response(serializer.data)
        """
        
        # Instead, get images from filesystem
        images = get_all_images_from_filesystem()
        return Response(images)


class MaskSaveView(APIView):
    """
    View for handling mask saving.
    
    This endpoint accepts mask files, associates them with existing images,
    and handles any necessary resizing metadata.
    """
    def post(self, request, format=None):
        # Validate required fields are present
        errors = {}
        
        if 'file' not in request.FILES:
            errors['file'] = ["No mask file provided"]
        
        if 'image' not in request.data:
            errors['image'] = ["Image ID is required"]
        
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        # COMMENTED: Database validation
        """
        # Validate image ID exists
        try:
            image_id = request.data.get('image')
            image = Image.objects.get(pk=image_id)
        except Image.DoesNotExist:
            return Response({'image': ["Image with this ID does not exist"]},
                          status=status.HTTP_400_BAD_REQUEST)
        """
        
        # Instead, validate image exists in filesystem
        image_id = request.data.get('image')
        image_filename = image_id  # In filesystem approach, ID might be the filename
        
        # Get image details from filesystem
        image_dir = os.path.join(settings.MEDIA_ROOT, 'images')
        image_path = None
        
        # Check if image_id is a filename
        if os.path.exists(os.path.join(image_dir, image_id)):
            image_path = os.path.join(image_dir, image_id)
        else:
            # Try to find the image by ID in our filesystem list
            images = get_all_images_from_filesystem()
            for img in images:
                if str(img['id']) == str(image_id):
                    image_path = os.path.join(image_dir, img['original_filename'])
                    image_filename = img['original_filename']
                    break
        
        if not image_path or not os.path.exists(image_path):
            return Response({'image': ["Image with this ID does not exist"]},
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get dimensions from image file
            with PILImage.open(image_path) as img:
                width, height = img.size
        except Exception as e:
            return Response({'image': [f"Error reading image: {str(e)}"]},
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get mask data
        mask_file = request.FILES['file']
        
        # Save the mask file directly
        try:
            # Get base filename without extension
            base_filename = os.path.splitext(os.path.basename(image_filename))[0]
            mask_ext = os.path.splitext(mask_file.name)[1].lower() or '.png'
            
            # Ensure mask directory exists
            mask_dir = os.path.join(settings.MEDIA_ROOT, 'masks')
            if not os.path.exists(mask_dir):
                os.makedirs(mask_dir)
            
            # Use the same base filename as the image for the mask
            mask_filename = f"{base_filename}{mask_ext}"
            mask_path = os.path.join(mask_dir, mask_filename)
            
            # Save the mask file
            with open(mask_path, 'wb+') as destination:
                for chunk in mask_file.chunks():
                    destination.write(chunk)
            
            # COMMENTED: Database operation
            """
            # Create the mask object
            mask = Mask.objects.create(
                file=mask_file,
                image=image,
                original_width=width,
                original_height=height
            )
            
            # Return serialized data
            serializer = MaskSerializer(mask)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            """
            
            # Create a response that mimics the serializer output
            response_data = {
                'id': mask_filename,
                'file': f"/media/masks/{mask_filename}",
                'image_filename': image_filename,
                'original_width': width,
                'original_height': height,
                'created_at': os.path.getctime(mask_path)
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MaskListView(APIView):
    """
    View for listing all masks.
    
    This endpoint returns a list of all masks stored in the system,
    including their URLs, associated images, and dimensions.
    """
    def get(self, request, format=None):
        # COMMENTED: Database operation
        """
        # Get all masks
        masks = Mask.objects.all()
        
        # Serialize the masks
        serializer = MaskSerializer(masks, many=True)
        
        # Return the serialized data
        return Response(serializer.data)
        """
        
        # Instead, get masks from filesystem
        masks = get_all_masks_from_filesystem()
        return Response(masks)


class MaskCheckView(APIView):
    """
    View for checking if an image has a mask.
    
    This endpoint checks if a mask exists for a given image filename.
    It's used by the frontend to filter images that already have masks.
    """
    def get(self, request, filename, format=None):
        # COMMENTED: Database check
        """
        # Strip any path and get just the filename without extension
        base_filename = os.path.splitext(os.path.basename(filename))[0]
        
        # Check if any mask's filename matches the image
        mask_exists = Mask.objects.filter(
            image__original_filename__startswith=base_filename
        ).exists()
        """
        
        # Instead, check if mask exists in filesystem
        mask_exists = check_mask_exists_for_image(filename)
        
        # Return the result
        return Response({'hasMask': mask_exists})


class ImageDetailView(APIView):
    """
    View for retrieving image details.
    
    This endpoint returns detailed information about a specific image,
    including its file URL, dimensions, and other metadata.
    """
    def get(self, request, pk, format=None):
        # COMMENTED: Database operation
        """
        try:
            # Attempt to retrieve the image by ID
            image = Image.objects.get(pk=pk)
            
            # Serialize the image data
            serializer = ImageSerializer(image)
            
            # Return serialized data
            return Response(serializer.data)
            
        except Image.DoesNotExist:
            # Return 404 if image with given ID doesn't exist
            return Response(
                {"error": f"Image with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        """
        
        # Instead, get image details from filesystem
        images = get_all_images_from_filesystem()
        for img in images:
            if str(img['id']) == str(pk):
                return Response(img)
        
        # Return 404 if image with given ID doesn't exist
        return Response(
            {"error": f"Image with ID {pk} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
