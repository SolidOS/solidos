/*   Sharing Pane
**
**  This outline pane allows a user to view and adjust the sharing -- accesss control lists
** for anything which has that capability.
**
** I am using in places single quotes strings like 'this'
** where internationalization ("i18n") is not a problem, and double quoted
** like "this" where the string is seen by the user and so I18n is an issue.
*/

// These used to be in js/init/icons.js but are better in the pane.
// tabulator.Icon.src.icon_sharing = tabulator.iconPrefix + 'js/panes/common/icons/noun_123691.svg';
// tabulator.Icon.tooltips[tabulator.Icon.src.icon_sharing] = 'Sharing'

module.exports = {

  icon:  UI.icons.iconBase + 'js/panes/common/icons/noun_123691.svg',

  name: 'sharing',

  // Does the subject deserve an contact pane?
  label: function(subject) {
    var kb = UI.store;
    var ns = UI.ns;
    var t = kb.findTypeURIs(subject);
    if (t[ns.ldp('Resource').uri]) return "Sharing"; // @@ be more sophisticated?
    if (t[ns.ldp('Container').uri]) return "Sharing"; // @@ be more sophisticated?
    if (t[ns.ldp('BasicContainer').uri]) return "Sharing"; // @@ be more sophisticated?
    // check being allowed to see/change shgaring?
    return null; // No under other circumstances
  },


  render: function(subject, dom) {
    var kb = UI.store;
    var ns = UI.ns;
    var div = dom.createElement("div")
    div.setAttribute('class', 'sharingPane');

    var t = kb.findTypeURIs(subject);
    var noun = "file";
    if (t[ns.ldp('BasicContainer').uri] || t[ns.ldp('Container').uri]) noun = "folder";

    var pane = dom.createElement('div');
    var table = pane.appendChild(dom.createElement('table'));
    table.setAttribute('style', 'font-size:120%; margin: 1em; border: 0.1em #ccc ;');

    var statusRow = table.appendChild(dom.createElement('tr'));
    var statusBlock = statusRow.appendChild(dom.createElement('div'));
    statusBlock.setAttribute('style', 'padding: 2em;');
    var MainRow = table.appendChild(dom.createElement('tr'));
    var box = MainRow.appendChild(dom.createElement('table'));
    // var bottomRow = table.appendChild(dom.createElement('tr'));

    context = { target: subject, me: null, noun: noun,
        div: pane, dom: dom, statusRegion: statusBlock };
    var uri = tabulator.preferences.get('me');
    context.me =  uri ? $rdf.sym(uri) : null;
    UI.widgets.preventBrowserDropEvents(dom);

    box.appendChild(UI.widgets.ACLControlBox(subject, dom, noun, function(ok, body){
      if (!ok) {
        box.innerHTML = "ACL control box Failed: " + body
      }
    }))

    /*
    UI.widgets.logInLoadProfile(context).then(function(context){
    }).catch(function(err){
      console.log('Catch from ACLControlBox: ' + err)
      box.appendChild(UI.widgets.ACLControlBox(subject, dom, noun, function(ok, body){
        if (!ok) {
          box.innerHTML = "ACL control box Failed (with no profile): " + body
        }
      }))
    } // If we don't have a profile, we can manaagwe wihout esp when testing
    )
    */
    div.appendChild(pane);
    return div;
  }
}

//ends
