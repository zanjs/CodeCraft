/**
 * Created by william on 20.08.15.
 */
var api = require('./api');

module.exports = function(app, security) {
    app.get('/api/album/:id', function(req, res) {
        api.getAlbumById(req, res, '>>> album loading');
    });
    app.get('/api/albums', function(req, res) {
        api.getAlbums(req, res, '>>> albums listing');
    });
    app.post('/api/album', function(req, res) {
        security.authenticationRequired(req, res, function(req, res) {
            api.createAlbum(req, res, '>>> album creating');
        });
    });
    app.post('/api/album/:id', function(req, res) {
        security.authenticationRequired(req, res, function(req, res) {
            api.updateAlbum(req, res, '>>> album updating');
        });
    });

    app.get('/api/article/:id', function(req, res) {
        api.getArticleById(req, res, '>>> article loading');
    });
    app.post('/api/article', function(req, res) {
        security.authenticationRequired(req, res, function(req, res) {
            api.createArticle(req, res, '>>> article creating');
        });
    });
    app.post('/api/article/:id', function(req, res) {
        api.updateArticle(req, res, '>>> article updating');
    });
};