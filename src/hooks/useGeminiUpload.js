import { useState } from 'react';

export function useGeminiUpload() {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [uploadedScreenshots, setUploadedScreenshots] = useState([]);

    const handleScreenshotUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress(10);
        setProgressText('Uploading images...');

        const newScreenshots = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            await new Promise((resolve) => {
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    newScreenshots.push({
                        file: file,
                        data: imageData,
                        base64: imageData.split(',')[1]
                    });
                    resolve();
                };
                reader.readAsDataURL(file);
            });

            setUploadProgress(10 + ((i + 1) / files.length) * 30);
        }

        setUploadedScreenshots(prev => [...prev, ...newScreenshots]);
        setUploading(false);
        setUploadProgress(0);
    };

    const removeUploadedImage = (index) => {
        setUploadedScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const processScreenshotsWithGemini = async (fillExtractedData) => {
        if (uploadedScreenshots.length === 0) {
            alert("Please upload at least one screenshot first.");
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setProgressText('Initializing AI...');

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                alert('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
                setUploading(false);
                return;
            }

            setUploadProgress(20);
            setProgressText('Analyzing screenshots...');

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const parts = [
                {
                    text: `You are an expert at extracting academic grade data from screenshots. 
                    
Analyze these grade sheet screenshots and extract all course information. For each course, identify:
1. Course code (e.g., CSE101, MAT201, INT108, etc.)
2. Course name/title
3. Grade received (O, A+, A, B+, B, C, D, E, F, G, or I for incomplete)

NOTE: Do NOT try to extract credits/credit hours - they are not visible in these screenshots.

Return the data in this exact JSON format:
{
  "terms": [
    {
      "termNumber": 1,
      "courses": [
        {
          "code": "CSE101",
          "name": "ORIENTATION TO COMPUTING-I",
          "grade": "A+"
        },
        {
          "code": "INT108",
          "name": "PYTHON PROGRAMMING",
          "grade": "A+"
        }
      ]
    }
  ]
}

Important:
- Group courses by term/semester based on the "Semester:" header (I, II, III, IV, etc.)
- Extract the semester number from headers like "Semester:I" (1), "Semester:II" (2), etc.
- Only use valid grades: O, A+, A, B+, B, C, D, E, F, G, I
- Extract ALL courses visible in the images
- Do NOT include credits field
- Return ONLY valid JSON, no additional text`
                }
            ];

            uploadedScreenshots.forEach((screenshot) => {
                parts.push({
                    inlineData: {
                        mimeType: screenshot.file.type,
                        data: screenshot.base64
                    }
                });
            });

            const requestBody = {
                contents: [{
                    parts: parts
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 4096,
                }
            };

            setUploadProgress(40);

            // Retry logic
            let retries = 0;
            const maxRetries = 3;
            let result;

            while (retries <= maxRetries) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });

                    if (response.status === 429) {
                        retries++;
                        if (retries > maxRetries) throw new Error('Rate limit exceeded. Please wait a few minutes and try again with fewer images.');
                        const waitTime = Math.pow(2, retries) * 1000;
                        setProgressText(`Rate limit hit. Retrying in ${waitTime / 1000}s...`);
                        await new Promise(r => setTimeout(r, waitTime));
                        continue;
                    }

                    if (!response.ok) {
                        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
                    }

                    result = await response.json();
                    break;
                } catch (err) {
                    if (retries >= maxRetries) throw err;
                    retries++;
                    const waitTime = Math.pow(2, retries) * 1000;
                    setProgressText(`Connection error. Retrying in ${waitTime / 1000}s...`);
                    await new Promise(r => setTimeout(r, waitTime));
                }
            }

            setUploadProgress(80);
            setProgressText('Processing data...');

            const generatedText = result.candidates[0].content.parts[0].text;
            let jsonText = generatedText.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
            }

            const extractedData = JSON.parse(jsonText);

            setUploadProgress(90);
            setProgressText('Filling grades...');

            await fillExtractedData(extractedData);

            setUploadProgress(100);
            setProgressText('Complete! Data has been filled in.');

            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                setUploadedScreenshots([]);
                alert('Successfully extracted and filled data from screenshots!');
            }, 2000);

            return true;

        } catch (error) {
            console.error(error);
            let errorMessage = error.message;
            if (errorMessage.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please wait a few minutes.';
            } else if (errorMessage.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            alert(`Error: ${errorMessage}`);
            setUploading(false);
            return false;
        }
    };

    return {
        uploading,
        uploadProgress,
        progressText,
        uploadedScreenshots,
        handleScreenshotUpload,
        removeUploadedImage,
        processScreenshotsWithGemini
    };
}
