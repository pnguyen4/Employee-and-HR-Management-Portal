const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const { RegToken } = require ('../models/RegToken.model');
const FRONTEND_URL = "http://localhost:4200";

exports.createRegToken = async (req, res) => {
    try {
        if (! (req.body.email && req.body.name)) {
            res.json({
              status: '401',
              message: 'cannot generate registration token without email or name'
            });
        }
        const email = req.body.email;
        const name = req.body.name;
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
          return res.json({status: '409', msg: 'not a valid email address'});
        }
 
        const token_payload = {
            email,
            name,
            expiresAt: (new Date()).setTime((new Date().getTime() + (3*60*60*1000)))
        };
        const token = jwt.sign(token_payload, process.env.JWT_KEY, { expiresIn: "3h"});
        // add to registration token history
        const link = `${FRONTEND_URL}/signup/${token}`;
        await RegToken.create({email, name, link});
        sendmail(email, link);

        res.json({status: '200', token, message: 'registration link emailed and saved to history'});
    } catch (error) {
      res.json({status: '400', message: 'cannot create token'});
    }
};

exports.getRegTokens = async (req, res) => {
    try {
      const regtokens = await RegToken.find();
      res.json({status: '200', regtokens});
    } catch (error) {
      res.json({status: '400', message: 'cannot retrieve registration link history'});
    }
}


exports.statusReport = async (req, res) => {
  
  let transporter = nodemailer.createTransport({
    service : "hotmail",
    auth: {
      user: "bfmean2022@outlook.com",
      pass: "Example123!",
    },
  });

  let info = await transporter.sendMail({
    from: 'bfmean2022@outlook.com', // sender address
    to: req.body.email, // list of receivers
    subject: req.body.status?"Your VisaStatus is approved":"Your VisaStatus is rejected", // Subject line
    text: "Reason ....", // plain text body
    //html: "<b>Hello world?</b>", // html body
  }); 
  console.log("Message sent: %s", info.messageId);
  res.status(200).json();
}

async function sendmail(email, link) {

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service : "hotmail",
    auth: {
      user: "bfmean2022@outlook.com",
      pass: "Example123!",
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'bfmean2022@outlook.com', // sender address
    to: email, // list of receivers
    subject: "Your Beaconfire Registration Link", // Subject line
    text: `Sign in Link: ${link}`, // plain text body
    //html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
}


