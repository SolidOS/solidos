/*      View argument Pane
**
**  This pane shows a position and optionally the positions which
** support or oppose it.
*/

tabulator.Icon.src.icon_argument = tabulator.iconPrefix + 'js/panes/argument/icon_argument.png'
tabulator.panes.argumentPane = {
  icon: tabulator.Icon.src.icon_argument, // @@

  name: 'argument',

  label: function (subject) {
    var kb = UI.store
    var t = kb.findTypeURIs(subject)

    if (t[UI.ns.arg('Position').uri]) return 'Argument'

    return null
  },

  // View the data in a file in user-friendly way
  render: function (subject, myDocument) {
    var $r = UI.rdf
    var kb = UI.store
    var arg = UI.ns.arg

    subject = kb.canon(subject)
    var types = kb.findTypeURIs(subject)

    var div = myDocument.createElement('div')
    div.setAttribute('class', 'argumentPane')

    // var title = kb.any(subject, UI.ns.dc('title'))

    var comment = kb.any(subject, UI.ns.rdfs('comment'))
    if (comment) {
      var para = myDocument.createElement('p')
      para.setAttribute('style', 'margin-left: 2em; font-style: italic;')
      div.appendChild(para)
      para.textContent = comment.value
    }
    var plist = kb.statementsMatching(subject, arg('support'))
    tabulator.outline.appendPropertyTRs(div, plist, false)

    var plist = kb.statementsMatching(subject, arg('opposition'))
    tabulator.outline.appendPropertyTRs(div, plist, false)

    return div
  }
}

tabulator.panes.register(tabulator.panes.argumentPane, false)

// ends
