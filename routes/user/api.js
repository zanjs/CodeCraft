/**
 * Created by william on 27.06.15.
 */
var User = require('../../models/user').getUserModel();
var Pending = require('../../models/pending').getPendingModel();
var Reset = require('../../models/reset').getResetModel();
var config = require('../../config');
var encryptor = require('../../lib/encryptor');
var utils = require('../utils');


var PURPOSE_PROFILE = 'profile';
var PURPOSE_LOGIN = 'login';


/**
 * Get user by id
 * @param req
 * @param res
 * @param context
 */
exports.getUserById = function(req, res, context) {
    console.log(context);
    var id = req.params.id;
    var purpose = req.query.purpose;
    var trimOptions = utils.clone(utils.userTrimOptions);
    if(purpose === PURPOSE_PROFILE) {
        trimOptions.follows = false;
        trimOptions.recommneds = false;
        trimOptions.activities = false;
        trimOptions.albums = false;
        trimOptions.articles = false;
        trimOptions.contributions = false;
        trimOptions.subscriptions = false;
    }

    // 1. validate the request
    if(!id) {
        return res.status(400).json({ message: 'Bad request.' });
    }

    // 2. find user by id
    else {
        User.findById(id).exec()
            .then(function(user) {
                if(user) {
                    utils.filterUser(user.toObject(), trimOptions)
                        .then(function(resultUser) {
                            return res.status(200).json(resultUser);
                        });
                } else {
                    return res.status(404).json({ message: 'User not found.' });
                }
            }, function(err) {
                return res.status(500).json(err);
            });
    }
};


/**
 * Register a new user(create a pending) and send out the activation email
 * @param req
 * @param res
 * @param context
 */
exports.register = function(req, res, context) {
    console.log(context);
    var userData = req.body;
    var url;
    var mailContent;

    // validate the request
    if(userData && userData.email && typeof userData.email === 'string' && userData.password && userData.username) {

        userData.email = userData.email.toLowerCase();

        // check availability of email
        User.count({ email: userData.email }).exec()
            .then(function(count) {
                // email available, prepare invitation and create pending
                if(count === 0) {
                    // create hashed password
                    var hashedPassword = encryptor.createHash(userData.password);
                    var hashedEmail = encryptor.createHash(userData.email);
                    userData.password = hashedPassword;
                    userData.hashCode = new Buffer(hashedEmail).toString('base64');

                    // prepare email
                    url = "http://" + config.server.ip + ':3000' + "/account/activate/" + userData.hashCode;
                    mailContent = "亲爱的用户 " + userData.username + " :\n\n" +
                        "欢迎加入源艺,开始您与众多IT爱好者分享源码,交流经验和探索发现的旅程。\n" +
                        "请点击下面的链接来激活您的账户:\n" + url + "\n" +
                        "如果您无法通过链接进行跳转,请把这个链接复制粘贴在浏览器的地址栏中\n\n" +
                        "如果您没有在源艺进行注册,可能有人误用了您的邮箱地址,请无视这封邮件。\n\n" +
                        "祝您体验愉快\n" +
                        "源艺\n\n\n" +
                        "Dear " + userData.username + " :\n\n" +
                        "Welcome to CodeCraft and start sharing your coding experience with other programming funs.\n" +
                        "To verify your email address and activate your account, please click on the link below:\n" + url + "\n" +
                        "If clicking on the link doesn't work, try copying and pasting it into your browser.\n\n" +
                        "If you didn't register at CodeCraft, your email address might has been used by others as wrong input, please ignore this email.\n\n" +
                        "Kind regards\n" +
                        "The CodeCraft Team";
                    // try to update an existing pending
                    return Pending.update(
                        { email: userData.email },
                        { username: userData.username, password: hashedPassword, hashCode:  userData.hashCode, createdAt: new Date() }

                    ).exec();
                }
                // email in use, return a message to client.
                else {
                    throw new Error('Email in use.');
                }
            })
            .then(function(result) {
                // pending updated, resend invitation
                if(result && result.nModified > 0) {
                    return utils.sendEmail(userData.email, "来自源艺 codecraft.cn 的激活邀请", mailContent);
                }
                // no pending found, creat one
                else if(result && result.nModified == 0) {
                    userData.created = new Date();
                    return Pending.create(userData);
                }
            })
            .then(function(result) {
                // pending updated, email resent, stop chaining here.
                if(result === 'Email sent.') {
                    throw new Error(result);
                }
                // pending created, send invitation here.
                else if(result && result !== 'Email sent.') {
                    return utils.sendEmail(userData.email, "来自源艺 codecraft.cn 的激活邀请", mailContent);
                }
            })
            .then(function(result) {
                // invitation sent.
                if(result === 'Email sent.') {
                    throw new Error(result);
                }
            })
            .onReject(function(err){
                switch(err.message) {
                    case 'Email not sent.':
                        return res.status(500).json({ message: 'Email not sent.' });
                        break;
                    case 'Email sent.':
                        return res.status(200).json({ message: 'Email sent.' });
                        break;
                    case 'Email not sent.':
                        return res.status(200).json({ message: 'Email in use.' });
                        break;
                    default:
                        return res.status(500).json(err);
                        break;
                }
            })
            .end();
    }
    // invalid request
    else {
        return res.status(400).json({ message: 'Bad request.' });
    }
};


