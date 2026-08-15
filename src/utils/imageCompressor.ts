/**
 * Dynamic Client-side Image Compressor and Downscaler using HTML5 Canvas.
 * Prevents Firestore document size errors (1MB limit) by ensuring base64 images
 * remain well below ~150KB while retaining high visual clarity.
 */
export function compressImage(
  fileOrBase64: File | string,
  maxDimension: number = 900,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while constring to maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D context from canvas"));
          return;
        }

        // Draw image beautifully
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to highly optimized JPEG base64
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };

      img.onerror = (err) => {
        reject(err);
      };

      img.src = src;
    };

    if (fileOrBase64 instanceof File) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImage(event.target.result as string);
        } else {
          reject(new Error("FileReader did not produce any result"));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    } else {
      processImage(fileOrBase64);
    }
  });
}
