/**
 * Created by william on 13.08.15.
 */
var ccTutorials = angular.module('cc.tutorials', []);

/**
 * Config
 */
ccTutorials.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('albums', {
            url: '/albums',
            templateUrl: '/modules/tutorials/albums.html',
            controller: 'AlbumsController',
            resolve: {
                albums: ['$stateParams', 'tutorialApi', function($stateParams, tutorialApi) {
                    return tutorialApi.getAlbums('list_with_details');
                }]
            }
        })
        .state('album', {
            url: '/albums/:id',
            templateUrl: '/modules/tutorials/album.html',
            controller: 'AlbumDetailsController',
            resolve: {
                album: ['$stateParams', 'tutorialApi', function($stateParams, tutorialApi) {
                    return tutorialApi.getAlbumById($stateParams.id, 'details');
                }]
            }
        })
        .state('new-article', {
            url: '/albums/:albumId/newArticle',
            templateUrl: '/modules/tutorials/add-article.html',
            controller: 'AddArticleController'
        })
        .state('article', {
            url: '/article/:id',
            templateUrl: 'modules/tutorials/article.html',
            controller: 'ArticleDetailsController',
            resolve: {
                article: ['$stateParams', 'tutorialApi', function($stateParams, tutorialApi) {
                    return tutorialApi.getArticleById($stateParams.id, 'details');
                }]
            }
        });
}]);


/**
 * Controllers
 */
ccTutorials.controller('AlbumsController', ['$scope', '$state', '$stateParams', '$compile', '$window', '$document', '$timeout', 'underscore', 'albums', function($scope, $state, $stateParams, $compile, $window, $document, $timeout, underscore, albums) {
    $scope.state = $state;
    $scope.albums = angular.copy(albums);
    $scope.filteredAlbums = angular.copy(albums);
    $scope.searchOptions = {
        type: 'All'
    };


    // Interactions
    function _closePreview() {
        angular.element('.album-preview').remove();
    }
    function _resetAlbumsTop() {
        angular.forEach(angular.element('.album'), function(item) {
            var currentItem = angular.element(item);
            currentItem.css('top', 0);
        });
    }
    function _setAlbumsTop(offsetTop, top) {
        angular.forEach(angular.element('.album'), function(item) {
            var currentItem = angular.element(item);
            if(currentItem.prop('offsetTop') > offsetTop) {
                currentItem.css('top', top);
            }
        });
    }
    function _getPreviewOffset(selectedOffset) {
        var offset = angular.copy(selectedOffset);
        // set left
        angular.forEach(angular.element('.album'), function(item) {
            var currentItem = angular.element(item);
            if(currentItem.prop('offsetLeft') < offset.left) {
                offset.left = currentItem.prop('offsetLeft');
            }
        })
        // set top
        offset.top = offset.top + 250;
        return offset;
    }
    function _openPreview(offset) {
        var previewElement = angular.element('<div class="album-preview" album="selectedAlbum" close="closePreview()" state="state"></div>');
        var listDiv = angular.element('.album-list');
        $compile(previewElement)($scope);
        listDiv.append(previewElement);
        previewElement.offset( offset );
        previewElement.height(290);
    }
    function _resetAll(previousElement) {
        if(previousElement.length) {
            _closePreview();
            _resetAlbumsTop();
            previousElement.removeClass('selected');
            var pageElement = angular.element('.page-container');
            pageElement.css('height','auto');
        }
    }
    function _showPreview(element, previousElement, sameElement) {
        // 1. check if clicking on the same album again
        // 1.1 if yes, do nothing here, since preview is closed and all albums are reset
        // 1.2 if no, move down all albums bellow the selected element and open another preview
        if(!sameElement) {
            // update offset of selected element
            var selectedOffset = { left: element.prop('offsetLeft'), top: element.prop('offsetTop')};
            _setAlbumsTop(selectedOffset.top, 310);
            var previewOffset = _getPreviewOffset(selectedOffset);
            // addjust previewOffset because of the animation
            if(element.prop('offsetTop') > previousElement.prop('offsetTop')) {
                previewOffset.top -= 310;
            }
            _openPreview(previewOffset);
        }

        // 2. update element class 'selected'
        if(sameElement) {
            element.removeClass('selected');
        } else {
            element.addClass('selected');
        }

        // 3. update page container heiht
        var pageElement = angular.element('.page-container');
        pageElement.css('height','auto');
        var pageHeight = parseInt(pageElement.height());
        if(previousElement.length === 0) {
            pageElement.height(pageHeight + 310);
        } else if(!sameElement) {
            pageElement.height(pageHeight + 310);
        }
    }
    function _updateAlbumsAndPreview(element) {
        if(element.length) {
            var previousElement = angular.element('.album.selected');
            var sameElement = previousElement.length && element.hasClass('selected');

            // 1. check if any preview is open, close it if yes
            _resetAll(previousElement);
            // 2. mode albums and show preview
            _showPreview(element, previousElement, sameElement);
        }
    }
    $scope.togglePreview = function(album, index) {
        $scope.selectedAlbum = album;
        $scope.selectedIndex = index;
        var element = angular.element('.album').eq($scope.selectedIndex);
        _updateAlbumsAndPreview(element);
    };
    $scope.closePreview = function() {
        var previousElement = angular.element('.album.selected');
        _resetAll(previousElement);
    };
    $scope.search = function(type) {
        $scope.closePreview();
        if(type) {
            if(type === 'All') {
                $scope.filteredAlbums = angular.copy($scope.albums);
            } else {
                $scope.filteredAlbums = underscore.filter($scope.albums, function(item) {
                    return item.type === type;
                });
            }
            $scope.searchOptions.type = type;
        } else {
            $timeout.cancel($scope.searchOptions.timeout);
            if($scope.searchOptions.query.trim().length > 0) {
                $scope.searchOptions.timeout = $timeout(function () {
                    // todo: call server for query
                }, 1000);
            } else {
                $scope.searchOptions.results = [];
            }
        }
    };


    // Events
    var w = angular.element($window);
    $scope.getWindowDimensions = function () {
        return w.width();
    };
    $scope.$watch($scope.getWindowDimensions, function (newValue, oldValue) {
        if(!angular.equals(newValue, oldValue)) {
            if(Math.abs(newValue - oldValue) > 18) {
                var element = angular.element('.album.selected');
                if(element.length) {
                    _updateAlbumsAndPreview(element);
                }
            }

        }
    }, true);
    w.bind('resize', function () {
        $scope.$apply();
    });
}]);

