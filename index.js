/**
 *
 * Data Mashup library
 *
 */

// var dump, tabulator, UI, $rdf

function dump (msg) {
  console.log(msg.slice(0, -1))
}
global.dump = dump

// Vestigial things still in old tabulator entry point
if (typeof tabulator === 'undefined') {
  var tabulator = { isExtension: false } // a kludge until tabulator completely removed
  tabulator.mode = 'webapp'
  tabulator.preferences = { // non-persistent stand-in just for 'me' value 2016
    value: [],
    get: function (k) {
      return this.value[k]
    },
    set: function (k, v) {
      if (typeof v !== 'string') {
        console.log('Non-string value of preference ' + k + ': ' + v)
        throw new Error('Non-string value of preference ' + k + ': ' + v)
      }
      this.value[k] = v
    }
  }
  global.tabulator = tabulator
}

// var events = require('events') // load in the order which they are npm installed
// var http = require('http-browserify')

//  Solid-compatible UI module
// try global
const UI = require('solid-ui')
const $rdf = UI.rdf
global.$rdf = $rdf

if (typeof window !== 'undefined'){
  window.UI = UI
}

$rdf.log = UI.log

UI.panes = require('solid-app-set')

UI.OutlineObject = require('solid-app-set/outline/manager.js')

// later in the context of a window and a document:

if (typeof window !== 'undefined') {
  var dom = window.document
  dom.outline = UI.outline = new UI.OutlineObject(dom)
}

global.require = function require (lib) {
  if (lib === 'mashlib') {
    return UI
  } else {
    throw new Error('Cannot require (this is a Mashlib-specific require stub)')
  }
}

module.exports = UI

// UI.color = require('jscolor/jscolor.js')
