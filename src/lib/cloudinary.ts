const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = 'pantryveda_preset'; 

export async function uploadToCloudinary(imageData: string): Promise<string | null> {
  if (!CLOUD_NAME) {
    console.error("Cloudinary Cloud Name not configured.");
    return null;
  }
  
  try {
    // Convert Data URI to Blob
    const blob = await dataURItoBlob(imageData);
    
    const formData = new FormData();
    formData.append('file', blob, 'failed-scan.jpg');
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error response:', errorData);
      throw new Error(`Failed to upload image: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

// Helper function to convert Data URI to Blob
function dataURItoBlob(dataURI: string): Promise<Blob> {
  return fetch(dataURI).then(res => res.blob());
}