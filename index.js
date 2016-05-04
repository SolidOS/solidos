/**
 *
 * Data Mashup library
 *
 */


var events = require('events') // load in the order which they are npm installed
var http = require('http-browserify')
requireState.loadedPackage['http'] = requireState.loadedPackage['http-browserify']


//  Solid-compatible UI module
// try global
UI = require('solid-ui')
$rdf = UI.rdf

if (typeof window !== 'undefined'){
  window.UI = UI
}

$rdf.log = UI.log


UI.OutlineObject  = require('./panes/outline/manager.js')

// later in the context of a window and a document:

var dom = window.document
dom.outline = new tabulator.OutlineObject(dom)


UI.panes = require("./panes/index.js")


// UI.color = require('jscolor/jscolor.js')


//And Preferences mechanisms.
// tabulator.loadScript("js/init/prefs.js");

/*
tabulator.loadScript("js/tab/sources-ext.js");

//And, finally, all non-pane UI code.
tabulator.loadScript("js/tab/labeler.js");
tabulator.loadScript("js/tab/request.js");
// tabulator.loadScript("js/tab/outlineinit.js");
tabulator.loadScript("js/tab/userinput.js"); // moved to panes
// tabulator.loadScript("js/tab/outline.js");

//Oh, and the views!
// tabulator.loadScript("js/init/views.js");

*/

// ENDS
