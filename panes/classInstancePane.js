/*   Class member Pane
**
**  This outline pane lists the members of a class
*/

var UI = require('solid-ui')

module.exports = {
  icon: tabulator.Icon.src.icon_instances,

  name: 'classInstance',

  label: function (subject) {
    var n = UI.store.each(
      undefined, UI.ns.rdf('type'), subject).length
    if (n > 0) return 'List (' + n + ')' // Show how many in hover text
    n = UI.store.each(
      subject, UI.ns.ldp('contains')).length
    if (n > 0) {
      return 'Contents (' + n + ')' // Show how many in hover text
    }
    return null // Suppress pane otherwise
  },

  render: function (subject, myDocument) {
    var kb = UI.store
    var complain = function complain (message, color) {
      var pre = myDocument.createElement('pre')
      pre.setAttribute('style', 'background-color: ' + color || '#eed' + ';')
      div.appendChild(pre)
      pre.appendChild(myDocument.createTextNode(message))
    }
    var div = myDocument.createElement('div')
    div.setAttribute('class', 'instancePane')
    div.setAttribute('style', '  border-top: solid 1px #777; border-bottom: solid 1px #777; margin-top: 0.5em; margin-bottom: 0.5em ')

    // If this is an LDP container just list the directory
    var noHiddenFiles = function (st) {
      var lastbit = st.object.uri.slice(st.object.dir().length + 1)
      return !(lastbit.length && lastbit[0] === '.' || lastbit.slice(-3) === '.acl')
    }
    var contentsStatements = kb.statementsMatching(subject, UI.ns.ldp('contains'))
    if (contentsStatements.length) {
      // complain("Contents:", 'white'); // filter out hidden files?
      tabulator.outline.appendPropertyTRs(div, contentsStatements, false, function (pred) {return true;})
    }

    // If this is a class, look for all both explicit and implicit
    var sts = kb.statementsMatching(undefined, UI.ns.rdf('type'), subject)
    if (sts.length > 0) {
      var already = {}, more = []
      sts.map(function (st) {already[st.subject.toNT()] = st})
      for (var nt in kb.findMembersNT(subject)) if (!already[nt])
          more.push($rdf.st(kb.fromNT(nt), UI.ns.rdf('type'), subject)); // @@ no provenence
      if (more.length) complain('There are ' + sts.length + ' explicit and ' +
          more.length + ' implicit members of ' + UI.utils.label(subject))
      if (subject.sameTerm(UI.ns.rdf('Property'))) {
        // / Do not find all properties used as properties .. unlesss look at kb index
      } else if (subject.sameTerm(UI.ns.rdfs('Class'))) {
        var uses = kb.statementsMatching(undefined, UI.ns.rdf('type'), undefined)
        var usedTypes = {}
        uses.map(function (st) {usedTypes[st.object] = st}) // Get unique
        var used = []
        for (var i in usedTypes) {
          used.push($rdf.st(
            $rdf.sym(i), UI.ns.rdf('type'), UI.ns.rdfs('Class')))
        }
        complain('Total of ' + uses.length + ' type statments and ' + used.length + ' unique types.')
      }

      if (sts.length > 10) {
        var tr = myDocument.createElement('TR')
        tr.appendChild(myDocument.createTextNode('' + sts.length))
        // tr.AJAR_statement=sts[i]
        div.appendChild(tr)
      }

      UI.outline.appendPropertyTRs(div, sts, true, function (pred) {return true;})

      if (more.length) {
        complain('Implcit:')
        UI.outline.appendPropertyTRs(div, more, true, function (pred) {return true;})
      }
    }
    return div
  }
}

// ends
