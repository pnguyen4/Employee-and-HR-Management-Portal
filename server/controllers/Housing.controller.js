const { User } = require('../models/User.model');
const { Housing } = require('../models/Housing.model');
const { FacReport } = require('../models/FacReport.model');
const { FacReportMsg } = require('../models/FacReportMsg.model');
const { Application } = require('../models/Application.model');
const bcrypt = require('bcryptjs');
const express = require('express');
const app = express();
const jwt = require("jsonwebtoken");

exports.getHousingDetails = async (req, res) => {
    try {
        // Nested references are a BITCH. I'm not sorry for this comment - Phillip
        const house = await Housing.findOne({_id: req.params.id}).populate({
            path: 'tenants',
            model: 'User',
            populate: {
                path: 'application_id',
                model: 'Application'
            }
        });
        return res.json({status: '200', house});
    } catch (error) {
        console.log(error);
        return res.json({status: "500", msg: error});
    }
};

exports.getHousingSummary = async (req, res) => {
    try {
        const houses = await Housing.find();
        return res.json({status: '200', houses});
    } catch (error) {
        return res.json({status: "500", msg: error});
    }
};

exports.createHousing = async (req, res) => {
    try {
        const newhouse = {
            landlord: req.body.landlord,
            address: req.body.address,
            facilities: req.body?.facilities ?? ''
        };
        const house  = await Housing.create(newhouse);
        return res.json({status: '200', house});
    } catch (error) {
        return res.json({status: "500", msg: error});
    }
};

exports.deleteHousing = async (req, res) => {
    try {
        await Housing.deleteOne({ _id: req.params.id });
        return res.json({status: '200'});
    } catch (error) {
        return res.json({status: "500", msg: error});
    }
};

exports.getHouseFacilityReports = async (req, res) => {
    try {
        const id = req.params.id;
        const facReports = await FacReport.find({housing_id: id});
        return res.json({status: '200', facReports});
    }
    catch (error) {
        return res.json({status: "500", msg: error});
    }
};

exports.createFacilityReport = async (req, res) => {
    try {
        const newreport = {
            housing_id: req.body.housing_id,
            author_id: req.body.author_id,
            status: "open",
            title: req.body.title,
            description: req.body.description,
            messages: []
        };
        const facReport = await FacReport.create(newreport);
        return res.json({status: '200', facReport});
    } catch (error) {
        return res.json({status: "500", msg: error});
    }
}

async function getAndPopulateFacReport( reportid ) {
    try {
        const report = await FacReport.findOne({_id: reportid})
            .populate({
                path: 'author_id',
                select: [ 'admin', 'application_id' ],
                populate: {
                    path: 'application_id',
                    select: [ 'firstname', 'lastname' ]
                }
            })
            .populate({
                path: 'messages',
                select: [ 'author_id', 'message', 'createdAt', 'updatedAt'],
                populate: {
                    path:'author_id',
                    select: [ '_id', 'admin', 'username' ],
                    populate: {
                        path: 'application_id',
                        select: ['firstname', 'lastname']
                    }
                }
            });
        
        return report;
    } catch(error) {
        return error;
    }
}

exports.getOneFacReport = async( req, res ) => {
    const { houseid: housing_id, reportid } = req.params;
    try {
        const report = await getAndPopulateFacReport(reportid);
        if( !report ) throw new Error(400)
        
        return res.json({status: "200", report});
    } catch(error) {
        if( error.message === String('400') ) return res.json({status: "400", msg: "Bad Request"})
        else return res.json({status: "500", msg: error});
    }
}

exports.updateFacReportStatus = async (req, res) => {
    try {
        const updated = await FacReport.updateOne({_id: req.params.reportid},
                                                  {status: req.body.status});
        return res.json({status: "200", updated});
    } catch (error) {
        return res.json({status: "500", msg: error});
    }
}
exports.addMsgToFacilityReport = async( req, res ) => {
    const { reportid } = req.params;
    const { author_id, message } = req.body;
    console.log({reportid, author_id, message})
    try {
        // create new message
        const newMsg = await FacReportMsg.create({
            facReport_id: reportid, author_id, message
        });
        await newMsg.save();

        // update facReport
        const tempReport = await FacReport.findOne({_id: reportid});
        // check if user is author of original report, or is an admin
        // if( newMsg.author_id !== facReport.author_id || !req.user.admin) throw new Error(404);
        
        tempReport.messages.push(newMsg._id);
        await tempReport.save();

        const report = await getAndPopulateFacReport(reportid);

        return res.json({status: "200", report})
    } catch(error) {
        return res.json({status: "500", msg: error});
    }
}

exports.editMsgOnFacilityReport = async( req, res ) => {
    console.log('edit start')
    const _id = req.params.msgid;
    const message = req.body.message;
    console.log({_id, message})
    try {
        const oldMsg = await FacReportMsg.findOne({_id});
        const reportid = oldMsg.facReport_id;
        // user auth check
        // if( req.user._id !== oldMsg.author_id ) {
        //     return res.json({status: "404", message: "User not authorized to edit this message"});
        // }

        oldMsg.message = message;
        await oldMsg.save();

        const report = await getAndPopulateFacReport(reportid);
        return res.json({status: "200", report })
    } catch(error) {
        return res.json({status: "500", msg: error});
    }
}
