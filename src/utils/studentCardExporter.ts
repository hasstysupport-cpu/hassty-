import { toPng, toBlob } from 'html-to-image';
import { StudentProfile, StudentCardCustomization } from '../types';

/**
 * Exports the live rendered Student ID Card element to a crystal clear High-DPI PNG
 * ensuring 100% visual fidelity between the on-screen card and the downloaded image.
 */
export async function exportStudentCardHighResPNG(
  student: StudentProfile,
  customization?: Partial<StudentCardCustomization>,
  filename?: string,
  elementId: string = 'student-card-renderer'
): Promise<void> {
  const cardElement = document.getElementById(elementId);
  if (!cardElement) {
    console.error(`Card element with ID "${elementId}" not found for export.`);
    return;
  }

  // Preserve previous transform states
  const prevTransform = cardElement.style.transform;
  const prevTransformOrigin = cardElement.style.transformOrigin;

  try {
    // Reset transform during export snapshot to ensure full 640x380 uncropped landscape card
    cardElement.style.transform = 'none';
    cardElement.style.transformOrigin = 'top left';

    // Generate high-resolution PNG using html-to-image with 3x pixel ratio
    const dataUrl = await toPng(cardElement, {
      width: 640,
      height: 380,
      quality: 1.0,
      pixelRatio: 3, // Ultra HD (1920x1140) 300+ DPI
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: '',
      filter: (node) => {
        // Exclude any interactive tooltips or buttons if any
        if (node instanceof HTMLElement && node.classList?.contains('no-export')) {
          return false;
        }
        return true;
      },
    });

    // Trigger download
    const link = document.createElement('a');
    const safeStudentName = (student.name || 'student').trim().replace(/\s+/g, '-');
    link.download = filename || `hassty-student-card-${safeStudentName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting student card image:', error);
    throw error;
  } finally {
    // Restore UI responsive transform
    cardElement.style.transform = prevTransform;
    cardElement.style.transformOrigin = prevTransformOrigin;
  }
}
