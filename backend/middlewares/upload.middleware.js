import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype?.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image files are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadTryOnImages = upload.fields([
  { name: "modelImage", maxCount: 1 },
  { name: "dressImage", maxCount: 1 },
  { name: "upperImage", maxCount: 1 },
  { name: "lowerImage", maxCount: 1 },
]);
