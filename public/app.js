/**
 * Created by william on 02.04.15.
 */

var codeCraft = angular.module('codeCraft', [ 'ui.router', 'duScroll', 'ngAnimate', 'ui.bootstrap', 'angular-loading-bar', 'toastr', 'bootstrap-switch', 'cc.utilities', 'cc.ui', 'cc.framework', 'cc.security', 'cc.api', 'cc.account', 'cc.tutorials']);

codeCraft.config(['$urlRouterProvider', '$locationProvider', '$stateProvider', function($urlRouterProvider, $locationProvider, $stateProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
}]);