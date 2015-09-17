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
    
### Add intellisense support to Visual Studio (method 1)

Locate the file html.xsd under Microsfot Visual Studio installation folder. 
es: C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\IDE\CommonExtensions\Microsoft\Web\Schemas\1033\HTML

copy the file teamdev_esri.xsd under that folder
replace html.xsd file with html.xsd file provided 
    
### Add intellisense support to Visual Studio (method 2)

Locate the file html.xsd under Microsfot Visual Studio installation folder. 
es: C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\IDE\CommonExtensions\Microsoft\Web\Schemas\1033\HTML

copy the file teamdev_esri.xsd under that folder
open the file html.xsd
locate 
    <xsd:include schemaLocation="CommonHTMLTypes.xsd" /> 
and add 
    <xsd:include schemaLocation="teamdev_esri.xsd" />
as follow: 
    <xsd:include schemaLocation="CommonHTMLTypes.xsd" /> 
    <xsd:include schemaLocation="teamdev_esri.xsd" /> 


locate 
    <xsd:group name="flowContent"> 
and add 
    <xsd:element ref="esri-map" /> 
as follow
    <xsd:group name="flowContent">
        <xsd:choice>
            ...
            <xsd:element ref="esri-map" />
            
locate 
    <xsd:group name="phrasingContent"> 
and add 
    <xsd:element ref="esri-map" />
as follow
    <xsd:group name="phrasingContent">
        <xsd:choice>
            ...
            <xsd:element ref="esri-map" />


    
    
## modules.list file
The module.list file contains a list of modules that teamdev.esri uses. 
You can use module.list to create a custom build of esri javascript api using http://jso.arcgis.com/ service

## Licensed under Apache License v.2