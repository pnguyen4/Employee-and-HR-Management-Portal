const { User } = require('../models/User.model');
const { Housing } = require('../models/Housing.model');
const { RegToken } = require('../models/RegToken.model');
const bcrypt = require('bcryptjs');
const express = require('express');
const app = express();
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const { MongoClient, ObjectId } = require('mongodb');

exports.createUser = async ( req, res ) => {
   /* const passwordComplexity =
          new RegExp('^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+*!=]).*$');
    if (!passwordComplexity.test(req.body.password)) {
      return res.json({status: '409', msg: 'Password does not meet complexity requirements'});
    } */
    const hashed = await bcrypt.hash(req.body.password, Number(process.env.SALT));

    const houses = await Housing.find();
    const randomIndex = Math.floor(Math.random() * houses.length);
    const assignedHouse = houses[randomIndex];
    const user = new User({ // create schema
      username: req.body.username,
      email: req.body.email,
      password: hashed,
      admin: req.body.admin,
      housing_id: assignedHouse._id
    });

  await Housing.updateOne({ _id: assignedHouse._id },
                          { "$push": { tenants: user._id }});
    const copy1 = await User.findOne({email:req.body.email},{}); // check if email already exist
    const copy2 = await User.findOne({username:req.body.username},{});  // check if username already exist

    if (copy1 === null && copy2 === null) { // if email not exist
      // almost forgot to do this, but mark the token used by this employee as successfully registered
      const token = req.headers.authorization;
      await RegToken.updateOne(
        {link: {"$regex": token, "$options": "i"}},
        {registered: true}
      );
      user.save().then(result => {
        res.status(200).json();
      });
    }
    else { // if email exist
        res.status(409).json();
    }
}    


exports.signin = async function (req,res) {
    try {
      let copy = await User.findOne({email:req.body.account},{});  // check if input is email
      if (copy === null) {
        copy = await User.findOne({username:req.body.account},{});  // check if input is username
      }
      if (!copy) {
        return res.json({status: '500', msg: "Account not found."});
      }
      if (copy && bcrypt.compareSync(req.body.password, copy.password)) { // found the exactly account and compare password
          const token = jwt.sign(  // create token
          {
              userId:copy._id,
              username:copy.username,
              email:copy.email,
              admin:copy.admin
          },
           process.env.JWT_KEY,
          {expiresIn:'3h'}
          );
        copy.password = undefined;
        return res.json({
          status: '200',
          user: copy,
          token: token,
          expiresAt:(new Date()).setTime((new Date().getTime() + (3*60*60*1000)))
        });
      }
      return res.json({status: '500', msg: "Invalid Password."});
    } catch (error) {
      return res.json({status: '500', msg: "Some other server error has occured."});
    }
}

exports.getUserByAccount = async function (req,res) {
  console.log(req.params.account);
  return res.json({msg: 'test'})
    let copy = await User.findOne({email:req.params.account},{});
    if (copy === null) copy = await User.findOne({username:req.params.account},{}); 
    
}

exports.getUserAll = async function (req,res) { 
    let copy = await User.find({},{}); 
    res.status(200).json({users:copy});    
} 

exports.getUserByKeyword = async function (req,res) { 
    let copy = await User.find({},{}); 
    let users = [];
    for (let i = 0; i < copy.length; i++) {
        if (copy[i].username.includes(req.params.keyword) || copy[i].email.includes(req.params.keyword)) {
            users.push(copy[i]);
        }
    }
    res.status(200).json({users:users});    
} 

exports.editUserWithPassword = async function (req,res) {

    const hashed = await bcrypt.hash(req.body.password, Number(process.env.SALT));
    const copy = await User.findOne({email:req.body.email},{});
    await User.findOneAndUpdate({email:req.body.email},{
      username: req.username,//req.body.username,
      email: req.body.email,
      admin: req.body.admin,
      password: hashed,
      application_id: ObjectId(req.body.application_id),
      housing_id: ObjectId(req.body.housing_id)
    })
    res.status(200).json();
  }



