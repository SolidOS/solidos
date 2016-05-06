/**
 *
 * Data Mashup library
 *
 */

dump = function(msg) {
  console.log(msg.slice(0,-1))
}



if (typeof tabulator === 'undefined'){
  tabulator = { isExtension: false} // a kludge until tabulator completely removed
  tabulator.preferences = {get: function(){}, set: function(){}}
}


var events = require('events') // load in the order which they are npm installed
var http = require('http-browserify')


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
dom.outline = UI.outline = new UI.OutlineObject(dom)


UI.panes = require("./panes/index.js")

// Override the ones set by browserify:

UI.icons.originalIconBase = "https://linkeddata.github.io/tabulator-firefox/content/js/solid-ui/lib/originalIcons/"
UI.icons.iconBase = "https://linkeddata.github.io/tabulator-firefox/content/js/solid-ui/lib/icons/"



module.exports = UI

// UI.color = require('jscolor/jscolor.js')



// ENDS
