    /*   Internal Pane
    **
    **  This outline pane contains the properties which are
    ** internal to the user's interaction with the web, and are not normaly displayed
    */
var UI = require('solid-ui')

module.exports = {

    icon: tabulator.Icon.src.icon_internals,

    name: 'internal',

    label: function(subject) {
        //if (subject.uri)
        return "under the hood";  // There is orften a URI even of no statements
      },

    render: function(subject, myDocument) {
        var $r = UI.rdf;
        var kb = UI.store;
        subject = kb.canon(subject);
        var types = kb.findTypeURIs(subject);
        function filter(pred, inverse) {
            if (types['http://www.w3.org/2007/ont/link#ProtocolEvent']) return true; // display everything for them
            return  !!(typeof tabulator.panes.internal.predicates[pred.uri] != 'undefined');
        }
        var div = myDocument.createElement('div')
        div.setAttribute('class', 'internalPane')
        div.setAttribute('style', 'background-color: #ddddff; padding: 0.5em; border-radius: 1em;')
//        appendRemoveIcon(div, subject, div);

        var plist = kb.statementsMatching(subject);
        var doc_uri = null;
        if (subject.uri) {
            plist.push($r.st(subject,
                    kb.sym('http://www.w3.org/2007/ont/link#uri'), subject.uri, UI.store.fetcher.appNode));
            if (subject.uri.indexOf('#') >= 0) {
                doc_uri = subject.uri.split('#')[0];
                plist.push($r.st(subject,
                    kb.sym('http://www.w3.org/2007/ont/link#documentURI'),
                    subject.uri.split('#')[0], UI.store.fetcher.appNode));
                plist.push($r.st(subject,
                    kb.sym('http://www.w3.org/2007/ont/link#document'),
                     kb.sym(subject.uri.split('#')[0]), UI.store.fetcher.appNode));
            } else {
                doc_uri = subject.uri;
            }
        }
        if (doc_uri) {
            var ed = tabulator.sparql.editable(doc_uri);
            if (ed) {
                plist.push($r.st(subject,
                    kb.sym('http://www.w3.org/ns/rww#editable'),
                    kb.literal(ed), UI.store.fetcher.appNode));
            }
        }
        tabulator.outline.appendPropertyTRs(div, plist, false, filter)
        plist = kb.statementsMatching(undefined, undefined, subject)
        tabulator.outline.appendPropertyTRs(div, plist, true, filter);
        return div
    },

    predicates: {// Predicates used for inner workings. Under the hood
        'http://www.w3.org/2007/ont/link#request': 1,
        'http://www.w3.org/2007/ont/link#requestedBy': 1,
        'http://www.w3.org/2007/ont/link#source': 1,
        'http://www.w3.org/2007/ont/link#session': 2, // 2=  test neg but display
        'http://www.w3.org/2007/ont/link#uri': 1,
        'http://www.w3.org/2007/ont/link#documentURI': 1,
        'http://www.w3.org/2007/ont/link#document':1,
        'http://www.w3.org/2007/ont/link#all': 1, // From userinput.js
        'http://www.w3.org/2007/ont/link#Document': 1,
        'http://www.w3.org/ns/rww#editable': 1,
        'http://www.w3.org/2000/01/rdf-schema#seeAlso': 1,
        'http://www.w3.org/2002/07/owl#': 1
    },
    classes: { // Things which are inherently already undercover
        'http://www.w3.org/2007/ont/link#ProtocolEvent': 1
    }
};

//    if (!SourceOptions["seeAlso not internal"].enabled)
// tabulator.panes.internal.predicates['http://www.w3.org/2000/01/rdf-schema#seeAlso'] = 1;
// tabulator.panes.internal.predicates[UI.ns.owl('sameAs').uri] = 1;

//ends
