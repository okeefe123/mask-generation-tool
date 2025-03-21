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
            
            # Use serializer just for the response
            serializer = ImageSerializer(image)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
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
        # Get all images
        images = Image.objects.all()
        
        # Serialize the images
        serializer = ImageSerializer(images, many=True)
        
        # Return the serialized data
        return Response(serializer.data)


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
        
        # Validate image ID exists
        try:
            image_id = request.data.get('image')
            image = Image.objects.get(pk=image_id)
        except Image.DoesNotExist:
            return Response({'image': ["Image with this ID does not exist"]},
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create mask data object
        mask_data = {
            'file': request.FILES['file'],
            'image': image.id,
            'original_width': request.data.get('original_width', image.width),
            'original_height': request.data.get('original_height', image.height)
        }
        
        # In a real implementation, we would handle mask resizing here if needed
        # to match the original image dimensions
        
        # Save the mask
        try:
            # Get the original file name from the image
            print(f"Creating mask for image: {image.original_filename}")
            
            # Create the mask object directly
            mask = Mask.objects.create(
                file=mask_data['file'],
                image=image,
                original_width=mask_data['original_width'],
                original_height=mask_data['original_height']
            )
            
            print(f"Created mask with filename: {mask.file.name}")
            
            # Return serialized data
            serializer = MaskSerializer(mask)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MaskListView(APIView):
    """
    View for listing all masks.
    
    This endpoint returns a list of all masks stored in the system,
    including their URLs, associated images, and dimensions.
    """
    def get(self, request, format=None):
        # Get all masks
        masks = Mask.objects.all()
        
        # Serialize the masks
        serializer = MaskSerializer(masks, many=True)
        
        # Return the serialized data
        return Response(serializer.data)


class MaskCheckView(APIView):
    """
    View for checking if an image has a mask.
    
    This endpoint checks if a mask exists for a given image filename.
    It's used by the frontend to filter images that already have masks.
    """
    def get(self, request, filename, format=None):
        # Strip any path and get just the filename without extension
        base_filename = os.path.splitext(os.path.basename(filename))[0]
        
        # Check if any mask's filename matches the image
        mask_exists = Mask.objects.filter(
            image__original_filename__startswith=base_filename
        ).exists()
        
        # Return the result
        return Response({'hasMask': mask_exists})


class ImageDetailView(APIView):
    """
    View for retrieving image details.
    
    This endpoint returns detailed information about a specific image,
    including its file URL, dimensions, and other metadata.
    """
    def get(self, request, pk, format=None):
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
