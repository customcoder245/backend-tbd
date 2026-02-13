import multer from "multer";
import os from "os";

const MAX_SIZE = 2 * 1024 * 1024;  // 2MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = process.env.VERCEL ? "/tmp" : os.tmpdir();
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});


const fileFilter = (req, file, cb) => {
  const allowed = [
    "text/csv",
    "application/vnd.ms-excel"
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only CSV files allowed"), false);
  }

  cb(null, true);
};

export const uploadCSV = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE }
}).single("file");