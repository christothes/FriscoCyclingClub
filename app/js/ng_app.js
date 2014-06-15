'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]);
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/', {templateUrl: 'partials/home.html'});
  $routeProvider.when('/road', {templateUrl: 'partials/road.html'});
  $routeProvider.when('/mtn', {templateUrl: 'partials/mtn.html'});
  $routeProvider.when('/track', {templateUrl: 'partials/track.html'});
  $routeProvider.when('/loggedIn', {templateUrl: 'partials/partial2.html'});
  $routeProvider.when('/denied', {templateUrl: 'partials/denied.html'});
  $routeProvider.when('/paypal', {templateUrl: 'partials/payTest.html'});
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);
