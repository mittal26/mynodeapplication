const express = require('express');
const router = express.Router(); 
const request = require('request');
const got     = require('got');


router.get('/',async(req,res) => {
    res.render('home');
});


module.exports = router;