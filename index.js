/**
 *
 *     MASHLIB      Data Mashup library
 *
 */

// var dump, UI, $rdf

function dump (msg) {
  console.log(msg.slice(0, -1))
}
global.dump = dump

// var events = require('events') // load in the order which they are npm installed
// var http = require('http-browserify')

//  Solid-compatible UI module
// try global

const UI = require('solid-ui')
const $rdf = UI.rdf
global.$rdf = $rdf

$rdf.log = UI.log

var panes = require('solid-app-set')

if (typeof window !== 'undefined') {
  window.UI = UI
  window.panes = panes
}

panes.UI = UI

// UI.OutlineObject = require('solid-app-set/outline/manager.js')

// later in the context of a window and a document:
/*
if (typeof window !== 'undefined') {
  var dom = window.document
  dom.outline = UI.outline = new UI.OutlineObject(dom)
}
*/
//  What does this fix?
global.require = function require (lib) {
  if (lib === 'mashlib') {
    return panes
  } else {
    throw new Error('Cannot require (this is a Mashlib-specific require stub)')
  }
}

module.exports = panes

// ends
