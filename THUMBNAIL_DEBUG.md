# PDF Thumbnail Debugging Guide

## Steps to Debug

1. **Upload a new PDF file** through the Notes Upload Modal
2. **Open Browser DevTools** (F12)
3. **Check the Console tab** for these logs:
   - "Generating thumbnail for:" - shows the Cloudinary response and file type
   - "PDF Thumbnail URL:" - shows the generated thumbnail URL
   - "Thumbnail failed to load:" - shows if the thumbnail failed to load

4. **Check the Network tab** to see if the thumbnail URL is being requested and what the response is

## Expected Thumbnail URL Format

For a PDF uploaded to Cloudinary, the thumbnail URL should look like:

```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/c_fill,w_400,h_300,f_jpg,pg_1/student-hub/notes/filename.pdf
```

Key parts:
- `/image/upload/` - tells Cloudinary to convert to image
- `c_fill,w_400,h_300` - crop and resize to 400x300
- `f_jpg` - convert to JPG format
- `pg_1` - extract page 1
- `student-hub/notes/filename.pdf` - the public_id (includes .pdf extension)

## Common Issues

### Issue 1: Cloudinary Upload Preset Not Configured for PDFs

**Solution:** Check your Cloudinary upload preset settings:
1. Go to Cloudinary Dashboard → Settings → Upload
2. Find the "notes_upload" preset
3. Ensure "Resource type" is set to "Auto" (not just "Image")

### Issue 2: PDF Processing Not Enabled

**Solution:** Cloudinary's PDF to image conversion requires:
- A paid plan OR
- PDF processing enabled in your account

Check: Cloudinary Dashboard → Settings → Upload → Advanced → "Enable PDF processing"

### Issue 3: Wrong Public ID Format

If the public_id doesn't include the folder path or has incorrect format, the URL won't work.

**Check:** Look at the console log for "Generating thumbnail for:" and verify the `publicId` value.

## Manual Test

Try accessing the thumbnail URL directly in your browser:

1. Copy the "PDF Thumbnail URL" from the console
2. Paste it in a new browser tab
3. If it shows a 404 or error, the issue is with Cloudinary configuration
4. If it shows the PDF page, the issue is with how the URL is being used in the app

## Alternative: Test with a Known Cloudinary PDF

Try this test URL format with your cloud name:
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/pg_1/sample.pdf
```

If this works, your account supports PDF processing.