/**
 * Activate an user account by creating the user in DB and removing the pending.
 * @param req
 * @param res
 * @param context
 */
exports.activate = function(req, res, context) {
    console.log(context);
    var hashCode = req.body.hashCode;
    var user = undefined;
    var trimOptions = utils.clone(utils.userTrimOptions);

    if(hashCode) {
        Pending.findOne({ hashCode: hashCode }).exec()
            .then(function(pending) {
                if(pending) {
                    // Create the new user from pending data
                    var newUser = {
                        email: pending.email,
                        password: pending.password,
                        username: pending.username,
                        role: 'user',
                        status: 'active',
                        createdAt: new Date(),
                        createdBy: 'system',
                        updatedAt: new Date(),
                        updatedBy: 'system',
                        photo: 'default',
                        activities: []
                    };
                    var activity = {
                        title: '加入源艺',
                        text: undefined,
                        linkedId: undefined,
                        type: 'Message',
                        date: new Date()
                    };
                    newUser.activities.push(activity);
                    return User.create(newUser);
                } else {
                    // Pending not found, could be expired
                    throw new Error('Pending not found.');
                }
            })
            .then(function(newUser) {
                if(newUser) {
                    // delete pending
                    user = {
                        email: newUser.email,
                        username: newUser.username
                    };
                    return Pending.remove({ hashCode: hashCode });
                }
            })
            .then(function(result) {
                if(result) {
                    url = "http://" + config.server.ip + ':3000';
                    var text = "亲爱的用户 " + user.username + " :\n\n" +
                        "您的账户以经激活,可以通过以下链接访问源艺主页:\n" + url + "\n\n" +
                        "祝您在源艺网体验愉快\n" +
                        "源艺\n\n\n" +
                        "Dear " + user.username + " :\n\n" +
                        "Your account at CodeCraft has been activated, and you can follow the link bellow to visit CodeCraft:" + url + "\n\n" +
                        "Kind regards\n" +
                        "The CodeCraft Team";
                    utils.sendEmail(user.email, "您的源艺 codecraft.cn 账户已激活", text);
                    return res.status(200).json({ message: 'Account activated.' });
                }
            })
            .onReject(function(err){
                switch(err.message) {
                    case 'Pending not found.':
                        return res.status(404).json({ message: 'Pending not found.' });
                        break;
                    default:
                        return res.status(500).json(err);
                        break;
                }
            })
            .end();
    } else {
        return res.status(400).json({ message: 'Bad request.' });
    }
};

/**
 * Send a password reset link to a registered email
 * @param req
 * @param res
 * @param context
 */
