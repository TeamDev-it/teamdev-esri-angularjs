/* global O */
/* global angular */
var m = angular.module("teamdev.esri", []);

m.factory("esriRegistry", function ($window) {
  if (typeof $window.teamdev == 'undefined')
    $window.teamdev = { esri_registry: {} };

  return {
    set: function (name, value) {
      $window.teamdev.esri_registry[name] = value;
    },
    get: function (name) {
      return $window.teamdev.esri_registry[name];
    },
    remove: function (name) {
      $window.teamdev.esri_registry[name] = null;
    }
  };
});

m.factory("esriQuery", function ($q, esriRegistry) {
  function setParameter(destination, source, parameter) {
    if (typeof (source && source[parameter]) !== "undefined" && source[parameter]) destination[parameter] = source[parameter];
  }

  return {
    featuresNearPoint: function (layerid, point, tollerance) {
      esriRegistry.get(layerid).features;
    },
    queryTask: function (url, fields, where, options) {
      var _q = $q.defer();

      this.create(fields, where, function (query) {
        require(["esri/tasks/QueryTask"], function (QueryTask) {
          var qt = new QueryTask(url);
          qt.execute(query, function (result) { _q.resolve(result); });
        });
      }, options);
      return _q.promise;
    },
    queryFeatures: function (layerid, fields, where, options) {
      var _q = $q.defer();

      if (!where) {
        where = fields;
        fields = "*";
      }

      this.create(fields, where, function (query) {
        esriRegistry.get(layerid).queryFeatures(query).then(function (result) { _q.resolve(result); });
      }, options);
      return _q.promise;
    },
    selectFeatures: function (layerid, fields, where, options) {
      if (!where) {
        where = fields;
        fields = "*";
      }

      var _q = $q.defer();
      this.create(fields, where, function (query) {
        if (layerid instanceof Object) layerid.selectFeatures(query).then(function (result) { _q.resolve(result); });
        else {
          var olayer = esriRegistry.get(layerid);
          if (olayer) olayer.selectFeatures(query).then(function (result) { _q.resolve(result); });
        }
      }, options);
      return _q.promise;
    },
    identify: function (layeruri, where) {
      var _q = $q.defer();

      require(["esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", "dojo/on"], function (IdentifyTask, IdentifyParameters, on) {
        var params = new IdentifyParameters();
        params.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
        setParameter(params, where, "dpi");
        setParameter(params, where, "dynamicLayerInfos");
        setParameter(params, where, "geometry");
        setParameter(params, where, "geometryType");
        setParameter(params, where, "height");
        setParameter(params, where, "layerDefinitions");
        setParameter(params, where, "layerIds");
        setParameter(params, where, "layerOption");
        setParameter(params, where, "layerTimeOptions");
        setParameter(params, where, "mapExtent");
        setParameter(params, where, "maxAllowableOffset");
        setParameter(params, where, "returnGeometry");
        setParameter(params, where, "orderByFields");
        setParameter(params, where, "spatialReference");
        setParameter(params, where, "timeExtent");
        setParameter(params, where, "tolerance");
        setParameter(params, where, "width");

        var tsk = new IdentifyTask(layeruri);
        tsk.execute(params, function (results) { _q.resolve(results); });
      });
      return _q.promise;
    },
    create: function (arg1, where, action, options) {
      if (angular.isFunction(arg1) && !action)
        action = arg1;

      if (action)
        require(["esri/tasks/query"], function (Query) {
          var query = new Query();

          setParameter(query, options, "spatialRel");
          setParameter(query, options, "geometry");
          setParameter(query, options, "returnGeometry");
          setParameter(query, options, "orderByFields");
          setParameter(query, options, "returnDistinctValues");
          setParameter(query, options, "distance");

          if (angular.isString(arg1))
            query.outFields = arg1.split(",");
          else if (angular.isArray(arg1))
            query.outFields = arg1;

          if (angular.isString(where)) query.where = where;
          else if (angular.isObject(where))
            query.geometry = where;

          action(query);
        });
    }
  };
});

