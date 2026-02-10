import multer from "multer";

import os from "os";

const MIN_SIZE = 10 * 1024;       // 10 KB minimum
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB maximum

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use /tmp for Vercel (production) and OS temp dir for local
    const tempDir = process.env.VERCEL ? "/tmp" : os.tmpdir();
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PNG and JPEG images are allowed"), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE
  }
});


// ✅ LOWER LIMIT CHECK MIDDLEWARE
export const validateImageSize = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  if (req.file.size < MIN_SIZE) {
    return res.status(400).json({
      message: "Image too small. Minimum size is 10KB"
    });
  }

  next();
};
