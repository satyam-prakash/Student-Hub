# URGENT: Fix Cloudinary 401 Error - Step by Step

## The Problem
Your Cloudinary files are **PRIVATE** and returning **401 Unauthorized** errors. This is why BOTH Download and View buttons don't work.

## IMMEDIATE FIX REQUIRED

### Step 1: Go to Cloudinary Dashboard
1. Open: **https://cloudinary.com/console**
2. Log in with your account

### Step 2: Go to Settings
1. Click the **Settings** icon (⚙️) in the top right
2. Click on the **Upload** tab

### Step 3: Find or Create Upload Preset
Look for a preset named `notes_upload`:

**If it EXISTS:**
1. Click **Edit** next to `notes_upload`
2. Scroll down to find **Access Control**
3. Change **Access mode** to: **Public**
4. Click **Save**

**If it DOESN'T EXIST:**
1. Click **Add upload preset** button
2. Fill in:
   - **Preset name**: `notes_upload`
   - **Signing mode**: **Unsigned**
   - **Folder**: `student-hub/notes`
   - **Access mode**: **Public** (IMPORTANT!)
3. Click **Save**

### Step 4: Test with New Upload
1. Go back to your app
2. **Refresh the browser** (Ctrl + R)
3. **Upload a NEW file**
4. Try to view/download it

## Why This Happens

Cloudinary has two access modes:
- **Public** ✅ - Anyone can access files (what you need)
- **Authenticated** ❌ - Requires signed URLs (causing 401 errors)

Your current preset is set to **Authenticated**, which is why you're getting 401 errors.

## Important Notes

⚠️ **Old files will still have 401 errors** - They were uploaded with authenticated access
✅ **New files will work** - After you change the preset to Public

## Alternative: Make Existing Files Public

If you want to fix old files:
1. Go to **Media Library** in Cloudinary
2. Find your uploaded files in `student-hub/notes`
3. Click on each file
4. Change **Access mode** to **Public**
5. Click **Save**

## After Fixing

Both **View** and **Download** buttons will work perfectly!
