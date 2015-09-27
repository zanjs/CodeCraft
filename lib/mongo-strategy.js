/**
 * Created by william on 23.06.15.
 */
var util = require('util');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var UserSchema = require('../models/user');
var User = UserSchema.getUserModel();
var encryptor = require('./encryptor');

function MongoDBStrategy(dbUrl, dbName, collection) {
    this.dbUrl = dbUrl;
    this.dbName = dbName;
    this.collection = collection;

    // Config Passport to use 'email' as username field, and 'verifyUser' as verification method
    LocalStrategy.call(this, { usernameField:'email' }, this.verifyUser.bind(this));

    // Serialization for session storage
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    // Deserialization
    passport.deserializeUser(function (_id, done) {
        User.findById(_id, '_id email username role status photo', function (err, user) {
            done(err, user);
        });
    });

    // Strategy name
    this.name = MongoDBStrategy.name;
}

// MongoDBStrategy inherits from LocalStrategy
util.inherits(MongoDBStrategy, LocalStrategy);
MongoDBStrategy.name = "mongo";

// Authenticate required user
MongoDBStrategy.prototype.verifyUser = function (email, password, done) {
    process.nextTick(function () {
        if(typeof email === 'string') {
            User.findOne({ email: email.toLowerCase() }, function (err, user) {
                if (err) {
                    user = null;
                } else if (user) {
                    if(!encryptor.validateHash(user.password, password)) {
                        user = null;
                    }
                } else {
                    user = null;
                    return done(err, user);
                }

                return done(err, user);
            });
        } else {
            return done(null, null);
        }
    });
};

module.exports = MongoDBStrategy;