m.directive("esriMap", function ($q, esriRegistry) {
  function link(scope, element, attrs) {
    function createMap() {
      var prepared = $q.defer();
      scope.isObjectReady = prepared.promise;
      require(["esri/map", "esri/arcgis/utils", "esri/IdentityManager", "dojo/on", "dojo/touch", "dojo/domReady"], function (Map, arcgisUtils, esriIm, on, touch) {

        var options = {
          basemap: "gray",
          autoResize: false,
        };

        if (scope.autoresize) options.autoResize = scope.autoresize;
        if (scope.mapcenter) options.center = scope.mapcenter;
        if (scope.mapbase) options.basemap = scope.mapbase;
        if (scope.mapzoom) options.zoom = scope.mapzoom;
        if (scope.scale) options.scale = scope.scale;

        if (scope.showLabels) options.showLabels = scope.showLabels;
        if (scope.slider) options.slider = scope.slider;
        if (scope.showInfoWindowOnClick) options.showInfoWindowOnClick = scope.showInfoWindowOnClick;
        if (scope.wrapAround180) options.wrapAround180 = scope.wrapAround180;

        if (scope.minZoom) options.minZoom = scope.minZoom;
        if (scope.maxZoom) options.maxZoom = scope.maxZoom;
        if (scope.minScale) options.minScale = scope.minScale;
        if (scope.maxScale) options.maxScale = scope.maxScale;

        if (scope.showNavigation) options.nav = scope.showNavigation;
        if (scope.showLogo) options.logo = scope.showLogo;
        if (scope.showAttribution) options.showAttribution = scope.showAttribution;


        if (scope.credentials) {
          esriIm.registerToken(scope.credentials);
        }

        if (scope.disableScrollZoom)
          options.smartNavigation = false;

        if (scope.webmapid) {
          arcgisUtils.createMap(scope.webmapid, scope.mapid, { mapOptions: options }).then(function (result) {
            scope.esri_map = result.map;
            prepared.resolve();
          });
        }
        else {
          scope.esri_map = new Map(scope.mapid, options);
          prepared.resolve();
        }

        prepared.promise.then(function () {
          esriRegistry.set(scope.mapid, scope.esri_map);
          if (scope.esri_map.loaded) {
            //scope.esri_map.resize();
            if (scope.disableScrollZoom)
              scope.esri_map.disableScrollWheelZoom();
            if (scope.onMapReady()) scope.onMapReady()(scope.esri_map);
          }
          else {
            scope.esri_map.on("load", function () {
              //scope.esri_map.resize();
              if (scope.disableScrollZoom)
                scope.esri_map.disableScrollWheelZoom();
              if (scope.onMapReady()) scope.onMapReady()(scope.esri_map);
            });
          }
          scope.esri_map.on("click", function (p) {
            if (scope.onClick())
              scope.onClick()(p);

            if (scope.onGraphicsClick() || scope.isOnMobileDevice) {
              require(["esri/geometry/Extent"], function (Extent) {
                var pixelWidth = scope.esri_map.extent.getWidth() / scope.esri_map.width;
                var toleraceInMapCoords = scope.clickTolerance * pixelWidth;
                var clickExtent = new Extent(p.mapPoint.x - toleraceInMapCoords, p.mapPoint.y - toleraceInMapCoords,
                                              p.mapPoint.x + toleraceInMapCoords, p.mapPoint.y + toleraceInMapCoords,
                                              scope.esri_map.extent.spatialReference);
                var result_graphics = [];
                scope.esri_map.graphics.graphics.forEach(function (g) {
                  if (clickExtent.contains(g)) result_graphics.push(g);
                });
                scope.onGraphicsClick()(result_graphics);
              });
            }
          });
        });
      });
    };

    if (scope.mapcenter) scope.$watch("mapcenter", function (n, o) {
      if (scope.esri_map && scope.esri_map.loaded && n !== o) {
        scope.isObjectReady.then(function () {
          scope.esri_map.centerAt(n);
        });
      }
    });
    if (scope.mapbase) scope.$watch("mapbase", function (n, o) {
      if (scope.esri_map && scope.esri_map.loaded && n !== o) {
        scope.isObjectReady.then(function () {
          scope.esri_map.setBasemap(n);
        });
      }
    });
    if (scope.hideinfowindow !== undefined) scope.$watch("hideinfowindow", function (n, o) {
      if (scope.esri_map && scope.esri_map.loaded) {
        scope.isObjectReady.then(function () {
          if (n)
            scope.esri_map.infoWindow.hide();
        });
      }
    });

    createMap();
  };

  function compiler($element, $attrs) {
    $element.append('<div id=' + $attrs.mapId + '></div>');
    return {
      pre: link
    };
  }

  return {
    restrict: "E",
    replace: true,
    scope: {
      autoresize: "=autoResize",
      mapcenter: "=mapCenter",
      webmapid: "@webmapid",
      mapid: "@mapId",
      mapbase: "@baseMap",
      mapzoom: "=zoom",
      scale: "@scale",
      minZoom: "@minZoom",
      maxZoom: "@maxZoom",
      minScale: "@minScale",
      maxScale: "@maxScale",
      showNavigation: "=showNavigation",
      showLogo: "@showLogo",
      showAttribution: "@showAttribution",
      showLabels: "@showLabels",
      wrapAround180: "@wrapAround180",
      showInfoWindowOnClick: "@showInfoWindowOnClick",
      slider: "@slider",
      onMapReady: "&onMapReady",
      onClick: "&onClick",
      onGraphicsClick: "&onGraphicsClick",
      clickTolerance: "=",
      isOnMobileDevice: "=",
      credentials: "=",
      hideinfowindow: "=hideInfoWindow",
      disableScrollZoom: "="
    },
    compile: compiler,
    controller: function ($scope) {
      this.addLayer = function (l) {
        $scope.isObjectReady.then(function () {
          $scope.esri_map.addLayer(l);
        });
      };
      this.removeLayer = function (l) {
        $scope.isObjectReady.then(function () {
          if (typeof ($scope.esri_map._gc) !== "undefined" && $scope.esri_map._gc && typeof ($scope.esri_map._gc._surface) !== "undefined" && $scope.esri_map._gc._surface)
            $scope.esri_map.removeLayer(l);

          // Non devo rimuovere in modo coatto l'oggetto dal registry. 
          // L'oggetto si rimuover� da solo al $destroy
          //if (l.id) esriRegistry.remove(l.id);
        });
      };
      this.getMap = function (action) {
        if (action) $scope.isObjectReady.then(function () { action($scope.esri_map); });
      };
      this.setInfoWindow = function (t, c) {
        $scope.isObjectReady.then(function () {
          $scope.esri_map.infoWindow.setTitle(t);
          $scope.esri_map.infoWindow.setContent(c);
        });
      };
    }
  };
});

