/**
 * Created by william on 27.06.15.
 */
var api = require('./api');

module.exports = function(app, security) {
    app.get('/api/user/:id', function(req, res) {
        api.getUserById(req, res, '>>> user loading');
    });
    app.post('/api/register', function(req, res) {
        api.register(req, res, '>>> user registration');
    });
    app.post('/api/activate', function(req, res) {
        api.activate(req, res, '>>> user activation');
    });
    app.post('/api/find-password', function(req, res) {
        api.findPassword(req, res, '>>> find password');
    });
    app.post('/api/reset-password', function(req, res) {
        api.resetPassword(req, res, '>>> reset password');
    });
};