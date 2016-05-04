/*
   Second generation social network functionality for foaf
*/

tabulator.panes.register(tabulator.panes.newsocialpane= {

    icon:tabulator.Icon.src.icon_social,
    name: 'social2',
    label: function(subject){
        if (UI.store.whether(
            subject, UI.ns.rdf('type'),
            UI.ns.foaf('Person'))){
            return 'social2';
        } else {
            return null;
        }
    },
    render: function(s, doc){
      //custom event handler
      function CustomEvents(){
        this._events ={};
      }
      CustomEvents.prototype.addEventListener = function(en,evt){
        e= this._events;
        e[en] = e[en]||[];
        e[en].push(evt);
      }
      CustomEvents.prototype.raiseEvent = function(en, args, context){
        e = this._events;
        //throw an exception if there is no event en registered
        if (!e[en]){ throw("No event \""+en+"\" registered.")}

        for (var i = 0; i < e[en].length; i++){
          e[en][i].apply(context,args)
        }
      }
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

      //NAMESPACES
      var foaf = UI.rdf.Namespace("http://xmlns.com/foaf/0.1/");
      var cloud = UI.rdf.Namespace("http://www.w3.org/ns/cloud#");
      var sioc = UI.rdf.Namespace("http://rdfs.org/sioc/ns#");
      var sioct = UI.rdf.Namespace('http://rdfs.org/sioc/types#');
      var rdf= UI.ns.rdf;
      var dc = UI.rdf.Namespace('http://purl.org/dc/elements/1.1/');
      var dcterms = UI.rdf.Namespace('http://purl.org/dc/terms/');
      var rss = UI.rdf.Namespace("http://purl.org/rss/1.0/");
      var kb = UI.store;
      var sf = UI.store.fetcher;
      var sparqlUpdater = new UI.rdf.UpdateManager(kb);
      var Events = new CustomEvents();


      sf.lookUpThing(kb.sym('http://foaf.qdos.com/reverse/?path=' + encodeURIComponent(s.uri)));
      var workspace =kb.statementsMatching(null,cloud('contains'),s);
      workspace = (workspace.length > 0 )? workspace[0].subject.uri:false;
      var socialpane = doc.createElement('div');
      socialpane.id = "social";


      //GET RELATIONSHIP DATA
      var fin = kb.statementsMatching(null,foaf('knows'), kb.canon(s));
      var fout = kb.each(kb.canon(s), foaf('knows'));
      var acq ={
        "friends":[],
        "unconfirmed":[],
        "requests":[]
      };
      var checked = {};
      //Find friend matches
      for (var fo in Iterator(fout)){
        for(var i=0; i < fin.length; i++){
          if (friend = fin[i].subject.sameTerm(fo[1])){ break;}
        }
        if(friend){
          acq['friends'].push(fin[i].subject);
          checked[i] = true;
        }
        else{ acq['unconfirmed'].push(fo[1]); }
      }
      for (var fi in Iterator(fin)){
        if (!(fi[0] in checked)){
          for (var i = 0; i < fout.length; i++){
            if (friend = fout[i].sameTerm(fi)) break;
          }
          if(friend) acq['friends'].push(fi[1].subject);
          else acq['requests'].push(fi[1].subject);
        }
      }
      //GET THE CURRENT USER'S PROFILE
      function getProfileData(person){
        var profile = {};
        var cperson = kb.canon(kb.sym(person));
        var person = kb.sym(person);
        var fn =  kb.any(person, foaf('givenname'));
        var ln =  kb.any(person, foaf('family_name'));
        profile['name'] =(kb.whether(cperson, foaf('name'))) ?  kb.any(person, foaf('name')): fn+" "+ln;
        if (!fn && !ln) profile['name'] = (kb.whether(cperson, foaf('nick')))? kb.any(cperson,foaf('nick')): "No name specified";
        profile['phone'] = kb.each(cperson, foaf('phone'));
        profile['email'] = kb.each(cperson, foaf('mbox'));
        profile['websites'] = kb.each(cperson, foaf('homepage')).concat(kb.each(cperson,foaf('weblog')));
        profile['picture'] =  kb.any(person, foaf('depiction')) || kb.any(cperson, foaf('img')) ||  false;
        profile['nick'] = kb.each(cperson, foaf('nick'));
        profile['aim'] = kb.each(cperson,foaf('aimChatID'));
        profile['skype'] = kb.each(cperson,foaf('skypeID'));
        profile['msn'] = kb.each(cperson,foaf('msnChatID'));
        profile['jabber'] = kb.each(cperson,foaf('jabberID'));
        profile['icq'] = kb.each(cperson,foaf('icqChatID'));
        profile['yahoo'] = kb.each(cperson,foaf('yahooChatID'));
        profile['status']= new Array();
        profile['images'] = kb.each(cperson, foaf('img'));//.concat(kb.each(cperson, foaf('depiction')));
        var posts = Iterator(kb.statementsMatching(null,rdf('type'),sioct('MicroblogPost')));
        for(var post in posts){ profile['status'].push(post[1].subject); }
        //identica hack
        var posts = Iterator( kb.statementsMatching(null,rdf('type'),'http://rdfs.org/sioc/types#MicroblogPost'));
        for(var post in posts){
          if(kb.whether(post[1].subject, foaf('maker'),person)) profile['status'].push(post[1].subject); }
        profile['plan'] = kb.each(cperson,foaf('plan'));

        return profile;
      }
      //generate new elements
      function newElement(tag, p){
        x=doc.createElement(tag);
        x['child']= function(tag){return newElement(tag, x)};
        if(!p){ socialpane.appendChild(x);}
        else{ p.appendChild(x);}
        return x;
      }
      //display info from IM accounts
      function displayAcct(proto, profile , p ){
        if(profile[proto].length){
          newElement('h4',p).innerHTML = proto;
          accts = newElement('ul',p);
          accts.className = "contactlist";
          for (i=0; i< profile[proto].length; i++){
            newElement('li', accts).innerHTML = profile[proto][i];
          }
        }
      }


      //DISPLAY MICROBLOG POSTS FROM IDENTICA/PERSONAL MICROBLOG
      function getStatusUpdates(post, date){
        var content = kb.any(post,rss('modules/content/encoded')) || kb.any(post,sioc('content'));
        var theDate = kb.statementsMatching(post,dc('date')) ;
        var postDate  =(theDate.length > 0 )? theDate[0].object : (kb.any(post, dcterms('created')) || "permalink");
        return "<p>"+content+"</p><p><a href='"+post.uri +"'> "+String(postDate)+"</a></p>";
      }
      function editable(uri){
        return tabulator.outline.sparql.prototype.editable(uri,UI.store);
      }
      //LISTENERS-----------------------------------------------
      function updateFriends(that) //TODO  update users friends, send friend change event
      {
        var batch =[

        ]
        sparqlUpdater.insert_statement(
          [new UI.rdf.Statement(I, foaf('knows'),s, I)],
          function(a,b,c) {
            sparqlUpdater.insert_statement(
              [new UI.rdf.Statement(I, foaf('knows'),s, s)],
              function(a,b,c){
                Events.raiseEvent("evtStatusUpdate",[acc,statusMsg,person],this);
                Events.raiseEvent("evtUpdateFriendState",[], that);
                callback(a, b, c, batch);
            });
        });
      }
      function changeStatusList() //TODO update the status list in the ui
      {}
      var changeFriendList = function() //TODO update user's friends in the ui
      {}
      function updatePhotos(photo, comment, writableSpace){
        var photo = photo.replace(/^\s+|\s+$/g, '');
        batch = [
          new UI.rdf.Statement(I, foaf('made'), kb.sym(photo), I),
          new UI.rdf.Statement(kb.sym(photo), dc('description'),comment, I),
        ]
        sparqlUpdater.insert_statement(batch, function(a,b,c){
            //kb.add
            updatePhotoPane()
        });
      } //TODO update the photos
      var changeFriendButton= function()//TODO update the text of the friend button
      {
        var I =kb.sym( tabulator.preferences.get('me'));
        var myProfile = kb.sameThings(I,s);

        if (kb.whether(I, foaf('knows'),s)){
          ui.addFriend.value = "Unlink "+(profile['nick'][0]||profile.name);
        }else{
          ui.addFriend.value = "I know "+(profile['nick'][0]||profile.name);
        }
        if(myProfile){ ui.addFriend.className = "hidden"}
        else{ui.addFriend.className=""}

      }
      function activateView(view, evt){ // click on a tab to show a view
        var v= doc.getElementById(view);
        var tab = evt.target.parentNode.getElementsByTagName('li');
        var views =v.parentNode.getElementsByTagName("div");
        for (var i =0; i < tab.length; i++){
          tab[i].className = tab[i].className.replace(/active/,'');
        }
        for (var i =0; i < views.length; i++){
          views[i].className = views[i].className.replace(/active/,'');
        }
        evt.target.className = "active";
        v.className = "active";
      }
      function showNewAccForm(){ // allow user to generate new webid
        var req =UI.rdf.Util.XMLHTTPFactory();
        //req.open("POST","https://localhost/config/register.php",false);
        var nac =  doc.getElementById('newaccountform');
        //req.send(null);
        //if(req.status == 200)
       //   nac.innerHTML=req.responseText;
        nac.className = (nac.className =="")? "active":"";
      }
      function statusUpdate(workspace, statusMsg, person, su, callback){ //post a new status update to the server
        var date = String(new Date().getISOdate())
        var micro =  workspace+"/status";
        var newPost =kb.sym( micro+"#"+date.replace(/:/g,''));
        var batch = [
          new UI.rdf.Statement(newPost, rdf('type'), sioct('MicroblogPost'),kb.sym(micro)),
          new UI.rdf.Statement(newPost, sioc('content'), statusMsg,kb.sym(micro)),
          new UI.rdf.Statement(newPost, dc('date'), date,kb.sym(micro)),
          new UI.rdf.Statement(kb.sym(micro), sioc('container_of'), newPost,kb.sym(micro)),
          new UI.rdf.Statement(newPost,foaf('maker'),person,kb.sym(micro))
          ];
        su.insert_statement(batch,
            function(a, b, c) {
              Events.raiseEvent("evtStatusUpdate",[acc,statusMsg,person],this);
              callback(a, b, c, batch);
            });
      }
      function requestWebID(target){
      }
      function changeMyProfile(){
        return [(tabulator.preferences.get('me') == p), tabulator.preferences.get('me')];
      }

      Events.addEventListener("evtUpdateFriendList", changeFriendList); //update the friends list
      Events.addEventListener("evtUpdateFriendState",changeFriendButton); //update the state of the add friend button
      //END LISTENERS-----------------------------------------

      var p=s.uri;
      var I = kb.sym(tabulator.preferences.get('me'));
      var myProfile = kb.sameThings(I,s);
      var profile = getProfileData(p);
      var ui={};
      sf.addCallback('done',function(){Events.raiseEvent("evtUpdateFriendState",[],this);
          tabulator.panes.newsocialpane.render(s,doc);
          })
      if (!(kb.whether(I, rdf('type'),foaf('Person')))){
          sf.lookUpThing(I);
      }
      ui.newacc = newElement('input');
        ui.newacc.type='button';
        ui.newacc.value= 'Create a new WebID';
        ui.newacc.addEventListener("click", function(evt){showNewAccForm()}, false);
        ui.newacc.id= 'new_account_button';
      ui.newaccForm = newElement('form');
        ui.newaccForm.action= "#";
        ui.newaccForm.id = "newaccountform";
        ui.newaccForm.method ="POST";
        ui.newaccForm.addEventListener("submit", function(evt){showNewAccForm()}, false);
        ui.acc= newElement('dl',ui.newaccForm);
        newElement('dt',ui.acc).innerHTML="Nickname/Username:";
        ui.accusername = newElement('dd', ui.acc).child('input');
          ui.accusername.name="username";
        newElement('dt',ui.acc).innerHTML="WebID Provider";
        ui.accprovider = newElement('dd',ui.acc).child('input');
          ui.accprovider.value ="http://";
        ui.newacchelp = newElement('p',ui.newaccForm);
        ui.newacchelp.id="helptext"
        ui.newacchelp.innerHTML = "\
                                   A Web ID is a URL for you. It allows you to set up a public\
                                   profile, with friends, pictures and all kinds of things.\
                                   It works like having an account on a social networking site,\
                                   but it isn't restricted to just that site. It is very open\
                                   because the information can connect to other people, organizations\
                                   and projects and so on, without everyon having to join the same\
                                   social networking site. All you need is some place on the web\
                                   where you can save a file to."

      ui.keygen= newElement ("p", ui.acc);
        ui.keygen.innerHTML = "<keygen keytype='RSA'id='keygen' name='keygen' challenge='antisocial' />";
      ui.makenewacc= newElement('input',ui.acc);
      ui.makenewacc.type='submit';
      ui.newaccForm.addEventListener("change",function(){
          ui.newaccForm.action=ui.accprovider.value;
//          dump(ui.accprovider.value)
//        var req =UI.rdf.Util.XMLHTTPFactory();
//        req.open("POST",ui.accprovider.value,false);
//        req.send({username:ui.accusername, keygen:keygen.getElementById('keygen').value});
//        return false;
        },false);
      ui.makenewacc.value='Create my WebID';


      newElement('h1').innerHTML = profile.name;

      //CONTACT INFORMATION BOX ---------------------------------------
      ui.contact = newElement('div');
      ui.contact.id ="contact";
      if (profile.picture){
      ui.profileimg = newElement('img',ui.contact);
        ui.profileimg.src = profile.picture.uri;
        ui.profileimg.id = "profile_img";
      }

      ui.meform = newElement('form',ui.contact);
        ui.me = newElement('input',ui.meform);
        newElement('span',ui.meform).innerHTML ="This is me."
        ui.me.type='checkbox';
        ui.me.checked = myProfile;
        ui.me.addEventListener('click', function(evt){
            if (evt.target.checked){
              if (!kb.whether(s,foaf("weblog"),kb.sym(workspace+"/status"))){
                sparqlUpdater.insert_statement([ new UI.rdf.Statement(s, foaf('weblog'), kb.sym(workspace+"/status"), s)], function(){});
              }
              tabulator.preferences.set('me',s.uri);
            }
            else {
              tabulator.preferences.set('me','');
            }
            this.I = (evt.target.checked)? s.uri: '';
            this.myProfile = ( I == s.uri);
            Events.raiseEvent("evtUpdateFriendState",[],this);
        },false);

      //display if the profile is editable
      //check for documents whose primarytopic is the person
      // then check if those are personalprofiledocuments.
      ui.editable = newElement('p',ui.contact);
      var aboutme = kb.each(null, foaf('primaryTopic'), I);
      var editableProfile = false;
      /*
      for (var docAboutMe in Iterator(aboutme)) {
        dump (docAboutMe);
        dump(kb.statementsMatching(docAboutMe))
        if( kb.whether( docAboutMe, rdf('type'), foaf('PersonalProfileDocument')) && editable(docAboutMe.uri)){
            editableProfile = true;
            break;
          }
      }*/
      ui.editable.innerHTML = editableProfile ? "This profile is not writable":"";

      ui.plan = newElement('div',ui.contact);
        ui.plan.id= "plan";
        ui.plan.className = (myProfile)? 'editable' : '';
      newElement('p', ui.plan).innerHTML = profile.plan;

      newElement('h3', ui.contact).innerHTML = "Contact Information";
      if (profile.websites){
        newElement('h4',ui.contact).innerHTML = "Websites";
        ui.sites= newElement('ul', ui.contact);
        sites={};
        for (var site in Iterator( profile['websites'])){
          site=site[1];
          si = site.uri.replace(/\/$/,'')
          if (!(si in sites)){
            ui.site = newElement('li', ui.sites).child('a');
            ui.site.innerHTML = UI.utils.label( site);
            ui.site.href = site.uri;
            sites[si] = true;
          }
        }
      }

      newElement('h4',ui.contact).innerHTML = "Nickname";
      ui.nicks = newElement('ul',ui.contact);
      var nick ={}
      for (i=0; i< profile['nick'].length; i++){
        if (!(profile.nick[i] in nick)){
          newElement('li',ui.nicks).innerHTML = profile['nick'][i];
          nick[profile.nick[i]] = true;
        }
      }
      if(profile.phone){
        newElement('h4',ui.contact).innerHTML = "Phone";
        ui.phone = newElement('ul',ui.contact);
        var phone = {}
        for (i=0; i< profile['phone'].length; i++){
          if (!(profile.phone[i] in phone)){
            ui.phonenumber = newElement('li',ui.phone).child('a');
            ui.phonenumber.innerHTML = profile['phone'][i].uri.replace(/tel:\+?/,'');
            ui.phonenumber.href = profile['phone'][i].uri;
            phone[profile.phone[i]]=true;
          }
        }
      }
      if (profile.email){
        newElement('h4',ui.contact).innerHTML = "Email";
        ui.email = newElement('ul', ui.contact);
        for (var email in Iterator( profile['email'])){
          email=email[1];
          ui.mbox = newElement('li', ui.email).child('a');
          ui.mbox.innerHTML = (email.uri) ? email.uri.replace("mailto:","") : email;
          ui.mbox.href =(email.uri) ? email.uri: "mailto:"+email;
        }
      }

      displayAcct('aim', profile , ui.contact );
      displayAcct('jabber', profile , ui.contact );
      displayAcct('skype', profile , ui.contact );
      displayAcct('yahoo', profile , ui.contact );
      displayAcct('icq', profile , ui.contact );
      displayAcct('msn', profile , ui.contact );
      //END CONTACT INFORMATION BOX -----------------------------------

      //RIGHT PANEL
      ui.rp = newElement('div');
      ui.rp.id = "rightpanel";
      //add friends
      ui.addFriend = newElement('input', ui.rp);
        ui.addFriend.type="button";
        ui.addFriend.id='addfriend';
        ui.addFriend.addEventListener("click",function(evt){updateFriends(this)}, false);
        Events.raiseEvent("evtUpdateFriendState",[],this); //call it to put the interface in the proper initial state


        //tabs
        ui.views = newElement('ol',ui.rp);
        ui.views.id="viewtabs";
        ui.statusView = newElement('li', ui.views);
          ui.statusView.innerHTML = "Status";
          ui.statusView.className = "active";
          ui.statusView.addEventListener("click", function(evt){activateView("status",evt);},false);
        ui.photoView  = newElement('li', ui.views);
          ui.photoView.innerHTML = "Photos";
          ui.photoView.addEventListener("click", function(evt){activateView("photos",evt);},false);
        ui.friendView = newElement('li', ui.views);
          ui.friendView.innerHTML = "Friends";
          ui.friendView.addEventListener("click", function(evt){activateView("friends",evt);},false);
        if (myProfile){
          ui.editProfile = newElement('li', ui.views);
            ui.editProfile.innerHTML = "Edit Profile";
            ui.editProfile.addEventListener('click', function(evt){activateView("editprofile",evt);},false);
        }

      //STATUSES
      ui.statusbox = newElement('div', ui.rp);
        ui.statusbox.id = "status";
        ui.statusbox.className = "active";
      ui.postbox = newElement('form', ui.statusbox);
        ui.postbox.id = "postbox";
      newElement('p', ui.postbox).innerHTML = (myProfile)?"What's up?": "Message "+(profile['nick'][0]||profile.name)+":";
      ui.posttext =  newElement('textarea',ui.postbox);
        ui.posttext.id = "status_text";
      ui.post = newElement('input',ui.postbox);
          ui.post.type = "submit";
          ui.post.value = "Send";
          ui.postbox.addEventListener("submit",function(){
              //perform a status update
              statusUpdate(workspace, doc.getElementById("status_text").value,I,sparqlUpdater);
              },false)
          ui.post.id = "post_button";
      ui.statuses = newElement('ol',ui.statusbox);
      for (var status in Iterator(profile['status'])){
        newElement('li', ui.statuses).innerHTML =getStatusUpdates(status[1],new Date);
      }

      //PHOTOS
      ui.photobox = newElement('div', ui.rp); //containers for the photos.
        ui.photobox.id ='photos';

        if (myProfile){
          //-- add photo ui --
          ui.addnewphoto = newElement('form',ui.photobox);
          ui.addnewphoto.id = "addnewphoto";
          ui.addnewphoto.addEventListener("submit", function(evt){
              updatePhotos(ui.addphotouri.value, ui.photocomment, I);
              return false;
          }, false); //TODO post photo
          newElement('p' , ui.addnewphoto).innerHTML ="Photo URL: ";
          ui.addphotouri = newElement('input', ui.addnewphoto); //input box for the photo uri
          ui.addphotouri.type= 'text';
          ui.submitphoto = newElement('input', ui.addnewphoto); //add the photo
          ui.submitphoto.type ='submit';
          ui.submitphoto.value = "Post";
          newElement('p', ui.addnewphoto).innerHTML = "Comment:";
          ui.photocomment = newElement('textarea', ui.addnewphoto);
        }


        // photoStore holds the images that are to be displayed in the photo view
        // on the interface.
        var photoStore ={}
        for (var img in Iterator(profile['images'])){
            img = img[1];
            photostore ={}
            if (!(img.uri in photostore)){
              ui.photo = newElement('img',ui.photobox);
              ui.photo.src = img.uri;
              photostore[img.uri] = true;
            }
        }


      //ACCQUAINTANCES
      ui.knowsbox = newElement('div',ui.rp);
      ui.knowsbox.id = "friends";
      newElement('h3',ui.knowsbox).innerHTML="Friends";
      ui.knows = newElement('ul', ui.knowsbox);
        ui.knows.id="knows_list";
      ui.knows.friend = new Array();
      for (var friend in Iterator(acq.friends)){
        ui.knows.friend=newElement('li',ui.knows).child('a');
        ui.knows.friend.innerHTML = UI.utils.label(friend[1]);
        ui.knows.friend.href= friend[1].uri;
      }
      newElement('h3',ui.knowsbox).innerHTML="Knows";
      ui.unconf = newElement('ul', ui.knowsbox);
        ui.unconf.id="unconf_list";
      ui.unconf.friend = new Array();
      for (var unconfirmed in Iterator(acq.unconfirmed)){
        ui.unconf.friend=newElement('li',ui.unconf).child('a');
        ui.unconf.friend.innerHTML = UI.utils.label(unconfirmed[1]);
        ui.unconf.friend.href= unconfirmed[1].uri;
      }
      newElement('h3',ui.knowsbox).innerHTML="Friend Requests";
      ui.knowsof = newElement('ul', ui.knowsbox);
        ui.knowsof.id="knowsof_list";
      ui.knowsof.friend = new Array();
      for (var request in Iterator(acq.requests)){
        ui.knowsof.friend=newElement('li',ui.knowsof).child('a');
        ui.knowsof.friend.innerHTML = UI.utils.label(request[1]);
        ui.knowsof.friend.href= request[1].uri;
      }
      //EDIT PROFILE
      ui.editprofilebox = newElement('div',ui.rp);
      ui.editprofilebox.id = "editprofile";
      ui.editprofilebox.innerHTML = '<form action="" method="POST">\
        <dt>Name:</dt><dd> <input value=""></dd>\
        <dt>Profile Picture:</dt><dd> <input></dd>\
        <dt>Website:</dt> <dd><input value=""></dd>\
        <dt>Phone Number:</dt><dd><input value=""></dd>';
      return socialpane;
    }
}, true);