m.directive("featureLayer", function ($q, esriRegistry, $timeout) {
  return {
    restrict: "E",
    require: "^esriMap",
    replace: true,
    scope: {
      id: "@",
      url: "@",
      visible: "=",
      onClick: "&",
      onDblClick: "&",
      outFields: "@",
      zoomToSelection: "@",
      mode: "@",
      onReady: "&",
      index: "@",
      showInfoWindowOnClick: "=",
      onBeforeApplyEdits: "&",
      onEditsComplete: "&",
      onGraphicAdd: "&",
      onGraphicRemove: "&",
      editable : "@",
    },
    link: {
      pre: function (scope, element, attrs, esriMap) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;
        require(["esri/layers/FeatureLayer", "esri/graphicsUtils", "esri/IdentityManager"], function (FeatureLayer, GraphicsUtils, esriIm) {
          console.log(esriIm);

          if (attrs.url)
            scope.this_layer = new FeatureLayer(attrs.url, evaluateOptions(scope));
          else
            scope.this_layer = new FeatureLayer({ featureSet: null, layerDefinition: { "geometryType": "esriGeometryPolygon", "fields": [] } }, evaluateOptions(scope));

          esriMap.addLayer(scope.this_layer, scope.index);

          if (scope.id) {
            scope.this_layer.id = scope.id;
            esriRegistry.set(scope.id, scope.this_layer);
          }

          if (scope.this_layer.loaded)
            ready.resolve();
          else
            scope.this_layer.on("load", function (r) {
              ready.resolve();
            });

          scope.isObjectReady.then(function () {

            if (scope.editable)
              try { scope.this_layer.setEditable(scope.editable); } catch (e) {
                console.log("Setting Editing to Layer failed: " + e);
              }

            if (scope.onReady()) scope.onReady()(scope.this_layer);
          });

          //if (scope.onClick() || scope.showInfoWindowOnClick == true)
          scope.this_layer.on("click", function (r) {
            if (!scope.$$phase && !scope.$root.$$phase) scope.$apply(function () {
              if (scope.onClick()) scope.onClick()(r);
            });
            else
              if (scope.onClick()) scope.onClick()(r);

            esriMap.getMap(function (rr) {
              rr.infoWindow.hide();
              rr.infoWindow.clearFeatures();
              rr.infoWindow.setFeatures([r.graphic]);
              if (scope.showInfoWindowOnClick == true)
                $timeout(function () { rr.infoWindow.show(r.mapPoint); });
            });
          });

          if (scope.onDblClick()) scope.this_layer.on("dbl-click", function (r) { scope.onDblClick()(r); });
          if (scope.onBeforeApplyEdits()) scope.this_layer.on("before-apply-edits", function (r) { scope.onBeforeApplyEdits()(r); });
          if (scope.onEditsComplete()) scope.this_layer.on("edits-complete", function (r) { scope.onEditsComplete()(r); });
          if (scope.onGraphicAdd()) scope.this_layer.on("graphic-add", function (r) { scope.onGraphicAdd()(r); });
          if (scope.onGraphicRemove()) scope.this_layer.on("graphic-remove", function (r) { scope.onGraphicRemove()(r); });

          function evaluateOptions(scope) {
            var options = {};

            if (scope.mode)
              switch (scope.mode) {
                case "MODE_SNAPSHOT": options.mode = FeatureLayer.MODE_SNAPSHOT; break;
                case "MODE_ONDEMAND": options.mode = FeatureLayer.MODE_ONDEMAND; break;
                case "MODE_SELECTION": options.mode = FeatureLayer.MODE_SELECTION; break;
                case "MODE_AUTO": options.mode = FeatureLayer.MODE_AUTO; break;

                case "POPUP_HTML_TEXT": options.mode = FeatureLayer.POPUP_HTML_TEXT; break;
                case "POPUP_NONE": options.mode = FeatureLayer.POPUP_NONE; break;
                case "POPUP_URL": options.mode = FeatureLayer.POPUP_URL; break;
                case "SELECTION_ADD": options.mode = FeatureLayer.SELECTION_ADD; break;
                case "SELECTION_NEW": options.mode = FeatureLayer.SELECTION_NEW; break;
                case "SELECTION_SUBTRACT": options.mode = FeatureLayer.SELECTION_SUBTRACT; break;
              }

            if (scope.outFields)
              if (angular.isArray(scope.outFields))
                options.outFields = scope.outFields;
              else
                options.outFields = scope.outFields.split(",");
            return options;
          }

          scope.this_layer.on("selection-complete", function () {
            if (scope.zoomToSelection == true) {
              scope.isObjectReady.then(function () {
                var extent = GraphicsUtils.graphicsExtent(scope.this_layer.getSelectedFeatures());
                esriMap.getMap(function (m) { m.setExtent(extent); });
              });
            }
          });

        });
        if (scope.visible) scope.$watch("visible", function (n, o) {
          if (scope.this_layer && n !== o) {
            scope.this_layer.setVisibility(n);
          }
        });

        scope.$on("$destroy", function () {
          scope.isObjectReady.then(function () {
            if (scope.id && esriRegistry.get(scope.id) === scope.this_layer)
              esriRegistry.remove(scope.id);
            esriMap.removeLayer(scope.this_layer);
          });
        });
      }
    },
    controller: function ($scope) {
      this.add = function (point) {
        $scope.isObjectReady.then(function () {
          $scope.this_layer.add(point);
        });
      };
      this.setSymbol = function (symbol) {
        $scope.isObjectReady.then(function () {
          require(["esri/renderers/SimpleRenderer"], function (SimpleRenderer) {
            $scope.this_layer.setRenderer(SimpleRenderer(symbol));
          });
        });
      };
      this.remove = function (g) { $scope.this_layer.remove(g); };
      this.getLayer = function (action) {
        if (action)
          $scope.isObjectReady.then(function () { action($scope.this_layer) });
      };
      this.setRenderer = function (renderer) {
        $scope.isObjectReady.then(function () {
          $scope.this_layer.setRenderer(renderer);
        });
      };
      this.setInfoWindow = function (t, c) {
        $scope.isObjectReady.then(function () {
          require(["esri/InfoTemplate"], function (InfoTemplate) {
            var template = new InfoTemplate();
            template.setTitle(t);
            template.setContent(c);
            $scope.this_layer.setInfoTemplate(template);
          });
        });
      };
    }
  };
});

