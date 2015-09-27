/**
 * Created by william on 06.18.15.
 */

var ccApi = angular.module('cc.api', []);


/**
 * User Api
 */
ccApi.factory('userApi', ['$http', 'promiseService', function($http, promiseService) {
    return {
        getUserById: function(id, purpose) {
            return promiseService.wrap(function(promise) {
                $http.get(apiConfig.host + 'api/user/' + id + (purpose ? '?purpose=' + purpose : '')).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);


ccApi.factory('tutorialApi', ['$http', 'promiseService', function($http, promiseService) {
    return {
        createAlbum: function(albumData) {
            return promiseService.wrap(function(promise) {
                $http.post(apiConfig.host + 'api/album', albumData).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAlbumById: function(id, purpose) {
            return promiseService.wrap(function(promise) {
                $http.get(apiConfig.host + 'api/album/' + id + (purpose ? '?purpose=' + purpose : '')).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAlbums: function(purpose) {
            return promiseService.wrap(function(promise) {
                $http.get(apiConfig.host + 'api/albums' + (purpose ? '?purpose=' + purpose : '')).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateAlbum: function(albumData) {
            return promiseService.wrap(function(promise) {
                $http.post(apiConfig.host + 'api/album/' + albumData._id, albumData).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createArticle: function(articleData) {
            return promiseService.wrap(function(promise) {
                $http.post(apiConfig.host + 'api/article', articleData).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getArticleById: function(id, purpose) {
            return promiseService.wrap(function(promise) {
                $http.get(apiConfig.host + 'api/article/' + id + (purpose ? '?purpose=' + purpose : '')).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateArticle: function(articleData) {
            return promiseService.wrap(function(promise) {
                $http.post(apiConfig.host + 'api/article/' + articleData._id, articleData).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);