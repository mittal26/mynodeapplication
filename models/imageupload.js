const mongoose = require('mongoose');

const imageuploadSchema = new mongoose.Schema({
    imgUrl:String,
});

const ImageUpload = mongoose.model('imageupload',imageuploadSchema);

exports.ImageUpload = ImageUpload;
