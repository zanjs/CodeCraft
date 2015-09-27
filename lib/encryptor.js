/**
 * Created by william on 24.06.15.
 */
var config = require('../config.js');
var crypto = require('crypto');

var encryptor = {
    createHash: function(secret) {
        var salt = this.generateSalt(config.security.saltLength);
        var hash = this.getMd5(secret + salt);
        return salt + hash;
    },
    validateHash: function(hash, secret) {
        var salt = hash.substr(0, config.security.saltLength);
        var validHash = salt + this.getMd5(secret + salt);
        return hash === validHash;
    },
    getMd5: function(string) {
        return crypto.createHash('md5').update(string).digest('hex');
    },
    generateSalt: function(size) {
        var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ',
            setLen = set.length,
            salt = '';
        for (var i = 0; i < size; i++) {
            var p = Math.floor(Math.random() * setLen);
            salt += set[p];
        }
        return salt;
    }
};

module.exports = encryptor;