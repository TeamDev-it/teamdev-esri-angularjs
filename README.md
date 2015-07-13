#AngularJS Module for ESRI Arcgis Maps

This module wraps Arcgis Javascript api into easy to use directives for AngularJS 1.x


## Install with bower
    bower install teamdev-esri-angularjs
    
## How To

### Create your first angularjs project with esri maps. 

Include Teamdev module
    
    angular.module('starter', ['teamdev.esri' ...

Create your first map in HTML using directives. 
    
    <esri-map base-map="topo" map-id="map" zoom="9"></esri-map>
    
    
    
## modules.list file
The module.list file contains a list of modules that teamdev.esri uses. 
You can use module.list to create a custom build of esri javascript api using http://jso.arcgis.com/ service