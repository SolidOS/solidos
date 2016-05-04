/*
 Microblog pane
 Charles McKenzie <charles2@mit.edu>
*/
tabulator.panes.register(tabulator.panes.microblogPane = {

    icon: tabulator.Icon.src.icon_mb,
    name: 'microblogPane',
    label: function(subject) {
        var SIOCt = UI.rdf.Namespace('http://rdfs.org/sioc/types#');
        if (UI.store.whether(subject, UI.ns.rdf('type'), UI.ns.foaf('Person'))) {
            return "Microblog";
        } else {
            return null;
        }
    },
    render: function(s, doc) {
        //***********************************************
        // NAMESPACES  SECTION
        //***********************************************
        var SIOC = UI.rdf.Namespace("http://rdfs.org/sioc/ns#");
        var SIOCt = UI.rdf.Namespace('http://rdfs.org/sioc/types#');
        var RSS = UI.rdf.Namespace("http://purl.org/rss/1.0/");
        var FOAF = UI.rdf.Namespace('http://xmlns.com/foaf/0.1/');
        var terms = UI.rdf.Namespace("http://purl.org/dc/terms/");
        var RDF = UI.ns.rdf;

        var kb = UI.store;
        var charCount = 140;
        var sf =  UI.store.fetcher
        //***********************************************
        // BACK END
        //***********************************************
        var sparqlUpdater = new UI.rdf.UpdateManager(kb);
        //----------------------------------------------
        //ISO 8601 DATE
        //----------------------------------------------
        Date.prototype.getISOdate = function (){
            var padZero = function(n){
                return (n<10)? "0"+n: n;
            };
            var ISOdate = this.getUTCFullYear()+"-"+
                padZero (this.getUTCMonth())+"-"+
                padZero (this.getUTCDate())+"T"+
                padZero (this.getUTCHours())+":"+
                padZero (this.getUTCMinutes())+":"+
                padZero (this.getUTCSeconds())+"Z";
            return ISOdate;
        };
        Date.prototype.parseISOdate= function(dateString){
            var arrDateTime = dateString.split("T");
            var theDate = arrDateTime[0].split("-");
            var theTime = arrDateTime[1].replace("Z","").split(":");

            this.setUTCDate(1);
            this.setUTCFullYear(theDate[0]);
            this.setUTCMonth(theDate[1]);
            this.setUTCDate(theDate[2]);
            this.setUTCHours(theTime[0]);
            this.setUTCMinutes(theTime[1]);
            this.setUTCSeconds(theTime[2]);

            return this;

        };
        //----------------------------------------------
        // FOLLOW LIST
        // store the URIs of followed users for
        // dereferencing the @replies
        //----------------------------------------------
        var FollowList = function(user) {
            this.userlist = {};
            this.uris = {};
            var myFollows = kb.each(kb.sym(user), SIOC('follows'));
            for (var mf in myFollows) {
                this.add(kb.any(myFollows[mf], SIOC('id')), myFollows[mf].uri);
            }
        };
        FollowList.prototype.add = function(user, uri) {
            // add a user to the follows store
            if (this.userlist[user]) {
                if (! (uri in this.uris)) {
                    this.userlist[user].push(uri);
                    this.uris[uri] = "";
                }
            } else {
                this.userlist[user] = [uri];
            }
        };
        FollowList.prototype.selectUser = function(user) {
            // check if a user is in the follows list.
            if (this.userlist[user]) {
                return [(this.userlist[user].length == 1), this.userlist[user]];
            } else {
                //user does not follow any users with this nick
                return [false, []];
            }
        };
        //----------------------------------------------
        // FAVORITES
        // controls the list of favorites.
        // constructor expects a user as uri.
        //----------------------------------------------
        var Favorites = function(user) {
            this.favorites = {};
            this.favoritesURI = "";
            if (!user) { //TODO is this even useful?
                return;
            }
            this.user = user.split("#")[0];
            created = kb.each(kb.sym(user), SIOC('creator_of'));
            for (var c in created) {
                if (kb.whether(created[c], RDF('type'), SIOCt('FavouriteThings'))) {
                    this.favoritesURI = created[c];
                    var favs = kb.each(created[c], SIOC('container_of'));
                    for (var f in favs) {
                        this.favorites[favs[f]] = "";
                    }
                    break;
                }
            }
        };
        Favorites.prototype.favorited = function(post) {
            /*Favorited- returns true if the post is a favorite
            false otherwise*/
            return (kb.sym(post) in this.favorites);
        };
        Favorites.prototype.add = function(post, callback) {
            var batch = new UI.rdf.Statement(this.favoritesURI, SIOC('container_of'), kb.sym(post), kb.sym(this.user));
            sparqlUpdater.insert_statement(batch,
            function(a, success, c) {
                if (success) {
                    kb.add(batch.subject, batch.predicate, batch.object, batch.why);
                }
                callback(a, success, c);
            });
        };
        Favorites.prototype.remove = function(post, callback) {
            var batch = new UI.rdf.Statement(this.favoritesURI, SIOC('container_of'), kb.sym(post), kb.sym(this.user));
            sparqlUpdater.delete_statement(batch,
            function(a, success, c) {
                if (success) {
                    kb.add(batch.subject, batch.predicate, batch.object, batch.why);
                }
                callback(a, success, c);
            });
        };
        //----------------------------------------------
        // MICROBLOG
        // store the uri's of followed users for
        // dereferencing the @replies.
        //----------------------------------------------
        var Microblog = function(kb) {
            this.kb= kb;
            this.sparqlUpdater = new UI.rdf.UpdateManager(kb);

            //attempt to fetch user account from local preferences if just
            //in case the user's foaf was not writable. add it to the store
            //this will probably need to change.
            var the_user = tabulator.preferences.get("me");
            if (the_user) {
                var the_account = tabulator.preferences.get('acct');
                if (the_user === '') {
                    tabulator.preferences.set('acct', '');
                } else if (the_account && the_account !== '') {
                    the_user = kb.sym(the_user);
                    the_account = kb.sym(tabulator.preferences.get('acct'));
                }
                if (the_user && the_account && the_account !== '') {
                    kb.add(the_user, FOAF('holdsAccount'), the_account, the_user.uri.split("#")[0]);
                }
            }
        };
        Microblog.prototype.getUser = function(uri){
            User = new Object();
            User.name = (kb.any(uri, SIOC("name")))? kb.any(uri, SIOC("name")):"";
            User.avatar = (kb.any(uri, SIOC("avatar"))) ?  kb.any(uri, SIOC("avatar")) :"";
            User.id = kb.any(uri, SIOC("id"));
            User.sym = uri;
            return User;
        };

        Microblog.prototype.getPost =  function(uri){
            Post = new Object();
            // date ----------
            var postLink = new Date();
                postLink = postLink.parseISOdate(String(kb.any(uri, terms('created'))));
            var h = postLink.getHours();
            var a = (h > 12) ? " PM": " AM";
            h = (h > 12) ? (h - 12) : h;
            var m = postLink.getMinutes();
            m = (m < 10) ? "0" + m: m;
            var mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var da = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            var ds = da[postLink.getDay()] + " " + postLink.getDate() + " " + mo[postLink.getMonth()] + " " + postLink.getFullYear();
            postLink = h + ":" + m + a + " on " + ds;
            Post.date = postLink;
            //---------
            Post.mentions ="";
            Post.message = String(kb.any(uri, SIOC("content")));
            Post.creator = kb.any(uri, SIOC('has_creator'));
            Post.uri = "";
            return Post;
        };
        Microblog.prototype.gen_random_uri = function(base) {
            //generate random uri
            var uri_nonce = base + "#n" + Math.floor(Math.random() * 10e+9);
            return kb.sym(uri_nonce);
        };
        Microblog.prototype.statusUpdate = function(statusMsg, callback, replyTo, meta) {
            var myUserURI = this.getMyURI();
            myUser = kb.sym(myUserURI.split("#")[0]);
            var newPost = this.gen_random_uri(myUser.uri);
            var microlist = kb.each(kb.sym(myUserURI), SIOC('creator_of'));
            var micro;
            for (var microlistelement in microlist) {
                if (kb.whether(microlist[microlistelement], RDF('type'), SIOCt('Microblog')) &&
                !kb.whether(microlist[microlistelement], SIOC('topic'), kb.sym(this.getMyURI()))) {
                    micro = microlist[microlistelement];
                    break;
                }
            }

            //generate new post
            var batch = [
            new UI.rdf.Statement(newPost, RDF('type'), SIOCt('MicroblogPost'), myUser),
            new UI.rdf.Statement(newPost, SIOC('has_creator'), kb.sym(myUserURI), myUser),
            new UI.rdf.Statement(newPost, SIOC('content'), statusMsg, myUser),
            new UI.rdf.Statement(newPost, terms('created'), String(new Date().getISOdate()), myUser),
            new UI.rdf.Statement(micro, SIOC('container_of'), newPost, myUser)
            ];

            // message replies
            if (replyTo) {
                batch.push(new UI.rdf.Statement(newPost, SIOC('reply_of'), kb.sym(replyTo), myUser));
            }

            // @replies, #hashtags, !groupReplies
            for (var r in meta.recipients) {
                batch.push(new UI.rdf.Statement(newPost, SIOC('topic'), kb.sym(meta.recipients[r]), myUser));
                batch.push(new UI.rdf.Statement(kb.any(), SIOC("container_of"), newPost, myUser));
                var mblogs = kb.each(kb.sym(meta.recipients[r]), SIOC('creator_of'));
                for (var mbl in mblogs) {
                    if (kb.whether(mblogs[mbl], SIOC('topic'), kb.sym(meta.recipients[r]))) {
                        var replyBatch = new UI.rdf.Statement(
                        mblogs[mbl],
                        SIOC("container_of"),
                        newPost,
                        kb.sym(meta.recipients[r].split('#')[0]));
                        this.sparqlUpdater.insert_statement(replyBatch);
                    }
                }
            }

            this.sparqlUpdater.insert_statement(batch,
            function(a, b, c) {
                callback(a, b, c, batch);
            });
        };
        Microblog.prototype.getMyURI = function() {
            var me = tabulator.preferences.get('me');
            dump(me);
            var myMicroblog = kb.any(kb.sym(me), FOAF('holdsAccount'));
            dump ("\n\n"+myMicroblog);
            return (myMicroblog) ? myMicroblog.uri: false;
        };
        Microblog.prototype.generateNewMB = function(id, name, avatar, loc) {
            var host = loc + "/" + id;
            var rememberMicroblog = function() {
                tabulator.preferences.set("acct", host + "#" + id);
            };
            var cbgenUserMB = function(a, success, c, d) {
                if (success) {
                    notify('Microblog generated at ' + host + '#' + id
                            +'please add <b>'+host+'</b> to your foaf.');
                    mbCancelNewMB();
                    //assume the foaf is not writable and store the microblog to the
                    //preferences for later retrieval.
                    //this will probably need to change.
                    rememberMicroblog();
                    for (var triple in d) {
                        kb.add(d[triple].subject, d[triple].predicate, d[triple].object, d[triple].why);
                    }
                }
            };

            var genUserMB = [
            //user
            new UI.rdf.Statement(kb.sym(host + "#" + id), RDF('type'), SIOC('User'), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + "#" + id), SIOC('creator_of'), kb.sym(host + '#mb'), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + "#" + id), SIOC('creator_of'), kb.sym(host + '#mbn'), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + "#" + id), SIOC('creator_of'), kb.sym(host + '#fav'), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + "#" + id), SIOC('name'), name, kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + "#" + id), SIOC('id'), id, kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + "#" + id), RDF('label'), id, kb.sym(host)),
            new UI.rdf.Statement(s, FOAF('holdsAccount'), kb.sym(host + "#" + id), kb.sym(host)),
            //microblog
            new UI.rdf.Statement(kb.sym(host + '#mb'), RDF('type'), SIOCt('Microblog'), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + '#mb'), SIOC('has_creator'), kb.sym(host + "#" + id), kb.sym(host)),
            //notification microblog
            new UI.rdf.Statement(kb.sym(host + '#mbn'), RDF('type'), SIOCt('Microblog'), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + '#mbn'), SIOC('topic'), kb.sym(host + "#" + id), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + '#mbn'), SIOC('has_creator'), kb.sym(host + "#" + id), kb.sym(host)),
            //favorites container
            new UI.rdf.Statement(kb.sym(host + '#fav'), RDF('type'), SIOCt('FavouriteThings'), kb.sym(host)),
            new UI.rdf.Statement(kb.sym(host + '#fav'), SIOC('has_creator'), kb.sym(host + '#' + id), kb.sym(host))
            ];
            if (avatar) {
                //avatar optional
                genUserMB.push(new UI.rdf.Statement(kb.sym(host + "#" + id), SIOC('avatar'), kb.sym(avatar), kb.sym(host)));
            }
            this.sparqlUpdater.insert_statement(genUserMB, cbgenUserMB);
        };
        var mb = new Microblog(kb);
        var Favorites = new Favorites(mb.getMyURI());
        var FollowList = new FollowList(mb.getMyURI());


        //***********************************************
        // FRONT END FUNCTIONALITY
        //***********************************************
        //----------------------------------------------
        // PANE
        // User Interface for the Microblog Pane
        //----------------------------------------------
        var Pane = function(s, doc, microblogPane){
            var TabManager = function(doc){
                this.tablist =  {};
                this.doc = doc;
                this.tabView = doc.createElement("ul");
                this.tabView.className ="tabslist";
            }
            TabManager.prototype.create = function(id, caption, view, isDefault){
                var tab= this.doc.createElement('li');
                tab.innerHTML = caption;
                if (isDefault){tab.className = "active";}
                tab.id = id;
                change = this.change;
                tablist= this.tablist
                tab.addEventListener("click",function(evt){change(evt.target.id, tablist,doc)}, false);

                this.tablist[id] = {"view":view.id, "tab":tab};
                this.tabView.appendChild(tab);

            };
            TabManager.prototype.getTabView = function(){
                return this.tabView;
            };
            TabManager.prototype.change = function(id,tablist,doc){
                for ( var tab in tablist ){
                    if(tab == id){
                        tablist[id]["tab"].className = "active";
                        doc.getElementById(tablist[id]["view"]).className += " active";
                    } else {
                        var view = doc.getElementById(tablist[tab].view);
                        view.className= view.className.replace(/\w*active\w*/, "");
                        tablist[tab].tab.className = tablist[id].tab.className.replace(/\w*active\w*/, "");
                    }
                }
            }
            this.microblogPane =  microblogPane;
            var accounts = kb.each(s, FOAF('holdsAccount'))
            for (var a in accounts) {
                if (kb.whether(accounts[a], RDF('type'), SIOC('User')) &&
                kb.whether(kb.any(accounts[a], SIOC('creator_of')), RDF('type'), SIOCt('Microblog'))) {
                    var account = accounts[a];
                    break;
                }
            }
            this.Ifollow = kb.whether(kb.sym(mb.getMyURI()), SIOC('follows'), account);
            this.thisIsMe;
            var resourceType = kb.any(s, RDF('type'));
            if (resourceType.uri == SIOCt('Microblog').uri || resourceType.uri == SIOCt('MicroblogPost').uri) {
                this.thisIsMe = (kb.any(s, SIOC('has_creator')).uri == mb.getMyURI());
            } else if (resourceType.uri == SIOC('User').uri) {
                this.thisIsMe = (s.uri == mb.getMyURI());
            } else if (resourceType.uri == FOAF('Person').uri) {
                this.thisIsMe = (s.uri == tabulator.preferences.get('me'));
            } else {
                this.thisIsMe = false;
            }

            this.Tab = new TabManager(doc);
        }

        Pane.prototype.notify = function(messageString) {
            var xmsg = doc.createElement('li');
            xmsg.className = "notify";
            xmsg.innerHTML = messageString;
            doc.getElementById("notify-container").appendChild(xmsg);
            setTimeout(function() {
                doc.getElementById('notify-container').removeChild(xmsg);
                delete xmsg;
            },
            4000);
        };

        Pane.prototype.header = function(s,doc){
            postNotificationContainer = this.postNotificationContainer;
            var that = this;
            lsFollowUser = function() {
                var myUser = kb.sym(mb.getMyURI());
                var Ifollow = that.Ifollow;
                var username = that.creator.name;
                var mbconfirmFollow = function(uri,success, msg) {
                    if (success=== true) {
                        if (!that.Ifollow) {
                            //prevent duplicate entries from being added to kb (because that was happening)
                            if (!kb.whether(followMe.subject, followMe.predicate, followMe.object, followMe.why)) {
                                kb.add(followMe.subject, followMe.predicate, followMe.object, followMe.why);
                            }
                        } else {
                            kb.removeMany(followMe.subject, followMe.predicate, followMe.object, followMe.why);
                        }
                        dump("\n"+ that.Ifollow);
                        that.Ifollow = !that.Ifollow;
                        xfollowButton.disabled = false;
                        dump(that.Ifollow);
                        followButtonLabel = (that.Ifollow) ? "Unfollow ": "Follow ";
                        var doFollow = (that.Ifollow) ? "now follow ": "no longer follow ";
                        xfollowButton.value = followButtonLabel + username;
                        that.notify("You " + doFollow + username + ".");
                    }
                };
                var followMe = new UI.rdf.Statement(myUser, SIOC('follows'), that.creator.sym, myUser);
                xfollowButton.disabled = true;
                xfollowButton.value = "Updating...";
                if (!that.Ifollow) {
                    sparqlUpdater.insert_statement(followMe, mbconfirmFollow);
                } else {
                    sparqlUpdater.delete_statement(followMe, mbconfirmFollow);
                }
            };
            var notify = function(messageString) {
                var xmsg = doc.createElement('li');
                xmsg.className = "notify";
                xmsg.innerHTML = messageString;
                doc.getElementById("notify-container").appendChild(xmsg);
                setTimeout(function() {
                    doc.getElementById('notify-container').removeChild(xmsg);
                    delete xmsg;
                },
                4000);
            };
            var mbCancelNewMB = function(evt) {
                xupdateContainer.removeChild(xupdateContainer.childNodes[xupdateContainer.childNodes.length - 1]);
                xcreateNewMB.disabled = false;
            };
            var lsCreateNewMB = function(evt) {
                //disable the create new microblog button.
                //then prefills the information.
                xcreateNewMB.disabled = true;
                var xcmb = doc.createElement('div');
                var xcmbName = doc.createElement('input');
                if (kb.whether(s, FOAF('name'))) {
                    //handle use of FOAF:NAME
                    xcmbName.value = kb.any(s, FOAF('name'));
                } else {
                    //handle use of family and given name
                    xcmbName.value = (kb.any(s, FOAF('givenname'))) ?
                    kb.any(s, FOAF('givenname')) + " ": "";
                    xcmbName.value += (kb.any(s, FOAF("family_name"))) ?
                    kb.any(s, FOAF('givenname')) : "";
                    xcmbName.value = kb.any(s, FOAF('givenname')) + " " +
                    kb.any(s, FOAF("family_name"));
                }
                var xcmbId = doc.createElement('input');
                xcmbId.value = (kb.any(s, FOAF('nick'))) ? kb.any(s, FOAF('nick')) : "";
                var xcmbAvatar = doc.createElement('input');
                if (kb.whether(s, FOAF('img'))) {
                    // handle use of img
                    xcmbAvatar.value = kb.any(s, FOAF('img')).uri;
                } else {
                    //otherwise try depiction
                    xcmbAvatar.value = (kb.any(s, FOAF('depiction'))) ?
                    kb.any(s, FOAF('depiction')).uri: "";
                }
                var workspace;
                //= kb.any(s,WORKSPACE) //TODO - ADD URI FOR WORKSPACE DEFINITION
                var xcmbWritable = doc.createElement("input");
                xcmbWritable.value = (workspace) ? workspace: "http://dig.csail.mit.edu/2007/wiki/sandbox";
                xcmb.innerHTML = '\
                        <form class ="createNewMB" id="createNewMB">\
                            <p id="xcmbname"><span class="">Name: </span></p>\
                            <p id="xcmbid">Id: </p>\
                            <p id="xcmbavatar">Avatar: </p> \
                            <p id="xcmbwritable">Host my microblog at: </p>\
                            <input type="button" id="mbCancel" value="Cancel" />\
                            <input type="submit" id="mbCreate" value="Create\!" />\
                        </form>\
                        ';
                xupdateContainer.appendChild(xcmb);
                doc.getElementById("xcmbname").appendChild(xcmbName);
                doc.getElementById("xcmbid").appendChild(xcmbId);
                doc.getElementById("xcmbavatar").appendChild(xcmbAvatar);
                doc.getElementById("xcmbwritable").appendChild(xcmbWritable);
                doc.getElementById("mbCancel").addEventListener("click", mbCancelNewMB, false);
                doc.getElementById("createNewMB").addEventListener("submit",function() {
                    mb.generateNewMB(xcmbId.value, xcmbName.value, xcmbAvatar.value, xcmbWritable.value);
                },false);
                xcmbName.focus();
            };
            var mbSubmitPost = function() {
                var postDate = new Date();
                var meta = {
                    recipients: []
                };
                //user has selected a microblog to post to
                if (mb.getMyURI()) {
                    myUser = kb.sym(mb.getMyURI());
                    //submission callback
                    var cbconfirmSubmit = function(uri, success, responseText, d) {
                        if (success === true) {
                            for (var triple in d) {
                                kb.add(d[triple].subject, d[triple].predicate, d[triple].object, d[triple].why);
                            }
                            xupdateSubmit.disabled = false;
                            xupdateStatus.value = "";
                            mbLetterCount();
                            notify("Microblog Updated.");
                            if (that.thisIsMe) {
                                doc.getElementById('postNotificationList').insertBefore(that.generatePost(d[0].subject), doc.getElementById('postNotificationList').childNodes[0]);
                            }
                        } else {
                            notify("There was a problem submitting your post.");
                        }
                    };
                    var words = xupdateStatus.value.split(" ");
                    var mbUpdateWithReplies = function() {
                        xupdateSubmit.disabled = true;
                        xupdateSubmit.value = "Updating...";
                        mb.statusUpdate(xupdateStatus.value, cbconfirmSubmit, xinReplyToContainer.value, meta);
                    };
                    for (var word in words) {
                        if (words[word].match(/\@\w+/)) {
                            var atUser = words[word].replace(/\W/g, "");
                            var recipient = FollowList.selectUser(atUser);
                            if (recipient[0] === true) {
                                meta.recipients.push(recipient[1][0]);
                            } else if (recipient[1].length > 1) {
                                // if  multiple users allow the user to choose
                                var xrecipients = doc.createElement('select');
                                var xrecipientsSubmit = doc.createElement('input');
                                xrecipientsSubmit.type = "button";
                                xrecipientsSubmit.value = "Continue";
                                xrecipientsSubmit.addEventListener("click",
                                function() {
                                    meta.recipients.push(recipient[1][xrecipients.value]);
                                    mbUpdateWithReplies();
                                    xrecipients.parentNode.removeChild(xrecipientsSubmit);
                                    xrecipients.parentNode.removeChild(xrecipients);
                                },
                                false);
                                var recipChoice = function(recip, c) {
                                    var name = kb.any(kb.sym(recip), SIOC('name'));
                                    var choice = doc.createElement('option');
                                    choice.value = c;
                                    choice.innerHTML = name;
                                    return choice;
                                };
                                for (var r in recipient[1]) {
                                    xrecipients.appendChild(recipChoice(recipient[1][r], r));
                                }
                                xupdateContainer.appendChild(xrecipients);
                                xupdateContainer.appendChild(xrecipientsSubmit);
                                return;
                            } else {
                                //no users known or self reference.
                                if (String(kb.any(kb.sym(mb.getMyURI()), SIOC("id"))).toLowerCase() == atUser.toLowerCase()) {
                                    meta.recipients.push(mb.getMyURI());
                                } else {
                                    notify("You do not follow " + atUser + ". Try following " + atUser + " before mentioning them.");
                                    return;
                                }
                            }
                        }
                        /* else if(words[word].match(/\#\w+/)){
                            //hashtag
                        } else if(words[word].match(/\!\w+/)){
                            //usergroup
                        }*/
                    }
                    mbUpdateWithReplies();
                } else {
                    notify("Please set your microblog first.");
                }
            };
            var mbLetterCount = function() {
                xupdateStatusCounter.innerHTML = charCount - xupdateStatus.value.length;
                xupdateStatusCounter.style.color = (charCount - xupdateStatus.value.length < 0) ? "#c33": "";
                if (xupdateStatus.value.length === 0) {
                    xinReplyToContainer.value = "";
                    xupdateSubmit.value = "Send";
                }
            };
            //reply viewer
            var xviewReply = doc.createElement('ul');
                xviewReply.className = "replyView";
                xviewReply.addEventListener("click", function() {
                    xviewReply.className = "replyView";
                },false);
            this.xviewReply = xviewReply;
            var headerContainer = doc.createElement('div');
            headerContainer.className = "header-container";

            //---create status update box---
            var xnotify = doc.createElement('ul');
            xnotify.id = "notify-container";
            xnotify.className = "notify-container";
            this.xnotify = xnotify
            var xupdateContainer = doc.createElement('form');
            xupdateContainer.className = "update-container";
            xupdateContainer.innerHTML = "<h3>What are you up to?</h3>";
            if (mb.getMyURI()) {
                var xinReplyToContainer = doc.createElement('input');
                    xinReplyToContainer.id = "xinReplyToContainer";
                    xinReplyToContainer.type = "hidden";

                var xupdateStatus = doc.createElement('textarea');
                    xupdateStatus.id ="xupdateStatus";

                var xupdateStatusCounter = doc.createElement('span');
                    xupdateStatusCounter.appendChild(doc.createTextNode(charCount));
                    xupdateStatus.cols = 30;
                    xupdateStatus.addEventListener('keyup', mbLetterCount, false);
                    xupdateStatus.addEventListener('focus', mbLetterCount, false);

                var xupdateSubmit = doc.createElement('input');
                    xupdateSubmit.id="xupdateSubmit";
                    xupdateSubmit.type = "submit";
                    xupdateSubmit.value = "Send";

                xupdateContainer.appendChild(xinReplyToContainer);
                xupdateContainer.appendChild(xupdateStatusCounter);
                xupdateContainer.appendChild(xupdateStatus);
                xupdateContainer.appendChild(xupdateSubmit);
                xupdateContainer.addEventListener('submit', mbSubmitPost, false);
            } else {
                var xnewUser = doc.createTextNode("\
                    Hi, it looks like you don't have a microblog,\
                    would you like to create one? ");
                var xcreateNewMB = doc.createElement("input");
                xcreateNewMB.type = "button";
                xcreateNewMB.value = "Create a new Microblog";
                xcreateNewMB.addEventListener("click", lsCreateNewMB, false);
                xupdateContainer.appendChild(xnewUser);
                xupdateContainer.appendChild(xcreateNewMB);
            }

            headerContainer.appendChild(xupdateContainer);

            var subheaderContainer = doc.createElement('div');
            subheaderContainer.className = "subheader-container";

            //user header
            this.creator;
            var creators = kb.each(s, FOAF('holdsAccount'));
            for (var c in creators) {
                if (kb.whether(creators[c], RDF('type'), SIOC('User')) &&
                kb.whether(kb.any(creators[c], SIOC('creator_of')), RDF('type'), SIOCt('Microblog'))) {
                    var creator = creators[c];
                    // var mb = kb.sym(creator.uri.split("#")[0]);
                    //UI.store.fetcher.refresh(mb);
                    break;
                    //TODO add support for more than one microblog in same foaf
                }
            }
            if (creator) {
                this.creator = mb.getUser(creator);
                //---display avatar, if available ---
                if (this.creator.avatar !== "") {
                    var avatar = doc.createElement('img');
                        avatar.src = this.creator.avatar.uri;
                    subheaderContainer.appendChild(avatar);
                }
                //---generate name ---
                var userName = doc.createElement('h1');
                    userName.className = "fn";
                    userName.appendChild(doc.createTextNode(this.creator.name + " (" + this.creator.id + ")"));
                subheaderContainer.appendChild(userName);
                //---display follow button---
                if (!this.thisIsMe && mb.getMyURI()) {
                    var xfollowButton = doc.createElement('input');
                    xfollowButton.setAttribute("type", "button");
                    followButtonLabel = (this.Ifollow) ? "Unfollow ": "Follow ";
                    xfollowButton.value = followButtonLabel + this.creator.name;
                    xfollowButton.addEventListener('click', lsFollowUser, false);
                    subheaderContainer.appendChild(xfollowButton);
                }
                //user header end
                //header tabs
                var xtabsList = this.Tab.getTabView();
                headerContainer.appendChild(subheaderContainer);
                headerContainer.appendChild(xtabsList);
            }
            return headerContainer;
        }
        Pane.prototype.generatePost = function(post, me) {
            /*
            generatePost - Creates and formats microblog posts
                post - symbol of the uri the post in question
        */
            var that=this;
            var viewPost = function(uris) {
                xviewReply = that.xviewReply;
                for (var n in xviewReply.childNodes) {
                    xviewReply.removeChild(xviewReply.childNodes[0]);
                }
                var xcloseContainer = doc.createElement('li');
                xcloseContainer.className = "closeContainer";
                var xcloseButton = doc.createElement('span');
                xcloseButton.innerHTML = "&#215;";
                xcloseButton.className = "closeButton";
                xcloseContainer.appendChild(xcloseButton);
                xviewReply.appendChild(xcloseContainer);
                for (var uri in uris) {
                    xviewReply.appendChild(that.generatePost(kb.sym(uris[uri]), this.thisIsMe, "view"));
                }
                xviewReply.className = "replyView-active";
                that.microblogPane.appendChild(xviewReply);
            };
            //container for post
            var xpost = doc.createElement('li');
                xpost.className = "post";
                xpost.setAttribute("id", String(post.uri).split("#")[1]);
            var Post = mb.getPost(post);
            //username text
            var uname = kb.any(kb.any(post, SIOC('has_creator')), SIOC('id'));
            var uholdsaccount = kb.any(undefined, FOAF('holdsAccount'), kb.any(post, SIOC('has_creator')));
            var xuname = doc.createElement('a');
            xuname.href = uholdsaccount.uri;
            xuname.className = "userLink";
            var xunameText = doc.createTextNode(mb.getUser(Post.creator).id);
            xuname.appendChild(xunameText);
            //user image
            var xuavatar = doc.createElement('img');
                xuavatar.src = mb.getUser(Post.creator).avatar.uri;
                xuavatar.className = "postAvatar";
            //post content
            var xpostContent = doc.createElement('blockquote');
            var postText = Post.message;
            //post date
            var xpostLink = doc.createElement("a");
            xpostLink.className = "postLink";
            xpostLink.addEventListener("click",
            function() {
                viewPost([post.uri]);
            },
            false);
            xpostLink.id = "post_" + String(post.uri).split("#")[1];
            xpostLink.setAttribute("content", post.uri);
            xpostLink.setAttribute("property", "permalink");
            postLink = doc.createTextNode((Post.date) ? Post.date: "post date unknown");
            xpostLink.appendChild(postLink);


            //LINK META DATA (MENTIONS, HASHTAGS, GROUPS)
            var mentions = kb.each(post, SIOC("topic"));
            tags = new Object();

            for (var mention in mentions) {
                sf.lookUpThing(mentions[mention]);
                id = kb.any(mentions[mention], SIOC('id'));
                tags["@" + id] = mentions[mention];
            }
            var postTags = postText.match(/(\@|\#|\!)\w+/g);
            var postFunction = function() {
                p = postTags.pop();
                return (tags[p]) ? kb.any(undefined, FOAF('holdsAccount'), tags[p]).uri: p;
            };
            for (var t in tags) {
                var person = t.replace(/\@/, "");
                var replacePerson = RegExp("(\@|\!|\#)(" + person + ")");
                postText = postText.replace(replacePerson, "$1<a href=\"" + postFunction() + "\">$2</a>");
            }
            xpostContent.innerHTML = postText;

            //in reply to logic
            // This has the potential to support a post that replies to many messages.
            var inReplyTo = kb.each(post, SIOC("reply_of"));
            var xreplyTo = doc.createElement("span");
            for (var reply in inReplyTo) {
                var theReply ;
                theReply = String(inReplyTo[reply]).replace(/\<|\>/g, "");
                var genReplyTo = function() {
                    var reply = doc.createElement('a');
                    reply.innerHTML = ", <b>in reply to</b>";
                    reply.addEventListener("click",
                    function() {
                        viewPost([post.uri, theReply]);
                        return false;
                    },
                    false);
                    return reply;
                };
                xreplyTo.appendChild(genReplyTo());

            }

            //END LINK META DATA
            //add the reply to and delete buttons to the interface
            var mbReplyTo = function() {
                var id = mb.getUser(Post.creator).id;
                var xupdateStatus = doc.getElementById("xupdateStatus");
                var xinReplyToContainer = doc.getElementById("xinReplyToContainer");
                var xupdateSubmit = doc.getElementById("xupdateSubmit");
                xupdateStatus.value = "@" + id + " ";
                xupdateStatus.focus();
                xinReplyToContainer.value = post.uri;
                xupdateSubmit.value = "Reply";
            };
            var mbDeletePost = function(evt) {
                var lsconfirmNo = function() {
                    doc.getElementById('notify-container').removeChild(xconfirmDeletionDialog);
                    evt.target.disabled = false;
                };
                var lsconfirmYes = function() {
                    reallyDelete();
                    doc.getElementById('notify-container').removeChild(xconfirmDeletionDialog);
                };
                evt.target.disabled = true;
                var xconfirmDeletionDialog = doc.createElement('li');
                xconfirmDeletionDialog.className = "notify conf";
                xconfirmDeletionDialog.innerHTML += "<p>Are you sure you want to delete this post?</p>";
                xconfirmDeletionDialog.addEventListener("keyup",
                function(evt) {
                    if (evt.keyCode == 27) {
                        lsconfirmNo();
                    }
                },
                false);
                var confirmyes = doc.createElement("input");
                confirmyes.type = "button";
                confirmyes.className = "confirm";
                confirmyes.value = "Delete";
                confirmyes.addEventListener("click", lsconfirmYes, false);
                var confirmno = doc.createElement("input");
                confirmno.type = "button";
                confirmno.className = "confirm";
                confirmno.value = "Cancel";
                confirmno.addEventListener("click", lsconfirmNo, false);
                xconfirmDeletionDialog.appendChild(confirmno);
                xconfirmDeletionDialog.appendChild(confirmyes);
                doc.getElementById("notify-container").appendChild(xconfirmDeletionDialog);
                confirmno.focus();

                var reallyDelete = function() {
                    //callback after deletion
                    var mbconfirmDeletePost = function(a, success) {
                        if (success) {
                            that.notify("Post deleted.");
                            //update the ui to reflect model changes.
                            var deleteThisNode = evt.target.parentNode;
                            deleteThisNode.parentNode.removeChild(deleteThisNode);
                            kb.removeMany(deleteMe);
                        } else {
                            that.notify("Oops, there was a problem, please try again");
                            evt.target.disabled = true;
                        }
                    };
                    //delete references to post
                    var deleteContainerOf = function(a, success) {
                        if (success) {
                            var deleteContainer = kb.statementsMatching(
                            undefined, SIOC('container_of'), kb.sym(doc.getElementById(
                            "post_" + evt.target.parentNode.id).getAttribute("content")));
                            sparqlUpdater.batch_delete_statement(deleteContainer, mbconfirmDeletePost);
                        } else {
                            that.notify("Oops, there was a problem, please try again");
                            evt.target.disabled = false;
                        }
                    };
                    //delete attributes of post
                    evt.target.disabled = true;
                    deleteMe = kb.statementsMatching(kb.sym(doc.getElementById(
                    "post_" + evt.target.parentNode.id).getAttribute("content")));
                    sparqlUpdater.batch_delete_statement(deleteMe, deleteContainerOf);
                };
            };
            if (mb.getMyURI()) {
                // If the microblog in question does not belong to the user,
                // display the delete post and reply to post buttons.
                var themaker = kb.any(post, SIOC('has_creator'));
                if (mb.getMyURI() != themaker.uri) {
                    var xreplyButton = doc.createElement('input');
                    xreplyButton.type = "button";
                    xreplyButton.value = "reply";
                    xreplyButton.className = "reply";
                    xreplyButton.addEventListener('click', mbReplyTo, false);
                } else {
                    var xdeleteButton = doc.createElement('input');
                    xdeleteButton.type = 'button';
                    xdeleteButton.value = "Delete";
                    xdeleteButton.className = "reply";
                    xdeleteButton.addEventListener('click', mbDeletePost, false);
                }
            }

            var mbFavorite = function(evt) {
                var nid = evt.target.parentNode.id;
                var favpost = doc.getElementById("post_" + nid).getAttribute("content");
                xfavorite.className += " ing";
                var cbFavorite = function(a, success, c, d) {
                    if (success) {
                        xfavorite.className = (xfavorite.className.split(" ")[1] == "ed") ?
                        "favorit": "favorit ed";
                    }
                };
                if (!Favorites.favorited(favpost)) {
                    Favorites.add(favpost, cbFavorite);
                } else {
                    Favorites.remove(favpost, cbFavorite);
                }
            };
            var xfavorite = doc.createElement('a');
            xfavorite.innerHTML = "&#9733;";
            xfavorite.addEventListener("click", mbFavorite, false);
            if (Favorites.favorited(post.uri)) {
                xfavorite.className = "favorit ed";

            } else {
                xfavorite.className = "favorit";
            }
            //build
            xpost.appendChild(xuavatar);
            xpost.appendChild(xpostContent);
            if (mb.getMyURI()) {
                xpost.appendChild(xfavorite);
                if (mb.getMyURI() != themaker.uri) {
                    xpost.appendChild(xreplyButton);
                }
                else {
                    xpost.appendChild(xdeleteButton);
                }
            }
            xpost.appendChild(xuname);
            xpost.appendChild(xpostLink);
            if (inReplyTo !== "") {
                xpost.appendChild(xreplyTo);
            }
            return xpost;
        };
        Pane.prototype.generatePostList = function(gmb_posts) {
            /*
            generatePostList - Generate the posts and
            display their results on the interface.
            */
            var post_list = doc.createElement('ul');
            var postlist = new Object();
            var datelist = new Array();
            for (var post in gmb_posts) {
                var postDate = kb.any(gmb_posts[post], terms('created'));
                if (postDate) {
                    datelist.push(postDate);
                    postlist[postDate] = this.generatePost(gmb_posts[post], this.thisIsMe);
                }
            }
            datelist.sort().reverse();
            for (var d in datelist) {
                post_list.appendChild(postlist[datelist[d]]);
            }
            return post_list;
        };
        Pane.prototype.followsView = function(){
            var getFollowed = function(user) {
                var userid = kb.any(user, SIOC('id'));
                var follow = doc.createElement('li');
                follow.className = "follow";
                userid = (userid) ? userid: user.uri;
                var fol = kb.any(undefined, FOAF('holdsAccount'), user);
                fol = (fol) ? fol.uri: user.uri;
                follow.innerHTML = "<a href=\"" + fol + "\">" +
                userid + "</a>";
                return follow;
            };
            var xfollows = doc.createElement('div');
                xfollows.id =  "xfollows";
            xfollows.className = "followlist-container view-container";
            if (this.creator && kb.whether(this.creator.sym, SIOC('follows'))) {
                var creatorFollows = kb.each(this.creator.sym, SIOC('follows'));
                var xfollowsList = doc.createElement('ul');
                for (var thisPerson in creatorFollows) {
                    xfollowsList.appendChild(getFollowed(creatorFollows[thisPerson]));
                }
                xfollows.appendChild(xfollowsList);
            }
            this.Tab.create("tab-follows","Follows",xfollows,false);
            return xfollows;
        }
        Pane.prototype.streamView = function(s,doc){
            var postContainer = doc.createElement('div');
            postContainer.id = "postContainer";
            postContainer.className = "post-container view-container active";
            var mb_posts = [];
            if (kb.whether(s, FOAF('name')) && kb.whether(s, FOAF('holdsAccount'))) {
                sf.lookUpThing(kb.any(s, FOAF('holdsAccount')));
                var follows = kb.each(kb.any(s, FOAF('holdsAccount')), SIOC('follows'));
                for (var f in follows) {
                    sf.lookUpThing(follows[f]);
                    //look up people user follows
                    var smicroblogs = kb.each(follows[f], SIOC('creator_of'));
                    //get the follows microblogs
                    for (var smb in smicroblogs) {
                        sf.lookUpThing(smicroblogs[smb]);
                        if (kb.whether(smicroblogs[smb], SIOC('topic'), follows[f])) {
                            continue;
                        } else {
                            mb_posts = mb_posts.concat(kb.each(smicroblogs[smb], SIOC('container_of')));
                        }
                    }
                }
            }
            if (mb_posts.length > 0) {
                var postList = this.generatePostList(mb_posts);
                //generate stream
                postList.id = "postList";
                postList.className = "postList";
                postContainer.appendChild(postList);
            }
            this.Tab.create("tab-stream","By Follows",postContainer,true);
            return postContainer;
        }
        Pane.prototype.notificationsView = function(s,doc){
            var postNotificationContainer = doc.createElement('div');
                postNotificationContainer.id="postNotificationContainer";
                postNotificationContainer.className = "notification-container view-container";
            var postMentionContainer = doc.createElement('div');
                postMentionContainer.id = "postMentionContainer";
                postMentionContainer.className = "mention-container view-container";
            var mbn_posts = [];
            var mbm_posts = [];
            //get mbs that I am the creator of.
            var theUser = kb.any(s, FOAF('holdsAccount'));
            var user = kb.any(theUser, SIOC('id'));
            var microblogs = kb.each(theUser, SIOC('creator_of'));
            for (var mbm in microblogs) {
                sf.lookUpThing(microblogs[mbm]);
                if (kb.whether(microblogs[mbm], SIOC('topic'), theUser)) {
                    mbm_posts = mbm_posts.concat(kb.each(microblogs[mbm], SIOC('container_of')));
                } else {
                    if (kb.whether(microblogs[mbm], RDF('type'), SIOCt('Microblog'))) {
                        mbn_posts = mbn_posts.concat(kb.each(microblogs[mbm], SIOC('container_of')));
                    }
                }
            }
            var postNotificationList = this.generatePostList(mbn_posts);
            postNotificationList.id = "postNotificationList";
            postNotificationList.className = "postList";
            postNotificationContainer.appendChild(postNotificationList);

            var postMentionList = this.generatePostList(mbm_posts);
            postMentionList.id = "postMentionList";
            postMentionList.className = "postList";
            postMentionContainer.appendChild(postMentionList);
            this.postMentionContainer = postMentionContainer
            this.postNotificationContainer =postNotificationContainer
            this.Tab.create("tab-by-user","By "+user,postNotificationContainer,false);
            this.Tab.create("tab-at-user","@"+user,postMentionContainer,false);
        };
        Pane.prototype.build = function(){
            var microblogPane = this.microblogPane;
            this.headerContainer = this.header(s,doc);
            this.postContainer = this.streamView(s,doc)
            this.notificationsView(s,doc)
            this.xfollows = this.followsView()
                microblogPane.className = "ppane";
                microblogPane.appendChild(this.xviewReply);
                microblogPane.appendChild(this.xnotify);
                microblogPane.appendChild(this.headerContainer);
                if (this.xfollows != undefined) {microblogPane.appendChild(this.xfollows);}
                microblogPane.appendChild(this.postContainer);
                microblogPane.appendChild(this.postNotificationContainer);
                microblogPane.appendChild(this.postMentionContainer);
        };

        var microblogpane  = doc.createElement("div");
//      var getusersfollows = function(uri){
//          var follows = new Object();
//          var followsa = {follows:0, matches:0};
//          var accounts = kb.each(s, FOAF("holdsAccount"));
//          //get all of the accounts that a person holds
//          for (var acct in accounts){
//              var account  = accounts[acct].uri;
//              var act = kb.each(kb.sym(account),SIOC("follows"));
//              for (var a in act){
//                  var thisuri = act[a].uri.split("#")[0];
//                  if (!follows[thisuri]){followsa.follows+=1;}
//                  follows[thisuri] =true;
//              }
//          }
//
//          var buildPaneUI = function(uri){
//              followsa.matches = (follows[uri]) ? followsa.matches+1: followsa.matches;
//              dump(follows.toSource());
//              if(followsa.follows == followsa.matches ){
                    var ppane = new Pane(s,doc,microblogpane)
                    ppane.build();
//                  return false;
//              }
//              else{
//                  return true;
//              }
//          }
//          sf.addCallback('done',buildPaneUI);
//          sf.addCallback('fail',buildPaneUI);
//          //fetch each of the followers
//          for (var f in follows){
//              sf.refresh(kb.sym(f));
//          }
//      }(s);
        return microblogpane;
    }
},
true);
