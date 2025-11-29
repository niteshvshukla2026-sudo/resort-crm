// backend/src/middleware/upload.js
import multer from "multer";

const storage = multer.memoryStorage(); // file memory me rahega
const upload = multer({ storage });

export default upload;
