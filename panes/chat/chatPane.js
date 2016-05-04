/*   Chat Pane
**
**  Plan is to support a finte number of chat graph shapes
** and investigate the interop between them.
*/

tabulator.Icon.src.icon_chat = tabulator.iconPrefix + 'js/panes/common/icons/noun_346319.svg'
tabulator.Icon.tooltips[tabulator.Icon.src.icon_chat] = 'chat'

tabulator.panes.register({
  icon: tabulator.Icon.src.icon_chat,

  name: 'chat',

  /*   AN RRSAgent IRC log:

  <irc://localhost:6667/&mit>
      a    foaf:ChatChannel
      foaf:chatEventList
              [ rdf:_100
                 <#T19-10-58>
              rdf:_101
                 <#T19-10-58-1>
              rdf:_102
  ..
  <#T19-28-47-1>
      dc:creator
         [ a wn:Person; foaf:nick "timbl" ]
      dc:date
         "2016-03-15T19:28:47Z"
      dc:description
         "timbl has joined &mit"
      a    foaf:chatEvent.

  */

  label: function (subject) {
    var kb = UI.store, ns = UI.ns
    var n = UI.store.each(subject, ns.wf('message')).length
    if (n > 0) return 'Chat (' + n + ')' // Show how many in hover text

    if (kb.holds(undefined, ns.rdf('type'), ns.foaf('ChatChannel'), subject)) { // subject is the file
      return 'IRC log'
    }
    return null // Suppress pane otherwise
  },

  render: function (subject, dom) {
    var kb = UI.store, ns = UI.ns
    var complain = function complain (message, color) {
      var pre = dom.createElement('pre')
      pre.setAttribute('style', 'background-color: ' + color || '#eed' + ';')
      div.appendChild(pre)
      pre.appendChild(dom.createTextNode(message))
    }

    var div = dom.createElement('div')
    div.setAttribute('class', 'chatPane')
    options = {} // Like newestFirst
    var messageStore

    if (kb.any(subject, UI.ns.wf('message'))) {
      messageStore = UI.store.any(subject, UI.ns.wf('message')).doc()

    } else if (kb.holds(undefined, ns.rdf('type'), ns.foaf('ChatChannel'), subject)) { // subject is the file
      var ircLogQuery = function () {
        var query = new $rdf.Query('IRC log entries')
        var v = {}['chan', 'msg', 'date', 'list', 'pred', 'creator', 'content'].map(function (x) {
          query.vars.push(v[x] = $rdf.variable(x))})
        query.pat.add(v['chan'], ns.foaf('chatEventList'), v['list']) // chatEventList
        query.pat.add(v['list'], v['pred'], v['msg']) //
        query.pat.add(v['msg'], ns.dc('date'), v['date'])
        query.pat.add(v['msg'], ns.dc('creator'), v['creator'])
        query.pat.add(v['msg'], ns.dc('description'), v['content'])
        return query
      }
      messageStore = subject
      options.query = ircLogQuery()

    } else {
      complain('Unknown chat type')
    }

    div.appendChild(UI.widgets.messageArea(dom, kb, subject, messageStore, options))

    return div
  }
}, true)

// ends
