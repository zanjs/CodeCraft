/**
 * Created by william on 27.06.15.
 */
var ccAccount = angular.module('cc.account', []);


/**
 * Config
 */
ccAccount.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('profile', {
            url: '/profile/:id',
            templateUrl: '/modules/account/profile.html',
            controller: 'ProfileController',
            resolve: {
                user: ['$stateParams', 'userApi', function($stateParams, userApi) {
                    return userApi.getUserById($stateParams.id, 'profile');
                }]
            }
        })
        .state('activation', {
            url: '/account/activate/:hashCode',
            templateUrl: '/modules/account/activate.html',
            controller: 'ActivationController'
        })
        .state('reset', {
            url: '/account/reset-password/:hashCode',
            templateUrl: '/modules/account/reset-password.html',
            controller: 'ResetController'
        });
}]);


/**
 * Controllers
 */
ccAccount.controller('ProfileController', ['$rootScope' ,'$scope', '$state', 'user' , function($rootScope, $scope, $state, user) {
    $scope.user = user;
    $scope.tab = 'activities';

    // Interactions
    $scope.switchTab = function(tab) {
        $scope.tab = tab;
    };
    $scope.viewActivityDetails = function(activity) {
        switch(activity.type) {
            case 'Album':
                $state.go('album', { id: activity.linkedId });
                break;
            case 'Article':
                $state.go('article', { id: activity.linkedId });
                break;
        }
    };
    $scope.viewAlbumDetails = function(album) {
        $state.go('album', { id: album._id });
    };

    // Utils
    $scope.isVisitor =  $rootScope.user && $rootScope.user._id === $scope.user._id;
}]);

ccAccount.controller('ActivationController', ['$scope', '$state', '$stateParams', '$interval', 'security', function($scope, $state, $stateParams, $interval, security) {
    // activate user account
    security.activate($stateParams.hashCode)
        .then(function(res) {
            $scope.message = security.lastMessage();
            _startCountDown();
        }, function(err) {
            _startCountDown();
            $scope.message = security.lastMessage();
        });

    // count down and jump to homepage
    var countDown;
    function _startCountDown() {
        $scope.counter = 10;
        countDown = $interval(_countingDown, 1000);
    }
    function _countingDown() {
        $scope.counter--;
        if($scope.counter === 0) {
            _stopCountDown();
        }
    }
    function _stopCountDown() {
        $interval.cancel(countDown);
        $state.go('home');
    }
}]);

ccAccount.controller('ResetController', ['$scope', '$state', '$stateParams', '$interval', 'security', function($scope, $state, $stateParams, $interval, security) {
    $scope.userData = {
        hashCode: $stateParams.hashCode
    };
    $scope.reset = function() {
        return security.resetPassword($scope.userData.hashCode, $scope.userData.password)
            .then(function(res) {
                $scope.message = security.lastMessage();
                _startCountDown();
            }, function(err) {
                $scope.message = security.lastMessage();
                _startCountDown();
            });
    };

    $scope.toHomepage = function() {
      $state.go('home');
    };

    // count down and jump to homepage
    var countDown;
    function _startCountDown() {
        $scope.counter = 10;
        countDown = $interval(_countingDown, 1000);
    }
    function _countingDown() {
        $scope.counter--;
        if($scope.counter === 0) {
            _stopCountDown();
        }
    }
    function _stopCountDown() {
        $interval.cancel(countDown);
        $state.go('home');
    }
}]);