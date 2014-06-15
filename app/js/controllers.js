'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('AppCtrl', ['$scope', function ($scope) {
    console.log("AppCtrl");
  }])
  .controller('StoreCtrl', ['$scope', function ($scope) {
    console.log("StoreCtrl");
  }]);
