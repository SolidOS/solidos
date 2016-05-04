/*   Trip Pane
**
** This pane deals with trips themselves and also
** will look at transactions organized by trip.
**
**  This outline pane allows a user to interact with a transaction
**  downloaded from a bank statement, annotting it with classes and comments,
**  trips, etc
*/

var UI = require('solid-ui')

// tabulator.Icon.src.icon_trip = tabulator.iconPrefix +
//    'js/panes/transaction/22-pixel-068010-3d-transparent-glass-icon-alphanumeric-dollar-sign.png'; // @@
// tabulator.Icon.tooltips[tabulator.Icon.src.icon_trip] = 'travel expenses'

module.exports = {

    icon: UI.icons.iconBase + 'noun_62007.svg',

    name: 'travel expenses',

    // Does the subject deserve this pane?
    label: function(subject) {
        var Q = $rdf.Namespace('http://www.w3.org/2000/10/swap/pim/qif#');
        var kb = UI.store;
        var t = kb.findTypeURIs(subject);

        // if (t['http://www.w3.org/2000/10/swap/pim/qif#Transaction']) return "$$";
        //if(kb.any(subject, Q('amount'))) return "$$$"; // In case schema not picked up


        if (Q('Transaction') in kb.findSuperClassesNT(subject)) return "by Trip";
        if (t['http://www.w3.org/ns/pim/trip#Trip']) return "Trip $";

        return null; // No under other circumstances (while testing at least!)
    },

    render: function(subject, myDocument) {
        var kb = UI.store;
        var ns = UI.ns;
        var CAL = $rdf.Namespace('http://www.w3.org/2002/12/cal/ical#');
        var WF = $rdf.Namespace('http://www.w3.org/2005/01/wf/flow#');
        var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
        var DCT = $rdf.Namespace('http://purl.org/dc/terms/');
        var UI = $rdf.Namespace('http://www.w3.org/ns/ui#');
        var Q = $rdf.Namespace('http://www.w3.org/2000/10/swap/pim/qif#');
        var TRIP = $rdf.Namespace('http://www.w3.org/ns/pim/trip#');

        var div = myDocument.createElement('div')
        div.setAttribute('class', 'transactionPane');
        div.innerHTML='<h1>Transaction</h1><table><tbody><tr>\
        <td>%s</tr></tbody></table>\
        <p>This is a pane under development.</p>';

        var commentFlter = function(pred, inverse) {
            if (!inverse && pred.uri ==
                'http://www.w3.org/2000/01/rdf-schema#comment') return true;
            return false
        }

        var setModifiedDate = function(subj, kb, doc) {
            var deletions = kb.statementsMatching(subject, DCT('modified'));
            var deletions = deletions.concat(kb.statementsMatching(subject, WF('modifiedBy')));
            var insertions = [ $rdf.st(subject, DCT('modified'), new Date(), doc) ];
            if (me) insertions.push($rdf.st(subject, WF('modifiedBy'), me, doc) );
            sparqlService.update(deletions, insertions, function(uri, ok, body){});
        }

        var complain = function complain(message, style){
            if (style == undefined) style = 'color: grey';
            var pre = myDocument.createElement("pre");
            pre.setAttribute('style', style);
            div.appendChild(pre);
            pre.appendChild(myDocument.createTextNode(message));
        }
        var thisPane = this;
        var rerender = function(div) {
            var parent  = div.parentNode;
            var div2 = thisPane.render(subject, myDocument);
            parent.replaceChild(div2, div);
        };


 // //////////////////////////////////////////////////////////////////////////////



        var sparqlService = new UI.rdf.UpdateManager(kb);


        var plist = kb.statementsMatching(subject)
        var qlist = kb.statementsMatching(undefined, undefined, subject)

        var t = kb.findTypeURIs(subject);

        var me_uri = tabulator.preferences.get('me');
        var me = me_uri? kb.sym(me_uri) : null;

        //      Function: Render a single trip

        var renderTrip = function renderTrip(subject, thisDiv){
            var query = new $rdf.Query(UI.utils.label(subject));
            var vars =  [ 'date', 'transaction', 'comment', 'type',  'in_USD'];
            var v = {};
            vars.map(function(x){query.vars.push(v[x]=$rdf.variable(x))}); // Only used by UI
            query.pat.add(v['transaction'], TRIP('trip'), subject);

            var opt = kb.formula();
            opt.add(v['transaction'], ns.rdf('type'), v['type']); // Issue: this will get stored supertypes too
            query.pat.optional.push(opt);

            query.pat.add(v['transaction'], Q('date'), v['date']);

            var opt = kb.formula();
            opt.add(v['transaction'], ns.rdfs('comment'), v['comment']);
            query.pat.optional.push(opt);

            //opt = kb.formula();
            query.pat.add(v['transaction'], Q('in_USD'), v['in_USD']);
            //query.pat.optional.push(opt);

            var calculations = function() {
                var total = {};
                var trans = kb.each(undefined, TRIP('trip'), subject);
                // complain("@@ Number of transactions in this trip: " + trans.length);
                trans.map(function(t){
                    var ty = kb.the(t, ns.rdf('type'));
                    // complain(" -- one trans: "+t.uri + ' -> '+kb.any(t, Q('in_USD')));
                    if (!ty) ty = Q('ErrorNoType');
                    if (ty && ty.uri) {
                        var tyuri = ty.uri;
                        if (!total[tyuri]) total[tyuri] = 0.0;
                        var lit = kb.any(t, Q('in_USD'));
                        if (!lit) {
                            complain("    @@ No amount in USD: "+lit+" for " + t);
                        }
                        if (lit) {
                            total[tyuri] = total[tyuri] + parseFloat(lit.value);
                            //complain('      Trans type ='+ty+'; in_USD "' + lit
                            //       +'; total[tyuri] = '+total[tyuri]+';')
                        }
                    }
                });
                var str = '';
                var types = 0;
                var grandTotal = 0.0;
                for (var uri in total) {
                    str += UI.utils.label(kb.sym(uri)) + ': '+total[uri]+'; ';
                    types++;
                    grandTotal += total[uri];
                }
                complain("Totals of "+trans.length+" transactions: " + str, ''); // @@@@@  yucky -- need 2 col table
                if (types > 1) complain("Overall net: "+grandTotal, 'text-treatment: bold;')
            }
            var tableDiv = UI.widgets.renderTableViewPane(myDocument, {'query': query, 'onDone': calculations} );
            thisDiv.appendChild(tableDiv);

        }

        //          Render the set of trips which have transactions in this class

        if (Q('Transaction') in kb.findSuperClassesNT(subject)) {

            ts = kb.each(undefined, ns.rdf('type'), subject);
            var tripless = [];
            var index = [];
            for (var i=0; i<ts.length; i++) {
                var trans = ts[i];
                var trip = kb.any(trans, TRIP('trip'));
                if (!trip) {
                    tripless.push(trans);
                } else {
                    if (!(trans in index)) index[trip] =  { total:0, transactions: [] };
                    var usd = kb.any(trans, Q('in_USD'));
                    if (usd) index[trip]['total'] += usd;
                    var date = kb.any(trans, Q('date'));
                    index[trip.toNT()]['transactions'].push([date, trans]);
                }
            }
/*            var byDate = function(a,b) {
                return new Date(kb.any(a, CAL('dtstart'))) -
                        new Date(kb.any(b, CAL('dtstart')));
            }
*/
            var list = [], x;
            for (var h1 in index) {
                var t1 = kb.fromNT(h1);
                list.push([kb.any(t1, CAL('dtstart')), t1]);
            }
            list.sort();
            for (var j=0; j < list.length; j++){
                var t2 = list[j][1];
                renderTrip(t2, div);
            }


       //       Render a single trip

        } else if (t['http://www.w3.org/ns/pim/trip#Trip']) {

            renderTrip(subject, div);

        }

        //if (!me) complain("You do not have your Web Id set. Set your Web ID to make changes.");

        return div;
    }

}

//ends
