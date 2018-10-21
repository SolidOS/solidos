/**
 *
 *     MASHLIB      Data Mashup library
 *
 *  Solid-compatible User Interface library
 *  for the databrowser, etc
 */

function dump (msg) {
  console.log(msg.slice(0, -1))
}
global.dump = dump


const panes = require('solid-panes') // applets
// const UI = require('solid-ui') // widgets etc
const $rdf = require('rdflib')
global.$rdf = $rdf

// $rdf.log = UI.log

if (typeof window !== 'undefined') {
  // window.UI = UI
  window.panes = panes
}

window.onpopstate = function(event) {
  window.document.outline.GotoSubject($rdf.sym(window.document.location.href), true, undefined, true, undefined)
}

// panes.UI = UI

//  Allow require('mashlib') in the databrowser
global.require = function require (lib) {
  if (lib === 'mashlib') {
    return panes
  } else {
    throw new Error('Cannot require (this is a Mashlib-specific require stub)')
  }
}

module.exports = panes

// ends