exports.findPassword = function(req, res, context) {
    console.log(context);
    var userData = req.body;
    var url;
    var mailContent;


    // validate the request
    if(userData && userData.email && typeof userData.email === 'string') {
        userData.email = userData.email.toLowerCase();
        // check availability of email
        User.findOne({ email: userData.email }).exec()
            .then(function(user) {
                // email not found, return a message to client.
                if(!user) {
                    throw new Error('Email not found.');
                }
                // email found, prepare password reset link and create reset
                else {
                    // create hashed email
                    var hashedEmail = encryptor.createHash(userData.email);
                    userData.hashCode = new Buffer(hashedEmail).toString('base64');
                    userData.username = user.toObject().username;

                    // prepare email
                    url = "http://" + config.server.ip + ':3000' + "/account/reset-password/" + userData.hashCode;
                    mailContent = "亲爱的用户 " + userData.username + " :\n\n" +
                        "您刚刚申请了重置密码服务,请点击下面的链接来进行重置:\n" + url + "\n" +
                        "如果您无法通过链接进行跳转,请把这个链接复制粘贴在浏览器的地址栏中\n\n" +
                        "如果您没有申请重置密码,可能有人误用了您的邮箱地址,请无视这封邮件。\n\n" +
                        "祝您体验愉快\n" +
                        "源艺\n\n\n" +
                        "Dear " + userData.username + " :\n\n" +
                        "We just received your request for a password reset, please click on the link below to proceed:\n" + url + "\n" +
                        "If clicking on the link doesn't work, try copying and pasting it into your browser.\n\n" +
                        "If you didn't make the request, your email address might has been used by others as wrong input, please ignore this email.\n\n" +
                        "Kind regards\n" +
                        "The CodeCraft Team";
                    // try to update an existing Reset
                    return Reset.count({ email: userData.email }).exec();
                }
            })
            .then(function(count) {
                // reset found, resend link
                if(typeof count === 'number' && count > 0) {
                    return utils.sendEmail(userData.email, "来自源艺 codecraft.cn 的密码重置链接", mailContent);
                }
                // reset not found, create reset and then send email
                else if(typeof count === 'number' && count == 0) {
                    userData.created = new Date();
                    return Reset.create(userData);
                }
            })
            .then(function(result) {
                // link resent, stop chaining here.
                if(result === 'Email sent.') {
                    throw new Error(result);
                }
                // reset created, send link here.
                else if(result && result !== 'Email sent.') {
                    return utils.sendEmail(userData.email, "来自源艺 codecraft.cn 的密码重置链接", mailContent);
                }
            })
            .then(function(result) {
                // link sent.
                if(result === 'Email sent.') {
                    return res.status(200).json({ message: result });
                }
            })
            .onReject(function(err){
                switch(err.message) {
                    case 'Email not found.':
                        return res.status(404).json({ message: 'Email not found.' });
                        break;
                    case 'Email not sent.':
                        return res.status(500).json({ message: 'Email not sent.' });
                        break;
                    case 'Email sent.':
                        return res.status(200).json({ message: 'Email sent.' });
                        break;
                    default:
                        return res.status(500).json(err);
                        break;
                }
            })
            .end();
    }
    // invalid request
    else {
        return res.status(400).json({ message: 'Bad request.' });
    }
};

/**
 * Update the user's password by providing the hash code and new password.
 * @param req
 * @param res
 * @param context
 */
exports.resetPassword = function(req, res, context) {
    console.log(context);
    var userData = req.body;
    var user = undefined;
    var url;

    if(userData.hashCode && userData.password) {
        Reset.findOne({ hashCode: userData.hashCode }).exec()
            .then(function(reset) {
                if(reset) {
                    // find user by email
                    var email = reset.toObject().email;
                    return User.findOne({ email: email }).exec();
                } else {
                    // reset not found, could be expired
                    throw new Error('Reset not found.');
                }
            })
            .then(function(resUser) {
                // user found, update password
                if(resUser) {
                    user = resUser.toObject();
                    var hashedPassword = encryptor.createHash(userData.password);
                    return User.update(
                        { email: user.email },
                        { password: hashedPassword, updatedAt: new Date(), updatedBy: 'system' }
                    ).exec();
                }
                // user not found, this should never happen unless the user is deleted from DB while the reset is still there.
                else {
                    throw new Error('User not found.');
                }
            })
            .then(function(result) {
                // password updated, send email
                if(result && result.nModified > 0) {
                    url = "http://" + config.server.ip + ':3000';
                    var text = "亲爱的用户 " + user.username + " :\n\n" +
                        "您的密码以经重置,可以通过以下链接访问源艺主页:\n" + url + "\n\n" +
                        "祝您在源艺网体验愉快\n" +
                        "源艺\n\n\n" +
                        "Dear " + user.username + " :\n\n" +
                        "Your password has been reset, and you can follow the link bellow to visit CodeCraft:\n" + url + "\n\n" +
                        "Kind regards\n" +
                        "The CodeCraft Team";
                    return utils.sendEmail(user.email, "您的源艺 codecraft.cn 密码已重置", text);
                }
                // password not updated, again this should never happen.
                else if(result && result.nModified == 0) {
                    throw new Error('User not found.');
                }
            })
            .then(function(result) {
                // email sent and delete the reset
                if(result === 'Email sent.') {
                    return Reset.remove({ email: user.email });
                }
            })
            .then(function(result) {
                if(result) {
                    return res.status(200).json({ message: 'Password reset.' });
                }
            })
            .onReject(function(err){
                switch(err.message) {
                    case 'Reset not found.':
                        return res.status(404).json({ message: 'Reset not found.' });
                        break;
                    case 'Email not sent.':
                        return res.status(500).json({ message: 'Email not sent.' });
                        break;
                    default:
                        return res.status(500).json(err);
                        break;
                }
            })
            .end();
    } else {
        return res.status(400).json({ message: 'Bad request.' });
    }
};