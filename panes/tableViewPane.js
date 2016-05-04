
// Format an array of RDF statements as an HTML table.
//
// This can operate in one of three modes: when the class of object is given
// or when the source document from whuch data is taken is given,
// or if a prepared query object is given.
// (In principle it could operate with neither class nor document
// given but typically
// there would be too much data.)
// When the tableClass is not given, it looks for common  classes in the data,
// and gives the user the option.
//
// 2008 Written, Ilaria Liccardi
// 2014 core functionality now in common/table.js   -timbl


/////////////////////////////////////////////////////////////////////

/* Table view pane  -- view of a class*/
var UI = require('solid-ui')

module.exports = {
    icon: tabulator.iconPrefix + "icons/table.png",

    name: "tableOfClass",

    label: function(subject) {
            //if (!UI.store.holds(subject, UI.ns.rdf('type'),UI.ns.rdfs('Class'))) return null;
            if (!UI.store.any(undefined, UI.ns.rdf('type'),subject)) return null;
            var n = UI.store.statementsMatching(
                undefined, UI.ns.rdf( 'type'), subject).length;
            if (n == 0) return null;  // None, suppress pane
            if (n > 15) return null;  // @@ At the moment this pane can be slow with too many @@ fixme by using limits
            return (UI.utils.label(subject) + " table")
        },

    render: function(subject, myDocument) {
        var div = myDocument.createElement("div");
        div.setAttribute('class', 'tablePane');
        div.appendChild(UI.widgets.renderTableViewPane(myDocument, {'tableClass': subject}));
        return div;
    }
}
