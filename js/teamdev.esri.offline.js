/* global O */
/* global angular */
var m = angular.module("teamdev.esri")
.directive("offlineTileLayer", function ($q, esriRegistry) {
  return {
    restrict: "E",
    require: "^esriMap",
    replace: true,
    scope: {
      id: "@",
      url: "@",
      isOnLine: "=",
      onReady: "&"
    },
    link: {
      pre: function (scope, element, attrs, esriMap) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;
        require(["./lib/teamdev-esri-angularjs/js/libs/offline-tiles-advanced-min.js"], function () {
          scope.this_layer = new O.esri.Tiles.OfflineTileEnablerLayer(scope.url, function () {
            console.log("Offline Tile Layer Loaded.");

            esriMap.addLayer(scope.this_layer);
            ready.resolve();
            if (scope.onReady())
              scope.onReady()(scope.this_layer);
          }, scope.isOnLine);
        
          if (scope.id) {
            scope.this_layer.id = scope.id;
            esriRegistry.set(scope.id, scope.this_layer);
          }
        });
      }
    }
  };
});