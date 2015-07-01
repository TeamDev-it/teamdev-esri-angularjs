var m = angular.module("teamdev.esri.renderers", ["teamdev.esri"]);

m.directive("heatmapRenderer", function ($q) {
  var ready = $q.defer();
  var isready = ready.promise;

  return {
    restrict: "E",
    request: "^esriMap",
    scope: {
      blurRadius: "=",
      colorStops: "=",
      colors: "=",
      field: "=",
      maxPixelIntensity: "=",
      minPixelIntensity: "="
    },
    link: function (scope, element, attrs, esrimap) {
      require(["esri/renderers/HeatmapRenderer"], function (HeatmapRenderer) {

        scope.this_renderer = new HeatmapRenderer({
          colors: scope.colors,
          blurRadius: scope.blurRadius,
          field: scope.field,
          maxPixelIntensity: scope.maxPixelIntensity,
          minPixelIntensity: scope.minPixelIntensity
        });
        ready.resolve();
      });

      scope.$watch("blurRadius", function () { isready.then(function () { scope.this_renderer.setBlurRadius(scope.blurRadius); }); });
      scope.$watch("colorStops", function () { isready.then(function () { scope.this_renderer.setColorStops(scope.colorStops); }); });
      scope.$watch("colors", function () { isready.then(function () { scope.this_renderer.setColors(scope.colors); }); });
      scope.$watch("field", function () { isready.then(function () { scope.this_renderer.setField(scope.field); }); });
      scope.$watch("maxPixelIntensity", function () { isready.then(function () { scope.this_renderer.setMaxPixelIntensity(scope.maxPixelIntensity); }); });
      scope.$watch("minPixelIntensity", function () { isready.then(function () { scope.this_renderer.setMinPixelIntensity(scope.minPixelIntensity); }); });
    }
  };
});
