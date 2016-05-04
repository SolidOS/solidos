/*   pad Pane
**
*/
// These used to be in js/init/icons.js but are better in the pane.
// tabulator.Icon.src.icon_pad = tabulator.iconPrefix + 'js/panes/pad/images/ColourOn.png';
// tabulator.Icon.tooltips[tabulator.Icon.src.icon_pad] = 'notepad'

var UI = require('solid-ui')

module.exports = {

  icon:  (module.__dirname || __dirname) + 'images/ColourOn.png',

  name: 'pad',

  // Does the subject deserve an pad pane?
  label: function(subject) {
    var kb = UI.store;
    var ns = UI.ns;
    var t = kb.findTypeURIs(subject);
    if (t['http://www.w3.org/ns/pim/pad#Notepad']) {
      return "pad";
    }
    return null; // No under other circumstances
  },

  // and follow instructions there
  render: function(subject, dom) {



    // Utility functions

    var complainIfBad = function(ok, message) {
        if (!ok) {
            div.appendChild(UI.widgets.errorMessageBlock(dom, message, 'pink'));
        }
    };

    var clearElement = function(ele) {
        while (ele.firstChild) {
            ele.removeChild(ele.firstChild);
        }
        return ele;
    }

    var webOperation = function(method, uri, options, callback) {
        var xhr = $rdf.Util.XMLHTTPFactory();
        xhr.onreadystatechange = function (){
            if (xhr.readyState == 4){
                var ok = (!xhr.status || (xhr.status >= 200 && xhr.status < 300));
                callback(uri, ok, xhr.responseText, xhr);
            }
        };
        xhr.open(method, uri, true);
        if (options.contentType) {
            xhr.setRequestHeader('Content-type', options.contentType);
        }
        xhr.send(options.data ? options.data : undefined);
    };

    var webCopy = function(here, there, content_type, callback) {
        webOperation('GET', here,  {}, function(uri, ok, body, xhr) {
            if (ok) {
                webOperation('PUT', there, { data: xhr.responseText, contentType: content_type}, callback);
            } else {
                callback(uri, ok, "(on read) " + body, xhr);
            }
        });
    };

    //////////////////////// Accesss control


    // Two variations of ACL for this app, public read and public read/write
    // In all cases owner has read write control

    var genACLtext = function(docURI, aclURI, allWrite) {
        var g = $rdf.graph(), auth = $rdf.Namespace('http://www.w3.org/ns/auth/acl#');
        var a = g.sym(aclURI + '#a1'), acl = g.sym(aclURI), doc = g.sym(docURI);
        g.add(a, UI.ns.rdf('type'), auth('Authorization'), acl);
        g.add(a, auth('accessTo'), doc, acl)
        g.add(a, auth('agent'), me, acl);
        g.add(a, auth('mode'), auth('Read'), acl);
        g.add(a, auth('mode'), auth('Write'), acl);
        g.add(a, auth('mode'), auth('Control'), acl);

        a = g.sym(aclURI + '#a2');
        g.add(a, UI.ns.rdf('type'), auth('Authorization'), acl);
        g.add(a, auth('accessTo'), doc, acl)
        g.add(a, auth('agentClass'), ns.foaf('Agent'), acl);
        g.add(a, auth('mode'), auth('Read'), acl);
        if (allWrite) {
            g.add(a, auth('mode'), auth('Write'), acl);
        }
        return $rdf.serialize(acl, g, aclURI, 'text/turtle');
    }

    var setACL = function(docURI, allWrite, callback) {
        var aclDoc = kb.any(kb.sym(docURI),
            kb.sym('http://www.iana.org/assignments/link-relations/acl')); // @@ check that this get set by web.js
        if (aclDoc) { // Great we already know where it is
            var aclText = genACLtext(docURI, aclDoc.uri, allWrite);
            webOperation('PUT', aclDoc.uri, { data: aclText, contentType: 'text/turtle'}, callback);
        } else {

            fetcher.nowOrWhenFetched(docURI, undefined, function(ok, body){
                if (!ok) return callback(ok, "Gettting headers for ACL: " + body);
                var aclDoc = kb.any(kb.sym(docURI),
                    kb.sym('http://www.iana.org/assignments/link-relations/acl')); // @@ check that this get set by web.js
                if (!aclDoc) {
                    // complainIfBad(false, "No Link rel=ACL header for " + docURI);
                    callback(false, "No Link rel=ACL header for " + docURI);
                } else {
                    var aclText = genACLtext(docURI, aclDoc.uri, allWrite);
                    webOperation('PUT', aclDoc.uri, { data: aclText, contentType: 'text/turtle'}, callback);
                }
            })
        }
    };


    ////////////////////////////////////// Getting logged in with a WebId

    var setUser = function(webid) {
        if (webid) {
            tabulator.preferences.set('me', webid);
            console.log("(SetUser: Logged in as "+ webid+")")
            me = kb.sym(webid);
            // @@ Here enable all kinds of stuff
        } else {
            tabulator.preferences.set('me', '');
            console.log("(SetUser: Logged out)")
            me = null;
        }
        if (logInOutButton) {
            logInOutButton.refresh();
        }
        if (webid && waitingForLogin) {
            waitingForLogin = false;
            showAppropriateDisplay();
        }
    }


    ////////// Who am I

    var whoAmI = function() {
        var me_uri = tabulator.preferences.get('me');
        me = me_uri? kb.sym(me_uri) : null;
        UI.widgets.checkUser(padDoc, setUser);

        if (!tabulator.preferences.get('me')) {
            console.log("(You do not have your Web Id set. Sign in or sign up to make changes.)");

            if (tabulator.mode == 'webapp' && typeof document !== 'undefined' &&
                document.location &&  ('' + document.location).slice(0,16) === 'http://localhost') {

                me = kb.any(subject, UI.ns.dc('author')); // when testing on plane with no webid
                console.log("Assuming user is " + me)
            }

        } else {
            me = kb.sym(tabulator.preferences.get('me'))
            // console.log("(Your webid is "+ tabulator.preferences.get('me')+")");
        };
    }




    ////////////////////////////////  Reproduction: spawn a new instance
    //
    // Viral growth path: user of app decides to make another instance
    //
    //

    var newInstanceButton = function() {
        var button = div.appendChild(dom.createElement('button'));
        button.textContent = "Start another pad";
        button.addEventListener('click', function() {
            return showBootstrap(subject, spawnArea, "pad")
        })
        return button;
    };


    // Option of either using the workspace system or just typing in a URI
    //
    var showBootstrap = function showBootstrap(thisInstance, container, noun) {
        var div = clearElement(container);
        var na = div.appendChild(UI.widgets.newAppInstance(
            dom, "Start a new " + noun + " in a workspace", initializeNewInstanceInWorkspace));

        var hr = div.appendChild(dom.createElement('hr')); // @@

        var p = div.appendChild(dom.createElement('p'));
        p.textContent = "Where would you like to store the data for the " + noun + "?  " +
        "Give the URL of the directory where you would like the data stored.";
        var baseField = div.appendChild(dom.createElement('input'));
        baseField.setAttribute("type", "text");
        baseField.size = 80; // really a string
        baseField.label = "base URL";
        baseField.autocomplete = "on";

        div.appendChild(dom.createElement('br')); // @@

        var button = div.appendChild(dom.createElement('button'));
        button.textContent = "Start new " + noun + " at this URI";
        button.addEventListener('click', function(e){
            var newBase = baseField.value;
            if (newBase.slice(-1) !== '/') {
                newBase += '/';
            }
            initializeNewInstanceAtBase(thisInstance, newBase);
        });
    }


    /////////  Create new document files for new instance of app

    var initializeNewInstanceInWorkspace = function(ws) {
        var newBase = kb.any(ws, ns.space('uriPrefix'));
        if (!newBase) {
            newBase = ws.uri.split('#')[0];
        } else {
	    newBase = newBase.value;
	}
        if (newBase.slice(-1) !== '/') {
            $rdf.log.error(appPathSegment + ": No / at end of uriPrefix " + newBase ); // @@ paramater?
            newBase = newBase + '/';
        }
        var now = new Date();
        newBase += appPathSegment + '/id'+ now.getTime() + '/'; // unique id

        initializeNewInstanceAtBase(thisInstance, newBase);
    }

    var initializeNewInstanceAtBase = function(thisInstance, newBase) {

        var here = $rdf.sym(thisInstance.uri.split('#')[0]);

        var sp = UI.ns.space;
        var kb = UI.store;


        var newPadDoc = kb.sym(newBase + 'pad.ttl');
        var newIndexDoc = kb.sym(newBase + 'index.html');

        toBeCopied = [
            { local: 'index.html', contentType: 'text/html'}
        ];

        newInstance = kb.sym(newPadDoc.uri + '#thisPad');


        // $rdf.log.debug("\n Ready to put " + kb.statementsMatching(undefined, undefined, undefined, there)); //@@


        agenda = [];

        var f, fi, fn; //   @@ This needs some form of visible progress bar
        for (f=0; f < toBeCopied.length; f++) {
            var item = toBeCopied[f];
            var fun = function copyItem(item) {
                agenda.push(function(){
                    var newURI = newBase + item.local;
                    console.log("Copying " + base + item.local + " to " +  newURI);
                    webCopy(base + item.local, newBase + item.local, item.contentType, function(uri, ok, message, xhr) {
                        if (!ok) {
                            complainIfBad(ok, "FAILED to copy "+ base + item.local +' : ' + message);
                            console.log("FAILED to copy "+ base + item.local +' : ' + message);
                        } else {
                            xhr.resource = kb.sym(newURI);
                            kb.fetcher.parseLinkHeader(xhr, kb.bnode()); // Dont save the whole headers, just the links

			    var setThatACL = function() {
				setACL(newURI, false, function(ok, message){
				    if (!ok) {
					complainIfBad(ok, "FAILED to set ACL "+ newURI +' : ' + message);
					console.log("FAILED to set ACL "+ newURI +' : ' + message);
				    } else {
					agenda.shift()(); // beware too much nesting
				    }
				})
			    }
			    if (!me) {
				console.log("Waiting to find out id user users to access " + xhr.resource)
				UI.widgets.checkUser(xhr.resource, function(webid){
				    me = kb.sym(webid);
				    console.log("Got user id: "+ me);
				    setThatACL();
				});
			    } else {
				setThatACL();
			    }
                        }
                    });
                });
            };
            fun(item);
        };
        /*
	if (!me) {
	    agenda.push(function(){
		console.log("Waiting to dind out id user users to access " + newIndexDoc)
		UI.widgets.checkUser(newIndexDoc, function(webid){
		    me = kb.sym(webid);
		    conole.log("Got user id: "+ me);
		    agenda.shift()();
		});
	    });
	};
	*/
	//   me  is now defined

        agenda.push(function createNewPadDataFile(){

	    kb.add(newInstance, ns.rdf('type'), PAD('Notepad'), newPadDoc);

	    kb.add(newInstance, ns.dc('created'), new Date(), newPadDoc);
	    if (me) {
		kb.add(newInstance, ns.dc('author'), me, newPadDoc);
	    }
	    kb.add(newInstance, PAD('next'), newInstance, newPadDoc); // linked list empty

	    // Keep a paper trail   @@ Revisit when we have non-public ones @@ Privacy
	    kb.add(newInstance, UI.ns.space('inspiration'), thisInstance, padDoc);
	    kb.add(newInstance, UI.ns.space('inspiration'), thisInstance, newPadDoc);

            updater.put(
                newPadDoc,
                kb.statementsMatching(undefined, undefined, undefined, newPadDoc),
                'text/turtle',
                function(uri2, ok, message) {
                    if (ok) {
                        agenda.shift()();
                    } else {
                        complainIfBad(ok, "FAILED to save new notepad at: "+ there.uri +' : ' + message);
                        console.log("FAILED to save new notepad at: "+ there.uri +' : ' + message);
                    };
                }
            );
        });



        agenda.push(function() {
            setACL(newPadDoc.uri, true, function(ok, body) {
                complainIfBad(ok, "Failed to set Read-Write ACL on pad data file: " + body);
                if (ok) agenda.shift()();
            })
        });


        agenda.push(function(){  // give the user links to the new app

            var p = div.appendChild(dom.createElement('p'));
            p.setAttribute('style', 'font-size: 140%;')
            p.innerHTML =
                "Your <a href='" + newIndexDoc.uri + "'><b>new notepad</b></a> is ready. "+
                "<br/><br/><a href='" + newIndexDoc.uri + "'>Go to new pad</a>";
            });

        agenda.shift()();
        // Created new data files.
    }



    ///////////////  Update on incoming changes


    // Manage participation in this session
    //
    //  This is more general tham the pad.
    //
    var manageParticipation = function(subject) {
        if (!me) throw "Unknown user";
        var parps = kb.each(subject, ns.wf('participation')).filter(function(pn){
            kb.hold(pn, ns.dc('author'), me)});
        if (parps.length > 1) throw "Multiple participations";
        if (!parps.length) {
            participation = UI.widgets.newThing(padDoc);
        }

    }




    /////////////////////////


    var listenToIframe = function() {
        // Event listener for login (from child iframe)
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventListener = window[eventMethod];
        var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

        // Listen to message from child window
        eventListener(messageEvent,function(e) {
          if (e.data.slice(0,5) == 'User:') {
            // the URI of the user (currently either http* or dns:* values)
            var user = e.data.slice(5, e.data.length);
            if (user.slice(0, 4) == 'http') {
              // we have an HTTP URI (probably a WebID), do something with the user variable
              // i.e. app.login(user);
                setUser(user);
            }
          }
        },false);
    }

    var showResults = function(exists) {
        console.log("showResults()");

        whoAmI(); // Set 'me'  even if on a plane

        var title = kb.any(subject, ns.dc('title'))
        if (typeof window  !== 'undefined' && title) {
            window.document.title = title.value;
        }
        options.exists = exists;
        padEle = (UI.widgets.notepad(dom, padDoc, subject, me, options));
        naviMain.appendChild(padEle);

        var initiated = tabulator.updater.setRefreshHandler(padDoc, UI.store, padEle.reloadAndSync);
    };

    var showSignon = function showSignon() {
        var d = clearElement(naviMain);
        // var d = div.appendChild(dom.createElement('div'));
        var origin =  window && window.location ? window.location.origin : '';
        d.innerHTML = '<p style="font-size: 120%; background-color: #ffe; padding: 2em; margin: 1em; border-radius: 1em;">'+
        'You need to be logged in.<br />To be able to use this app'+
            ' you need to log in with webid account at a storage provider.</p> '+
            '<iframe class="text-center" src="https://linkeddata.github.io/signup/?ref=' + origin + '" '+
            'style="margin-left: 1em; margin-right: 1em; width: 95%; height: 40em;" '+
            ' sandbox="allow-same-origin allow-scripts allow-forms" frameborder="0"></iframe>';
            listenToIframe();
            waitingForLogin = true; // hack
    };



    // Read or create empty data file

    var loadPadData = function () {
        var div = naviMain;
        fetcher.nowOrWhenFetched(padDoc.uri, undefined, function(ok, body, xhr){
            if (!ok) {
                if (0 + xhr.status === 404) { ///  Check explictly for 404 error
                    console.log("Initializing results file " + padDoc)
                    updater.put(padDoc, [], 'text/turtle', function(uri2, ok, message, xhr) {
                        if (ok) {
                            kb.fetcher.saveRequestMetadata(xhr, kb, padDoc.uri);
                            kb.fetcher.saveResponseMetadata(xhr, kb); // Drives the isEditable question
                            clearElement(naviMain);
                            showResults(false);
                        } else {
                            complainIfBad(ok, "FAILED to create results file at: "+ padDoc.uri +' : ' + message);
                            console.log("FAILED to craete results file at: "+ padDoc.uri +' : ' + message);
                        };
                    });
                } else { // Other error, not 404 -- do not try to overwite the file
                    complainIfBad(ok, "FAILED to read results file: " + body);
                }
            } else { // Happy read
                clearElement(naviMain);
                if (kb.holds(subject, ns.rdf('type'), ns.wf('TemplateInstance'))) {
                    showBootstrap(subject, naviMain, 'pad');
                }
                showResults(true);
                naviMiddle3.appendChild(newInstanceButton());

            }
        });
    };

    ////////////////////////////////////////////// Body of Pane



    var appPathSegment = 'app-pad.timbl.com'; // how to allocate this string and connect to

    var kb = UI.store;
    var fetcher = UI.store.fetcher;
    var ns = UI.ns;
    var me;
    var updater = new $rdf.UpdateManager(kb);
    var waitingForLogin = false;

    var PAD = $rdf.Namespace('http://www.w3.org/ns/pim/pad#');


    //window.document.title = "Pad";

    //var subject = kb.sym(subject_uri);
    var thisInstance = subject
    var padDoc = subject.doc()

    var padEle;

    var div = dom.createElement('div');



    //  Build the DOM

    var structure = div.appendChild(dom.createElement('table')); // @@ make responsive style
    structure.setAttribute('style', 'background-color: white; min-width: 94%; margin-right:3% margin-left: 3%; min-height: 13em;');

    var naviLoginoutTR = structure.appendChild(dom.createElement('tr'));
    var naviLoginout1 = naviLoginoutTR.appendChild(dom.createElement('td'));
    var naviLoginout2 = naviLoginoutTR.appendChild(dom.createElement('td'));
    var naviLoginout3 = naviLoginoutTR.appendChild(dom.createElement('td'));

    var logInOutButton = null;

    var naviTop = structure.appendChild(dom.createElement('tr')); // stuff
    var naviMain = naviTop.appendChild(dom.createElement('td'));
    naviMain.setAttribute('colspan', '3');

    var naviMiddle = structure.appendChild(dom.createElement('tr')); // controls
    var naviMiddle1 = naviMiddle.appendChild(dom.createElement('td'));
    var naviMiddle2 = naviMiddle.appendChild(dom.createElement('td'));
    var naviMiddle3 = naviMiddle.appendChild(dom.createElement('td'));

    var naviStatus = structure.appendChild(dom.createElement('tr')); // status etc
    var statusArea = naviStatus.appendChild(dom.createElement('div'));

    var naviSpawn = structure.appendChild(dom.createElement('tr')); // create new
    var spawnArea = naviSpawn.appendChild(dom.createElement('div'));


    var naviMenu = structure.appendChild(dom.createElement('tr'));
    naviMenu.setAttribute('class', 'naviMenu');
//    naviMenu.setAttribute('style', 'margin-top: 3em;');
    var naviLeft = naviMenu.appendChild(dom.createElement('td'));
    var naviCenter = naviMenu.appendChild(dom.createElement('td'));
    var naviRight = naviMenu.appendChild(dom.createElement('td'));

    var options = { statusArea: statusArea, timingArea: naviMiddle1 }

	  loadPadData();

    return div

  }
}
//ends
