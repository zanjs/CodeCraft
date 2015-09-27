/**
 * Created by william on 27.06.15.
 */
var ccUI = angular.module('cc.ui', []);

ccUI.filter('cnDate', function() {
    var isDate = function(date) {
        return ( (new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) ));
    };
    var addPrefix = function(num) {
        if(num < 10) {
            num = '0' + num;
        }
        return num;
    };

    return function(input) {
        if(!isDate(input)) {
            return '某年某月';
        } else {
            var date = new Date(input);
            return date.getFullYear() + '-' + addPrefix(date.getMonth() + 1) + '-' + addPrefix(date.getDate());
        }
    };
});

ccUI.filter('trimText', function() {
    return function(input, length) {
        var text = '暫時沒有介紹';
        length = length || 150;
        if(typeof input === 'string') {
            if(input.length > length) {
                text = input.substring(0, length - 1) + ' ...';
            } else {
                text = input;
            }
        }
        return text;
    }
});

ccUI.directive('busy', [function() {
    return {
        restrict: 'A',
        template: '<button class="btn btn-sm" ng-click="click()" ng-disabled="disabled() || isBusy"> <span ng-if="isBusy"><i ng-class="icon"></i></span> <span ng-transclude></span> </button>',
        replace: true,
        transclude: true,
        scope: {
            busy: '&',
            busyIcon: '@',
            busyDisabled: '&'
        },
        link: function(scope, element, attrs) {
            scope.isBusy = false;
            scope.icon = scope.busyIcon || 'fa fa-spinner fa-spin';
            scope.disabled = scope.busyDisabled || function () {
                    return false;
                };

            scope.click = function() {
                var promise = scope.busy();
                if (typeof promise == 'object' && typeof promise.finally == 'function') {
                    scope.isBusy = true;
                    promise.finally(function () {
                        scope.isBusy = false;
                    });
                }
            }
        }
    }
}]);

ccUI.directive('albumPreview', [function() {
    return {
        restrict: 'C',
        templateUrl: '/modules/tutorials/album-preview.html',
        scope: {
            album: '=',
            close: '&',
            state: '='
        },
        link: function(scope, element, attrs) {
            scope.viewAlbum = function() {
                scope.state.go('album', { id: scope.album._id });
            };
        }
    }
}]);

ccUI.directive('pagedown', function($compile, $timeout, $rootScope, frameworkModalFactory) {
    var nextId = 0;

    return {
        require: 'ngModel',
        restrict: 'C',
        replace: true,
        scope: {
            rowNumber: '=',
            placeholder: '='
        },
        template: '<div></div>',
        link: function(scope, element, attrs, ngModel) {
            var converter = Markdown.getSanitizingConverter();
            Markdown.Extra.init(converter, {
                extensions: "all",
                highlighter: "prettify"
            });
            var editorUniqueId;
            if (attrs.id == null) {
                editorUniqueId = nextId++;
            } else {
                editorUniqueId = attrs.id;
            }
            scope.viewMode = false;

            var newElement = $compile(
                '<div>' +
                '<div class="wmd-panel">' +
                '<div id="wmd-button-bar-' + editorUniqueId + '" class="wmd-button-bar"></div>' +
                '<textarea id="wmd-input-' + editorUniqueId + '" class="wmd-input form-control" placeholder="' + (scope.placeholder || '在这里添加文字，支持 Markdown') + '">' +
                '</textarea>' +
                '</div>' +
                '<div id="wmd-preview-' + editorUniqueId + '" class="pagedown-preview wmd-panel wmd-preview dashed"></div>' +
                '</div>')(scope);

            element.html(newElement);
            var $textarea = $('#wmd-input-' + editorUniqueId);
            $('div#wmd-preview-' + editorUniqueId).hide();
            var helpOptions = {
                preview: {
                    title: 'preview title',
                    handler: function() {
                        scope.viewMode = !scope.viewMode;
                        if(scope.viewMode) {
                            $('textarea#wmd-input-' + editorUniqueId).hide();
                            $('div#wmd-button-group1-' + editorUniqueId).hide();
                            $('div#wmd-button-group2-' + editorUniqueId).hide();
                            $('div#wmd-button-group3-' + editorUniqueId).hide();
                            $('div#wmd-button-group4-' + editorUniqueId).hide();
                            $('button#wmd-preview-button-' + editorUniqueId + '>i').toggleClass('fa-eye fa-edit');
                            $('button#wmd-preview-button-' + editorUniqueId + '>span').text(' 编辑');
                            $('div#wmd-preview-' + editorUniqueId).show();
                        } else {
                            $('textarea#wmd-input-' + editorUniqueId).show();
                            $('div#wmd-button-group1-' + editorUniqueId).show();
                            $('div#wmd-button-group2-' + editorUniqueId).show();
                            $('div#wmd-button-group3-' + editorUniqueId).show();
                            $('div#wmd-button-group4-' + editorUniqueId).show();
                            $('button#wmd-preview-button-' + editorUniqueId + '>i').toggleClass('fa-edit fa-eye');
                            $('button#wmd-preview-button-' + editorUniqueId + '>span').text(' 预览');
                            $('div#wmd-preview-' + editorUniqueId).hide();
                        }
                    }
                },
                help: {
                    title: 'help title',
                    handler: function() {
                        frameworkModalFactory.showPagedownHelpModal();
                        //$rootScope.$broadcast('cc-modal::open-pagedown-help');
                    }
                }
            };
            var editor = new Markdown.Editor(converter, "-" + editorUniqueId, helpOptions);
            var $wmdInput = element.find('#wmd-input-' + editorUniqueId);
            var init = false;
            $textarea.css({
                overflow: 'hidden',
                minHeight: 150 + 'px'
            });
            editor.hooks.chain("onPreviewRefresh", function () {
                prettyPrint();
                var val = $wmdInput.val();
                if (init && val !== ngModel.$modelValue ) {
                    $timeout(function(){
                        scope.$apply(function(){
                            ngModel.$setViewValue(val);
                            ngModel.$render();
                        });
                    });
                }
                autosize($textarea);
            });
            ngModel.$formatters.push(function(value){
                init = true;
                $wmdInput.val(value);
                editor.refreshPreview();
                return value;
            });

            editor.run();
        }
    };
});

