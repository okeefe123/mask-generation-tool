import os
import io
import tempfile
from PIL import Image, ExifTags
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
from django.core.files.base import ContentFile


def convert_mpo_to_jpeg(image_file):
    """
    Convert MPO files to JPEG format.
    
    Args:
        image_file: An UploadedFile object containing the image data
        
    Returns:
        A new UploadedFile object with the converted image if it was MPO,
        or the original file if it was already JPEG
    """
    # Open the image with PIL
    if isinstance(image_file, InMemoryUploadedFile):
        # For in-memory files
        image = Image.open(io.BytesIO(image_file.read()))
        # Reset file pointer
        image_file.seek(0)
    elif isinstance(image_file, TemporaryUploadedFile):
        # For files saved to disk
        image = Image.open(image_file.temporary_file_path())
    else:
        # For other file types
        image = Image.open(image_file)
    
    # Check if the image is MPO format
    if image.format == 'MPO':
        # MPO files contain multiple images, we'll extract the first one
        # Create a temporary file to save the converted image
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            # Save the first image as JPEG
            image.save(temp_file.name, 'JPEG')
            
            # Create a new file name based on the original
            new_name = os.path.splitext(image_file.name)[0] + '.jpg'
            
            # Create a new uploaded file
            with open(temp_file.name, 'rb') as f:
                content = f.read()
                
            # Clean up the temporary file
            os.unlink(temp_file.name)
            
            # Create a new file with the converted content
            converted_file = ContentFile(content, name=new_name)
            return converted_file
    
    # If it's not MPO, return the original file
    return image_file


def extract_image_metadata(image_file):
    """
    Extract metadata from an image file.
    
    Args:
        image_file: An UploadedFile object containing the image data
        
    Returns:
        A dictionary containing image metadata
    """
    # Open the image with PIL
    if isinstance(image_file, InMemoryUploadedFile):
        # For in-memory files
        image = Image.open(io.BytesIO(image_file.read()))
        # Reset file pointer
        image_file.seek(0)
    elif isinstance(image_file, TemporaryUploadedFile):
        # For files saved to disk
        image = Image.open(image_file.temporary_file_path())
    else:
        # For other file types
        image = Image.open(image_file)
    
    # Extract basic metadata
    metadata = {
        'width': image.width,
        'height': image.height,
        'format': image.format,
    }
    
    # Try to extract EXIF data if available
    try:
        exif_data = {}
        if hasattr(image, '_getexif') and image._getexif():
            exif = image._getexif()
            for tag, value in exif.items():
                tag_name = ExifTags.TAGS.get(tag, tag)
                # Make sure the value is JSON serializable
                if isinstance(value, (int, float, str, bool, type(None))):
                    exif_data[tag_name] = value
                else:
                    # Convert other types to string to ensure serializability
                    exif_data[tag_name] = str(value)
            
            metadata['exif'] = exif_data
    except (AttributeError, KeyError, IndexError):
        # EXIF data might not be available or readable
        pass
    
    return metadata


def process_uploaded_image(image_file):
    """
    Process an uploaded image file - convert if needed and extract metadata.
    
    Args:
        image_file: An UploadedFile object containing the image data
        
    Returns:
        A tuple containing (processed_file, metadata)
    """
    # First convert MPO to JPEG if needed
    processed_file = convert_mpo_to_jpeg(image_file)
    
    # Then extract metadata
    metadata = extract_image_metadata(processed_file)
    
    return processed_file, metadata