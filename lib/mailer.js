/**
 * Created by william on 28.06.15.
 */
var nodemailer = require("nodemailer");
var config = require("../config");

// create reusable transport method (opens pool of SMTP connections)

module.exports = {
    smtpTransport: nodemailer.createTransport("SMTP",{
        transport: "SMTP",
        host: "smtp.126.com",
        port:465,
        secureConnection: true,
        requiresAuth: true,
        domains: ["126.com"],
        auth: {
            user: config.mail.emailAddress,
            pass: config.mail.emailPassword
        }
    })
};