/*   Category Pane
**
**  This outline pane allows the user to select which sublclasses
** something is a member of in a tree-organized class hierarchy.
** This could equally well be used for any other hierarchical set of things
** such as nested geograpgical regions or nested time periods,
** or for a class of a related thing, such of class of person in the picture.
** Maybe this hsoul dbe split off as a widget for tagging within other panes.
*/

// These used to be in js/init/icons.js but are better in the pane.
// tabulator.Icon.src.icon_categorize = tabulator.iconPrefix + 'icons/22-categorize.png'
// tabulator.Icon.tooltips[tabulator.Icon.src.icon_categorize] = 'Categories'

var UI = require('solid-ui')

module.exports = {
  icon: UI.icons.originalIconBase + 'icons/22-categorize.png',

  name: 'category',

  // Does the subject deserve a categorizing pane?
  label: function (subject) {
    var kb = UI.store
    var t = kb.findTypeURIs(subject)
    // @@@ t = kb.topTypeURIs(t)
    var classes = 0
    for (var u in t) classes++
    // @@@@  if (classes==0) return null ;  // None, suppress pane

    // Not if a class itself (maybe need a different pane for that):
    if (t['http://www.w3.org/2000/01/rdf-schema#Class']) return null
    if (t['http://www.w3.org/2002/07/owl#Class']) return null

    return 'Categorize ' + classes; // Yes under other circumstances (while testing at least!)

  },

  render: function (subject, myDocument) {
    var kb = UI.store

    var div = myDocument.createElement('div')
    div.setAttribute('class', 'categoryPane')

    var types = kb.findTypeURIs(subject)
    var tops = kb.topTypeURIs(types)
    var bots = kb.bottomTypeURIs(types)

    // ///////////// debug
    /*
    var str = ""
    for (var t in types) str = str + t + ",  "
    var debug = div.appendChild(myDocument.createTextNode('Types: '+str)) // @@@

    var str = ""
    for (var t in bots) str = str + t + ",  "
    var debug = div.appendChild(myDocument.createTextNode('. Bots: '+str)) // @@@
    */

    function domForClass (c, force) {
      var tr = myDocument.createElement('TR')
      tr.setAttribute('class', 'categoryClass')
      var anchor = myDocument.createElement('A')
      if (c.uri) anchor.setAttribute('href', c.uri)
      anchor.setAttribute('class', c.uri in types ? 'categoryIn' : 'categoryOut')
      if (c.uri in bots) anchor.setAttribute('class', 'categoryBottom')
      var lab = UI.utils.label(c, true)
      if (c.uri in types) lab += ' *'
      anchor.appendChild(myDocument.createTextNode(lab))
      tr.appendChild(anchor)

      // Add provenance info - which statement makes us beleive this
      if (c.uri) {
        var st = types[c.uri]
        if (st) {
          if (st.uri) { // just a subsumption
            /* nothing */
          } else if (st.why) { // specific statement
            var anchor = myDocument.createElement('A')
            anchor.appendChild(myDocument.createTextNode(
              '  (' +
              UI.utils.label(st.subject) + ' ' +
              UI.utils.label(st.predicate) + ' ' +
              UI.utils.label(st.object) + ')'))
            if (st.why.uri) anchor.setAttribute('href', st.why.uri)
            anchor.setAttribute('class', 'categoryWhy')
            tr.appendChild(anchor)
          }
        }
      }
      var table = null
      /*
      var makeSelectForSubs = function(subs, multiple) {
          var n = 0; var uris ={} // Count them
          for (var i=0; i < subs.length; i++) {
              var sub = subs[i]
              if (sub.uri in uris) continue
              uris[sub.uri] = true; n++
          }
          if (n>0) {
              var select = myDocument.createElement('select')
              if (multiple) select.setAttribute('multiple', 'true')
              //@@ Later, check whether classes are disjoint.
              select.innerHTML = "<option>-- classify --</option>"
              for (var uri in uris) {
                  var option = myDocument.createElement('option')
                  option.appendChild(myDocument.createTextNode(UI.utils.label(kb.sym(uri))))
                  option.setAttribute('name', uri)
                  if (uri in types) option.setAttribute('selected', 'true')
                  select.appendChild(option)
              }
              return select
          }
          return null

      } // makeSelectForSubs
      */

      if (kb.any(c, kb.sym('http://www.w3.org/2002/07/owl#disjointUnionOf'))) {
        var sel = UI.widgets.makeSelectForCategory(
          myDocument, kb, subject, c,
          subs, false) // Not multiple
      }
      /*
                  var subClassesAsNT = {}
                  if (disjointSubclassLists.length) {
                      for (j=0; j<disjointSubclassLists.length; j++) {
                          td.appendChild(myDocument.createTextNode('subs:'+subs))
                          var subs = disjointSubclassLists[j].elements
                          var sel = UI.widgets.makeSelectForCategory(
                              myDocument, kb, subject, c,
                              subs, false) // Not multiple
                          if (sel) tr.appendChild(sel)
                          for (var i=0; i<subs.length; i++) {
                              subClassesAsNT[subs[i].toNT()] = true // Could be blank node
                          }
                      }
                  }
      */

      var subs = kb.each(undefined, kb.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), c)
      if (subs) {
        if (!table) {
          table = myDocument.createElement('TABLE')
          table.setAttribute('class', 'categoryTable')
          tr.appendChild(table)
        }

        var uris = {}; // remove duplicates (why dups?) and count
        var n = 0
        for (var i = 0; i < subs.length; i++) {
          var sub = subs[i]
          if (sub.uri in uris) continue
          uris[sub.uri] = true; n++
        }
        // @@
        for (var uri in uris) {
          if (uri in types) {
            table.appendChild(domForClass(kb.sym(uri), false))
          //                    } else if (c.uri && ((c.uri in bots) || (c.uri in categorizables))) {
          //                        table.appendChild(domForClass(kb.sym(uri), false))
          }
        }
      }

      return tr
    }

    for (var u in tops) {
      var c = kb.sym(u)
      var tr = domForClass(c)
      div.appendChild(tr)
    }

    return div
  }
}

// ends