m.directive("graphicsLayer", function ($q, esriRegistry) {

  return {
    restrict: "E",
    require: "^esriMap",
    scope: {
      id: "@",
      visible: "=",
      onClick: "&",
      index: "@"

    },
    link: {
      pre: function (scope, element, attrs, esriMap) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;

        require(["esri/layers/GraphicsLayer"], function (GraphicsLayer) {
          scope.this_layer = new GraphicsLayer();
          esriMap.addLayer(scope.this_layer, scope.index);
          if (scope.id) {
            scope.this_layer.id = scope.id;
            esriRegistry.set(scope.id, scope.this_layer);
          }
          ready.resolve();

          scope.this_layer.on("click", function (r) {
            if (!scope.$$phase && !scope.$root.$$phase) scope.$apply(function () {
              if (scope.onClick()) scope.onClick()(r);
            });
          });
        });
        if (scope.visible) scope.$watch("visible", function (n, o) {
          if (scope.this_layer && n !== o) {
            scope.this_layer.setVisibility(n);
          }
        });
        scope.$on("$destroy", function () {
          scope.isObjectReady.then(function () {
            if (scope.id && esriRegistry.get(scope.id) === scope.this_layer) esriRegistry.remove(scope.id);
            esriMap.removeLayer(scope.this_layer);
          });
        });
      }
    },
    controller: function ($scope) {
      this.add = function (point) {
        $scope.isObjectReady.then(function () {
          $scope.this_layer.add(point);
        });
      };
      this.setSymbol = function (symbol) {
        $scope.isObjectReady.then(function () {
          require(["esri/renderers/SimpleRenderer"], function (SimpleRenderer) {
            $scope.this_layer.setRenderer(new SimpleRenderer(symbol));
          });
        });
      };
      this.remove = function (g) {
        $scope.this_layer.remove(g);
      };
      this.setInfoWindow = function (t, c) {
        $scope.isObjectReady.then(function () {
          require(["esri/InfoTemplate"], function (InfoTemplate) {
            var template = new InfoTemplate();
            template.setTitle(t);
            template.setContent(c);
            $scope.this_layer.setInfoTemplate(template);
          });
        });
      };
      this.getLayer = function (action) {
        if (action)
          $scope.isObjectReady.then(function () { action($scope.this_layer) });
      };
    }
  };
});

m.directive("editor", function ($q) {
  return {
    restrict: "E",
    require: ["^esriMap"],
    scope: {
      editorDiv: "@",
      id: "@",
      enableSnapping: "@",
      toolbarVisible: "@",
      maxUndoRedoOperations: "@",
      geometryService: "@",
      enableUndoRedo: "@",
      disableAttributeUpdate: "@",
      disableGeometryUpdate: "@",
      enableSnappingMessage: "@",
    },
    link: function (scope, element, attr, parents) {
      var ready = $q.defer();
      scope.isObjectReady = ready.promise;

      parents[0].getMap(function (m) {
        require(["esri/SnappingManager", "esri/dijit/editing/Editor", "esri/toolbars/draw", "dojo/i18n!esri/nls/jsapi", "dojo/_base/array", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!"],
          function (SnappingManager, Editor, Draw, i18n, arrayUtils) {

            var featureLayerInfos = [];

            for (var i in m._layers) {
              if (m._layers[i].type === "Feature Layer")
                featureLayerInfos.push({
                  "featureLayer": m._layers[i]
                });
            }

            var editor = new Editor({
              settings: {
                layerInfos: featureLayerInfos,
                map: m,
                toolbarVisible: scope.toolbarVisible || false,
                maxUndoRedoOperations: scope.maxUndoRedoOperations || 5,
                geometryService: scope.geometryService,
                enableUndoRedo: scope.enableUndoRedo || false,
                disableAttributeUpdate: scope.disableAttributeUpdate || false,
                disableGeometryUpdate: scope.disableGeometryUpdate || false,
              }
            }, scope.editorDiv);
            editor.startup();

            i18n.toolbars.draw.start += scope.enableSnappingMessage || "<br/>Press <b>CTRL</b> to enable snapping";
            i18n.toolbars.draw.addPoint += scope.enableSnappingMessage || "<br/>Press <b>CTRL</b> to enable snapping";

            if (scope.enableSnapping == true)
              map.enableSnapping();
          });
      });
    }
  };
});

m.directive("labelLayer", function ($q) {
  return {
    restrict: "E",
    require: ["^featureLayer", "^esriMap"],
    scope: {
      fieldName: "@"
    },
    link: function (scope, element, attr, parents) {
      var ready = $q.defer();
      scope.isObjectReady = ready.promise;
      require(["esri/layers/LabelLayer", "esri/symbols/TextSymbol", "esri/renderers/SimpleRenderer"],
        function (LabelLayer, TextSymbol, SimpleRenderer) {
          var symbol = new TextSymbol();
          var renderer = new SimpleRenderer(symbol);
          scope.this_layer = new LabelLayer();

          parents[0].getLayer(function (l) {
            scope.this_layer.addFeatureLayer(l, renderer, "{" + scope.fieldName + "}");
            parents[1].addLayer(scope.this_layer);
          });
          ready.resolve();
        });

      scope.$on("$destroy", function () {
        scope.isObjectReady.then(function () {
          parents[1].removeLayer(scope.this_layer);
        });
      });
    }
  };
});

m.directive("polyLine", function ($q) {

  return {
    restrict: "E",
    require: ["?^graphicsLayer", "?^featureLayer"],
    scope: {
      json: "="
    },
    link: {
      pre: function (scope, element, attrs, layers) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;
        var layer = layers[0] || layers[1];
        require(["esri/geometry/Polyline", "esri/graphic"], function (Polyline, Graphic) {

          if (scope.json)
            if (scope.json instanceof Object && scope.json.type === "polyline")
              scope.geometry = scope.json;
            else
              scope.geometry = new Polyline(scope.json);
          if (scope.symbol) {
            scope.graphic = new Graphic(scope.geometry, scope.symbol);
            layer.add(scope.graphic);
          }
          else {
            scope.graphic = new Graphic(scope.geometry);
            layer.add(scope.graphic);
          }
          ready.resolve();
        });

        scope.$on("$destroy", function () { scope.isObjectReady.then(function () { layer.remove(scope.graphic); }); });
      }
    },
    controller: function ($scope) {
      this.setSymbol = function (val) {
        $scope.isObjectReady.then(function () {
          $scope.symbol = val;
          $scope.graphic.setSymbol(val);
          $scope.graphic.draw();
        });
      };
    }
  };
});

