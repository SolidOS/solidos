import $rdf, { IndexedFormula } from 'rdflib'
import panes from 'solid-panes'
import './index.scss'
import { initHeader } from './global/header'

const global: any = window

global.$rdf = $rdf

document.addEventListener('DOMContentLoaded', function () {
  // Set up cross-site proxy
  const fetcher: any = $rdf.Fetcher
  fetcher.crossSiteProxyTemplate = window.origin + '/xss/?uri={uri}'

  // Authenticate the user
  const UI = panes.UI
  UI.authn
    .checkUser()
    .then(function () {
      // Set up the view for the current subject
      const kb = (UI as any).store
      const uri = window.location.href
      const subject = kb.sym(uri)
      const outliner = panes.getOutliner(document)
      outliner.GotoSubject(subject, true, undefined, true, undefined)
      return kb
    })
    .then((kb: IndexedFormula) => initHeader(kb, (kb as any).fetcher))
})

window.onpopstate = function (event) {
  global.document.outline.GotoSubject(
    $rdf.sym(window.document.location.href),
    true,
    undefined,
    true,
    undefined
  )
}

// It's not clear where this function is used, so unfortunately we cannot remove it:
function dump (msg: string[]) {
  console.log(msg.slice(0, -1))
}

global.dump = dump
