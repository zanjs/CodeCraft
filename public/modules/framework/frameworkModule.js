/**
 * Created by william on 02.04.15.
 */
var ccFramework = angular.module('cc.framework', []);


/**
 * Config
 */
ccFramework.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: '/modules/framework/home.html',
            controller: 'HomePageController'
        });
}]);


/**
 * Controllers
 */
ccFramework.controller('MainMenuController', ['$rootScope', '$scope', '$state', 'toastr', 'security', 'frameworkModalFactory', 'tutorialsModalFactory', function($rootScope, $scope, $state, toastr, security, frameworkModalFactory, tutorialsModalFactory) {
    // Initialization
    $scope.menuOpened = false;
    var _defaultMenu = {
        buttons: [
            {
                name: '登录注册',
                icon: 'sign-in',
                click: function() {
                    $scope.closeMenu();
                    frameworkModalFactory.showSignInModal();
                }
            }
        ],
        navigations: [
            {
                name: '源艺首页',
                icon: 'home',
                click: function() {
                    $scope.closeMenu();
                    $state.go('home');
                }
            },
            {
                name: '专辑大厅',
                icon: 'institution',
                click: function() {
                    $scope.closeMenu();
                    $state.go('albums');
                }
            },
            { name: '讨论专区', icon: 'comments-o' },
            { name: '数据统计', icon: 'area-chart' },
            { name: '关于本站', icon: 'sitemap' }
        ]
    };

    var _availableButtons = {
        signIn: {
            name: '登录注册',
            icon: 'sign-in',
            click: function() {
                $scope.closeMenu();
                frameworkModalFactory.showSignInModal();
            }
        },
        signOut: {
            name: '退出登录',
            icon: 'sign-out',
            click: function() {
                security.logout()
                    .then(function(res) {
                        toastr.success('bye~');
                    });
                $scope.closeMenu();
            }
        },
        addAlbum: {
            name: '创建专辑',
            icon: 'plus-square',
            click: function() {
                tutorialsModalFactory.showAddAlbumModal();
                $scope.closeMenu();
            }
        },
        addArticle: {
            name: '撰写文章',
            icon: 'pencil-square',
            click: function() {

                $scope.closeMenu();
            }
        }
    };

    $scope.menu = angular.copy(_defaultMenu);


    // Interactions
    $scope.toggleMenu = function() {
        $scope.menuOpened = !$scope.menuOpened;
    };
    $scope.closeMenu = function() {
        $scope.menuOpened = false;
    };


    // System Events
    $scope.$on('cc::security::login', function() {
        $rootScope.user = security.currentUser();
        _setButtons([ 'addArticle', 'addAlbum' ]);
    });
    $scope.$on('cc::security::logout', function() {
        $rootScope.user = security.currentUser();
        _setButtons();
    });

    // Menu Events
    $scope.$on('cc::menu::close', function() {
        $scope.closeMenu();
    });
    $scope.$on('cc::menu::reset', function() {
        $scope.menu.buttons = angular.copy(_defaultMenu);
    });
    $scope.$on('cc::menu::set-buttons', _setButtons);

    function _setButtons(buttons) {
        var buttonList = [];
        angular.forEach(buttons, function(buttonName) {
            if(_availableButtons[buttonName]) {
                buttonList.push(_availableButtons[buttonName]);
            }
        });
        if($rootScope.user && $rootScope.user._id) {
            buttonList.push(_availableButtons.signOut);
        } else {
            buttonList.push(_availableButtons.signIn)
        }
        $scope.menu.buttons = angular.copy(buttonList);
    }


    // Profile Events
    $scope.viewProfile = function() {
        if($rootScope.user && $rootScope.user._id) {
            $state.go('profile', { id: $rootScope.user._id });
        }
    };
}]);

ccFramework.controller('HomePageController', ['$state', '$scope', 'frameworkModalFactory', function($state, $scope, frameworkModalFactory) {
    $scope.languageConfig = languageConfig;
    $scope.language = 'chinese';

    $scope.toAlbums = function() {
        $state.go('albums');
    };
    $scope.join = function() {
        frameworkModalFactory.showSignInModal();
    };
}]);



/**
 * Modal Factory Services
 */
ccFramework.factory('frameworkModalFactory', ['$modal', function($modal) {
    return {
        showSignInModal: function() {
            var modal = $modal.open({
                templateUrl: '/modules/framework/sign-in-modal.html',
                controller: 'SignInModalController'
            });
            return modal.result;
        },
        showPagedownHelpModal: function() {
            var modal = $modal.open({
                templateUrl: '/modules/framework/pagedownHelpModal.html',
                controller: 'PagedownHelpModalController'
            });
            return modal.result;
        }
    }
}]);


/**
 * Modal Controllers
 */
ccFramework.controller('SignInModalController', ['$scope', '$modalInstance', 'toastr', 'security', 'promiseService',
    function($scope, $modalInstance, toastr, security, promiseService) {
        // Initialization
        $scope.mode = 'login';
        $scope.userData = {};

        // Interactions
        $scope.close = function() {
            $scope.cancel();
        };
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
        $scope.toggle = function() {
            if($scope.mode === 'login') {
                $scope.mode = 'register';
            } else {
                $scope.mode = 'login';
            }
            $scope.message = undefined;
        };
        $scope.formValid = function(form) {
            var valid = true;
            if(!form.email.$valid) {
                valid = false;
            }
            if($scope.mode === 'login') {
                if(!form.password.$valid) {
                    valid = false;
                }
            } else {
                if(!form.password.$valid || $scope.userData.password !== $scope.userData.password2 || !form.username.$valid) {
                    valid = false;
                }
            }
            return valid;
        };
        $scope.login = function() {
            return security.login($scope.userData.email, $scope.userData.password)
                .then(function(user) {
                    toastr.success('欢迎来到源艺, ' + user.username, '欢迎');
                    $scope.close();
                }, function(err) {
                    $scope.message = security.lastMessage();
                });
        };
        $scope.register = function() {
            return security.register($scope.userData.email, $scope.userData.password, $scope.userData.username)
                .then(function(res) {
                    $scope.message = security.lastMessage();
                }, function(err) {
                    $scope.message = security.lastMessage();
                });
        };
        $scope.findPassword = function() {
            return security.findPassword($scope.userData.email)
                .then(function(res) {
                    $scope.message = security.lastMessage();
                }, function(err) {
                    $scope.message = security.lastMessage();
                });
        }
    }]);

ccFramework.controller('PagedownHelpModalController', ['$scope', '$modalInstance',
    function($scope, $modalInstance) {
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);