m.directive("point", function ($q) {
  function renderpoint(scope, layer) {
    var ready = $q.defer();
    scope.isObjectReady = ready.promise;
    require(["esri/geometry/Point", "esri/graphic", "esri/SpatialReference", "esri/geometry/webMercatorUtils"], function (Point, Graphic, SpatialReference, webMercatorUtils) {

      if (scope.json)
        scope.this_point = new Point(scope.json);
      else if (scope.spatialReference)
        scope.this_point = new Point(scope.longitude, scope.latitude, new SpatialReference({ wkid: scope.spatialReference }));
      else
        scope.this_point = new Point(scope.longitude, scope.latitude);

      if (scope.this_point.spatialReference.wkid == "4326")
        scope.this_point = webMercatorUtils.geographicToWebMercator(scope.this_point);

      if (typeof (scope.geometry) !== "undefined")
        scope.geometry = scope.this_point;

      if (scope.symbol) {
        scope.graphic = new Graphic(scope.this_point, scope.symbol);
        layer.add(scope.graphic);
      }
      else {
        scope.graphic = new Graphic(scope.this_point);
        layer.add(scope.graphic);
      }

      if (scope.extra) scope.graphic.extra = scope.extra;

      ready.resolve();
    });
  }

  function redrawpoint(scope, layer) {
    require(["esri/geometry/Point", "esri/graphic", "esri/SpatialReference", "esri/geometry/webMercatorUtils"], function (Point, Graphic, SpatialReference, webMercatorUtils) {
      if (scope.graphic) {
        var prevgraphic = scope.graphic;
        if (prevgraphic._layer && prevgraphic._layer.graphics && prevgraphic._layer.graphics.length > 0) {
          var i = prevgraphic._layer.graphics.indexOf(prevgraphic);
          prevgraphic._layer.graphics.splice(i, 1);
        }
        layer.remove(prevgraphic);
        prevgraphic.hide();
        if (scope.symbol)
          scope.graphic = new Graphic(scope.this_point, scope.symbol);
        else
          scope.graphic = new Graphic(scope.this_point);
        layer.add(scope.graphic);
        scope.graphic.draw();

      }
    });
  }

  return {
    restrict: "E",
    require: ["?^graphicsLayer", "?^featureLayer"],
    scope: {
      spatialReference: "@",
      latitude: "=",
      longitude: "=",
      json: "=",
      extra: "=",
      geometry: "="
    },
    link: {
      pre: function (scope, element, attrs, layers) {
        var layer = layers[0] || layers[1];
        renderpoint(scope, layer);
        scope.__layer = layer;
        scope.$on("$destroy", function () { scope.isObjectReady.then(function () { layer.remove(scope.graphic); }) });
        scope.$watch("latitude", function (n, o) {
          if (scope.this_point && n != o) {
            scope.this_point.setY(n);
            redrawpoint(scope, layer);
            if (typeof (scope.geometry) !== "undefined")
              scope.geometry = scope.this_point;

          }
        });
        scope.$watch("longitude", function (n, o) {
          if (scope.this_point && n != o) {
            scope.this_point.setX(n);
            redrawpoint(scope, layer);
            if (typeof (scope.geometry) !== "undefined")
              scope.geometry = scope.this_point;
          }
        });
      }
      /*,
      post: function (scope, element, attrs, layers)
      {
        var layer = layers[0] || layers[1];
       renderpoint(scope, layer);
      }
      */
    },
    controller: function ($scope) {
      this.setSymbol = function (val) {
        $scope.symbol = val;
        $scope.isObjectReady.then(function () {
          $scope.graphic.setSymbol(val);
          $scope.graphic.draw();
        });
      };
    }
  };
});

m.directive("search", function ($q, esriRegistry) {
  return {
    restrict: "E",
    require: "^esriMap",
    scope: {
      id: "@",
      target: "@"
    },
    link: {
      pre: function (scope, element, attrs, esriMap) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;

        require(["esri/dijit/Search"], function (Search) {
          esriMap.getMap(function (m) {

            scope.this_layer = new Search({ map: m }, scope.target);
            scope.this_layer.startup();

            if (scope.id) {
              scope.this_layer.id = scope.id;
              esriRegistry.set(scope.id, scope.this_layer);
            }
            ready.resolve();
          });
          scope.$on("$destroy", function () {
            scope.isObjectReady.then(function () {
              if (scope.id) esriRegistry.remove(scope.id);
              scope.this_layer.destroy();
            });
          });
        });
      }
    }
  };
});

