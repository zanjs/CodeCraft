/**
 * Created by william on 06.09.15.
 */
var mailer = require('../lib/mailer');
var Q = require('q');
var underscore = require('underscore');
var Album = require('../models/album').getAlbumModel();
var Article = require('../models/article').getArticleModel();
var User = require('../models/user').getUserModel();


var PROMISE_TYPE_USER = 'user';
var PROMISE_TYPE_ALBUM = 'album';
var PROMISE_TYPE_ARTICLE = 'article';

function _idListContainsId(list, id) {
    var result = false;
    if(!(list instanceof Array)) {
        list = [ list ];
    }
    if(list.length > 0) {
        list.forEach(function(item) {
            if(item.equals(id)) {
                result = true;
            }
        });
    }
    return result;
}

var utils = {
    /**
     * return the deep copy of an object
     * @param object
     */
    clone: function(object) {
        return JSON.parse(JSON.stringify(object));
    },
    sendEmail: function(address, subject, mailContent) {
        var smtpTransport = mailer.smtpTransport;

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: "源艺 codecraft.cn <codecraft_cn@126.com>",      // sender address
            to: address,                                            // list of receivers
            subject: subject,                                       // Subject line
            text: mailContent                                              // plaintext body
        };

        // send mail with defined transport object
        return Q.Promise(function(resolve, reject, notify) {
            smtpTransport.sendMail(mailOptions, function(err, response){
                // if you don't want to use this transport object anymore, uncomment following line
                smtpTransport.close(); // shut down the connection pool, no more messages
                if(err){
                    reject(new Error('Email not sent.'));
                } else {
                    resolve('Email sent.');
                }
            });
        });
    },
    albumTrimOptions: {
        articles: true,
        authorDetails: true,
        comments: true,
        statisticDetails: true
    },
    articleTrimOptions: {
        album: true,
        authorDetails: true,
        content: true,
        comments: true,
        statisticDetails: true
    },
    userTrimOptions: {
        follows: true,
        recommneds: true,
        activities: true,
        albums: true,
        articles: true,
        contributions: true,
        subscriptions: true
    },
    minimumAlbum: function(album) {
        return {
            _id: album._id,
            name: album.name,
            cover: album.cover,
            isPublic: album.isPublic,
            createdAt: album.createdAt,
            createdBy: album.createdBy,
            updatedAt: album.updatedAt,
            updatedBy: album.updatedBy
        }
    },
    filterAlbum: function(album, trimOptions) {
        if(typeof album === 'object') {
            album = [album];
        }
        return Q.Promise(function(resolve, reject, notify) {
            utils.filterAlbums(album, trimOptions)
                .then(function(albums) {
                    resolve(albums[0]);
                });
        });
    },
    filterAlbums: function(originalAlbums, trimOptions) {
        var filteredAlbums = [];
        var userIds = [];
        var articleIds = [];
        var promises = [];
        var promiseTypes = [];

        // return the promise
        return Q.Promise(function(resolve, reject, notify) {
            // prepare basic albums and promises
            originalAlbums.forEach(function(album) {
                filteredAlbums.push(_getBasicAlbum(album, trimOptions));

                if(trimOptions && !trimOptions.articles) {
                    articleIds = underscore.union(articleIds, album.articles);
                }
                if(trimOptions && !trimOptions.authorDetails) {
                    userIds.push(album.author._id);
                }
            });
            if(userIds.length) {
                promises.push(User.find({ _id: { $in: userIds } }).exec());
                promiseTypes.push(PROMISE_TYPE_USER);
            }
            if(articleIds.length) {
                promises.push(Article.find({ _id: { $in: articleIds } }).exec());
                promiseTypes.push(PROMISE_TYPE_ARTICLE);
            }

            // handle the database query
            // no query needed
            if(promises.length === 0) {
                resolve(filteredAlbums);
            }
            // execute query
            else {
                Q.allSettled(promises).then(function(results) {
                    results.forEach(function(result, index) {
                        if (result.state === "fulfilled") {
                            var items = result.value;

                            // got author
                            if(promiseTypes[index] === PROMISE_TYPE_USER) {
                                filteredAlbums = _setAlbumsAuthors(filteredAlbums, items);
                            }
                            // got articles
                            if(promiseTypes[index] === PROMISE_TYPE_ARTICLE) {
                                filteredAlbums = _setAlbumsArticles(filteredAlbums, items);
                            }
                        }
                    });
                    resolve(filteredAlbums);
                });
            }
        });

        function _getBasicAlbum(album, trimOptions) {
            var filteredAlbum = {
                _id: album._id,
                name: album.name,
                introduction: album.introduction,
                tags: album.tags,
                author: album.author,
                cover: album.cover,
                articlesCount: album.articles ? album.articles.length : 0,
                commentsCount: album.comments ? album.comments.length : 0,
                contributorsCount: album.contributors ? album.contributors.length : 0,
                bookmarkedCount: album.bookmarkedBy ? album.bookmarkedBy.length : 0,
                likedCount: album.likedBy ? album.likedBy.length : 0,
                sharedCount: album.sharedBy ? album.sharedBy.length : 0,
                createdAt: album.createdAt,
                createdBy: album.createdBy,
                updatedAt: album.updatedAt,
                updatedBy: album.updatedBy,
                isPublic: album.isPublic
            };

            if(trimOptions && !trimOptions.comments) {
                filteredAlbum.comments = album.comments;
            }
            if(trimOptions && !trimOptions.statisticDetails) {
                filteredAlbum.contributors = album.contributors;
                filteredAlbum.bookmarkedBy = album.bookmarkedBy;
                filteredAlbum.likedBy = album.likedBy;
                filteredAlbum.sharedBy = album.sharedBy;
            }

            return filteredAlbum;
        }
        function _setAlbumsAuthors(albums, users) {
            albums.forEach(function(filteredAlbum, index) {
                var author = underscore.find(users, function(user) {
                    return user._id.equals(originalAlbums[index].author._id);
                });
                filteredAlbum.author = utils.minimumUser(author);
            });
            return albums;
        }
        function _setAlbumsArticles(albums, articles) {
            albums.forEach(function(filteredAlbum, index) {
                filteredAlbum.articles = underscore.chain(articles)
                    .filter(function(article) {
                        return _idListContainsId(originalAlbums[index].articles, article._id);
                    })
                    .map(function(article) {
                        return utils.minimumArticle(article);
                    })
                    .value();
            });
            return albums;
        }

    },
    minimumArticle: function(article) {
        var minArticle = {
            _id: article._id,
            title: article.title,
            content: article.content,
            hasVideo: article.hasVideo,
            createdAt: article.createdAt,
            createdBy: article.createdBy,
            updatedAt: article.updatedAt,
            updatedBy: article.updatedBy
        };
        if(article.content && article.content.length > 60) {
            minArticle.content = article.content.substring(0, 60 - 1) + ' ...';
        }
        return minArticle;
    },
    filterArticle: function(article, trimOptions) {
        if(typeof article === 'object') {
            article = [article];
        }
        return Q.Promise(function(resolve, reject, notify) {
            utils.filterArticles(article, trimOptions)
                .then(function(articles) {
                    resolve(articles[0]);
                });
        });
    },
    filterArticles: function(originalArticles, trimOptions) {
        var filteredArticles = [];
        var userIds = [];
        var albumIds = [];
        var promises = [];
        var promiseTypes = [];

        // return the promise
        return Q.Promise(function(resolve, reject, notify) {
            // prepare basic albums and promises
            originalArticles.forEach(function(article) {
                filteredArticles.push(_getBasicArticle(article, trimOptions));

                if(trimOptions && !trimOptions.authorDetails) {
                    userIds.push(article.author._id);
                }
                if(trimOptions && !trimOptions.album) {
                    albumIds.push(article.albumId);
                }
            });
            if(userIds.length) {
                promises.push(User.find({ _id: { $in: userIds } }).exec());
                promiseTypes.push(PROMISE_TYPE_USER);
            }
            if(albumIds.length) {
                promises.push(Album.find({ _id: { $in: albumIds } }).exec());
                promiseTypes.push(PROMISE_TYPE_ALBUM);
            }

            // handle the database query
            // no query needed
            if(promises.length === 0) {
                resolve(filteredArticles);
            }
            // execute query
            else {
                Q.allSettled(promises).then(function(results) {
                    results.forEach(function(result, index) {
                        if (result.state === "fulfilled") {
                            var items = result.value;
                            // got author
                            if(promiseTypes[index] === PROMISE_TYPE_USER) {
                                filteredArticles = _setArticlesAuthors(filteredArticles, items);
                            }
                            // got articles
                            if(promiseTypes[index] === PROMISE_TYPE_ALBUM) {
                                filteredArticles = _setArticlesAlbums(filteredArticles, items);
                            }
                        }
                    });
                    resolve(filteredArticles);
                });
            }
        });

        function _getBasicArticle(article, trimOptions) {
            var filteredArticle = {
                _id: article._id,
                title: article.title,
                tags: article.tags,
                albumId: article.albumId,
                author: article.author,
                hasVideo: article.hasVideo,
                videoUrl: article.videoUrl,
                contributorsCount: article.contributors ? article.contributors.length : 0,
                commentsCount: article.comments ? article.comments.length : 0,
                likedCount: article.likedBy ? article.likedBy.length : 0,
                sharedCount: article.sharedBy ? article.sharedBy.length : 0,
                createdAt: article.createdAt,
                updatedAt: article.updatedAt
            };

            if(trimOptions && !trimOptions.content) {
                filteredArticle.content = article.content;
            }
            if(trimOptions && !trimOptions.comments) {
                filteredArticle.comments = article.comments;
            }
            if(trimOptions && !trimOptions.statisticDetails) {
                filteredArticle.contributors = article.contributors;
                filteredArticle.likedBy = article.likedBy;
                filteredArticle.sharedBy = article.sharedBy;
            }

            return filteredArticle;
        }
        function _setArticlesAuthors(articles, users) {
            articles.forEach(function(filteredArticle, index) {
                var author = underscore.find(users, function(user) {
                    return user._id.equals(originalArticles[index].author._id);
                });
                filteredArticle.author = utils.minimumUser(author);
            });
            return articles;
        }
        function _setArticlesAlbums(articles, albums) {
            articles.forEach(function(filteredArticle, index) {
                var album = underscore.find(albums, function(album) {
                    return album._id.equals(originalArticles[index].albumId);
                });
                filteredArticle.album = utils.minimumAlbum(album);
            });
            return articles;
        }
    },
    minimumUser: function(user) {
        return {
            _id: user._id,
            email: user.email,
            username: user.username,
            photo: user.photo,
            createdAt: user.createdAt,
            recommendedCount: user.recommendedBy ? user.recommendedBy.length : 0,
            followedCount: user.followers ? user.followers.length : 0,
            articlesCount: user.articles ? user.articles.length : 0
        }
    },
    filterUser: function(user, trimOptions) {
        if(typeof user === 'object') {
            user = [user];
        }
        return Q.Promise(function(resolve, reject, notify) {
            utils.filterUsers(user, trimOptions)
                .then(function(users) {
                    resolve(users[0]);
                });
        });
    },
    filterUsers: function(originalUsers, trimOptions) {
        var filteredUsers = [];
        var userIds = [];
        var albumIds = [];
        var articleIds = [];
        var promises = [];
        var promiseTypes = [];

        // return the promise
        return Q.Promise(function(resolve, reject, notify) {
            // prepare basic albums and promises
            originalUsers.forEach(function(user) {
                filteredUsers.push(_getBasicUser(user, trimOptions));

                if(trimOptions && !trimOptions.follows) {
                    userIds = underscore.union(userIds, user.followers);
                    userIds = underscore.union(userIds, user.following);
                }
                if(trimOptions && !trimOptions.recommneds) {
                    userIds = underscore.union(userIds, user.recommendedBy);
                    userIds = underscore.union(userIds, user.recommending);
                }

                if(trimOptions && !trimOptions.albums) {
                    albumIds = underscore.union(albumIds, user.albums);
                }
                if(trimOptions && !trimOptions.articles) {
                    articleIds = underscore.union(articleIds, user.articles);
                }
                if(trimOptions && !trimOptions.contributions) {
                    albumIds = underscore.union(albumIds, user.albumContributions);
                    articleIds = underscore.union(articleIds, user.articleContributions);
                }
                if(trimOptions && !trimOptions.subscriptions) {
                    albumIds = underscore.union(albumIds, user.subscriptions);
                    albumIds = underscore.union(albumIds, user.albumCollections);
                    albumIds = underscore.union(albumIds, user.albumShare);
                    articleIds = underscore.union(articleIds, user.articleCollections);
                    articleIds = underscore.union(articleIds, user.articleShare);
                }
            });
            if(userIds.length) {
                promises.push(User.find({ _id: { $in: userIds } }).exec());
                promiseTypes.push(PROMISE_TYPE_USER);
            }
            if(albumIds.length) {
                promises.push(Album.find({ _id: { $in: albumIds } }).exec());
                promiseTypes.push(PROMISE_TYPE_ALBUM);
            }
            if(articleIds.length) {
                promises.push(Article.find({ _id: { $in: articleIds } }).exec());
                promiseTypes.push(PROMISE_TYPE_ARTICLE);
            }

            // handle the database query
            // no query needed
            if(promises.length === 0) {
                resolve(filteredUsers);
            }
            // execute query
            else {
                Q.allSettled(promises).then(function(results) {
                    results.forEach(function(result, index) {
                        if (result.state === "fulfilled") {
                            var items = result.value;
                            // got users
                            if(promiseTypes[index] === PROMISE_TYPE_USER) {
                                filteredUsers = _setUsersRelations(filteredUsers, items);
                            }
                            // got albums
                            if(promiseTypes[index] === PROMISE_TYPE_ALBUM) {
                                filteredUsers = _setUsersAlbums(filteredUsers, items);
                            }
                            // got articles
                            if(promiseTypes[index] === PROMISE_TYPE_ARTICLE) {
                                filteredUsers = _setUsersArticles(filteredUsers, items);
                            }
                        }
                    });
                    resolve(filteredUsers);
                });
            }

        });

        function _getBasicUser(user, trimOptions) {
            var filteredUser = {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                photo: user.photo,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                recommendedCount: user.recommendedBy ? user.recommendedBy.length : 0,
                followedCount: user.followers ? user.followers.length : 0,
                albumsCount: user.albums ? user.albums.length : 0,
                articlesCount: user.articles ? user.articles.length : 0,
                albumContributionsCount: user.albumContributions ? user.albumContributions.length : 0,
                articleContributionsCount: user.articleContributions ? user.articleContributions.length : 0
            };

            if(trimOptions && !trimOptions.activities) {
                filteredUser.activities = user.activities;
            }

            return filteredUser;
        }
        function _setUsersRelations(filteredUsers, searchResults) {
            filteredUsers.forEach(function(filteredUser, index) {
                // followers and followings
                if(trimOptions && !trimOptions.follows) {
                    filteredUser.followers = underscore.chain(searchResults)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].followers, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumUser(item);
                        })
                        .value();
                    filteredUser.following = underscore.chain(searchResults)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].following, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumUser(item);
                        })
                        .value();
                }
                // users recommended by you and users you recommend.
                if(trimOptions && !trimOptions.recommneds) {
                    filteredUser.recommendedBy = underscore.chain(searchResults)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].recommendedBy, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumUser(item);
                        })
                        .value();
                    filteredUser.recommending = underscore.chain(searchResults)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].recommending, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumUser(item);
                        })
                        .value();
                }
            });
            return filteredUsers;
        }
        function _setUsersAlbums(filteredUsers, articles) {
            filteredUsers.forEach(function(filteredUser, index) {
                // user's albums
                if(trimOptions && !trimOptions.albums) {
                    filteredUser.albums = underscore.chain(articles)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].albums, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumAlbum(item);
                        })
                        .value();
                }
                // albums contributed by user
                if(trimOptions && !trimOptions.contributions) {
                    filteredUser.albumContributions = underscore.chain(articles)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].albumContributions, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumAlbum(item);
                        })
                        .value();
                }
                // user's subscription, collection, and share
                if(trimOptions && !trimOptions.subscriptions) {
                    filteredUser.subscriptions = underscore.chain(articles)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].subscriptions, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumAlbum(item);
                        })
                        .value();
                    filteredUser.albumCollections = underscore.chain(articles)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].albumCollections, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumAlbum(item);
                        })
                        .value();
                    filteredUser.albumShare = underscore.chain(articles)
                        .filter(function(item) {
                            return _idListContainsId(originalUsers[index].albumShare, item._id);
                        })
                        .map(function(item) {
                            return utils.minimumAlbum(item);
                        })
                        .value();
                }
            });
            return filteredUsers;
        }
        function _setUsersArticles(filteredUsers, albums) {
            filteredUsers.forEach(function(filteredUser, index) {
                if(promiseTypes[index] === PROMISE_TYPE_ARTICLE) {
                    if(trimOptions && !trimOptions.articles) {
                        filteredUser.articles = underscore.chain(albums)
                            .filter(function(item) {
                                return _idListContainsId(originalUsers[index].articles, item._id);
                            })
                            .map(function(item) {
                                return utils.minimumArticle(item);
                            })
                            .value();
                    }
                    if(trimOptions && !trimOptions.contributions) {
                        filteredUser.articleContributions = underscore.chain(albums)
                            .filter(function(item) {
                                return _idListContainsId(originalUsers[index].articleContributions, item._id);
                            })
                            .map(function(item) {
                                return utils.minimumArticle(item);
                            })
                            .value();
                    }
                    if(trimOptions && !trimOptions.subscriptions) {
                        filteredUser.articleCollections = underscore.chain(albums)
                            .filter(function(item) {
                                return _idListContainsId(originalUsers[index].articleCollections, item._id);
                            })
                            .map(function(item) {
                                return utils.minimumArticle(item);
                            })
                            .value();
                        filteredUser.articleShare = underscore.chain(albums)
                            .filter(function(item) {
                                return _idListContainsId(originalUsers[index].articleShare, item._id);
                            })
                            .map(function(item) {
                                return utils.minimumArticle(item);
                            })
                            .value();
                    }
                }
            });
            return filteredUsers;
        }
    }
};

module.exports = utils;