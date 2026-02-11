# Quick Debug Test

## Test if buttons are working:

1. **Open browser console** (Press F12)
2. **Go to Console tab**
3. **Click on View or Download button**
4. **Check for any error messages**

## Common issues to check:

### Check if note.file_url exists:
- Open console (F12)
- Type: `console.log(document.querySelector('.card'))`
- See if the note data has `file_url`

### Possible issues:
1. **note.file_url is undefined** - The URL isn't being saved properly
2. **onDownload is not a function** - The parent component isn't passing the function
3. **Pop-up blocker** - Browser is blocking `window.open()`

## Quick Fix to Test:

Try clicking the Download button and check:
- Does a new tab try to open?
- Does the browser show a "pop-up blocked" message?
- Are there any red errors in the console?

Let me know what you see in the console when you click the buttons!
