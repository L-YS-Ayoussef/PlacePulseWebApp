const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const mediaUpload = multer({
  limits: { fileSize: 25 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/media");
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, `${uuidv4()}.${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    cb(null, !!MIME_TYPE_MAP[file.mimetype]);
  },
});

module.exports = mediaUpload;
