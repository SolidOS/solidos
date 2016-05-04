/**
 *
 * Data Mashup library
 *
 */


var events = require('events') // load in the order which they are npm installed
var http = require('http-browserify')
requireState.loadedPackage['http'] = requireState.loadedPackage['http-browserify']


//  Solid-compatible UI module
var UI = require('../solid-ui/index.js')

var $rdf = UI.rdf
$rdf.log = UI.log


UI.OutlineObject  = require('../panes/outline/manager.js')

// later in the context of a window and a document:
// dom.outline = new tabulator.OutlineObject(dom)



//Load the icons namespace onto tabulator.
tabulator.loadScript("js/init/icons.js");
//And Namespaces..
// tabulator.loadScript("js/init/namespaces.js");
//And Panes.. (see the below file to change which panes are included)
tabulator.panes = UI.panes = require("../panes/index.js")


// tabulator.loadScript("js/init/panes.js");
// tabulator.loadScript("js/jscolor/jscolor.js");
tabulator.panes.jscolor = UI.color = require('../jscolor/jscolor.js')
//And Preferences mechanisms.
tabulator.loadScript("js/init/prefs.js");


tabulator.loadScript("js/tab/sources-ext.js");

//And, finally, all non-pane UI code.
tabulator.loadScript("js/tab/labeler.js");
tabulator.loadScript("js/tab/request.js");
// tabulator.loadScript("js/tab/outlineinit.js");
tabulator.loadScript("js/tab/userinput.js"); // moved to panes
// tabulator.loadScript("js/tab/outline.js");

//Oh, and the views!
// tabulator.loadScript("js/init/views.js");

// ENDS
