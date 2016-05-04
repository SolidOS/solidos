/*   Dynamic loading of panes from metadata
**
**  This outline pane shows an external sanboxed viewer for the subject
**  according to metadata
*/

var UI = require('solid-ui')

// @@ todo: move this function elsewhere generic

var panesFromData = function(subject){
  var ns = UI.ns, kb = UI.store
  var apps = kb.each(undefined, ns.rdf('type'), ns.solid('ApplicationRegistration'))
  var t = kb.findTypeURIs(subject)
  for (var i=0; i<apps.length; i++){
    var app = apps[i]
    try {
      var icon = kb.any(app, ns.foaf('img')).value  // @@ check doap voab
      var label = kb.any(app, ns.rdfs('label')).value
      var URITemplate = kb.any(app, ns.solid('URITemplate')).value
      var appPage = kb.any(app, ns.solid('appPage')).uri
      var matches, types = kb.each(app, ns.solid('forClass'))
    } catch(e) {
      console.log("Error getting app details " + app + ": " + e)
      continue;
    }
    for (var j=0; j< types.length; j++){
      if (t[types[j].uri]) {
        matches = true; break;
      }
    }
    var render = function(subject, dom, template){
      var div = myDocument.createElement("div");
      div.setAttribute('class', 'docView')
      var iframe = myDocument.createElement("IFRAME")
      iframe.setAttribute('src', subject.uri)    // allow-same-origin
      iframe.setAttribute('class', 'doc')
      iframe.setAttribute('sandbox', 'allow-same-origin allow-forms'); // allow-scripts ?? no documents should be static
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
      iframe.setAttribute('style', 'resize = both; height: 120em; width:80em;')
//        iframe.setAttribute('height', '480')
//        iframe.setAttribute('width', '640')
      var tr = myDocument.createElement('TR')
      tr.appendChild(iframe)
      div.appendChild(tr)
      return div
    }
    if (matches){
      var pane = { icon: icon, label: function(){return label}}
    }
  }
}

//   Andrei's  'warp' file manager as a pane

// black rocket not ongh-pages: js/panes/common/icons/noun_113198.svg
// red rocket:  js/panes/warp/icons/warp-icon.png
//tabulator.Icon.src.icon_warp = tabulator.scriptBase + 'js/panes/warp/icons/warp-icon.png';
//tabulator.Icon.tooltips[tabulator.Icon.src.icon_warp] = 'warp'

module.exports = {

    icon: UI.icons.iconBase + 'noun_113198.svg',

    name: 'warp',

    // same as classInstancePane
    label: function(subject, myDocument) {
      var n = UI.store.each(
          undefined, UI.ns.rdf( 'type'), subject).length;
      if (n > 0) return "List (" + n + ")";  // Show how many in hover text
      n = UI.store.each(
          subject, UI.ns.ldp( 'contains')).length;
      if (n > 0) {
        return "Contents (" + n + ")"  // Show how many in hover text
      }
      return null;     // Suppress pane otherwise
    },

    render: function(subject, myDocument) {
        var div = myDocument.createElement("div")

        //  @@ When we can, use CSP to turn off scripts within the iframe
        div.setAttribute('class', 'warp')
        var iframe = myDocument.createElement("IFRAME")
        iframe.setAttribute('src', subject.uri)    // allow-same-origin
        iframe.setAttribute('class', 'doc')
        iframe.setAttribute('sandbox', 'allow-same-origin allow-forms allow-scripts'); // allow-scripts ?? no documents should be static
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe

        // Like https://linkeddata.github.io/warp/#/list/http/localhost:3080/timbl/Public/Test/Warp/
        var warpURI = 'https://linkeddata.github.io/warp/#/list/http'
        var p = subject.uri.indexOf('//')
        if (subject.uri.slice(0,6) === 'https:') {
          warpURI += 's'
        }
        warpURI += subject.uri.slice(p + 1)
        iframe.setAttribute('src', warpURI)
        iframe.setAttribute('style', 'resize = both; height: 120em; width:80em;')
//        iframe.setAttribute('height', '480')
//        iframe.setAttribute('width', '640')
        var tr = myDocument.createElement('TR')
        tr.appendChild(iframe)
        div.appendChild(tr)
        return div
    }
}
//ends
