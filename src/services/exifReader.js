// EXIF & File Metadata Parser for Dostflix Memory Studio
// Reads EXIF headers directly from JPEG/TIFF buffers and infers timestamps from filenames and file properties.

// Detect if a file is HEIC / HEIF format via extension, MIME, or ISOBMFF ftyp magic bytes
export async function isHeicFile(file) {
  if (!file) return false;
  const name = file.name || '';
  if (name.match(/\.(heic|heif)$/i)) return true;
  const type = file.type || '';
  if (type.includes('heic') || type.includes('heif')) return true;

  try {
    if (typeof file.slice === 'function') {
      const slice = await readFileSlice(file, 0, 32);
      if (slice && slice.byteLength >= 12) {
        const view = new DataView(slice);
        // Check for 'ftyp' at offset 4 (0x66747970)
        if (view.getUint8(4) === 0x66 && view.getUint8(5) === 0x74 &&
            view.getUint8(6) === 0x79 && view.getUint8(7) === 0x70) {
          const brand = String.fromCharCode(
            view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)
          ).toLowerCase();
          const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'];
          if (heicBrands.includes(brand)) return true;

          for (let offset = 16; offset <= slice.byteLength - 4; offset += 4) {
            const compBrand = String.fromCharCode(
              view.getUint8(offset), view.getUint8(offset+1), view.getUint8(offset+2), view.getUint8(offset+3)
            ).toLowerCase();
            if (heicBrands.includes(compBrand)) return true;
          }
        }
      }
    }
  } catch (e) {}

  return false;
}

// Helper to apply EXIF fields to metadata result
function applyExifToResult(exif, result) {
  if (!exif) return;
  if (exif.dateTimeOriginal) {
    result.captureDate = exif.dateTimeOriginal;
    result.captureDateSource = 'exif';
    result.isVerifiedMetadata = true;
  }
  if (exif.cameraMake) result.cameraMake = exif.cameraMake;
  if (exif.cameraModel) result.cameraModel = exif.cameraModel;
  if (exif.gps) {
    result.gps = exif.gps;
    result.isVerifiedMetadata = true;
  }
}

export async function extractFileMetadata(file) {
  const result = {
    originalFilename: file.name,
    fileType: file.type || 'unknown',
    fileSize: file.size,
    lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    folderName: extractFolderFromPath(file.webkitRelativePath || ''),
    captureDate: null,
    captureDateSource: 'none', // 'exif' | 'filename' | 'lastModified'
    isVerifiedMetadata: false,
    cameraMake: null,
    cameraModel: null,
    gps: null, // { latitude, longitude }
    locationName: null,
  };

  const isHeic = await isHeicFile(file);
  const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || Boolean(file.name && file.name.match(/\.(jpe?g|tiff?)$/i));

  // Attempt EXIF parsing for JPEG/TIFF
  if (isJpeg) {
    try {
      const buffer = await readFileSlice(file, 0, 131072); // Read first 128KB
      const exif = parseExifFromBuffer(buffer);
      applyExifToResult(exif, result);
    } catch (e) {
      // EXIF parse failures are non-fatal
    }
  } else if (isHeic) {
    // Attempt EXIF parsing for HEIC/HEIF files (read first 512KB)
    try {
      const buffer = await readFileSlice(file, 0, Math.min(524288, file.size));
      const exif = parseExifFromHeicBuffer(buffer);
      applyExifToResult(exif, result);
    } catch (e) {
      // Non-fatal
    }
  }

  // If no EXIF capture date was found, try smart filename parsing
  if (!result.captureDate) {
    const filenameDate = extractDateFromFilename(file.name);
    if (filenameDate) {
      result.captureDate = filenameDate;
      result.captureDateSource = 'filename';
    } else if (file.lastModified) {
      result.captureDate = new Date(file.lastModified).toISOString();
      result.captureDateSource = 'lastModified';
    }
  }

  return result;
}

// Slice a piece of the file as an ArrayBuffer
function readFileSlice(file, start, end) {
  if (typeof file.slice === 'function') {
    const slice = file.slice(start, Math.min(end, file.size));
    if (typeof slice.arrayBuffer === 'function') {
      return slice.arrayBuffer();
    }
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader not available'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    const slice = file.slice(start, Math.min(end, file.size));
    reader.readAsArrayBuffer(slice);
  });
}

// Extract folder from webkitRelativePath
function extractFolderFromPath(path) {
  if (!path) return '';
  const parts = path.split(/[\/\\]/);
  return parts.length > 1 ? parts[parts.length - 2] : '';
}