m.directive("circle", function ($q) {
  function renderpoint(scope, layer) {
    var ready = $q.defer();
    scope.isObjectReady = ready.promise;
    require(["esri/geometry/Circle", "esri/geometry/Point", "esri/graphic", "esri/SpatialReference", "esri/geometry/webMercatorUtils"],
      function (Circle, Point, Graphic, SpatialReference, webMercatorUtils) {

        var center = {};
        if (scope.spatialReference)
          center = new Point(scope.longitude, scope.latitude,
            new SpatialReference({ wkid: scope.spatialReference }));
        else
          center = new Point(scope.longitude, scope.latitude);

        //Check is WebMercator
        if (center.spatialReference.wkid == "4326")
          center = webMercatorUtils.geographicToWebMercator(center);

        scope.this_point = new Circle({
          center: center,
          radius: scope.radius
        });

        if (scope.symbol) {
          scope.graphic = new Graphic(scope.this_point, scope.symbol);
          layer.add(scope.graphic);
        }
        else {
          scope.graphic = new Graphic(scope.this_point);
          layer.add(scope.graphic);
        }
        if (scope.extra) scope.graphic.extra = scope.extra;

        if (typeof (scope.geometry) !== "undefined")
          scope.geometry = scope.this_point;
        ready.resolve();
      });
  }

  return {
    restrict: "E",
    require: ["?^graphicsLayer", "?^featureLayer"],
    scope: {
      spatialReference: "@",
      latitude: "=",
      longitude: "=",
      radius: "=",
      extra: "=",
      geometry: "="
    },
    link: {
      pre: function (scope, element, attrs, layers) {
        var layer = layers[0] || layers[1];
        renderpoint(scope, layer);

        scope.$watchGroup(["latitude", "longitude", "radius"], function () {
          scope.isObjectReady.then(function () {
            layer.remove(scope.graphic);
            renderpoint(scope, layer);
          });
        });
        scope.$on("$destroy", function () { scope.isObjectReady.then(function () { layer.remove(scope.graphic); }); });
      }
    },
    controller: function ($scope) {
      this.setSymbol = function (val) {
        $scope.isObjectReady.then(function () {
          $scope.symbol = val;
          $scope.graphic.setSymbol(val);
          $scope.graphic.draw();
        });
      };
    }
  };
});

m.directive("tooltip", function ($timeout) {
  return {
    restrict: "E",
    require: ["^featureLayer"],
    replace: false,
    link: function (scope, element, attr, layer, transclude) {
      element.css("display", "none");
      element.css("position", "fixed");
      element.css("z-index", "9999");
      scope.$g = null;
      scope._tooltipHide = null;
      if (layer[0])
        layer[0].getLayer(function (l) {
          require(["dojo/_base/connect"], function (connect) {
            connect.connect(l, "onMouseOut", function () {
              if (scope._tooltipHide)
                $timeout.cancel(scope._tooltipHide);
              scope._tooltipHide = $timeout(function () {
                element.css("display", "none");
                scope._tooltipHide = null;
              }, 2000);

            });
            connect.connect(l, "onMouseMove", function (m) {
              scope.$apply(function () { scope.$g = m.graphic; });
              element.css("display", "block");
              element.css("top", m.clientY + 2);
              element.css("left", m.clientX + 2);
            });
          });
        });
    }
  };
});

m.directive("infoWindow", function ($q, $compile, $timeout) {
  return {
    restrict: "E",
    require: ["?^featureLayer", "?^graphicsLayer", "?^esriMap"],
    replace: false,
    transclude: true,
    scope: {
      titleFunc: "&",
    },
    link: function (scope, element, attr, parents, transclude) {
      element.css("display", "none");
      var parent = parents[0] || parents[1] || parents[2];
      var transclusionScope;
      var title = attr.title;
      if (scope.titleFunc() instanceof Function) title = scope.titleFunc();

      transclude(function (clone, ss) {
        parent.setInfoWindow(title, clone[1]);
        transclusionScope = ss;
      });

      var ie = navigator.userAgent.match(/MSIE/);
      var ie11 = navigator.userAgent.match(/Trident\/7\./);

      if (parents[2])
        parents[2].getMap(function (map) {
          require(["dojo/_base/connect"], function (connect) {
            connect.connect(map.infoWindow, "onSelectionChange", function () {
              if (map.infoWindow.features) {
                /* Retransclude element to solve issues in IE 9-10-11 */
                if (ie || ie11)
                  transclude(function (clone, ss) {
                    parent.setInfoWindow(title, clone[1]);
                    transclusionScope = ss;
                  });
                $timeout(function () {
                  transclusionScope.$apply(function () { transclusionScope.$g = map.infoWindow.features[map.infoWindow.selectedIndex]; });
                });
              }
            });
          });
        });
    }
  };
});

m.directive("uniqueValueRenderer", function ($q) {
  return {
    restrict: "E",
    require: ["^featureLayer"],
    link: {
      pre: function (scope, element, attr, layer) {

      },
      post: function (scope, element, attr, layer) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;
        require(["esri/renderers/UniqueValueRenderer"], function (Renderer) {
          scope.this_renderer = new Renderer(scope.default_symbol, attr.field);
          for (var v in scope.infos)
            scope.this_renderer.addValue(scope.infos[v].value, scope.infos[v].symbol);

          layer[0].setRenderer(scope.this_renderer);
          ready.resolve();
        });
      }
    },
    controller: function ($scope) {
      $scope.infos = [];
      this.setSymbol = function (s) {
        $scope.default_symbol = s;
      };
      this.setInfo = function (i, s) {
        $scope.infos.push({ value: i, symbol: s });
      };
    }
  };
});

