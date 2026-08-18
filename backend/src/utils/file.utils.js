import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

/**
 * Safely extracts a ZIP file to a target destination directory with Zip Slip protection.
 * @param {string} zipFilePath - Absolute path to the uploaded ZIP file.
 * @param {string} destinationDir - Absolute path to extract files into.
 */
export function safeExtractZip(zipFilePath, destinationDir) {
  if (!fs.existsSync(zipFilePath)) {
    throw new Error('ZIP file not found');
  }

  // Ensure destination root exists
  fs.mkdirSync(destinationDir, { recursive: true });

  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  const normalizedDest = path.normalize(destinationDir) + path.sep;

  for (const entry of zipEntries) {
    // Prevent Zip Slip vulnerability
    const targetPath = path.join(destinationDir, entry.entryName);
    const normalizedTarget = path.normalize(targetPath);

    if (
      !normalizedTarget.startsWith(normalizedDest) &&
      normalizedTarget !== path.normalize(destinationDir)
    ) {
      throw new Error(`Security Exception: Path traversal attempt detected in ZIP entry "${entry.entryName}"`);
    }

    if (entry.isDirectory) {
      fs.mkdirSync(normalizedTarget, { recursive: true });
    } else {
      const parentDir = path.dirname(normalizedTarget);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(normalizedTarget, entry.getData());
    }
  }
}

/**
 * Clean up temporary files or folders safely
 * @param {string} targetPath
 */
export function removeFileOrFolder(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}
