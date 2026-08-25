import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../public/uploads/gallery");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // Map MIME type to a safe extension to avoid trusting original filename
    const mimeToExt = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const safeExt = mimeToExt[file.mimetype] || path.extname(file.originalname).toLowerCase() || ".jpg";

    // Ensure filename is simple and unique; do not include original filename
    const safeName = `gallery-${uniqueSuffix}${safeExt}`;
    cb(null, safeName);
  },
});

// File filter for images
const fileFilter = (req, file, cb) => {
  // Allow only JPEG, PNG, WEBP per requirements (no GIF)
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error(
      "Only image files are allowed (.jpg, .jpeg, .png, .webp)",
    );
    err.status = 400;
    cb(err);
  }
};

// Multer configuration
const uploadGallery = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Validate that an uploaded file is a real image by reading its magic bytes
// with sharp. Rejects text files or executables renamed to image extensions.
export const validateGalleryImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const metadata = await sharp(req.file.path).metadata();
    if (!metadata || !metadata.format) {
      throw new Error("not an image");
    }
    return next();
  } catch (err) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupErr) {
      // best-effort cleanup; ignore if the file was never written
    }
    const invalid = new Error(
      "Invalid image file. Only real .jpg, .jpeg, .png or .webp images are allowed.",
    );
    invalid.status = 400;
    return next(invalid);
  }
};

export default uploadGallery;
