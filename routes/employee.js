const express = require('express');
const router = express.Router(); 
const request = require('request');
const got     = require('got');
const { Employees } = require('../models/employee');

router.get('/',async(req,res) => {
    const employeeData = await Employees.find().sort('name');
    res.render('index',{employees: employeeData});
});

router.get('/new',(req,res) => {
    res.render('new');
});

router.post('/new',async(req,res) => {
    try{
        let newemployee = new Employees({
            name:req.body.name,
            designation:req.body.designation,
            salary:req.body.salary
        });
    
        await newemployee.save();
        req.flash('success_msg','Employee Added Successfully');
        res.redirect('/employee');
    }catch(ex) {
        console.log(ex);
    }
});

router.get('/empsearch',async(req,res) => {
    res.render('empsearch',{employee:""});
})

router.get('/searchemployee',async(req,res) => {
    let employee =  await Employees.findOne({name:req.query.name});
    res.render('empsearch',{employee:employee});
});

router.get('/edit/:id', async(req,res) => {
    let employee = await Employees.findById({_id:req.params.id});
    res.render('edit',{employee:employee});
});

router.put('/edit/:id',async(req,res) => {
    let employee = await Employees.updateOne({_id:req.params.id},{
        $set:{ 
            name:req.body.name,
            designation:req.body.designation,
            salary:req.body.salary
        }
    });
    req.flash('success_msg','Employee Updated Successfully');
    res.redirect('/employee');
});

router.delete('/delete/:id',async(req,res) => {
    let employee = await Employees.deleteOne({_id:req.params.id});
    req.flash('success_msg','Employee Deleted Successfully');
    res.redirect('/employee');
})



module.exports = router;