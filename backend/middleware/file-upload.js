const multer = require('multer'); // multer -> is a node expressed middleware to handle file data which is binary data
const { v4: uuidv4 } = require('uuid'); // here we can use "uuidv4()" to get a random number 

const MIME_TYPE_MAP = { // for mapping certain mime types to their extensions 
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const fileUpload = multer({ // the [fileUpload] -> returned from the "multer" function is a group of middlewares that can be used before executing the controller function
  limits: 500000, // the limit is 500,000 bytes which is the size of the file extracted  
  storage: multer.diskStorage({ // the key "storage" -> requires a multer storage driver, multer has a built-in disk storage and an object containing the congfigurations about the process of storing the file, this object will be passed to the "diskStorage" function
    destination: (req, file, cb) => { // "cb" -> callback function 
      cb(null, 'uploads/images'); // the first parameter passed is "null" indicating no errors, if an error object passed, the other parameters passed will be ignored 
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, uuidv4() + '.' + ext); // [uuid() + '.' + ext] -> is the value of the key "filename" that it is passed as the second parameter of the callback function and then it will be handled internally by multer to be the value of the key "filename"
    }
  }),
  fileFilter: (req, file, cb) => { // although the html element "input" has an attribute "accept" whose value is ".jpg,.png,.jpeg", but it is in the client-side, then it is necessay to ensure the file types in the server-side -> (backend)
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid mime type!');
    cb(error, isValid);
  }
});

module.exports = fileUpload;
