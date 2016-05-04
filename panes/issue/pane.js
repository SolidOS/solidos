/*   Issue Tracker Pane
**
**  This outline pane allows a user to interact with an issue,
** to change its state according to an ontology, comment on it, etc.
**
**
** I am using in places single quotes strings like 'this'
** where internationalization ("i18n") is not a problem, and double quoted
** like "this" where the string is seen by the user and so I18n is an issue.
*/

var UI = require('solid-ui')



// These used to be in js/init/icons.js but are better in the pane.
// tabulator.Icon.src.icon_bug = tabulator.iconPrefix + 'js/panes/issue/tbl-bug-22.png';
// tabulator.Icon.tooltips[tabulator.Icon.src.icon_bug] = 'Track issue'

module.exports = {

    icon:  UI.icons.iconBase + 'noun_97839.svg', // was: js/panes/issue/tbl-bug-22.png

    name: 'issue',

    // Does the subject deserve an issue pane?
    label: function(subject) {
        var kb = UI.store;
        var t = kb.findTypeURIs(subject);
        if (t['http://www.w3.org/2005/01/wf/flow#Task']) return "issue";
        if (t['http://www.w3.org/2005/01/wf/flow#Tracker']) return "tracker";
        // Later: Person. For a list of things assigned to them,
        // open bugs on projects they are developer on, etc
        return null; // No under other circumstances (while testing at least!)
    },

    render: function(subject, dom) {
        var kb = UI.store;
        var ns = UI.ns;
        var WF = $rdf.Namespace('http://www.w3.org/2005/01/wf/flow#');
        var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
        var DCT = $rdf.Namespace('http://purl.org/dc/terms/');
        var div = dom.createElement("div")
        div.setAttribute('class', 'issuePane');

        var commentFlter = function(pred, inverse) {
            if (!inverse && pred.uri ==
                'http://www.w3.org/2000/01/rdf-schema#comment') return true;
            return false
        }

        var setModifiedDate = function(subj, kb, doc) {
            if (!getOption(tracker, 'trackLastModified')) return;
            var deletions = kb.statementsMatching(subject, DCT('modified'));
            var deletions = deletions.concat(kb.statementsMatching(subject, WF('modifiedBy')));
            var insertions = [ $rdf.st(subject, DCT('modified'), new Date(), doc) ];
            if (me) insertions.push($rdf.st(subject, WF('modifiedBy'), me, doc) );
            updater.update(deletions, insertions, function(uri, ok, body){});
        }

        var say = function say(message, style){
            var pre = dom.createElement("pre");
            pre.setAttribute('style', style ? style :'color: grey');
            div.appendChild(pre);
            pre.appendChild(dom.createTextNode(message));
            return pre
        }

        var complainIfBad = function(ok,body){
            if (ok) {
            }
            else console.log("Sorry, failed to save your change:\n"+body, 'background-color: pink;');
        }

        var getOption = function (tracker, option){ // eg 'allowSubIssues'
            var opt = kb.any(tracker, ns.ui(option));
            return !!(opt && opt.value);
        }


        var thisPane = this;
        var rerender = function(div) {
            var parent  = div.parentNode;
            var div2 = thisPane.render(subject, dom);
            parent.replaceChild(div2, div);
        };

        var timestring = function() {
            var now = new Date();
            return ''+ now.getTime();
            // http://www.w3schools.com/jsref/jsref_obj_date.asp
        }


        //  Form to collect data about a New Issue
        //
        var newIssueForm = function(dom, kb, tracker, superIssue) {
            var form = dom.createElement('div');  // form is broken as HTML behaviour can resurface on js error
            var stateStore = kb.any(tracker, WF('stateStore'));

            var sendNewIssue = function() {
                titlefield.setAttribute('class','pendingedit');
                titlefield.disabled = true;
                sts = [];

                var issue = kb.sym(stateStore.uri + '#' + 'Iss'+timestring());
                sts.push(new $rdf.Statement(issue, WF('tracker'), tracker, stateStore));
                var title = kb.literal(titlefield.value);
                sts.push(new $rdf.Statement(issue, DC('title'), title, stateStore))

                // sts.push(new $rdf.Statement(issue, ns.rdfs('comment'), "", stateStore))
                sts.push(new $rdf.Statement(issue, DCT('created'), new Date(), stateStore));

                var initialStates = kb.each(tracker, WF('initialState'));
                if (initialStates.length == 0) console.log('This tracker has no initialState');
                for (var i=0; i<initialStates.length; i++) {
                    sts.push(new $rdf.Statement(issue, ns.rdf('type'), initialStates[i], stateStore))
                }
                if (superIssue) sts.push (new $rdf.Statement(superIssue, WF('dependent'), issue, stateStore));
                var sendComplete = function(uri, success, body) {
                    if (!success) {
                         console.log("Error: can\'t save new issue:" + body);
                        //dump('Tabulator issue pane: can\'t save new issue:\n\t'+body+'\n')
                    } else {
                        // dump('Tabulator issue pane: saved new issue\n')
                        form.parentNode.removeChild(form);
                        rerender(div);
                        tabulator.outline.GotoSubject(issue, true, undefined, true, undefined);
                        // tabulator.outline.GoToURI(issue.uri); // ?? or open in place?
                    }
                }
                updater.update([], sts, sendComplete);
            }
            //form.addEventListener('submit', function() {try {sendNewIssue} catch(e){console.log('sendNewIssue: '+e)}}, false)
            //form.setAttribute('onsubmit', "function xx(){return false;}");



            UI.store.fetcher.removeCallback('done','expand'); // @@ experimental -- does this kill the re-paint? no
            UI.store.fetcher.removeCallback('fail','expand');


            var states = kb.any(tracker, WF('issueClass'));
            classLabel = UI.utils.label(states);
            form.innerHTML = "<h2>Add new "+ (superIssue?"sub ":"")+
                    classLabel+"</h2><p>Title of new "+classLabel+":</p>";
            var titlefield = dom.createElement('input')
            titlefield.setAttribute('type','text');
            titlefield.setAttribute('size','100');
            titlefield.setAttribute('maxLength','2048');// No arbitrary limits
            titlefield.select() // focus next user input
            titlefield.addEventListener('keyup', function(e) {
                if(e.keyCode == 13) {
                    sendNewIssue();
                }
            }, false);
            form.appendChild(titlefield);
            return form;
        };




        /////////////////////// Reproduction: Spawn a new instance of this app

        var newTrackerButton = function(thisTracker) {
	    var button = UI.widgets.newAppInstance(dom, "Start your own new tracker", function(ws){

                var appPathSegment = 'issuetracker.w3.org'; // how to allocate this string and connect to

                // console.log("Ready to make new instance at "+ws);
                var sp = UI.ns.space;
                var kb = UI.store;

                var base = kb.any(ws, sp('uriPrefix')).value;
                if (base.slice(-1) !== '/') {
                    $rdf.log.error(appPathSegment + ": No / at end of uriPrefix " + base );
                    base = base + '/';
                }
                base += appPathSegment + '/' + timestring() + '/'; // unique id

                var documentOf = function(x) {
                    return kb.sym($rdf.uri.docpart(x.uri));
                }

                var stateStore = kb.any(tracker, WF('stateStore'));
                var newStore = kb.sym(base + 'store.ttl');

                var here = documentOf(thisTracker);

                var oldBase = here.uri.slice(0, here.uri.lastIndexOf('/')+1);

                var morph = function(x) { // Move any URIs in this space into that space
                    if (x.elements !== undefined) return x.elements.map(morph); // Morph within lists
                    if (x.uri === undefined) return x;
                    var u = x.uri;
                    if (u === stateStore.uri) return newStore; // special case
                    if (u.slice(0, oldBase.length) === oldBase) {
                        u = base + u.slice(oldBase.length);
                        $rdf.log.debug(" Map "+ x.uri + " to " + u);
                    }
                    return kb.sym(u);
                }
                var there = morph(here);
                var newTracker = morph(thisTracker);

                var myConfig = kb.statementsMatching(undefined, undefined, undefined, here);
                for (var i=0; i < myConfig.length; i++) {
                    st = myConfig[i];
                    kb.add(morph(st.subject), morph(st.predicate), morph(st.object), there);
                }

                // Keep a paper trail   @@ Revisit when we have non-public ones @@ Privacy
                //
                kb.add(newTracker, UI.ns.space('inspiration'), thisTracker, stateStore);

                kb.add(newTracker, UI.ns.space('inspiration'), thisTracker, there);

                // $rdf.log.debug("\n Ready to put " + kb.statementsMatching(undefined, undefined, undefined, there)); //@@


                updater.put(
                    there,
                    kb.statementsMatching(undefined, undefined, undefined, there),
                    'text/turtle',
                    function(uri2, ok, message) {
                        if (ok) {
                            updater.put(newStore, [], 'text/turtle', function(uri3, ok, message) {
                                if (ok) {
                                    console.info("Ok The tracker created OK at: " + newTracker.uri +
                                    "\nMake a note of it, bookmark it. ");
                                } else {
                                    console.log("FAILED to set up new store at: "+ newStore.uri +' : ' + message);
                                };
                            });
                        } else {
                            console.log("FAILED to save new tracker at: "+ there.uri +' : ' + message);
                        };
                    }
                );

                // Created new data files.
                // @@ Now create initial files - html skin, (Copy of mashlib, css?)
                // @@ Now create form to edit configuation parameters
                // @@ Optionally link new instance to list of instances -- both ways? and to child/parent?
                // @@ Set up access control for new config and store.

            }); // callback to newAppInstance

	    button.setAttribute('style', 'margin: 0.5em 1em;');
	    return button;

        }; // newTrackerButton



///////////////////////////////////////////////////////////////////////////////


        tabulator.updater = tabulator.updater || new UI.rdf.UpdateManager(kb);
        var updater = tabulator.updater;


        var plist = kb.statementsMatching(subject)
        var qlist = kb.statementsMatching(undefined, undefined, subject)

        var t = kb.findTypeURIs(subject);

        var me_uri = tabulator.preferences.get('me');
        var me = me_uri? kb.sym(me_uri) : null;


        // Reload resorce then

        var reloadStore = function(store, callBack) {
            UI.store.fetcher.unload(store);
            UI.store.fetcher.nowOrWhenFetched(store.uri, undefined, function(ok, body){
                if (!ok) {
                    console.log("Cant refresh data:" + body);
                } else {
                    callBack();
                };
            });
        };



        // Refresh the DOM tree

        var refreshTree = function(root) {
            if (root.refresh) {
                root.refresh();
                return;
            }
            for (var i=0; i < root.children.length; i++) {
                refreshTree(root.children[i]);
            }
        }

        // All the UI for a single issue, without store load or listening for changes
        //
        var singleIssueUI = function(subject, div) {

            var ns = UI.ns
            var predicateURIsDone = {};
            var donePredicate = function(pred) {predicateURIsDone[pred.uri]=true};
            donePredicate(ns.rdf('type'));
            donePredicate(ns.dc('title'));


            var setPaneStyle = function() {
                var types = kb.findTypeURIs(subject);
                var mystyle = "padding: 0.5em 1.5em 1em 1.5em; ";
                var backgroundColor = null;
                for (var uri in types) {
                    backgroundColor = kb.any(kb.sym(uri), kb.sym('http://www.w3.org/ns/ui#backgroundColor'));
                    if (backgroundColor) break;
                }
                backgroundColor = backgroundColor ? backgroundColor.value : '#eee'; // default grey
                mystyle += "background-color: " + backgroundColor + "; ";
                div.setAttribute('style', mystyle);
            }
            setPaneStyle();

            var stateStore = kb.any(tracker, WF('stateStore'));
            var store = kb.sym(subject.uri.split('#')[0]);

            // Unfinished -- need this for speed to save the reloadStore below
            var incommingPatch = function(text) {
                var contentType = xhr.headers['content-type'].trim();
                var patchKB = $rdf.graph();
                $rdf.parse(patchText, patchKB, doc.uri, contentType);
                // @@ TBC: check this patch isn't one of ours
                // @@ TBC: kb.applyPatch();  @@@@@ code me
                setPaneStyle();
                refreshTree(div);
            }

            UI.widgets.checkUserSetMe(stateStore);


            var states = kb.any(tracker, WF('issueClass'));
            if (!states) throw 'This tracker '+tracker+' has no issueClass';
            var select = UI.widgets.makeSelectForCategory(dom, kb, subject, states, store, function(ok,body){
                    if (ok) {
                        setModifiedDate(store, kb, store);
                        refreshTree(div);
                    }
                    else console.log("Failed to change state:\n"+body);
                })
            div.appendChild(select);


            var cats = kb.each(tracker, WF('issueCategory')); // zero or more
            for (var i=0; i<cats.length; i++) {
                div.appendChild(UI.widgets.makeSelectForCategory(dom,
                        kb, subject, cats[i], store, function(ok,body){
                    if (ok) {
                        setModifiedDate(store, kb, store);
                        refreshTree(div);
                    }
                    else console.log("Failed to change category:\n"+body);
                }));
            }

            var a = dom.createElement('a');
            a.setAttribute('href',tracker.uri);
            a.setAttribute('style', 'float:right');
            div.appendChild(a).textContent = UI.utils.label(tracker);
            a.addEventListener('click', UI.widgets.openHrefInOutlineMode, true);
            donePredicate(ns.wf('tracker'));


            div.appendChild(UI.widgets.makeDescription(dom, kb, subject, WF('description'),
                store, function(ok,body){
                    if (ok) setModifiedDate(store, kb, store);
                    else console.log("Failed to description:\n"+body);
                }));
            donePredicate(WF('description'));



            // Assigned to whom?

            var assignments = kb.statementsMatching(subject, ns.wf('assignee'));
            if (assignments.length > 1) {
                say("Weird, was assigned to more than one person. Fixing ..");
                var deletions = assignments.slice(1);
                updater.update(deletions, [], function(uri, ok, body){
                    if (ok) {
                        say("Now fixed.")
                    } else {
                        complain("Fixed failed: " + body)
                    }
                });

                // throw "Error:"+subject+"has "+assignees.length+" > 1 assignee.";
            }

            var assignee = assignments.length ? assignments[0].object : null;
            // Who could be assigned to this?
            // Anyone assigned to any issue we know about  @@ should be just for this tracker
            var sts = kb.statementsMatching(undefined,  ns.wf('assignee'));
            var devs = sts.map(function(st){return st.object});
            // Anyone who is a developer of any project which uses this tracker
            var proj = kb.any(undefined, ns.doap('bug-database'), tracker);
            if (proj) devs = devs.concat(kb.each(proj, ns.doap('developer')));
            if (devs.length) {
                devs.map(function(person){UI.store.fetcher.lookUpThing(person)}); // best effort async for names etc
                var opts = { 'mint': "** Add new person **",
                            'nullLabel': "(unassigned)",
                            'mintStatementsFun': function(newDev) {
                                var sts = [ $rdf.st(newDev, ns.rdf('type'), ns.foaf('Person'))];
                                if (proj) sts.push($rdf.st(proj, ns.doap('developer'), newDev))
                                return sts;
                            }};
                div.appendChild(UI.widgets.makeSelectForOptions(dom, kb,
                    subject, ns.wf('assignee'), devs, opts, store,
                    function(ok,body){
                        if (ok) setModifiedDate(store, kb, store);
                        else console.log("Failed to description:\n"+body);
                    }));
            }
            donePredicate(ns.wf('assignee'));


            if ( getOption(tracker, 'allowSubIssues')) {
                // Sub issues
                tabulator.outline.appendPropertyTRs(div, plist, false,
                    function(pred, inverse) {
                        if (!inverse && pred.sameTerm(WF('dependent'))) return true;
                        return false
                    });

                // Super issues
                tabulator.outline.appendPropertyTRs(div, qlist, true,
                    function(pred, inverse) {
                        if (inverse && pred.sameTerm(WF('dependent'))) return true;
                        return false
                    });
                donePredicate(WF('dependent'));
            }

            div.appendChild(dom.createElement('br'));

            if (getOption(tracker, 'allowSubIssues')) {
                var b = dom.createElement("button");
                b.setAttribute("type", "button");
                div.appendChild(b)
                classLabel = UI.utils.label(states);
                b.innerHTML = "New sub "+classLabel;
                b.setAttribute('style', 'float: right; margin: 0.5em 1em;');
                b.addEventListener('click', function(e) {
                    div.appendChild(newIssueForm(dom, kb, tracker, subject))}, false);
            };

            var extrasForm = kb.any(tracker, ns.wf('extrasEntryForm'));
            if (extrasForm) {
                UI.widgets.appendForm(dom, div, {},
                            subject, extrasForm, stateStore, complainIfBad);
                var fields = kb.each(extrasForm, ns.ui('part'));
                fields.map(function(field) {
                    var p = kb.any(field, ns.ui('property'));
                    if (p) {
                        donePredicate(p); // Check that one off
                    }
                });

            };

            //   Comment/discussion area

            var spacer = div.appendChild(dom.createElement('tr'));
	    spacer.setAttribute('style','height: 1em');  // spacer and placeHolder

            var messageStore = kb.any(tracker, ns.wf('messageStore'));
            if (!messageStore) messageStore = kb.any(tracker, WF('stateStore'));
	    kb.fetcher.nowOrWhenFetched(messageStore, function(ok, body, xhr){
		if (!ok) {
		    var er = dom.createElement('p')
		    er.textContent = body; // @@ use nice error message
		    div.insertBefore(er, spacer);
		} else {
		    var discussion = UI.widgets.messageArea(
			dom, kb, subject, messageStore)
		    div.insertBefore(discussion, spacer);
		}
	    })
	    donePredicate(ns.wf('message'));


            // Remaining properties
	    var plist = kb.statementsMatching(subject)
	    var qlist = kb.statementsMatching(undefined, undefined, subject)

            tabulator.outline.appendPropertyTRs(div, plist, false,
                function(pred, inverse) {
                    return !(pred.uri in predicateURIsDone)
                });
            tabulator.outline.appendPropertyTRs(div, qlist, true,
                function(pred, inverse) {
                    return !(pred.uri in predicateURIsDone)
                });

            var refreshButton = dom.createElement('button');
            refreshButton.textContent = "refresh";
            refreshButton.addEventListener('click', function(e) {
                UI.store.fetcher.unload(messageStore);
                UI.store.fetcher.nowOrWhenFetched(messageStore.uri, undefined, function(ok, body){
                    if (!ok) {
                        console.log("Cant refresh messages" + body);
                    } else {
                        refreshTree(div);
                        // syncMessages(subject, messageTable);
                    };
                });
            }, false);
	    refreshButton.setAttribute('style', 'margin: 0.5em 1em;');
            div.appendChild(refreshButton);
        }; // singleIssueUI



        //              Render a single issue

        if (t["http://www.w3.org/2005/01/wf/flow#Task"]) {

            var tracker = kb.any(subject, WF('tracker'));
            if (!tracker) throw 'This issue '+subject+'has no tracker';

            var trackerURI = tracker.uri.split('#')[0];
            // Much data is in the tracker instance, so wait for the data from it
            UI.store.fetcher.nowOrWhenFetched(trackerURI, subject, function drawIssuePane1(ok, body) {
                if (!ok) return console.log("Failed to load config " + trackerURI + ' '+body);
                var stateStore = kb.any(tracker, WF('stateStore'));

                UI.store.fetcher.nowOrWhenFetched(stateStore, subject, function drawIssuePane2(ok, body) {
                    if (!ok) return console.log("Failed to load state " + stateStore + ' '+body);

                    singleIssueUI(subject, div);
                    updater.addDownstreamChangeListener(stateStore, function() {refreshTree(div)}); // Live update
                });

            });  // End nowOrWhenFetched tracker

    ///////////////////////////////////////////////////////////

        //          Render a Tracker instance

        } else if (t['http://www.w3.org/2005/01/wf/flow#Tracker']) {
            var tracker = subject;

            var states = kb.any(subject, WF('issueClass'));
            if (!states) throw 'This tracker has no issueClass';
            var stateStore = kb.any(subject, WF('stateStore'));
            if (!stateStore) throw 'This tracker has no stateStore';

            UI.widgets.checkUserSetMe(stateStore);

            var cats = kb.each(subject, WF('issueCategory')); // zero or more

            var h = dom.createElement('h2');
            h.setAttribute('style', 'font-size: 150%');
            div.appendChild(h);
            classLabel = UI.utils.label(states);
            h.appendChild(dom.createTextNode(classLabel+" list")); // Use class label @@I18n

            // New Issue button
            var b = dom.createElement("button");
            var container = dom.createElement("div");
            b.setAttribute("type", "button");
            if (!me) b.setAttribute('disabled', 'true')
            container.appendChild(b);
            div.appendChild(container);
            b.innerHTML = "New "+classLabel;
            b.addEventListener('click', function(e) {
                    b.setAttribute('disabled', 'true');
                    container.appendChild(newIssueForm(dom, kb, subject));
                }, false);

            // Table of issues - when we have the main issue list
            UI.store.fetcher.nowOrWhenFetched(stateStore.uri, subject, function(ok, body) {
                if (!ok) return console.log("Cannot load state store "+body);
                var query = new $rdf.Query(UI.utils.label(subject));
                var cats = kb.each(tracker, WF('issueCategory')); // zero or more
                var vars =  ['issue', 'state', 'created'];
                for (var i=0; i<cats.length; i++) { vars.push('_cat_'+i) };
                var v = {}; // The RDF variable objects for each variable name
                vars.map(function(x){query.vars.push(v[x]=$rdf.variable(x))});
                query.pat.add(v['issue'], WF('tracker'), tracker);
                //query.pat.add(v['issue'], ns.dc('title'), v['title']);
                query.pat.add(v['issue'], ns.dct('created'), v['created']);
                query.pat.add(v['issue'], ns.rdf('type'), v['state']);
                query.pat.add(v['state'], ns.rdfs('subClassOf'), states);
                for (var i=0; i<cats.length; i++) {
                    query.pat.add(v['issue'], ns.rdf('type'), v['_cat_'+i]);
                    query.pat.add(v['_cat_'+i], ns.rdfs('subClassOf'), cats[i]);
                }

                query.pat.optional = [];

                var propertyList = kb.any(tracker, WF('propertyList')); // List of extra properties
                // console.log('Property list: '+propertyList); //
                if (propertyList) {
                    properties = propertyList.elements;
                    for (var p=0; p < properties.length; p++) {
                        var prop = properties[p];
                        var vname = '_prop_'+p;
                        if (prop.uri.indexOf('#') >= 0) {
                            vname = prop.uri.split('#')[1];
                        }
                        var oneOpt = new $rdf.IndexedFormula();
                        query.pat.optional.push(oneOpt);
                        query.vars.push(v[vname]=$rdf.variable(vname));
                        oneOpt.add(v['issue'], prop, v[vname]);
                    }
                }


                // console.log('Query pattern is:\n'+query.pat);
                // console.log('Query pattern optional is:\n'+opts);

                var selectedStates = {};
                var possible = kb.each(undefined, ns.rdfs('subClassOf'), states);
                possible.map(function(s){
                    if (kb.holds(s, ns.rdfs('subClassOf'), WF('Open')) || s.sameTerm(WF('Open'))) {
                        selectedStates[s.uri] = true;
                        // console.log('on '+s.uri); // @@
                    };
                });

                var overlay, overlayTable;

                var bringUpInOverlay = function(href) {
                    overlayPane.innerHTML = ''; // clear existing
                    var button = overlayPane.appendChild(dom.createElement('button'))
                    button.textContent = 'X';
                    button.addEventListener('click', function(event){
                        overlayPane.innerHTML = ''; // clear overlay
                    })
                    singleIssueUI(kb.sym(href), overlayPane);
                }

                var tableDiv = UI.widgets.renderTableViewPane(dom, {
                    query: query,
                    keyVariable: '?issue', // Charactersic of row
                    hints: {
                        '?issue':  { linkFunction: bringUpInOverlay },
                        '?created': { cellFormat: 'shortDate'},
                        '?state': { initialSelection: selectedStates }}} );
                div.appendChild(tableDiv);

                overlay = div.appendChild(dom.createElement('div'));
                overlay.setAttribute('style', ' position: absolute; top: 100px; right: 20px; margin: 1em white;');
                overlayPane = overlay.appendChild(dom.createElement('div')); // avoid stomping on style by pane

                if (tableDiv.refresh) { // Refresh function
                    var refreshButton = dom.createElement('button');
                    refreshButton.textContent = "refresh";
                    refreshButton.addEventListener('click', function(e) {
                        UI.store.fetcher.unload(stateStore);
                        UI.store.fetcher.nowOrWhenFetched(stateStore.uri, undefined, function(ok, body){
                            if (!ok) {
                                console.log("Cant refresh data:" + body);
                            } else {
                                tableDiv.refresh();
                            };
                        });
                    }, false);
                    div.appendChild(refreshButton);
                } else {
                    console.log('No refresh function?!');
                }

                updater.addDownstreamChangeListener(stateStore, tableDiv.refresh); // Live update


            });


            div.appendChild(dom.createElement('hr'));
            div.appendChild(newTrackerButton(subject));
            // end of Tracker instance


        } else {
            console.log("Error: Issue pane: No evidence that "+subject+" is either a bug or a tracker.")
        }
        if (!tabulator.preferences.get('me')) {
            console.log("(You do not have your Web Id set. Sign in or sign up to make changes.)");
        } else {
            // console.log("(Your webid is "+ tabulator.preferences.get('me')+")");
        };


        var loginOutButton = UI.widgets.loginStatusBox(dom, function(webid){
            // sayt.parent.removeChild(sayt);
            if (webid) {
                tabulator.preferences.set('me', webid);
                console.log("(Logged in as "+ webid+")")
                me = kb.sym(webid);
            } else {
                tabulator.preferences.set('me', '');
                console.log("(Logged out)")
                me = null;
            }
        });
        loginOutButton.setAttribute('style', 'margin: 0.5em 1em;');
        div.appendChild(loginOutButton);

        return div;

    }
}

//ends
