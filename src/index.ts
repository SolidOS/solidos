import $rdf, { NamedNode } from 'rdflib'
import panes from 'solid-panes'
import './styles/index.scss'
import { initHeader } from './global/header'
import { initFooter } from './global/footer'

const global: any = window

global.$rdf = $rdf

global.UI.initialize = function () {
  // Set up cross-site proxy
  const fetcher: any = $rdf.Fetcher
  fetcher.crossSiteProxyTemplate = window.origin + '/xss/?uri={uri}'

  // Authenticate the user
  const UI = panes.UI
  UI.authn.checkUser().then(function (profile: NamedNode | null) {
    // Set up the view for the current subject
    const kb = (UI as any).store
    const uri = window.location.href
    const subject = kb.sym(uri)
    const outliner = panes.getOutliner(document)
    outliner.GotoSubject(subject, true, undefined, true, undefined)
    return Promise.all([initHeader(kb), initFooter(kb, (kb as any).fetcher)])
  })
}

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
