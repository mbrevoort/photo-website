angular.module('photos', ['ngRoute'])
  .factory('photosService', function ($http) {

    return {
      directory: function (path) {
        return $http({method: 'GET', url: '/api/directory/' + path}).
          then(function (result) { return result.data })
      },
      exif: function (path) {
        return $http({method: 'GET', url: '/api/exif/' + path}).
          then(function (result) { return result.data })
      }
    }
  })
  .factory('scrollService', function ($rootScope) {
    'use strict';

    var state = {
      scrollY: 0
    };

    return {
      state: state,
      trigger: function () {
        console.log('trigger')
        $rootScope.$broadcast('scroll')
      }
    };
  })

  .controller('MainController', function ($scope) {

  })

  .controller('DirectoryController', function ($scope, $location, $timeout, photosService, scrollService) {
    photosService.directory($location.path()).then(function(details) {
      $scope.directory = details;
      scrollService.trigger();
    });
    $scope.viewDetail = function (item) {
      $location.path('/' + item.path);
    }
  })

  .controller('IndividualController', function ($scope, $location, photosService) {
    $scope.path = '/api/lg/' + $location.path();
    photosService.exif($location.path()).then(function(exif) {
      $scope.exif = exif;
    });
  })

  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
        .when(':root*\.:ext', {templateUrl: '/templates/individualView.html',   controller: 'IndividualController'})
        .otherwise({templateUrl: '/templates/directoryView.html',   controller: 'DirectoryController'});
    $locationProvider.html5Mode(true);
  }])

  .directive('keepScroll', function ($timeout, scrollService) {
    return function (scope, element, attrs) {

      //load scroll position after everything has rendered
      // $timeout(function () {
      //     var scrollY = scrollService.state[attrs.keepScroll];
      //     $(window).scrollTop(scrollY ? scrollY : 0);
      // }, 1000);

      scope.$on("scroll", function () {
        $timeout(function () {
          var scrollY = scrollService.state[attrs.keepScroll];
          $(window).scrollTop(scrollY ? scrollY : 0);
        }, 0);
      })

      //save scroll position on change
      scope.$on("$routeChangeStart", function () {
        scrollService.state[attrs.keepScroll] = $(window).scrollTop();
        console.log(scrollService.state[attrs.keepScroll]);
      });
    }
  });
