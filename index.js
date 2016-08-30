/**
 *
 * Data Mashup library
 *
 */

dump = function(msg) {
  console.log(msg.slice(0,-1))
}


// Vestigial things still in old tabulator entry point 
if (typeof tabulator === 'undefined'){
  tabulator = { isExtension: false} // a kludge until tabulator completely removed
  tabulator.mode = 'webapp'
  tabulator.preferences = { // non-persistent stand-in just for 'me' value 2016
    value: [],
    get: function(k){
      return this.value[k]
    },
    set: function(k,v){
      this.value[k] = v
    }
  }
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


UI.OutlineObject  = require('solid-app-set/outline/manager.js')

// later in the context of a window and a document:

var dom = window.document
dom.outline = UI.outline = new UI.OutlineObject(dom)

UI.panes = require("solid-app-set")

module.exports = UI

// UI.color = require('jscolor/jscolor.js')



// ENDS
