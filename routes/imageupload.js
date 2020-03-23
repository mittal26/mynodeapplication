const express = require('express');
const router = express.Router(); 
const request = require('request');
const got     = require('got');
const multer  = require('multer');
const path    = require('path');
const { ImageUpload } = require('../models/imageupload');
const fs = require('fs');

let storage   = multer.diskStorage({
    destination: './public/upload/images/',
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

var upload = multer({ 
    storage: storage,
    fileFilter: (req,file,cb) => {
        checkFileType(file,cb);
    }
});

function checkFileType(file,cb){
    const fileTypes = /jpeg|jpg|png|gif/;
    const extension = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if(extension) {
        return cb(null,true);
    }else {
        cb('Error:Please upload only image/images.')
    }
}

router.get('/',async(req,res) => {
    res.render('imageupload');
});

router.get('/uploads',async(req,res) => {
    const images = await ImageUpload.find({});
    res.render('uploads',{images:images});
});

router.post('/uploadSingle',upload.single('singleImage'),async(req,res) => {
    try {
        const file = req.file;
        if(!file) {
            return console.log('Please select image to upload.');
        }

        let url = file.path.replace('public','');
        //console.log(url);

        await ImageUpload.findOne({imgUrl:url})
        .then(img => {
            if(img) {
                console.log('Duplicate Image');
                req.flash('error_msg','Duplicate Image!');
                return res.redirect('/imageupload');
            }
            
            let image = new ImageUpload({
                imgUrl:url
            });
                            
            image.save();
            req.flash('success_msg','Image  Added Successfully');
            res.redirect('/imageupload/uploads');
        });
    }catch(ex) {
            console.log(ex.message)
    }             
});

router.post('/uploadmultiple',upload.array('multipleImages'),async(req,res) => {
    try {
        const files = req.files;
        if(!files) {
            return console.log('Please select image to upload.');
        }

        files.forEach(file => {
            let url = file.path.replace('public','');
            ImageUpload.findOne({imgUrl:url})
                .then(async img => {
                    if(img) {
                        return console.log('Duplicate Image!');
                    }
                     
                    let image = new ImageUpload({
                        imgUrl:url
                    });
                    await image.save();
                    
           });
        });

        res.redirect('/imageupload/uploads');
    }
    catch(ex) {
        console.log(ex);
    }
});

router.delete('/delete/:id',async(req,res) => {
    try {
        let searchQuery = {_id:req.params.id};
        const result = await ImageUpload.findOne(searchQuery);
        //console.log(path.join(__dirname,'../public/'+result['imgUrl']));
        fs.unlink(path.join(__dirname,'../public/'+result['imgUrl']) ,(err) => {
            if(err) return console.log(err); 
        });
        const deleteimage = await ImageUpload.deleteOne(searchQuery);
        res.redirect('/imageupload/uploads')
    }catch(ex) {
        console.log(ex);
    }
})


module.exports = router;