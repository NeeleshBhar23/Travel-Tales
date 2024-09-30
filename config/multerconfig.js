const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

//to upload file in disk storage 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads') //giving the path where the file stores 
    },
    filename: function (req, file, cb) {
     crypto.randomBytes(12, function(err, name){
     const fn = name.toString("hex")+path.extname(file.originalname);
        cb(null, fn)
     }) //giving a random name in hexa to the file with its extension 
    }
  })
  
  const upload = multer({ storage: storage })

  module.exports = upload;