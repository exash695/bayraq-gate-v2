import { pdfjs } from "react-pdf";
import * as pdfjsDist from "pdfjs-dist";

// Ensure worker is always pointed to the public static worker file served by Vite
if (typeof window !== "undefined") {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  } catch (e) {
    console.warn("Could not set react-pdf workerSrc:", e);
  }
  try {
    pdfjsDist.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  } catch (e) {
    console.warn("Could not set pdfjs-dist workerSrc:", e);
  }
  (window as any).pdfjsWorkerSrc = "/pdf.worker.min.mjs";
}

export { pdfjs, pdfjsDist };