// Parses dates formatted in common naming conventions:
// - "WhatsApp Image 2026-07-30 at 6.42.12 PM"
// - "IMG_20260730_184212"
// - "VID_2026-07-30"
// - "20260730_142010"
// - "2026-07-30"
export function extractDateFromFilename(name) {
  if (!name) return null;

  // 1. WhatsApp format: "WhatsApp Image 2026-07-30 at 6.42.12 PM"
  const waMatch = name.match(/(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?\s*(AM|PM)?/i);
  if (waMatch) {
    let [_, year, month, day, hour, minute, second, meridian] = waMatch;
    let h = parseInt(hour, 10);
    if (meridian) {
      if (meridian.toUpperCase() === 'PM' && h < 12) h += 12;
      if (meridian.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    const d = new Date(year, parseInt(month, 10) - 1, day, h, parseInt(minute, 10), second ? parseInt(second, 10) : 0);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // 2. Dash/Dot format: YYYY-MM-DD or YYYY.MM.DD
  const dashMatch = name.match(/(?:^|[_\-\s])(\d{4})[-.](\d{2})[-.](\d{2})(?:[_\-\sT](\d{2})[-.](\d{2})[-.](\d{2}))?/);
  if (dashMatch) {
    const [_, year, month, day, h, m, s] = dashMatch;
    const d = new Date(year, parseInt(month, 10) - 1, day, h ? parseInt(h, 10) : 12, m ? parseInt(m, 10) : 0, s ? parseInt(s, 10) : 0);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // 3. Compact camera format: "IMG_20260730_184212"
  const compactMatch = name.match(/(?:IMG|VID|PXL|PHOTO)?_?(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i);
  if (compactMatch) {
    const [_, year, month, day, h, m, s] = compactMatch;
    const d = new Date(year, parseInt(month, 10) - 1, day, parseInt(h, 10), parseInt(m, 10), parseInt(s, 10));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

// Low-level EXIF parser for JPEG files
function parseExifFromBuffer(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) {
    return null; // Not a JPEG
  }

  let offset = 2;
  const length = view.byteLength;

  while (offset < length) {
    if (offset + 4 > length) break;
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xFFE1) {
      // APP1 Marker (EXIF)
      const segmentLength = view.getUint16(offset, false);
      offset += 2;

      // Check for 'Exif\0\0'
      if (offset + 6 > length) break;
      const exifHeader = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );

      if (exifHeader === 'Exif') {
        const tiffOffset = offset + 6;
        return parseTiffHeader(view, tiffOffset);
      }
      offset += segmentLength - 2;
    } else if ((marker & 0xFF00) === 0xFF00) {
      // Other JPEG markers
      if (marker === 0xFFDA || marker === 0xFFD9) break; // SOS or EOI
      const segmentLength = view.getUint16(offset, false);
      offset += segmentLength;
    } else {
      break;
    }
  }

  return null;
}

// Low-level EXIF parser for HEIC / HEIF files
export function parseExifFromHeicBuffer(buffer) {
  if (!buffer || buffer.byteLength < 16) return null;
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  const view = new DataView(buffer);

  // 1. Search for 'Exif\0\0' (0x45, 0x78, 0x69, 0x66, 0x00, 0x00)
  for (let i = 0; i < len - 14; i++) {
    if (bytes[i] === 0x45 && bytes[i+1] === 0x78 && bytes[i+2] === 0x69 && bytes[i+3] === 0x66 &&
        bytes[i+4] === 0x00 && bytes[i+5] === 0x00) {
      const tiffOffset = i + 6;
      const parsed = parseTiffHeader(view, tiffOffset);
      if (parsed && (parsed.dateTimeOriginal || parsed.cameraMake || parsed.cameraModel || parsed.gps)) {
        return parsed;
      }
    }
  }

  // 2. Search for direct TIFF headers 'II*\0' or 'MM\0*'
  for (let i = 0; i < len - 12; i++) {
    if ((bytes[i] === 0x49 && bytes[i+1] === 0x49 && bytes[i+2] === 0x2A && bytes[i+3] === 0x00) ||
        (bytes[i] === 0x4D && bytes[i+1] === 0x4D && bytes[i+2] === 0x00 && bytes[i+3] === 0x2A)) {
      const parsed = parseTiffHeader(view, i);
      if (parsed && (parsed.dateTimeOriginal || parsed.cameraMake || parsed.cameraModel || parsed.gps)) {
        return parsed;
      }
    }
  }

  return null;
}

// Parse TIFF structure inside APP1
function parseTiffHeader(view, tiffOffset) {
  if (tiffOffset + 8 > view.byteLength) return null;

  const byteOrder = view.getUint16(tiffOffset, false);
  const isLittleEndian = byteOrder === 0x4949; // 'II'

  if (!isLittleEndian && byteOrder !== 0x4D4D) return null;

  const firstIFDOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
  if (firstIFDOffset < 8) return null;

  const result = {
    dateTimeOriginal: null,
    cameraMake: null,
    cameraModel: null,
    gps: null
  };

  const ifd0 = tiffOffset + firstIFDOffset;
  let exifIFDOffset = null;
  let gpsIFDOffset = null;

  // Read IFD0 entries
  if (ifd0 + 2 <= view.byteLength) {
    const numEntries = view.getUint16(ifd0, isLittleEndian);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0 + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;
      const tag = view.getUint16(entryOffset, isLittleEndian);

      if (tag === 0x010F) { // Make
        result.cameraMake = readString(view, entryOffset, tiffOffset, isLittleEndian);
      } else if (tag === 0x0110) { // Model
        result.cameraModel = readString(view, entryOffset, tiffOffset, isLittleEndian);
      } else if (tag === 0x8769) { // Exif IFD Pointer
        exifIFDOffset = view.getUint32(entryOffset + 8, isLittleEndian);
      } else if (tag === 0x8825) { // GPS IFD Pointer
        gpsIFDOffset = view.getUint32(entryOffset + 8, isLittleEndian);
      }
    }
  }

  // Read Exif IFD for Date Taken
  if (exifIFDOffset && (tiffOffset + exifIFDOffset + 2 <= view.byteLength)) {
    const exifIFD = tiffOffset + exifIFDOffset;
    const numEntries = view.getUint16(exifIFD, isLittleEndian);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = exifIFD + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;
      const tag = view.getUint16(entryOffset, isLittleEndian);

      if (tag === 0x9003 || tag === 0x9004 || tag === 0x0132) { // DateTimeOriginal, DateTimeDigitized, DateTime
        const rawDate = readString(view, entryOffset, tiffOffset, isLittleEndian);
        if (rawDate && !result.dateTimeOriginal) {
          result.dateTimeOriginal = parseExifDateString(rawDate);
        }
      }
    }
  }

  // Read GPS IFD
  if (gpsIFDOffset && (tiffOffset + gpsIFDOffset + 2 <= view.byteLength)) {
    const gpsIFD = tiffOffset + gpsIFDOffset;
    const numEntries = view.getUint16(gpsIFD, isLittleEndian);
    let lat = null, latRef = 'N', lon = null, lonRef = 'E';

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = gpsIFD + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;
      const tag = view.getUint16(entryOffset, isLittleEndian);

      if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
      if (tag === 0x0002) lat = readRationalArray(view, entryOffset, tiffOffset, isLittleEndian, 3);
      if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
      if (tag === 0x0004) lon = readRationalArray(view, entryOffset, tiffOffset, isLittleEndian, 3);
    }

    if (lat && lon && lat.length === 3 && lon.length === 3) {
      const latitude = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === 'S' ? -1 : 1);
      const longitude = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef === 'W' ? -1 : 1);
      result.gps = { latitude, longitude };
    }
  }

  return result;
}