m.directive("valueInfo", function ($q) {
  return {
    restrict: "E",
    require: ["^uniqueValueRenderer"],
    controller: function ($scope) {
      $scope.this_symbol = null;
      this.setSymbol = function (s) {
        $scope.this_symbol = s;
      };
    },
    link: function (scope, element, attr, renderer) {
      renderer[0].setInfo(attr.value, scope.this_symbol);
    }
  };
});

m.directive("pictureMarkerSymbol", function ($q) {
  return {
    restrict: "EA",
    scope: {
      symbolUrl: "@"
    },
    require: ["?^valueInfo", "^?uniqueValueRenderer", "?point", "?^point", "?^graphicsLayer", "?^featureLayer"],
    link: function (scope, element, attr, parents) {
      var ready = $q.defer();
      scope.isObjectReady = ready.promise;
      require(["esri/symbols/PictureMarkerSymbol"], function (PictureMarkerSymbol) {
        var pSymbol = new PictureMarkerSymbol(attr.symbolUrl || attr.pictureMarkerSymbol, attr.symbolWidth, attr.symbolHeight);
        if (attr.symbolOffsetX || attr.symbolOffsetY)
          pSymbol.setOffset(attr.symbolOffsetX ? attr.symbolOffsetX : 0, attr.symbolOffsetY ? attr.symbolOffsetY : 0)
        scope.this_symbol = pSymbol;
        ready.resolve();
        scope.ctrl = (parents[0] || parents[1] || parents[2] || parents[3] || parents[4] || parents[5]);
        if (scope.ctrl) scope.ctrl.setSymbol(scope.this_symbol);

        if (scope.symbolUrl) scope.$watch("symbolUrl", function (n, o) {
          if (scope.symbolUrl && scope.ctrl && n !== o) {
            var p2Symbol = new PictureMarkerSymbol(scope.symbolUrl, attr.symbolWidth, attr.symbolHeight);
            if (attr.symbolOffsetX || attr.symbolOffsetY)
              p2Symbol.setOffset(attr.symbolOffsetX ? attr.symbolOffsetX : 0, attr.symbolOffsetY ? attr.symbolOffsetY : 0)
            scope.this_symbol = p2Symbol;
            scope.ctrl.setSymbol(scope.this_symbol);
          }
        });
      });
    }
  };
});

m.directive("simpleLineSymbol", function ($q) {
  return {
    restrict: "EA",
    require: ["?^simpleFillSymbol", "?^simpleMarkerSymbol", "?circle", "?^circle", "?point", "?^point", "?polyLine", "?^polyLine", "?^graphicsLayer", "?^featureLayer"],
    scope: {
      symbolColor: "@"
    },
    link: function (scope, element, attr, parents) {
      var ready = $q.defer();
      scope.isObjectReady = ready.promise;
      require(["esri/symbols/SimpleLineSymbol", "esri/Color"], function (SimpleLineSymbol, Color) {

        var style = SimpleLineSymbol.STYLE_SOLID;
        var sym = attr.symbolStyle || attr.SimpleLineSymbol;
        if (sym) {
          switch (sym) {
            case "STYLE_DASH": style = SimpleLineSymbol.STYLE_DASH; break;
            case "STYLE_DASHDOT": style = SimpleLineSymbol.STYLE_DASHDOT; break;
            case "STYLE_DASHDOTDOT": style = SimpleLineSymbol.STYLE_DASHDOTDOT; break;
            case "STYLE_DOT": style = SimpleLineSymbol.STYLE_DOT; break;
            case "STYLE_LONGDASHDOT": style = SimpleLineSymbol.STYLE_LONGDASHDOT; break;
            case "STYLE_NULL": style = SimpleLineSymbol.STYLE_NULL; break;
            case "STYLE_SOLID": style = SimpleLineSymbol.STYLE_SOLID; break;
            case "STYLE_SHORTDASH": style = SimpleLineSymbol.STYLE_SHORTDASH; break;
            case "STYLE_SHORTDASHDOT": style = SimpleLineSymbol.STYLE_SHORTDASHDOT; break;
            case "STYLE_SHORTDASHDOTDOT": style = SimpleLineSymbol.STYLE_SHORTDASHDOTDOT; break;
            case "STYLE_SHORTDOT": style = SimpleLineSymbol.STYLE_SHORTDOT; break;
            default: style = sym;
          }
        }


        scope.this_symbol = new SimpleLineSymbol(
          style,
          Color.fromString(attr.symbolColor),
          attr.symbolWidth);
        ready.resolve();
        scope.ctrl = (parents[0] || parents[1] || parents[2] || parents[3] || parents[4] || parents[5] || parents[6] || parents[7] || parents[8]);
        if (scope.ctrl) scope.ctrl.setSymbol(scope.this_symbol);

        if (scope.symbolColor) scope.$watch("symbolColor", function (n, o) {
          if (scope.symbolColor && scope.ctrl && n !== o) {
            scope.this_symbol = scope.this_symbol = new SimpleLineSymbol(
              style,
              Color.fromString(attr.symbolColor),
              attr.symbolWidth);
            scope.ctrl.setSymbol(scope.this_symbol);
          }
        });

      });
    }
  };
});

