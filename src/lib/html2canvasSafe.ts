import { toPng } from 'html-to-image';

/**
 * Safely calls image generator using html-to-image to preserve layouts perfectly.
 */
export async function html2canvasSafe(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  const scale = options.scale || 3;
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  
  // Create an image using html-to-image
  // This library properly handles Arabic text rendering natively in the browser via SVG foreignObject.
  const dataUrl = await toPng(element, {
    quality: 1,
    backgroundColor: options.backgroundColor || '#121212',
    style: {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: `${width}px`,
      height: `${height}px`
    },
    width: width * scale,
    height: height * scale,
  });

  // Now create a canvas from that dataUrl (mocking html2canvas return)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