function readString(view, entryOffset, tiffOffset, isLittleEndian) {
  const count = view.getUint32(entryOffset + 4, isLittleEndian);
  if (count <= 0 || count > 100) return null;
  const valOffset = count <= 4 ? entryOffset + 8 : tiffOffset + view.getUint32(entryOffset + 8, isLittleEndian);
  if (valOffset + count > view.byteLength) return null;

  let str = '';
  for (let i = 0; i < count - 1; i++) {
    const char = view.getUint8(valOffset + i);
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str.trim();
}

function readRationalArray(view, entryOffset, tiffOffset, isLittleEndian, count) {
  const valOffset = tiffOffset + view.getUint32(entryOffset + 8, isLittleEndian);
  const arr = [];
  for (let i = 0; i < count; i++) {
    const o = valOffset + i * 8;
    if (o + 8 > view.byteLength) return null;
    const num = view.getUint32(o, isLittleEndian);
    const den = view.getUint32(o + 4, isLittleEndian);
    arr.push(den === 0 ? 0 : num / den);
  }
  return arr;
}

function parseExifDateString(str) {
  // EXIF dates look like "YYYY:MM:DD HH:MM:SS"
  const m = str.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [_, year, month, day, h, min, s] = m;
  const d = new Date(year, parseInt(month, 10) - 1, day, h, min, s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