ccTutorials.controller('AlbumDetailsController', ['$scope', '$state', 'toastr', 'tutorialApi', 'album', function($scope, $state, toastr, tutorialApi, album) {
    $scope.album = angular.copy(album);
    $scope.mode = 'view';

    // Interactions
    $scope.edit = function() {
        $scope.mode = 'edit';
        $scope.updatedAlbum = {
            _id: $scope.album._id,
            name: $scope.album.name,
            introduction: $scope.album.introduction,
            tags: angular.copy($scope.album.tags) || []
        };
    };
    $scope.cancel = function() {
        $scope.mode = 'view';
        $scope.updatedAlbum = undefined;
    };
    $scope.save = function() {
        return tutorialApi.updateAlbum($scope.updatedAlbum)
            .then(function() {
                $scope.album.name = $scope.updatedAlbum.name;
                $scope.album.introduction = $scope.updatedAlbum.introduction;
                $scope.album.tags = angular.copy($scope.updatedAlbum.tags);

                toastr.success('您的专辑已更新', '专辑更新成功');
                $scope.mode = 'view';
                $scope.updatedAlbum = undefined;
            }, function(err) {
                toastr.error('创建更新时遇到问题: ' + err.message, '专辑更新失败');
            });
    };
    $scope.addArticle = function() {
        $state.go('new-article', { albumId: $scope.album._id });
    };
    $scope.viewArticle = function(articleId) {
        $state.go('article', { id: articleId });
    };
    $scope.saveComments = function(comments) {
        $scope.album.comments = comments;
        return tutorialApi.updateAlbum($scope.album);
    }
}]);

ccTutorials.controller('AddArticleController', ['$scope', '$state', '$stateParams', 'toastr', 'tutorialApi', function($scope, $state, $stateParams, toastr, tutorialApi) {
    $scope.articleData = {
        albumId: $stateParams.albumId,
        tags: []
    };
    if(!$scope.user) {
        $state.go('home');
    }

    // Interactions
    $scope.cancel = function() {
        $state.go('album', { id: $stateParams.albumId });
    };
    $scope.save = function() {
        return tutorialApi.createArticle($scope.articleData)
            .then(function(newArticle) {
                toastr.success('您的文章已发布.', '文章发布成功');
                $state.go('article', { id: newArticle._id });
            }, function(err) {
                toastr.error('发布文章时遇到问题', '文章发布失败');
            });
    };
}]);

ccTutorials.controller('ArticleDetailsController', ['$scope', '$state', '$stateParams', 'toastr', 'tutorialApi', 'article', function($scope, $state, $stateParams, toastr, tutorialApi, article) {
    $scope.article = angular.copy(article);
    $scope.mode = 'view';

    // Interactions
    $scope.toggleEdit = function() {
        if($scope.mode === 'view') {
            $scope.articleData = angular.copy($scope.article);
            $scope.mode = 'edit';
        } else {
            $scope.mode = 'view';
            $scope.articleData = undefined;
        }
    };
    $scope.save = function() {
        return tutorialApi.updateArticle($scope.articleData)
            .then(function() {
                $scope.article = angular.copy($scope.articleData);

                toastr.success('您的文章已更新', '文章更新成功');
                $scope.mode = 'view';
                $scope.articleData = undefined;
            }, function(err) {
                toastr.error('文章更新时遇到问题: ' + err.message, '文章更新失败');
            });
    };
    $scope.viewAlbum = function(albumId) {
        $state.go('album', { id: albumId });
    };
    $scope.saveComments = function(comments) {
        $scope.article.comments = comments;
        return tutorialApi.updateArticle($scope.article);
    }
}]);


/**
 * Modal Factory Services
 */
ccTutorials.factory('tutorialsModalFactory', ['$modal', function($modal) {
    return {
        showAddAlbumModal: function() {
            var modal = $modal.open({
                templateUrl: '/modules/tutorials/add-album-modal.html',
                controller: 'AddAlbumModalController'
            });
            return modal.result;
        }
    }
}]);


/**
 * Modal Controllers
 */
ccTutorials.controller('AddAlbumModalController', ['$scope', '$state', '$modalInstance', 'toastr', 'security', 'tutorialApi',
    function($scope, $state, $modalInstance, toastr, security, tutorialApi) {
        // Initialization
        $scope.albumData = {};

        // Interactions
        $scope.close = function() {
            $scope.cancel();
        };
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
        $scope.save = function() {
            return tutorialApi.createAlbum($scope.albumData)
                .then(function(newAlbum) {
                    toastr.success('您的专辑已创建, 去添加几篇文章吧!', '专辑创建成功');
                    $scope.close();
                    $state.go('album', { id: newAlbum._id });
                }, function(err) {
                    toastr.error('创建专辑时遇到问题: ' + err, '专辑创建失败');
                });
        };
    }]);