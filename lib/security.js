/**
 * Created by william on 23.06.15.
 */
var passport = require('passport');
var MongoStrategy = require('./mongo-strategy');

var filterUser = function(user) {
    if (user) {
        return {
            user : {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                photo: user.photo
            }
        };
    } else {
        return { user: null };
    }
};

var security = {
    initialize: function(url, dbName, authCollection) {
        passport.use(new MongoStrategy(url, dbName, authCollection));
    },
    authenticationRequired: function(req, res, next) {
        if (req.isAuthenticated()) {
            next(req, res);
        } else {
            res.status(401).json(filterUser(req.user));
        }
    },
    adminRequired: function(req, res, next) {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(401).json(filterUser(req.user));
        }
    },
    sendCurrentUser: function(req, res, next) {
        if(req.user) {
            res.status(200).json(filterUser(req.user));
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    },
    login: function(req, res, next) {
        return passport.authenticate(MongoStrategy.name, authenticationFailed)(req, res, next);

        function authenticationFailed(err, user, info){
            if(err) {
                res.status(500).json(err);
            } else if(!user) {
                res.status(404).json({ message: 'User not found.' });
            } else {
                req.logIn(user, function(err) {
                    if(err) {
                        res.status(500).json(err);
                    } else {
                        res.status(200).json(filterUser(user));
                    }
                });
            }
        }
    },
    logout: function(req, res, next) {
        req.logout();
        res.status(200).json({ message: 'User signed out.' });
    }
};

module.exports = security;