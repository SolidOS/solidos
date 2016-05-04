/*   Financial Period Pane
**
**  This outline pane allows a user to interact with a period
**  downloaded from a bank statement, annotting it with classes and comments,
** trips, etc
*/

var UI = require('solid-ui')


module.exports = {

    icon:  UI.icons.iconBase + 'noun_142708.svg',

    name: 'period',

    // Does the subject deserve this pane?
    label: function(subject) {
        var Q = $rdf.Namespace('http://www.w3.org/2000/10/swap/pim/qif#');
        var kb = UI.store;
        var t = kb.findTypeURIs(subject);
        if (t['http://www.w3.org/2000/10/swap/pim/qif#Period']) return "period";
        return null; // No under other circumstances (while testing at least!)
    },

    render: function(subject, dom) {
        var kb = UI.store;
        var ns = UI.ns;
        var WF = $rdf.Namespace('http://www.w3.org/2005/01/wf/flow#');
        var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
        var DCT = $rdf.Namespace('http://purl.org/dc/terms/');
        var UI = $rdf.Namespace('http://www.w3.org/ns/ui#');
        var Q = $rdf.Namespace('http://www.w3.org/2000/10/swap/pim/qif#');
        var TRIP = $rdf.Namespace('http://www.w3.org/ns/pim/trip#');

        var div = dom.createElement('div')
        div.setAttribute('class', 'periodPane');
        div.innerHTML='<h1>Period</h1><table><tbody><tr>\
        <td>%s</tr></tbody></table>\
        <p>This is a pane under development.</p>';

        var commentFlter = function(pred, inverse) {
            if (!inverse && pred.uri ==
                'http://www.w3.org/2000/01/rdf-schema#comment') return true;
            return false
        }


        var mention = function mention(message, style){
            if (style == undefined) style = 'color: grey';
            var pre = dom.createElement("pre");
            pre.setAttribute('style', style);
            div.appendChild(pre);
            pre.appendChild(dom.createTextNode(message));
        }
        var happy = function happy(message){
            return mention('✓ ' + message, 'color: #010; background-color: #efe');
        }
        var complain = function complain(message){
            return mention(message, 'color: #100; background-color: #fee');
        }
        var thisPane = this;
        var rerender = function(div) {
            var parent  = div.parentNode;
            var div2 = thisPane.render(subject, dom);
            parent.replaceChild(div2, div);
        };


 // //////////////////////////////////////////////////////////////////////////////



        var sparqlService = new UI.rdf.UpdateManager(kb);


        var plist = kb.statementsMatching(subject)
        var qlist = kb.statementsMatching(undefined, undefined, subject)

        var t = kb.findTypeURIs(subject);

        var me_uri = tabulator.preferences.get('me');
        var me = me_uri? kb.sym(me_uri) : null;


        //              Render a single Period

        // This works only if enough metadata about the properties can drive the RDFS
        // (or actual type statements whichtypically are NOT there on)
        if (t['http://www.w3.org/2000/10/swap/pim/qif#Period']) {

            var dtstart = kb.any(subject, ns.cal('dtstart'));
            if (dtstart === undefined) {
                complain('(Error: There is no start date known for this period <'
                        +subject.uri+'>,\n -- every period needs one.)')
            };

            var dtend = kb.any(subject, ns.cal('dtend'));
            if (dtend === undefined) {
                complain('(Error: There is no end date known for this period <'
                        +subject.uri+'>,\n -- every period needs one.)')
            };

            var store = kb.any(subject, Q('annotationStore')) || null;

            var needed = kb.each(subject, ns.rdfs('seeAlso'));


            var predicateURIsDone = {};
            var donePredicate = function(pred) {predicateURIsDone[pred.uri]=true};
            donePredicate(ns.rdf('type'));

            var inPeriod = function(date) {
                return !!(date && date >= dtstart && date < dtend);
            };

            var d2 = function(n) {
                var s = '' + n
                if (s.indexOf('.') >= 0) {
                    return s.split('.')[0] + '.' + (s.split('.')[1]+'00').slice(0,2)
                }
                return s + '.00'
            }

            var transactionInPeriod = function(x) {
                return inPeriod(kb.any(x, ns.qu('date')));
            };

            var oderByDate = function(x, y) {
                dx = UI.store.any(x, ns.qu('date'));
                dy = UI.store.any(y, ns.qu('date'));
                if (dx !== undefined && dy !== undefined) {
                    if (dx.value < dy.value) return -1;
                    if (dx.value > dy.value) return 1;
                }
                if (x.uri < y.uri) return -1; // Arbitrary but repeatable
                if (x.uri > y.uri) return 1;
                return 0;
            }

            var setPaneStyle = function() {
                var mystyle = "padding: 0.5em 1.5em 1em 1.5em; ";
                if (account) {
                    var backgroundColor = kb.any(account,UI('backgroundColor'));
                    if (backgroundColor) mystyle += "background-color: "
                                +backgroundColor.value+"; ";
                }
                div.setAttribute('style', mystyle);
            }
            // setPaneStyle();

            var h2 = div.appendChild(dom.createElement('h2'));
            h2.textContent = "Period " + dtstart.value.slice(0,10) + ' - ' + dtend.value.slice(0,10);

            var insertedPane = function(dom, subject, paneName) {
                var p = tabulator.panes.byName(paneName);
                var d = p.render(subject, dom);
                d.setAttribute('style', 'border: 0.1em solid green;')
                return d;
            };

            var expandAfterRow = function(dom, row, subject, paneName, solo) {
                var siblings = row.parentNode.children;
                if (solo) {
                    for (var j = siblings.length - 1; j >= 0; j--) {
                        if (siblings[j].expanded) {
                            siblings[j].parentNode.removeChild(siblings[j].expanded);
                            siblings[j].expanded = false;
                        }
                    }
                }
                var tr = dom.createElement('tr');
                var td = tr.appendChild(dom.createElement('td'));
                td.setAttribute('style', 'width: 98%; padding: 1em; border: 0.1em solid grey;')
                var cols = row.children.length;
                if (row.nextSibling) {
                    row.parentNode.insertBefore(tr, row.nextSibling);
                } else {
                    row.parentNode.appendChild(tr);
                }
                row.expanded = tr;
                td.setAttribute('colspan', '' + cols)
                td.appendChild(insertedPane(dom, subject, paneName));
            };

            var expandAfterRowOrCollapse = function(dom, row, subject, paneName, solo) {
                if (row.expanded) {
                    row.parentNode.removeChild(row.expanded);
                    row.expanded = false;
                } else {
                    expandAfterRow(dom, row, subject, paneName, solo);
                }
            };

            var transactionTable = function(dom, list) {

                var table = dom.createElement('table');
                table.setAttribute('style', 'margin-left: 100; font-size: 9pt; width: 85%;');
                var transactionRow = function(dom, x) {
                    var tr = dom.createElement('tr');

                    var setTRStyle = function(tr, account) {
                        // var mystyle = "padding: 0.5em 1.5em 1em 1.5em; ";
                        var mystyle = "margin-left: 8em; padding-left: 5em;";
                        if (account) {
                            var backgroundColor = kb.any(account,UI('backgroundColor'));
                            if (backgroundColor) mystyle += "background-color: "
                                        +backgroundColor.value+"; ";
                        }
                        tr.setAttribute('style', mystyle);
                    }

                    var account = kb.any(x, ns.qu('toAccount'));
                    setTRStyle(tr, account);

                    var c0 = tr.appendChild(dom.createElement('td'));
                    var date = kb.any(x, ns.qu('date'));
                    c0.textContent = date ? date.value.slice(0,10) : '???';
                    c0.setAttribute('style',  'width: 7em;');

                    var c1 = tr.appendChild(dom.createElement('td'));
                    c1.setAttribute('style',  'width: 36em;');
                    var payee = kb.any(x, ns.qu('payee'));
                    c1.textContent = payee ? payee.value : '???';
                    var a1 = c1.appendChild(dom.createElement('a'));
                    a1.textContent = ' ➜';
                    a1.setAttribute('href', x.uri);

                    var c3 = tr.appendChild(dom.createElement('td'));
                    var amount = kb.any(x, ns.qu('in_USD'));
                    c3.textContent = amount ? d2(amount.value) : '???';
                    c3.setAttribute('style',  'width: 6em; text-align: right; '); // @@ decimal alignment?
                    tr.addEventListener('click', function(e) { // solo unless shift key
                        expandAfterRowOrCollapse(dom, tr, x, 'transaction', !e.shiftKey);
                    }, false);

                    return tr;
                 };

                 var list2 = list.filter(transactionInPeriod);
                 list2.sort(oderByDate);

                 for (var i=0; i < list2.length; i++) {
                    table.appendChild(transactionRow(dom, list2[i]));
                 }
                 return table;
            };


            // List unclassified transactions


            var dummies = {
                'http://www.w3.org/2000/10/swap/pim/qif#Transaction': true, // (we knew)
                'http://www.w3.org/2000/10/swap/pim/qif#Unclassified': true, // pseudo classifications we may phase out
                'http://www.w3.org/2000/10/swap/pim/qif#UnclassifiedOutgoing': true,
                'http://www.w3.org/2000/10/swap/pim/qif#UnclassifiedIncome': true,
            };
            var xURIs = kb.findMemberURIs(ns.qu('Transaction'));
            var unc_in = [], unc_out = [], usd, z, tt, t, j;
            for (var y in xURIs) { // For each thing which can be inferred to be a transaction
                if (xURIs.hasOwnProperty(y)) {
                    z = kb.sym(y);
                    tt = kb.each(z, ns.rdf('type')); // What EXPLICIT definitions
                    classified = false;
                    for (j=0; j< tt.length; j++) {
                        t = tt[j];
                        if ( dummies[t.uri] === undefined) {
                            classified = true;
                        }
                    };
                    if (!classified) {
                        usd = kb.any(z, ns.qu('in_USD'));
                        if (usd === undefined) {
                            usd = kb.any(z, ns.qu('amount'));
                        }
                        if (usd && ( '' + usd.value).indexOf('-') >= 0) {
                            unc_out.push(kb.sym(y));
                        } else {
                            unc_in.push(kb.sym(y));
                        }
                    }
                }
            }
            var tab, count;
            if (unc_in.length) {
                tab = transactionTable(dom, unc_in);
                count = tab.children.length;
                div.appendChild(dom.createElement('h3')).textContent = "Unclassified Income" +
                    ( count < 4 ? '' : ' (' + count + ')' );
                div.appendChild(tab);
            } else {
                happy("No unclassified income");
            }
            if (unc_out.length) {
                tab = transactionTable(dom, unc_out);
                count = tab.children.length;
                div.appendChild(dom.createElement('h3')).textContent = "Unclassified Outgoings" +
                    ( count < 4 ? '' : ' (' + count+ ')' );
                div.appendChild(tab);
            } else {
                happy("No unclassified outgoings ");
            }

            /////////////////  Check some categories of transaction for having given fields

            var catSymbol = function(catTail) {
                var cat, cats = kb.findSubClassesNT(ns.qu('Transaction'));
                for (cat in cats) {
                    if (cats.hasOwnProperty(cat)) {
                        if (cat.slice(1,-1).split('#')[1] === catTail) {
                            return kb.sym(cat.slice(1,-1));
                        }
                    };
                 };
                 return null;
            };

            var checkCatHasField = function(catTail, pred) {
                var cat = catSymbol(catTail), tab, count;
                var guilty = [], count = 0;
                if (!cat) {
                    complain("Error: No category correspnding to " + catTail)
                    return null;
                }
                var list = kb.each(undefined, ns.rdf('type'), cat);
                for (var i=0; i<list.length; i++) {
                    if (!kb.any(list[i], pred)) {
                        guilty.push(list[i]);
                    }
                }
                if (guilty.length) {
                    tab = transactionTable(dom, guilty);
                    count = tab.children.length;
                    div.appendChild(dom.createElement('h3')).textContent = UI.utils.label(cat)
                        + " with no " + UI.utils.label(pred) +
                        ( count < 4 ? '' : ' (' + count + ')' );
                    div.appendChild(tab);
                }
                return count;
            }

            // Load dynamically as properties of period
            if (checkCatHasField('Reimbursables', ns.trip('trip')) === 0) {
                happy("Reimbursables all have trips")
            };
            if (checkCatHasField('Other_Inc_Speaking', ns.trip('trip')) === 0) {
                happy("Speaking income all has trips")
            };
        // end of render period instance
        }

        //if (!me) complain("You do not have your Web Id set. Set your Web ID to make changes.");

        return div
    }
}

//ends
