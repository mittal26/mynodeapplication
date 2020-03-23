const search  = require('../routes/search');
const employee = require('../routes/employee');
const home     = require('../routes/home');
const imageupload   = require('../routes/imageupload');
const login         = require('../routes/login');
const admin         = require('../routes/admin');
const webscraping   = require('../routes/webscraping');
const express       = require('express');
const bodyParser     = require('body-parser');
const methodOverride = require('method-override');
const session        = require('express-session');
const flash          = require('connect-flash');
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const User           = require('../models/usermodel');

module.exports = function(app) {

    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(methodOverride('_method'));

    //middleware for session
    app.use(session({
        secret:"nodejs",
        resave:true,
        saveUninitialized:true
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy({usernameField:'email'},User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());


    //middleware for flash messages
    app.use(flash());

    app.use((req,res,next) => {
        res.locals.success_msg = req.flash(('success_msg'));
        res.locals.error_msg = req.flash(('error_msg'));
        res.locals.error     = req.flash(('error'));
        res.locals.currentUser      = req.user;
        next();
    });

    app.use('/search',search);
    app.use('/employee',employee);
    app.use('/imageupload',imageupload);
    app.use('/home',home);
    app.use('/webscraping',webscraping);
    app.use('/admin',admin);
    app.use('/',login);
}