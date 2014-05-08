'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'});
    $routeProvider.when('/road', {templateUrl: 'partials/road.html', controller: 'HomeCtrl'});
    $routeProvider.when('/mtn', {templateUrl: 'partials/mtn.html', controller: 'HomeCtrl'});
    $routeProvider.when('/track', {templateUrl: 'partials/track.html', controller: 'HomeCtrl'});
    $routeProvider.when('/loggedIn', {templateUrl: 'partials/partial2.html', controller: 'HomeCtrl'});
    $routeProvider.otherwise({redirectTo: '/view1'});
}]);
