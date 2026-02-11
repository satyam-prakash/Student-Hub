# Fixing 401 Unauthorized Error

## The Problem

You're getting a **401 Unauthorized** error when trying to view documents. This means:
- The Cloudinary files are **private** by default
- The browser can't access them in an iframe
- You need to configure your Cloudinary upload preset to make files **public**

## Solution: Update Cloudinary Upload Preset

You need to update your `notes_upload` preset in Cloudinary to make files publicly accessible.

### Steps to Fix:

1. **Go to Cloudinary Dashboard**
   - Visit: https://cloudinary.com/console
   - Log in to your account

2. **Navigate to Upload Presets**
   - Click on **Settings** (gear icon)
   - Click on **Upload** tab
   - Find your `notes_upload` preset

3. **Edit the Preset**
   - Click **Edit** on the `notes_upload` preset
   - Find **Delivery type** setting
   - Change it to: **Upload** (not "Authenticated" or "Private")
   - **Save** the preset

4. **Alternative: Create New Preset**
   If you don't have the preset yet:
   - Click **Add upload preset**
   - Name it: `notes_upload`
   - Set **Signing Mode**: Unsigned
   - Set **Delivery type**: Upload
   - Set **Folder**: `student-hub/notes`
   - **Save**

## Why This Happens

Cloudinary has three delivery types:
- **Upload** (Public) - Anyone can access the URL ✅
- **Private** - Requires authentication ❌
- **Authenticated** - Requires signed URLs ❌

For viewing files in iframes, you need **Upload (Public)** delivery type.

## After Fixing

1. **Upload a new file** to test
2. **Click "View"** on the new file
3. **Document should load** without 401 errors

**Note:** Old files uploaded before this fix will still have 401 errors. You'll need to re-upload them or manually change their delivery type in Cloudinary.

## Quick Test

After updating the preset, try uploading a new PDF or DOCX file and viewing it. It should work without errors!