m.directive("simpleFillSymbol", function ($q) {
  return {
    restrict: "EA",
    require: ["?circle", "?^circle", "?point", "?^point", "?polyLine", "?^polyLine", "?^graphicsLayer", "?^featureLayer"],
    link: {
      pre: function (scope, element, attr, parents) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;
        require(["esri/symbols/SimpleFillSymbol", "esri/Color"], function (SimpleFillSymbol, Color) {
          scope.this_symbol = new SimpleFillSymbol();

          var style = SimpleFillSymbol.STYLE_SOLID;
          var sym = attr.symbolStyle || attr.SimpleFillSymbol;
          if (sym) {
            switch (sym) {
              case "STYLE_BACKWARD_DIAGONAL": style = SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL; break;
              case "STYLE_CROSS": style = SimpleFillSymbol.STYLE_CROSS; break;
              case "STYLE_DIAGONAL_CROSS": style = SimpleFillSymbol.STYLE_DIAGONAL_CROSS; break;
              case "STYLE_FORWARD_DIAGONAL": style = SimpleFillSymbol.STYLE_FORWARD_DIAGONAL; break;
              case "STYLE_HORIZONTAL": style = SimpleFillSymbol.STYLE_HORIZONTAL; break;
              case "STYLE_NULL": style = SimpleFillSymbol.STYLE_NULL; break;
              case "STYLE_SOLID": style = SimpleFillSymbol.STYLE_SOLID; break;
              case "STYLE_VERTICAL": style = SimpleFillSymbol.STYLE_VERTICAL; break;
              default: style = sym;
            }
          }
          scope.this_symbol.setStyle(style);

          if (attr.symbolColor)
            scope.this_symbol.setColor(Color.fromString(attr.symbolColor));

          ready.resolve();
          var ctrl = (parents[0] || parents[1] || parents[2] || parents[3] || parents[4] || parents[5] || parents[6] || parents[7]);
          if (ctrl) ctrl.setSymbol(scope.this_symbol);
        });
      }
    },
    controller: function ($scope) {
      this.setSymbol = function (s) {
        $scope.isObjectReady.then(function () {
          $scope.this_symbol.setOutline(s);
        });
      };
    }
  };
});

m.directive("simpleTextSymbol", function ($q) {
  return {
    restrict: "EA",
    require: ["?point", "?^point", "?^graphicsLayer", "?^featureLayer"],
    scope: {
      textColor: "@",
      text: "@",
      fontSize: "=",
      fontStyle: "=",
      fontVariant: "=",
      fontWeight: "=",
      fontFamily: "=",
      xOffset: "=",
      yOffset: "="
    },
    link: {
      pre: function (scope, element, attr, parents) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;
        require(["esri/symbols/TextSymbol", "esri/Color", "esri/symbols/Font"], function (TextSymbol, Color, Font) {


          var fontStyle = Font.STYLE_NORMAL;
          if (scope.fontStyle) {
            switch (scope.fontStyle) {
              case "STYLE_ITALIC": fontStyle = Font.STYLE_ITALIC; break;
              case "STYLE_OBLIQUE": fontStyle = Font.STYLE_OBLIQUE; break;
            }
          }
          var fontVariant = Font.VARIANT_NORMAL;
          if (scope.fontVariant) {
            switch (scope.fontVariant) {
              case "VARIANT_SMALLCAPS": fontVariant = Font.VARIANT_SMALLCAPS; break;
            }
          }
          var fontWeight = Font.WEIGHT_NORMAL
          if (scope.fontWeight) {
            switch (scope.fontWeight) {
              case "WEIGHT_BOLD": fontWeight = Font.WEIGHT_BOLD; break;
              case "WEIGHT_BOLDER": fontWeight = Font.WEIGHT_BOLDER; break;
              case "WEIGHT_LIGHTER": fontWeight = Font.WEIGHT_LIGHTER; break;
            }
          }
          var font = new Font(scope.fontSize || "16", fontStyle, fontVariant, fontWeight, scope.fontFamily);

          scope.this_symbol = new TextSymbol(scope.text || attr.simpleTextSymbol || "", font);
          if (scope.xOffset && scope.yOffset) scope.this_symbol.setOffset(scope.xOffset, scope.yOffset);
          else if (scope.xOffset) scope.this_symbol.setOffset(scope.xOffset, 0);
          else if (scope.yOffset) scope.this_symbol.setOffset(0, scope.yOffset);

          if (scope.textColor)
            scope.this_symbol.setColor(Color.fromString(scope.textColor));


          ready.resolve();
          scope.ctrl = (parents[0] || parents[1] || parents[2] || parents[3]);
          if (scope.ctrl) scope.ctrl.setSymbol(scope.this_symbol);
          scope.$watch("text", function (n, o) {
            //             if (scope.text && scope.ctrl && n !== o) {
            //               scope.this_symbol.setText(n);
            //             }
            scope.this_symbol.setText(scope.text);
          });
        });
      }
    }
  };
});

m.directive("simpleMarkerSymbol", function ($q) {
  return {
    restrict: "EA",
    require: ["?point", "?^point", "?^graphicsLayer", "?^featureLayer"],
    scope: {
      json: "=",
      color: "@"
    },
    link: {
      pre: function (scope, element, attr, parents) {
        var ready = $q.defer();
        scope.isObjectReady = ready.promise;
        require(["esri/symbols/SimpleMarkerSymbol", "esri/Color"], function (SimpleMarkerSymbol, Color) {

          scope.this_symbol = new SimpleMarkerSymbol(scope.json);
          if (scope.color != undefined) {
            if (scope.color) scope.this_symbol.setColor(Color.fromString(scope.color));
            scope.$watch("color", function (n, o) {
              if (scope.color && n !== o) {
                scope.this_symbol.setColor(Color.fromString(scope.color));
              }
            });
          }

          ready.resolve();
          scope.ctrl = (parents[0] || parents[1] || parents[2] || parents[3]);
          if (scope.ctrl) scope.ctrl.setSymbol(scope.this_symbol);
        });
      }
    },
    controller: function ($scope) {
      $scope.infos = [];
      this.setSymbol = function (s) {
        $scope.isObjectReady.then(function () {
          $scope.this_symbol.setOutline(s);
          $scope.ctrl.setSymbol($scope.this_symbol);
        });
      };
    }
  };
});
