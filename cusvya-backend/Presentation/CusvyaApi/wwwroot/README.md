# Static Files - wwwroot

This directory serves static files for the Blush API.

## Directory Structure

```
wwwroot/
??? models/          # Model images (auto-created)
??? README.md        # This file
```

## Models Directory

The `models/` directory stores uploaded model images. Images are automatically:
- Created from base64 strings sent in API requests
- Saved as `.jpg` files with unique GUID names
- Accessible via `/models/{filename}.jpg` URL path
- Deleted when the associated model is updated or removed

## Usage

### Upload Image via API

When creating or updating a model, include the `imageBase64` field:

```json
{
  "title": "Evening Glam",
  "modelCategoryId": 1,
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "price": 150.00
}
```

The API will:
1. Decode the base64 string
2. Save it as a `.jpg` file in `wwwroot/models/`
3. Update the `imagePath` field with the relative path (e.g., `/models/abc123.jpg`)
4. Return the complete model with the saved path

### Access Images

Images are accessible via:
```
http://localhost:4080/models/{filename}.jpg
```

Example:
```
http://localhost:4080/models/12345678-1234-1234-1234-123456789abc.jpg
```

## Notes

- Images are stored as JPEG format
- File names are UUIDs to prevent collisions
- Old images are automatically deleted when updating models
- Directory is created automatically on application startup