ccUI.directive('pagedownViewer', function() {
    return {
        restrict: 'C',
        replace: true,
        scope: {
            content: '='
        },
        template: '<div></div>',
        link: function(scope, element) {
            var html = "";
            if(scope.content && scope.content.trim().length > 0) {
                var converter = new Markdown.getSanitizingConverter();
                Markdown.Extra.init(converter, {
                    extensions: "all",
                    highlighter: "prettify"
                });
                html = converter.makeHtml(scope.content);
            } else {
                html = '<div class="alert alert-warning" ng-show="!album.introduction || album.introduction.trim().length == 0">'
                    + '这里暂时还没有内容'
                    + '</div>';

            }
            element.html(html);
            prettyPrint();
        }
    }
});

ccUI.directive('commentsPanel', ['$rootScope', 'underscore', 'toastr', 'frameworkModalFactory', 'promiseService', function($rootScope, underscore, toastr, frameworkModalFactory, promiseService) {
    return {
        restrict: 'C',
        replace: true,
        scope: {
            comments: '=',
            saveComments: '&'
        },
        templateUrl: '/modules/framework/comments-panel.html',
        link: function(scope, element) {

            scope.commentData = {};
            scope.processedComments = _processComments();
            scope.replyToUuid = undefined;
            scope.replyTo = function(comment) {
                if(comment && comment.type === 'toComment') {
                    scope.replyToUuid = comment.replyTo;
                    scope.commentData.content = "To " + comment.author.username + ', '
                }
                else if(comment && comment.type === 'toPost') {
                    scope.replyToUuid = comment.uuid;
                    scope.commentData.content = "To " + comment.author.username + ', '
                } else {
                    scope.replyToUuid = undefined;
                }
            };
            scope.cancel = function() {
                scope.commentData = {};
                scope.replyToUuid = undefined;
            };
            scope.save = function() {
                return promiseService.wrap(function(promise) {
                    if($rootScope.user) {
                        scope.commentData.uuid = _getUuid();
                        scope.commentData.author = {
                            _id: $rootScope.user._id,
                            username: $rootScope.user.username,
                        };
                        if(scope.replyToUuid) {
                            scope.commentData.replyTo = scope.replyToUuid;
                            scope.commentData.type = 'toComment';
                        } else {
                            scope.commentData.type = 'toPost';
                        }
                        scope.commentData.date = new Date;
                        var comments = angular.copy(scope.comments);
                        comments.push(scope.commentData);
                        scope.saveComments({ comments: comments })
                            .then(function() {
                                toastr.success('您的评论已保存.', '评论发布成功');
                                scope.comments = angular.copy(comments);
                                scope.processedComments = _processComments();
                                scope.commentData = {};
                                promise.resolve();
                            });
                    } else {
                        frameworkModalFactory.showSignInModal();
                        promise.resolve();
                    }
                });
            };

            function _processComments() {
                var processedComments = underscore.where(scope.comments, { type: 'toPost' });
                var toComments = underscore.where(scope.comments, { type: 'toComment' });
                angular.forEach(processedComments, function(comment) {
                    comment.replies = underscore.where(toComments, { replyTo: comment.uuid });
                });
                return processedComments;
            }

            function _getUuid() {
                var d = new Date().getTime();
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = (d + Math.random()*16)%16 | 0;
                    d = Math.floor(d/16);
                    return (c=='x' ? r : (r&0x3|0x8)).toString(16);
                });
                return uuid;
            }
        }
    }
}]);

ccUI.directive('avatar', ['userApi', function(userAPi) {
    return {
        restrict: 'C',
        replace: true,
        scope: {
            userId: '='
        },
        template: '<img ng-src="{{ user.photo }}" alt="avatar" class="img-circle">',
        link: function(scope, element) {
            scope.user = {
                _id: scope.userId,
                photo: 'resources/img/avatar/avatar_default.jpg',
                username: ''
            };

            if(scope.userId) {
                userAPi.getUserById(scope.userId, 'avatar')
                    .then(function(user) {
                        scope.user.photo = user.photo === 'default' ? scope.user.photo : user.photo;
                        scope.user.username = user.username;
                    });
            }
        }
    }
}]);