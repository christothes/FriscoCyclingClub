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
    $routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: 'HomeCtrl'});
    $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'HomeCtrl'});
    $routeProvider.when('/loggedIn', {templateUrl: 'partials/partial2.html', controller: 'HomeCtrl'});
    $routeProvider.otherwise({redirectTo: '/view1'});
}]);
