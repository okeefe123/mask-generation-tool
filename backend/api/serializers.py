"""
Serializers for the mask_generator API.

This file defines serializers that convert between Django models and JSON.
"""
from rest_framework import serializers
from .models import Image, Mask


class ImageSerializer(serializers.ModelSerializer):
    """
    Serializer for the Image model.
    
    This serializer handles:
    - Converting Image model instances to JSON for API responses
    - Validating input data for creating Image instances
    """
    metadata = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    def get_metadata(self, obj):
        """Return the metadata dictionary."""
        return obj.metadata
    
    def get_image_url(self, obj):
        """Return the image URL."""
        if obj.file:
            return obj.file.url
        return None
    
    class Meta:
        model = Image
        fields = ['id', 'file', 'image_url', 'original_filename', 'width', 'height',
                 'uploaded_at', 'is_mpo', 'metadata']
        read_only_fields = ['id', 'uploaded_at', 'is_mpo', 'metadata', 'image_url']


class MaskSerializer(serializers.ModelSerializer):
    """
    Serializer for the Mask model.
    
    This serializer handles:
    - Converting Mask model instances to JSON for API responses
    - Validating input data for creating Mask instances
    """
    class Meta:
        model = Mask
        fields = ['id', 'file', 'image', 'created_at', 'original_width', 'original_height']
        read_only_fields = ['id', 'created_at']