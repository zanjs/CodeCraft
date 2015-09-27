/**
 * Created by william on 20.08.15.
 */
var Album = require('../../models/album').getAlbumModel();
var Article = require('../../models/article').getArticleModel();
var User = require('../../models/user').getUserModel();
var config = require('../../config');
var utils = require('../utils');


var ALBUM_PURPOSE_LIST = 'list';
var ALBUM_PURPOSE_DETAILS = 'details';
var ALBUM_PURPOSE_LIST_WITH_DETAILS = 'list_with_details';
var ARTICLE_PURPOSE_LIST = 'list';
var ARTICLE_PURPOSE_DETAILS = 'details';


/**
 * Create an album
 * @param req
 * @param res
 * @param context
 */
exports.createAlbum = function(req, res, context) {
    console.log(context);
    var albumData = req.body;
    var currentUser = req.user;
    var trimOptions = utils.clone(utils.albumTrimOptions);
    trimOptions.authorDetails = false;
    trimOptions.statisticDetails = false;
    var album;

    // 1. valid request, album name required
    if(albumData && albumData.name) {
        var author = {
            _id: currentUser._id,
            name: currentUser.username
        };
        albumData.author = author;
        albumData.createdAt = new Date();
        albumData.updatedAt = new Date();
        albumData.createdBy = author;
        albumData.updatedBy = author;
        albumData.cover = 'default';

        Album.create(albumData)
            .then(function(newAlbum) {
                if(newAlbum) {
                    return utils.filterAlbum(newAlbum.toObject(), trimOptions);
                }
            })
            .then(function(filteredAlbum) {
                if(filteredAlbum) {
                    album = filteredAlbum;
                    var activity = {
                        title: '创建了新专辑',
                        text: albumData.name,
                        linkedId: album._id,
                        type: 'Album',
                        date: album.createdAt
                    };
                    return User.update(
                        { _id: currentUser._id },
                        { $push: { albums: album._id, activities: activity } }
                    ).exec();
                }
            })
            .then(function(result) {
                if(result && result.nModified > 0) {
                    return res.status(200).json(album)
                } else {
                    return res.status(400).json({ message: 'User not found.' })
                }
            })
            .onReject(function(err){
                return res.status(500).json(err);
            })
            .end();
    }
    else {
        return res.status(400).json({ messaeg: 'Album name required.' });
    }
};


/**
 * List albums
 * @param req
 * @param res
 * @param context
 */
exports.getAlbums = function(req, res, context) {
    console.log(context);
    var purpose = req.query.purpose;
    var skip = req.query.skip;
    var limit = req.query.limit;
    var trimOptions = utils.clone(utils.albumTrimOptions);
    if(purpose === ALBUM_PURPOSE_LIST_WITH_DETAILS) {
        trimOptions.authorDetails = false;
    }

    // list albums
    var query = Album.find();
    if(skip) {
        query = query.skip(skip);
    }
    if(limit) {
        query = query.limit(limit);
    }
    query.exec()
        .then(function(albums) {
            if(albums && albums instanceof Array) {
                return utils.filterAlbums(albums, trimOptions);
            }
        })
        .then(function(filteredAlbums) {
            if(filteredAlbums) {
                return res.status(200).json(filteredAlbums);
            }
        })
        .onReject(function(err){
            return res.status(500).json(err);
        })
        .end();
};


/**
 * Get album by id
 * @param req
 * @param res
 * @param context
 */
exports.getAlbumById = function(req, res, context) {
    console.log(context);
    var id = req.params.id;
    var purpose = req.query.purpose;
    var trimOptions = utils.clone(utils.albumTrimOptions);
    if(purpose === ALBUM_PURPOSE_DETAILS) {
        trimOptions.comments = false;
        trimOptions.articles = false;
        trimOptions.authorDetails = false;
        trimOptions.statisticDetails = false;
    }


    // 1. validate the request
    if(!id) {
        return res.status(400).json({ message: 'Bad request.' });
    }

    // 2. find album by id
    else {
        Album.findById(id).exec()
            .then(function(album) {
                if(album) {
                    utils.filterAlbum(album.toObject(), trimOptions).then(function(resultAlbum) {
                        return res.status(200).json(resultAlbum);
                    });
                } else {
                    return res.status(404).json({ message: 'Album not found.' });
                }
            }, function(err) {
                return res.status(500).json(err);
            });
    }
};


/**
 * Update an album by post data
 * @param req
 * @param res
 * @param context
 */
exports.updateAlbum = function(req, res, context) {
    console.log(context);
    var id = req.params.id;
    var albumData = req.body;
    var currentUser = req.user;
    delete albumData._id;
    delete albumData.author;
    delete albumData.articles;

    // 1. valid the request
    if(id && albumData && albumData.name) {
        var user = {
            _id: currentUser._id,
            name: currentUser.username
        };

        albumData.updatedAt = new Date();
        albumData.updatedBy = user;
        Album.update({ _id: id }, albumData).exec()
            .then(function(result) {
                if(result && result.nModified > 0) {
                    return res.status(200).json({ message: 'Album updated.' });
                } else {
                    throw new Error('Album not found.');
                }
            })
            .onReject(function(err){
                switch(err.message) {
                    case 'Album not found.':
                        return res.status(404).json({message: 'Album not found.'});
                        break;
                    default:
                        return res.status(500).json(err);
                        break;
                }
            })
            .end();
    } else {
        return res.status(400).json({ message: 'Album id and name required.' });
    }
};


