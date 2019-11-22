import * as $rdf from 'rdflib'
import * as panes from 'solid-panes'
import './styles/index.scss'
import { initHeader } from './global/header'
import { initFooter } from './global/footer'

import { authn, store } from 'solid-ui'

const global: any = window

global.$rdf = $rdf
global.panes = panes

global.panes.runDataBrowser = function () {
  // Set up cross-site proxy
  const fetcher: any = $rdf.Fetcher
  fetcher.crossSiteProxyTemplate = window.origin + '/xss/?uri={uri}'

  // Authenticate the user
  authn.checkUser().then(function (_profile: $rdf.NamedNode | null) {
    // Set up the view for the current subject
    const uri = window.location.href
    const subject = store.sym(uri)
    const outliner = panes.getOutliner(document)
    outliner.GotoSubject(subject, true, undefined, true, undefined)
    const header = initHeader(store)
    const footer = initFooter(store, (store as any).fetcher)
    return Promise.all([header, footer])
  })
}

if (typeof global.require === 'undefined') {
  //  Allow require('mashlib') in the databrowser
  global.require = function require (lib: string) {
    if (lib === 'mashlib') {
      console.warn(
        "Warning: mashlib's custom implementation of `require` will be deprecated in the future. Please import mashlib using a build-time bundler, or access the global `panes` variable when including it as a script."
      )
      return panes
    } else {
      throw new Error(
        'Cannot require (this is a Mashlib-specific require stub)'
      )
    }
  }
}

window.onpopstate = function (_event: any) {
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
