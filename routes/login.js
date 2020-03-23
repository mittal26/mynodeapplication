const express = require('express');
const router = express.Router(); 
const request = require('request');
const got     = require('got');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const User          = require('../models/usermodel');
const crypto = require('crypto');
const async = require('async');
const nodemailer = require('nodemailer');
const config  = require('config');

// Checks if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please Login first to access this page.')
    res.redirect('/');
}

router.get('/forgot', (req, res)=> {
    res.render('./users/forgot');
});

router.get('/users/all', isAuthenticatedUser ,(req, res)=> {
    User.find({})
        .then(users => {
            res.render('./users/alluser', {users : users});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/user/all');
        })
});

router.get('/',async(req,res) => {
    res.render('./users/login');
});

router.get('/logout',isAuthenticatedUser,(req, res)=> {
    req.logOut();
    req.flash('success_msg', 'You have been logged out.');
    res.redirect('/');
})

router.get('/signup',isAuthenticatedUser,async(req,res) => {
    res.render('./users/signup');
});

// router.get('/dashboard',isAuthenticatedUser,async(req,res) => {
//     res.render('./users/dashboard');
// });

router.get('/password/change', isAuthenticatedUser, (req, res)=> {
    res.render('./users/changepassword');
});

router.post('/signup',isAuthenticatedUser,async(req,res) => {
    let {name,email,password} = req.body;

    let userData = {
        name:name,
        email:email
    }

    User.register(userData,password, (err,user) => {
        if(err) {
            req.flash("error_msg",'EROOR'+err);
            res.redirect('/signup');
        } 
        req.flash("success_msg",'Account created successfully');
        res.redirect('/signup');
    });
});

//POST routes
router.post('/login', passport.authenticate('local', {
    successRedirect : '/admin/dashboard',
    failureRedirect : '/',
    failureFlash: 'Invalid email or password. Try Again!!!'
}));


// Routes to handle forgot password
router.post('/forgot', (req, res, next)=> {
    let recoveryPassword = '';
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (err , buf) => {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({email : req.body.email})
                .then(user => {
                    if(!user) {
                        req.flash('error_msg', 'User does not exist with this email.');
                        return res.redirect('/forgot');
                    }

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 1800000; //   1/2 hours

                    user.save(err => {
                        done(err, token, user);
                    });
                })
                .catch(err => {
                    req.flash('error_msg', 'ERROR: '+err);
                    res.redirect('/forgot');
                })
        },
        (token, user) => {
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user : config.get('GMAIL_EMAIL'),
                    pass: config.get('GMAIL_PASSWORD')
                }
            });

            let mailOptions = {
                to: user.email,
                from : 'Application Name',
                subject : 'Recovery Email from Auth Project',
                text : 'Please click the following link to recover your passoword: \n\n'+
                        'http://'+ req.headers.host +'/reset/'+token+'\n\n'+
                        'If you did not request this, please ignore this email.'
            };
            smtpTransport.sendMail(mailOptions, err=> {
                req.flash('success_msg', 'Email send with further instructions. Please check that.');
                res.redirect('/forgot');
            });
        }

    ], err => {
        if(err) res.redirect('/forgot');
    });
});

router.get('/reset/:token', (req, res)=> {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires : {$gt : Date.now() } })
        .then(user => {
            if(!user) {
                req.flash('error_msg', 'Password reset token in invalid or has been expired.');
                res.redirect('/forgot');
            }

            res.render('./users/newpassword', {token : req.params.token});
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/forgot');
        });
});


router.post('/reset/:token', (req, res)=>{
    async.waterfall([
        (done) => {
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires : {$gt : Date.now() } })
                .then(user => {
                    if(!user) {
                        req.flash('error_msg', 'Password reset token in invalid or has been expired.');
                        res.redirect('/forgot');
                    }

                    if(req.body.password !== req.body.confirmpassword) {
                        req.flash('error_msg', "Password don't match.");
                        return res.redirect('/forgot');
                    }

                    user.setPassword(req.body.password, err => {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(err => {
                            req.logIn(user, err => {
                                done(err, user);
                            })
                        });
                    });
                })
                .catch(err => {
                    req.flash('error_msg', 'ERROR: '+err);
                    res.redirect('/forgot');
                });
        },
        (user) => {
            let smtpTransport = nodemailer.createTransport({
                service : 'Gmail',
                auth:{
                    user : config.get('GMAIL_EMAIL'),
                    pass: config.get('GMAIL_PASSWORD')
                }
            });

            let mailOptions = {
                to : user.email,
                from : 'Application Name',
                subject : 'Your password is changed',
                text: 'Hello, '+user.name+'\n\n'+
                      'This is the confirmation that the password for your account '+ user.email+' has been changed.'
            };

            smtpTransport.sendMail(mailOptions, err=>{
                req.flash('success_msg', 'Your password has been changed successfully.');
                res.redirect('/');
            });
        }

    ], err => {
        res.redirect('/');
    });
});

router.post('/password/change', (req, res)=> {
    if(req.body.password !== req.body.confirmpassword) {
        req.flash('error_msg', "Password don't match. Type again!");
        return res.redirect('/password/change');
    }

    //console.log(req.user,"sdasdas")

    User.findOne({email : req.user.email})
        .then(user => {
            user.setPassword(req.body.password, err=>{
                user.save()
                    .then(user => {
                        req.flash('success_msg', 'Password changed successfully.');
                        res.redirect('/password/change');
                    })
                    .catch(err => {
                        req.flash('error_msg', 'ERROR: '+err);
                        res.redirect('/password/change');
                    });
            });
        });
});

router.get('/edit/:id', isAuthenticatedUser,(req,res)=> {
    let searchQuery = {_id : req.params.id};

    User.findOne(searchQuery)
        .then(user => {
        res.render('./users/edituser', {user : user});
        })
        .catch(err => {
        req.flash('error_msg', 'ERROR: '+err);
        res.redirect('/users/all');
    });
});

//PUT routes starts here
router.put('/edit/:id', (req, res)=> {
    let searchQuery = {_id : req.params.id};

    User.updateOne(searchQuery, {$set : {
        name : req.body.name,
    }})
    .then(user => {
        req.flash('success_msg', 'User updated sucessfully.');
        res.redirect('/users/all');
    })
    .catch(err => {
        req.flash('error_msg', 'ERROR: '+err);
        res.redirect('/users/all');
    })
});

//DELETE routes starts here
router.delete('/delete/user/:id', (req, res)=>{
    let searchQuery = {_id : req.params.id};

    User.deleteOne(searchQuery)
        .then(user => {
            req.flash('success_msg', 'User deleted sucessfully.');
            res.redirect('/users/all');
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR: '+err);
            res.redirect('/users/all');
        })
});

router.get('*', (req, res)=> {
    res.render('notfound');
});

module.exports = router;