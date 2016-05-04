/*
    Summer 2010
    haoqili@mit.edu

This commit: - Autocomplete is done EXCEPT for clicking.
             - User output for uri links

NOTE: Dropdown only shows if
1. you first visit http://dig.csail.mit.edu/2007/wiki/docs/collections
2. refresh your foaf page

    //TODO:
    1 autocomplete clickable
    2 Enable Tab == Enter
    3 Disable typing in lines that depend on incompleted previous lines.
    4 Show words fading after entered into wiki
    - Load journal titles

    //small
    - Add co-authors
    - If Autocompleted a Journal title, check if the journal has an URL in its page before taking away the URL input box
    - Fix in userinput.js menu dropdown place
    - Background encorporates abstract textarea
    - Get pdf
    - Height of the input box

    NB:
    - When you want to select the first dropdown item, you have to arrow down and up again, not enter directly.
 */

tabulator.Icon.src.icon_pubs = tabulator.iconPrefix + 'icons/publication/publicationPaneIcon.gif';
tabulator.Icon.tooltips[tabulator.Icon.src.icon_pubs] = 'pubs'; //hover show word


tabulator.panes.pubsPane = {
    icon: tabulator.Icon.src.icon_pubs,

    name: 'pubs',

    label: function(subject) {  // Subject is the source of the document
        //criteria for display satisfied: return string that would be title for icon, else return null
        // only displays if it is a person, copied from social/pane.js
        if (UI.store.whether(
            subject, UI.ns.rdf('type'),
            UI.ns.foaf('Person'))){
            //dump("pubsPane: the subject is: "+subject);
                return 'pubs';
            } else {
                return null;
            }

    },

    render: function(subject, myDocument) { //Subject is source of doc, document is HTML doc element we are attaching elements to

        //NAMESPACES ------------------------------------------------------
        var foaf = UI.rdf.Namespace("http://xmlns.com/foaf/0.1/");
        //var rdf= UI.ns.rdf;
        var rdf = UI.rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
        var owl = UI.rdf.Namespace("http://www.w3.org/2002/07/owl/");
        var bibo = UI.rdf.Namespace("http://purl.org/ontology/bibo/");
        var dcterms = UI.rdf.Namespace('http://purl.org/dc/terms/');
        var dcelems = UI.rdf.Namespace('http://purl.org/dc/elements/1.1/');
        var soics = UI.rdf.Namespace('http://rdfs.org/sioc/spec/');
        var kb = UI.store;
        var sparqlUpdater = new UI.rdf.UpdateManager(kb);

        var collections_URI = 'http://dig.csail.mit.edu/2007/wiki/docs/collections';
        var journalURI = "";

        var works_URI = 'http://dig.csail.mit.edu/2007/wiki/docs/works'
        var jarticleURI = "";

        var bookURI = "";

        var doctitle_value ="";

        // Functions -------------------------------------------------------

        // Generic insert_statement return function
        var returnFunc = function(uri, success, error){
          //  dump('In title, 4 in update Service \n');
            if (success){
                dump("In title, editing successful! :D\n");
            } else {
                dump("In title, Error when editing\n");
            }
        };

        // Creates "tag" thing as a child under "p"
        function newElement(tag, p){
            var x = myDocument.createElement(tag);
            x['child'] = function(tag){return newElement(tag,x)};
            if(!p){ pubsPane.appendChild(x); }
            else{ p.appendChild(x); }
            return x;
        }


        function removeSpaces(str){
            return str.split(' ').join('');
        }

        function spacetoUline(str){
            return str.split(' ').join('_').toLowerCase();

        }

        function pl(str){
            return dump(str+"\n");
        }

        function newFormRowID(form, wordori, type){
            var outer_div = newElement('div', form);
            var word = spacetoUline(wordori);
            outer_div.id =  'divid_' + word;
            //if (word == 'journal') {
            //outer_div.className = 'active';
            // } else {
                outer_div.className = 'hideit';
            // }
            var inner_div = newElement('div', outer_div);
            inner_div.setAttribute('class', 'pubsRow');
            var word_span = newElement('span', inner_div);
            word_span.setAttribute('class', 'pubsWord');

            word_span.innerHTML = wordori + ': ';
            var word_box = newElement(type, inner_div);
            word_box.id = "inpid_" + word;
            return word_box;
        }

        function newOutputRow(form, wordori){
            var outer_div = newElement('div', form);
            var word = spacetoUline(wordori);
            outer_div.id =  'outid_' + word;
            outer_div.className = 'hideit';
            return  outer_div;
        }

        // Called first thing by Journal and Book
        // this function creates a new first row in the form that
        // asks for a document title,
        // makes the document's URI, and
        // inserts the input title into the URI
        // For "Book Title", puts creator into URI too
        var rootlistenRow = function(theForm, caption_title, typeofinp, storeURI, typeofdoc){
            // Variables:
            // create new row, with id: "inpid_"+sapcetoUline(caption_title)
            var doctitle = newFormRowID(theForm, caption_title, typeofinp);
            doctitle.select();
            var userinputResult = "";

            var docOutput = newOutputRow(theForm, caption_title);

            // Add the listener
            doctitle.addEventListener("keypress", function(e){
                // Only register legal chars

                //NB not using elementId.value because it's offbyone
                // only for userinput.js stuff, otherwise use:
                //var doctitle_id = myDocument.getElementById("inpid_"+ spacetoUline(caption_title));
                //var doctitle_value = doctitle_id.value;
                doctitle_value += String.fromCharCode(e.charCode);

                // When keys other than "enter" are entered, Journal Title should autocomplete
                dump("\n\n\n=========start in pubsPane ==========\n");
                dump("In " + caption_title + ", pressed the key="+e.keyCode+" with char=" + e.charCode +" the curinput is="+doctitle_value+"\n");
                switch (caption_title) {
                    case 'Journal Title':
                        dump("It's case Journal Title\n");
                        dump("TxtStr.formCharCode=" + doctitle_value+"\n");

                        // Journal Title has dropdown menu option
                        // THIS ONE LINE LINKS TO USERINPUT.JS:
                        userinputResult = tabulator.outline.UserInput.getAutoCompleteHandler("JournalTAC")(e); //**This (e) is passed to event in userinput.js that will handle keypresses, including up and down in menu
                        // If AC used: userinputResult = ['gotdptitle', str title, str uri]
                        // -- else: userinputResult = A string
                        dump("\nACRESULT!!="+userinputResult+"\n");

                        dump("========OVER=========\n");
                        break;
                    case 'Book Title':
                        dump("yo book\n");
                        break;
                    default:
                        dump("neither\n");
                }


                // For both Journal and Book, Enter Key creates new journal/book URI's
                if (e.keyCode == 13 ){
                    dump("In " + caption_title + ", 2 Enter PRESSED title=" + doctitle_value+"\n");
                    // clear dropdown menu, the function will check if one exists
                    tabulator.outline.UserInput.clearMenu();

                    // ======== If autocomplete was selected ==========
                    // Right now "got dropdown title" only is for Journal
                    if (userinputResult[0] == "gotdptitle"){

                        // If AC used: userinputResult = ['gotdptitle', str title, str uri]
                        // -- else: userinputResult = A string

                        journalURI = userinputResult[2];
                        dump("FROM DROP DOWN, journalURI="+journalURI+"\n");

                        // put complete name in journal input box:
                        var changeinpbox = myDocument.getElementById("inpid_journal_title");
                        changeinpbox.value = userinputResult[1];

                        // Show user the journal URI
                        docOutput.innerHTML = "Journal URI = <i>"+journalURI+"</i>";
                        docOutput.className = 'active';

                        // Hide Journal URL row
                        // TODO: First check that the Journal has a URL
                        var urlrow = myDocument.getElementById("divid_journal_url");
                        urlrow.className = 'hideit';

                        // Focus on the next part
                        var articleinp = myDocument.getElementById("inpid_journal_article_title");
                        articleinp.focus();
                    } else {
                        // ======== Traditional, no dropdown =========

                        // 0. Make a URI for this doc, storeURI#[millisecs epoch time]
                        dump("If NOT from title dropdown\n");
                        var now = new Date();
                        var docURI = storeURI + "#" + now.getTime();
                        if (caption_title == "Journal Title"){
                            journalURI = docURI;
                            docOutput.innerHTML = "Journal URI = <i>"+journalURI+"</i>";
                            dump("journalURI="+journalURI+"\n");
                        } else if (caption_title == "Book Title"){
                            bookURI = docURI;
                            docOutput.innerHTML = "Book URI = <i>"+bookURI+"</i>";
                            dump("bookURI="+bookURI+"\n");
                        }
                        dump("docURI="+docURI+"\n");
                        // Show user the URI
                        docOutput.className = 'active';

                        // 1. Make this doc URI type specified
                        var doctype_addst = new UI.rdf.Statement(kb.sym(docURI), UI.ns.rdf('type'), typeofdoc, kb.sym(storeURI));

                        // 2. Add the title for the journal (NB, not article title)
                        //NB, not using above doctitle_value because it will
                        // add "enter" to the string, messing it up
                        var doctitle_id = myDocument.getElementById("inpid_"+ spacetoUline(caption_title));
                        doctitle_value = doctitle_id.value;
                        var doctitle_addst = new UI.rdf.Statement(kb.sym(docURI), dcelems('title'), doctitle_value, kb.sym(storeURI));

                        var totalst = [doctype_addst, doctitle_addst];

                        // 3. Only for books, add creator:
                        if (caption_title == "Book Title"){
                            var creator_add = new UI.rdf.Statement(kb.sym(docURI), dcelems('creator'), subject, kb.sym(storeURI));
                            totalst.push(creator_add);
                        }

                        dump('Start SU' + caption_title + '\n');
                        dump('Inserting start:\n' + totalst + '\nInserting ///////\n');
                        sparqlUpdater.insert_statement(totalst, returnFunc);
                        dump('DONE SU' + caption_title + '\n');
                    }
                }

            }, false);
        };

        // this function makes a leaf level (knowing subjectURI) newFormRow
        // to put extracted info under the known subject URI
        var leaflistenRow = function(theForm, namestr, type, thesubject, thepredicate, storeURI){
            // Makes the new row, with id: "inpid_"+sapcetoUline(namestr)
            var item = newFormRowID(theForm, namestr, type);
            item.addEventListener("keypress", function(e){
                dump("In " + namestr + ", 1 pressing a key\n");
                if (e.keyCode == 13) {
                    dump("1\n");
                    var item_id = myDocument.getElementById("inpid_"+ spacetoUline(namestr) );
                    var item_value = item_id.value;
                    var item_trim = removeSpaces(item_value);
                    if (namestr == "Book Description") item_trim = item_value;
                    dump("2\n");
                    // Add to URI
                    var subjectURI = "undef";
                    if (thesubject == "journal") {
                        dump("journalURI=" + journalURI + "\n");
                        subjectURI = journalURI;
                    } else if (thesubject == "jarticle") {
                        dump("jarticleURI=" + jarticleURI + "\n");
                        subjectURI = jarticleURI;
                    } else if (thesubject == "book") {
                        dump("book\n");
                        subjectURI = bookURI;
                    }
                    dump("3\n");
                    var item_st = new UI.rdf.Statement(kb.sym(subjectURI), thepredicate, item_trim, kb.sym(storeURI));
                    dump('start SU for ' + namestr + "\n\n");
                    dump('Inserting start:\n' + item_st + '\nInserting ///////\n');
                    sparqlUpdater.insert_statement(item_st, returnFunc);
                    dump("DONE SU for " + namestr + "\n");
                }
            }, false);
        };

        // Building the HTML of the Pane, top to bottom ------------
        /// Headers
        var pubsPane = myDocument.createElement('div');
        pubsPane.setAttribute('class', 'pubsPane');

        var caption_h2 = myDocument.createElement('h2');
        caption_h2.appendChild(myDocument.createTextNode('Add your new publication'));
        pubsPane.appendChild(caption_h2);

        /// The form, starting with common pubs stuff
        var theForm = newElement('form', pubsPane);
        theForm.id = "the_form_id";

        /*// --- Co-Authors ----------
        newFormRowID(theForm, 'coAuthor1', 'input');
        newFormRowID(theForm, 'coAuthor2', 'input');
        newFormRowID(theForm, 'coAuthor3', 'input');

        var r_moreaut = newElement('div', theForm);
        r_moreaut.setAttribute('class', 'pubsRow');
        var b_moreaut = newElement('button', r_moreaut);
        b_moreaut.id = "b_moreaut";
        b_moreaut.type = "button";
        b_moreaut.innerHTML = "More authors?";

        b_moreaut.addEventListener("click", function(){
            var row2 = myDocument.getElementById('divid_coAuthor2');
            var row3 = myDocument.getElementById('divid_coAuthor3');
            row2.className = 'active';
            row3.className = 'active';
        }, false);*/


        /// === Dropdown ----------
        // NB: The names MUST be lowercase, ' '->_ names
        var jnlist = ['journal_title', 'journal_url', 'journal_article_title', 'article_published_date'];
        var bklist = ['book_title', 'book_url', 'book_published_date', 'book_description'];
        //Hiding all uri output displays during every dropdown switch
        var outputlist = ['journal_title', 'journal_article_title', 'book_title'];

        // Making the dropdown
        var dropdiv = newElement('div', theForm);
        dropdiv.setAttribute('class', 'pubsRow');
        var drop = newElement('select', dropdiv);
        drop.id = 'select_id';
        var op0 = newElement('option', drop);
        op0.innerHTML = "choose publication type";

        var op1 = newElement('option', drop);
        op1.id = 'op1_id';
        op1.innerHTML = "journal";
        op1.addEventListener("click", function(){
            for (var i=0; i<jnlist.length; i++){
                var jnitm = myDocument.getElementById("divid_"+jnlist[i]);
                jnitm.className = 'active';
            }
            for (var x=0; x<bklist.length; x++){
                var bkitm = myDocument.getElementById("divid_"+bklist[x]);
                bkitm.className = 'hideit';
            }
            for (var y=0; y<outputlist.length; y++){
                var ouitm = myDocument.getElementById("outid_"+outputlist[y]);
                ouitm.className = 'hideit';
            }
        }, false);
        var op2 = newElement('option', drop);
        op2.id = 'op2_id';
        op2.innerHTML = "book";
        op2.addEventListener("click", function(){
            for (var i=0; i<jnlist.length; i++){
                var jnitm = myDocument.getElementById("divid_"+jnlist[i]);
                jnitm.className = 'hideit';
            }
            for (var x=0; x<bklist.length; x++){
                var bkitm = myDocument.getElementById("divid_"+bklist[x]);
                bkitm.className = 'active';
            }
            for (var y=0; y<outputlist.length; y++){
                var ouitm = myDocument.getElementById("outid_"+outputlist[y]);
                ouitm.className = 'hideit';
            }
        }, false);

        // This is where the "journal" and "book" sections are created. Each id is "divid_" + 2ndarg
        //// ======== JOURNAL ===============================================================
        // J1. Make journal URI, with correct type (Journal), and title
        rootlistenRow(theForm, 'Journal Title', 'input', collections_URI, bibo('Journal'));

        // J2. Make journal url
        leaflistenRow(theForm, 'Journal URL', 'input', "journal", foaf('homepage'), collections_URI);

        // J3. Journal Article title, a new URI that links to the journal URI
        var jarttitle = newFormRowID(theForm, 'Journal Article Title', 'input');

        var jartoutp = newOutputRow(theForm, 'Journal Article Title');

        jarttitle.addEventListener("keypress", function(e){
            dump("In Journal_article_title, 1 pressing a key \n");
            if (e.keyCode == 13 ){
                dump("In Journal article title, 2 Enter PRESSED\n");

                var jarttitle_id = myDocument.getElementById("inpid_journal_article_title");
                var jarttitle_value = jarttitle_id.value;

                // 0. Make a URI for this Journal Article
                // works_URI = 'http://dig.csail.mit.edu/2007/wiki/docs/works';
                var now = new Date();
                jarticleURI = works_URI + "#" + now.getTime();
                // Show user the URI
                jartoutp.innerHTML = "Article URI = <i>"+jarticleURI+"</i>";
                jartoutp.className = 'active';

                dump("jartURI="+jarticleURI+"\n");

                // 1. Make this journal article URI type AcademicArticle
                var jarttype_add = new UI.rdf.Statement(kb.sym(jarticleURI), UI.ns.rdf('type'), bibo('AcademicArticle'), kb.sym(works_URI));

                // 2. Add the title for this journal article
                var jart_add = new UI.rdf.Statement(kb.sym(jarticleURI), dcelems('title'), jarttitle_value, kb.sym(works_URI));

                dump("The SUBJECT = "+subject+"\n");
                // 3. Add author to a creator of the journal article
                var auth_add = new UI.rdf.Statement(kb.sym(jarticleURI), dcterms('creator'), subject, kb.sym(jarticleURI));
                dump("1\n");
                // 4. Connect this journal article to the journal before
                var connect_add = new UI.rdf.Statement(kb.sym(jarticleURI), dcterms('isPartOf'), kb.sym(journalURI), kb.sym(works_URI));
                dump("2\n");
                var totalst = [jarttype_add, jart_add, auth_add, connect_add];
                dump("3\n");
                dump('Start SU journal article\n');
                dump('Inserting start:\n' + totalst + '\nInserting ///////\n');
                sparqlUpdater.insert_statement(totalst, returnFunc);
                dump('DONE SU journal article\n');
            }
        }, false);

        // J4. Add Date
        leaflistenRow(theForm, 'Article Published Date', 'input', 'jarticle', dcterms('date'), works_URI);


        //// ======== BOOK ===============================================================
        // B1. Make "Book Title" row, with correct type (Journal), title, and creator
        rootlistenRow(theForm, 'Book Title', 'input', works_URI, bibo('Book'));

        // B2. Make book url
        leaflistenRow(theForm, 'Book URL', 'input', "book", foaf('homepage'), works_URI);

        // B3. Add Date
        leaflistenRow(theForm, 'Book Published Date', 'input', 'book', dcterms('date'), works_URI);

        // B4. Make the abstract
        leaflistenRow(theForm, 'Book Description', 'textarea', "book", dcterms('description'), works_URI);



        /* TODO Minor: empty row, but to make background stretch down below the abstract box
        var r_empty = newElement('div', theForm);
        r_empty.setAttribute('class', 'emptyRow');
        r_empty.innerHTML = " Hi ";*/

        return pubsPane;
    }
};

tabulator.panes.register(tabulator.panes.pubsPane, true);
