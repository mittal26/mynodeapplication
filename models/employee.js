const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name:String,
    designation: String,
    salary:Number
});

const Employee = mongoose.model('employee',employeeSchema);

exports.Employees = Employee;


