/*
**                 Pane for running existing forms for any object
**
*/


// tabulator.Icon.src.icon_form = tabulator.iconPrefix + 'js/panes/form/form-b-22.png';
// tabulator.Icon.tooltips[tabulator.Icon.src.icon_form] = 'forms';

module.exports =  {

    icon: (module.__dirname || __dirname) + 'form-b-22.png',

    name: 'form',

    // Does the subject deserve this pane?
    label: function(subject) {
        var n = UI.widgets.formsFor(subject).length;
        UI.log.debug("Form pane: forms for "+subject+": "+n)
        if (!n) return null;
        return ""+n+" forms";
    },

    render: function(subject, dom) {
        var kb = UI.store;
        var ns = UI.ns;
        var WF = $rdf.Namespace('http://www.w3.org/2005/01/wf/flow#');
        var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
        var DCT = $rdf.Namespace('http://purl.org/dc/terms/');
        var UI = $rdf.Namespace('http://www.w3.org/ns/ui#');


        var mention = function complain(message, style){
            var pre = dom.createElement("p");
            pre.setAttribute('style', style ? style :'color: grey; background-color: white');
            box.appendChild(pre).textContent = message;
            return pre
        }

        var complain = function complain(message, style){
            mention(message, 'style', style ? style :'color: grey; background-color: #fdd;');
        }

        var complainIfBad = function(ok,body){
            if (ok) {
                // setModifiedDate(store, kb, store);
                // rerender(box);   // Deleted forms at the moment
            }
            else complain("Sorry, failed to save your change:\n"+body);
        }

        var thisPane = this;
        var rerender = function(box) {
            var parent  = box.parentNode;
            var box2 = thisPane.render(subject, dom);
            parent.replaceChild(box2, box);
        };

        if (!tabulator.sparql) tabulator.sparql = new UI.rdf.UpdateManager(kb);

        //kb.statementsMatching(undefined, undefined, subject);

        // The question of where to store this data about subject
        // This in general needs a whole lot more thought
        // and it connects to the discoverbility through links

        var t = kb.findTypeURIs(subject);

        var me_uri = tabulator.preferences.get('me');
        var me = me_uri? kb.sym(me_uri) : null;

        var box = dom.createElement('div');
        box.setAttribute('class', 'formPane');

        if (!me) {
            mention("You are not logged in. If you log in and have \
workspaces then you would be able to select workspace in which \
to put this new information")
        } else {
            var ws = kb.each(me, ns.ui('workspace'));
            if (ws.length = 0) {
                mention("You don't seem to have any workspaces defined.  \
A workspace is a place on the web (http://..) or in \
the file system (file:///) to store application data.\n")
            } else {
                //@@
            }
        }


        // Render forms using a given store

        var renderFormsFor = function(store, subject) {
            kb.fetcher.nowOrWhenFetched(store.uri, subject, function(ok, body) {
                if (!ok) return complain("Cannot load store "+store.uri + ': '+ body);

                //              Render the forms

                var forms = UI.widgets.formsFor(subject);

                // complain('Form for editing this form:');
                for (var i=0; i<forms.length; i++) {
                    var form = forms[i];
                    var heading = dom.createElement('h4');
                    box.appendChild(heading);
                    if (form.uri) {
                        var formStore = $rdf.Util.uri.document(form);
                        if (formStore.uri != form.uri) {// The form is a hash-type URI
                            var e = box.appendChild(UI.widgets.editFormButton(
                                    dom, box, form, formStore,complainIfBad ));
                            e.setAttribute('style', 'float: right;');
                        }
                    }
                    var anchor = dom.createElement('a');
                    anchor.setAttribute('href', form.uri);
                    heading.appendChild(anchor)
                    anchor.textContent = UI.utils.label(form, true);

                    /*  Keep tis as a reminder to let a New one have its URI given by user
                    mention("Where will this information be stored?")
                    var ele = dom.createElement('input');
                    box.appendChild(ele);
                    ele.setAttribute('type', 'text');
                    ele.setAttribute('size', '72');
                    ele.setAttribute('maxlength', '1024');
                    ele.setAttribute('style', 'font-size: 80%; color:#222;');
                    ele.value = store.uri
                    */

                    UI.widgets.appendForm(dom, box, {}, subject, form, store, complainIfBad);
                }

            }); // end: when store loded
        }; // renderFormsFor


        // Figure out what store

        // Which places are editable and have stuff about the subject?

        var store = null;

        // 1. The document URI of the subject itself
        var docuri = $rdf.Util.uri.docpart(subject.uri);
        if (subject.uri != docuri
            && tabulator.sparql.editable(docuri, kb))
            store = kb.sym($rdf.Util.uri.docpart(subject.uri)); // an editable data file with hash

        else if (store = kb.any(kb.sym(docuri), ns.link('annotationStore'))) {
            //
        }
        // 2. where stuff is already stored
        if (!store) {
            var docs = {}, docList = [];
            kb.statementsMatching(subject).map(function(st){docs[st.why.uri] = 1});
            kb.statementsMatching(undefined, undefined, subject).map(function(st){docs[st.why.uri] = 2});
            for (var d in docs) docList.push(docs[d], d);
            docList.sort();
            for (var i=0; i<docList.length; i++) {
                var uri = docList[i][1];
                if (uri && tabulator.sparql.editable(uri)) {
                    store = kb.sym(uri);
                    break;
                }
            }
        }

        // 3. In a workspace store

        var followeach = function(kb, subject, path) {
            if (path.length == 0) return [ subject ];
            var oo = kb.each(subj, path[0]);
            var res = [];
            for (var i=0; i<oo.length; i++) {
                res = res.concat(followeach(kb, oo[i], path.slice(1)));
            }
            return res;
        }

        var date = '2014'; // @@@@@@@@@@@@ pass as parameter



       if (store) {
            // mention("@@ Ok, we have a store <" + store.uri + ">.");
            renderFormsFor(store, subject);
        } else {
            complain("No suitable store is known, to edit <" + subject.uri + ">.");
            var foobarbaz = UI.widgets.selectWorkspace(dom,
                                        function(ws){
                mention("Workspace selected OK: " + ws);

                var activities = kb.each(undefined, ns.space('workspace'), ws);
                for (var j=0; j <activities.length;i++) {
                    var act = activities[j];

                    var s = kb.any(ws, ns.space('store'));
                    var start =  kb.any(ws, ns.ical('dtstart')).value();
                    var end =    kb.any(ws, ns.ical('dtend')).value();
                    if ( s && start && end &&  start <= date && end > date) {
                        renderFormsFor(s, subject);
                        break;
                    } else {
                        complain("Note no suitable annotation store in activity: " + act);
                    }
                }

           });
           box.appendChild(foobarbaz);
        };

        return box;
    }
}

//ends
