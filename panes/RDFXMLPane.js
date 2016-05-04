/*      RDF/XML content Pane
**
**  This pane shows the content of a particular RDF resource
** or at least the RDF semantics we attribute to that resource,
** in generated N3 syntax.
*/

var UI = require('solid-ui')

module.exports = {
  icon: tabulator.Icon.src.icon_RDFXMLPane,

  name: 'RDFXML',

  label: function (subject) {
    if ('http://www.w3.org/2007/ont/link#ProtocolEvent' in UI.store.findTypeURIs(subject)) return null

    var n = UI.store.statementsMatching(
      undefined, undefined, undefined, subject).length
    if (n == 0) return null
    return 'As RDF/XML (' + n + ')'
  },

  render: function (subject, myDocument) {
    var kb = UI.store
    var div = myDocument.createElement('div')
    div.setAttribute('class', 'RDFXMLPane')
    // Because of smushing etc, this will not be a copy of the original source
    // We could instead either fetch and re-parse the source,
    // or we could keep all the pre-smushed triples.
    var sts = kb.statementsMatching(undefined, undefined, undefined, subject); // @@ slow with current store!
    /*
    var kludge = kb.formula([]) // No features
    for (var i=0; i< sts.length; i++) {
        s = sts[i]
        kludge.add(s.subject, s.predicate, s.object)
    }
    */
    var sz = UI.rdf.Serializer(kb)
    sz.suggestNamespaces(kb.namespaces)
    sz.setBase(subject.uri)
    var str = sz.statementsToXML(sts)
    var pre = myDocument.createElement('PRE')
    pre.appendChild(myDocument.createTextNode(str))
    div.appendChild(pre)
    return div
  }
}

// ends
