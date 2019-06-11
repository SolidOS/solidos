require('./index.scss')
const $rdf = require('rdflib')
const panes = require('solid-panes')
const UI = panes.UI

window.$rdf = $rdf

document.addEventListener('DOMContentLoaded', function () {
  // Set up cross-site proxy
  $rdf.Fetcher.crossSiteProxyTemplate = window.origin + '/xss/?uri={uri}'

  // Authenticate the user
  UI.authn.checkUser()
    .then(function () {
      // Set up the view for the current subject
      const kb = UI.store
      const uri = window.location.href
      const subject = kb.sym(uri)
      const outliner = panes.getOutliner(document)
      outliner.GotoSubject(subject, true, undefined, true, undefined)
    })
})

window.onpopstate = function(event) {
  window.document.outline.GotoSubject($rdf.sym(window.document.location.href), true, undefined, true, undefined)
}

// It's not clear where this function is used, so unfortunately we cannot remove it:
function dump (msg) {
  console.log(msg.slice(0, -1))
}
window.dump = dump
