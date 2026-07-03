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

export const uploadProductImage = upload.single("image");

const excelUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const isExcel =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.originalname?.toLowerCase().endsWith(".xlsx");

    if (isExcel) {
      cb(null, true);
      return;
    }

    cb(new Error("Only .xlsx files are allowed."));
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadProductImportFile = excelUpload.single("file");