/**
 * Add an article to an album
 */
exports.createArticle = function(req, res, context) {
    console.log(context);
    var articleData = req.body;
    var currentUser = req.user;
    var trimOptions = utils.clone(utils.articleTrimOptions);
    trimOptions.content = false;
    trimOptions.authorDetails = false;
    trimOptions.statisticDetails = false;
    var album;
    var article;

    // 1. valid request, album name required
    if(articleData && articleData.albumId && articleData.title) {
        Album.findById(articleData.albumId).exec()
            .then(function(result) {
                if(result) {
                    album = result.toObject();

                    var author = {
                        _id: currentUser._id,
                        name: currentUser.username
                    };
                    articleData.author = author;
                    articleData.createdAt = new Date();
                    articleData.updatedAt = new Date();
                    articleData.createdBy = author;
                    articleData.updatedBy = author;

                    return Article.create(articleData);
                } else {
                    throw new Error('Album not found.');
                }
            })
            .then(function(newArticle) {
                if(newArticle) {
                    return utils.filterArticle(newArticle.toObject(), trimOptions);
                }
            })
            .then(function(filteredArticle) {
                if(filteredArticle) {
                    article = filteredArticle;
                    album.articles.push(article._id);
                    album.updatedAt = new Date();
                    delete album._id;
                    return Album.update({ _id: article.albumId }, album).exec();
                }
            })
            .then(function(updateResult) {
                if(updateResult && updateResult.nModified > 0) {
                    var activity = {
                        title: '添加了新文章',
                        text: article.title,
                        linkedId: article._id,
                        type: 'Article',
                        date: article.createdAt
                    };
                    return User.update(
                        { _id: currentUser._id },
                        { $push: { articles: article._id, activities: activity } }
                    ).exec();
                } else {
                    throw new Error('Album not found.');
                }
            })
            .then(function(updateResult) {
                if(updateResult && updateResult.nModified > 0) {
                    return res.status(200).json(article);
                } else {
                    throw new Error('User not found.');
                }
            })
            .onReject(function(err){
                if(err.type === 'CastError' && err.path === '_id') {
                    return res.status(404).json({ message: 'Album not found.' });
                } else {
                    switch(err.message) {
                        case 'Album not found.':
                            return res.status(404).json({ message: 'Album not found.' });
                            break;
                        default:
                            return res.status(500).json(err);
                            break;
                    }
                }
            })
            .end();
    } else {
        return res.status(400).json({ messaeg: 'Album id and article title required.' });
    }
};


/**
 * Get article by id
 * @param req
 * @param res
 * @param context
 */
exports.getArticleById = function(req, res, context) {
    console.log(context);
    var id = req.params.id;
    var purpose = req.query.purpose;
    var trimOptions = utils.clone(utils.articleTrimOptions);
    if(purpose === ARTICLE_PURPOSE_DETAILS) {
        trimOptions.album = false;
        trimOptions.content = false;
        trimOptions.comments = false;
        trimOptions.authorDetails = false;
        trimOptions.statisticDetails = false;
    }

    // 1. validate the request
    if(!id) {
        return res.status(400).json({ message: 'Bad request.' });
    }

    // 2. find article by id
    else {
        Article.findById(id).exec()
            .then(function(article) {
                if(article) {
                    utils.filterArticle(article.toObject(), trimOptions)
                        .then(function(filteredArticle) {
                            return res.status(200).json(filteredArticle);
                        });
                } else {
                    return res.status(404).json({ message: 'Article not found.' });
                }
            }, function(err) {
                return res.status(500).json(err);
            });
    }
};

/**
 * Update an article by post data
 * @param req
 * @param res
 * @param context
 */
exports.updateArticle = function(req, res, context) {
    console.log(context);
    var id = req.params.id;
    var articleData = req.body;
    var currentUser = req.user;
    delete articleData._id;
    delete articleData.author;

    // 1. valid the request
    if(id && articleData && articleData.albumId && articleData.title) {
        var user = {
            _id: currentUser._id,
            name: currentUser.username
        };

        articleData.updatedAt = new Date();
        articleData.updatedBy = user;
        Article.update({ _id: id }, articleData).exec()
            .then(function(result) {
                if(result && result.nModified > 0) {
                    return res.status(200).json({ message: 'Article updated.' });
                } else {
                    throw new Error('Article not found.');
                }
            })
            .onReject(function(err){
                switch(err.message) {
                    case 'Article not found.':
                        return res.status(404).json({message: 'Article not found.'});
                        break;
                    default:
                        return res.status(500).json(err);
                        break;
                }
            })
            .end();
    } else {
        return res.status(400).json({ message: 'Album id and article title required.' });
    }
};