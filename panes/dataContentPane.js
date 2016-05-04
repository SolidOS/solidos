/*      Data content Pane
**
**  This pane shows the content of a particular RDF resource
** or at least the RDF semantics we attribute to that resource.
*/

// To do:  - Only take data from one graph
//         - Only do forwards not backward?
//         - Expand automatically all the way down
//         - original source view?  Use ffox view source

var UI = require('solid-ui')

module.exports = {

    icon:  tabulator.Icon.src.icon_dataContents,

    name: 'dataContents',

    label: function(subject) {
        if('http://www.w3.org/2007/ont/link#ProtocolEvent' in UI.store.findTypeURIs(subject)) return null;
        var n = UI.store.statementsMatching(
            undefined, undefined, undefined, subject).length;
        if (n == 0) return null;
        return "Data ("+n+")";
    },
    /*
    shouldGetFocus: function(subject) {
        return UI.store.whether(subject, UI.ns.rdf('type'), UI.ns.link('RDFDocument'));
    },
*/
    statementsAsTables: function statementsAsTables(sts, myDocument, initialRoots) {
        var rep = myDocument.createElement('table');
        var sz = UI.rdf.Serializer( UI.store );
        var res = sz.rootSubjects(sts);
        var roots = res.roots;
        var subjects = res.subjects;
        var loopBreakers = res.loopBreakers;
        for (var x in loopBreakers) dump('\tdataContentPane: loopbreaker:'+x+'\n')
        var outline = UI.outline;
        var doneBnodes = {}; // For preventing looping
        var referencedBnodes = {}; // Bnodes which need to be named alas

        // The property tree for a single subject or anonymos node
        function propertyTree(subject) {
            // print('Proprty tree for '+subject);
            var rep = myDocument.createElement('table')
            var lastPred = null;
            var sts = subjects[sz.toStr(subject)]; // relevant statements
            if (!sts) { // No statements in tree
                rep.appendChild(myDocument.createTextNode('...')); // just empty bnode as object
                return rep;
            }
            sts.sort();
            var same =0;
            var td_p; // The cell which holds the predicate
            for (var i=0; i<sts.length; i++) {
                var st = sts[i];
                var tr = myDocument.createElement('tr');
                if (st.predicate.uri != lastPred) {
                    if (lastPred && same > 1) td_p.setAttribute("rowspan", ''+same)
                    td_p = myDocument.createElement('td');
                    td_p.setAttribute('class', 'pred');
                    var anchor = myDocument.createElement('a')
                    anchor.setAttribute('href', st.predicate.uri)
                    anchor.addEventListener('click', UI.widgets.openHrefInOutlineMode, true);
                    anchor.appendChild(myDocument.createTextNode(UI.utils.predicateLabelForXML(st.predicate)));
                    td_p.appendChild(anchor);
                    tr.appendChild(td_p);
                    lastPred = st.predicate.uri;
                    same = 0;
                }
                same++;
                var td_o = myDocument.createElement('td');
                td_o.appendChild(objectTree(st.object));
                tr.appendChild(td_o);
                rep.appendChild(tr);
            }
            if (lastPred && same > 1) td_p.setAttribute("rowspan", ''+same)
            return rep;
        }

        // Convert a set of statements into a nested tree of tables
        function objectTree(obj) {
            var res;
            switch(obj.termType) {
                case 'symbol':
                    var anchor = myDocument.createElement('a')
                    anchor.setAttribute('href', obj.uri)
                    anchor.addEventListener('click', UI.widgets.openHrefInOutlineMode, true);
                    anchor.appendChild(myDocument.createTextNode(UI.utils.label(obj)));
                    return anchor;

                case 'literal':

                    if (!obj.datatype || !obj.datatype.uri) {
                        res = myDocument.createElement('div');
                        res.setAttribute('style', 'white-space: pre-wrap;');
                        res.textContent = obj.value;
                        return res
                    } else if (obj.datatype.uri == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral') {
                        res = myDocument.createElement('div');
                        res.setAttribute('class', 'embeddedXHTML');
                        res.innerHTML = obj.value; // Try that  @@@ beware embedded dangerous code
                        return res;
                    };
                    return myDocument.createTextNode(obj.value); // placeholder - could be smarter,

                case 'bnode':
                    if (obj.toNT() in doneBnodes) { // Break infinite recursion
                        referencedBnodes[(obj.toNT())] = true;
                        var anchor = myDocument.createElement('a')
                        anchor.setAttribute('href', '#'+obj.toNT().slice(2))
                        anchor.setAttribute('class','bnodeRef')
                        anchor.textContent = '*'+obj.toNT().slice(3);
                        return anchor;
                    }
                    doneBnodes[obj.toNT()] = true; // Flag to prevent infinite recusruion in propertyTree
                    var newTable =  propertyTree(obj);
                    doneBnodes[obj.toNT()] = newTable; // Track where we mentioned it first
                    if (UI.utils.ancestor(newTable, 'TABLE') && UI.utils.ancestor(newTable, 'TABLE').style.backgroundColor=='white') {
                        newTable.style.backgroundColor='#eee'
                    } else {
                        newTable.style.backgroundColor='white'
                    }
                    return newTable;

                case 'collection':
                    var res = myDocument.createElement('table')
                    res.setAttribute('class', 'collectionAsTables')
                    for (var i=0; i<obj.elements.length; i++) {
                        var tr = myDocument.createElement('tr');
                        res.appendChild(tr);
                        tr.appendChild(objectTree(obj.elements[i]));
                    }
                    return  res;
                case 'formula':
                    var res = tabulator.panes.dataContentPane.statementsAsTables(obj.statements, myDocument);
                    res.setAttribute('class', 'nestedFormula')
                    return res;
                case 'variable':
                    var res = myDocument.createTextNode('?' + obj.uri);
                    return res;

            }
            throw "Unhandled node type: "+obj.termType
        }

        // roots.sort();

        if (initialRoots) {
            roots = initialRoots.concat(roots.filter(function(x){
                for (var i=0; i<initialRoots.length; i++) { // Max 2
                    if (x.sameTerm(initialRoots[i])) return false;
                }
                return true;
            }));
        }
        for (var i=0; i<roots.length; i++) {
            var tr = myDocument.createElement('tr')
            rep.appendChild(tr);
            var td_s = myDocument.createElement('td')
            tr.appendChild(td_s);
            var td_tree = myDocument.createElement('td')
            tr.appendChild(td_tree);
            var root = roots[i];
            if (root.termType == 'bnode') {
                td_s.appendChild(myDocument.createTextNode(UI.utils.label(root))); // Don't recurse!
            }
            else {
                td_s.appendChild(objectTree(root)); // won't have tree
            }
            td_tree.appendChild(propertyTree(root));
        }
        for (var bNT in referencedBnodes) { // Add number to refer to
            var table = doneBnodes[bNT];
            var tr = myDocument.createElement('tr');
            var anchor = myDocument.createElement('a')
            anchor.setAttribute('id', bNT.slice(2))
            anchor.setAttribute('class','bnodeDef')
            anchor.textContent = bNT.slice(3)+')';
            table.insertBefore(anchor, table.firstChild);
        }
        return rep;
    }, // statementsAsTables


    // View the data in a file in user-friendly way
    render: function(subject, myDocument) {

        var kb = UI.store;
        var div = myDocument.createElement("div")
        div.setAttribute('class', 'dataContentPane');
        // Because of smushing etc, this will not be a copy of the original source
        // We could instead either fetch and re-parse the source,
        // or we could keep all the pre-smushed triples.
        var sts = kb.statementsMatching(undefined, undefined, undefined, subject); // @@ slow with current store!
        if (1) {
            initialRoots = []; // Ordering: start with stuf fabout this doc
            if (kb.holds(subject, undefined, undefined, subject)) initialRoots.push(subject);
            // Then about the primary topic of the document if any
            var ps = kb.any(subject, UI.ns.foaf('primaryTopic'), undefined, subject);
            if (ps) initialRoots.push(ps);
            div.appendChild(tabulator.panes.dataContentPane.statementsAsTables(
                            sts, myDocument, initialRoots));

        } else {  // An outline mode openable rendering .. might be better
            var sz = UI.rdf.Serializer( UI.store );
            var res = sz.rootSubjects(sts);
            var roots = res.roots;
            var p  = {};
            // p.icon = dataContentPane.icon
            p.render = function(s2) {
                var div = myDocument.createElement('div')

                div.setAttribute('class', 'withinDocumentPane')
                var plist = kb.statementsMatching(s2, undefined, undefined, subject)
                appendPropertyTRs(div, plist, false, function(pred, inverse) {return true;})
                return div
            }
            for (var i=0; i<roots.length; i++) {
                var tr = myDocument.createElement("TR");
                root = roots[i];
                tr.style.verticalAlign="top";
                var td = thisOutline.outline_objectTD(root, undefined, tr)
                tr.appendChild(td)
                div.appendChild(tr);
                outline_expand(td, root,  {'pane': p});
            }
        }
        return div
    }
}
