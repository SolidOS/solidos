//  Tag Pane
//
//   Pane for adding semantics to the sort of tags you tag a photo with.
//
// Written by: albert08, 2009
//

    tagPane = {};
    tagPane.icon = tabulator.Icon.src.icon_tagPane;
    tagPane.name = 'Tag';

    // namespace
    var RDF = UI.rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    var RDFS = UI.rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
    var TAGS = UI.rdf.Namespace("http://www.holygoat.co.uk/owl/redwood/0.1/tags/");
    var PAC = UI.rdf.Namespace("http://dig.csail.mit.edu/2008/PAC/ontology/pac#");
    var OWL = UI.rdf.Namespace("http://www.w3.org/2002/07/owl#");

    tagPane.label = function(subject) {

        if (!UI.store.whether(subject, RDF('type'), TAGS("Tag"))) {
            return null;
        }
        return "Tag";
    }


    tagPane.render = function(subject, myDocument) {
        var kb = UI.store
        var docURI = subject.uri.substring(0,subject.uri.lastIndexOf("#"));
        var stWhy = new UI.rdf.NamedNode(docURI);
        var outline = tabulator.outline;
        var editable = outline.UserInput.sparqler.editable(docURI, kb);
        var tag = kb.the(subject, RDFS("label"), undefined, stWhy);

        // Create the main panel
		var main_div = myDocument.createElement("div");
        main_div.setAttribute("class", "TagPane");
        main_div.setAttribute("id", "TagPane");

        tagPane.render.removeSameAs = function(e) {
            var id = e.target.id;
            id = id.substring(id.lastIndexOf("_")+1,id.length);
            var uri = myDocument.getElementById("sameAs_"+id).textContent;
            var s = subject;
            var p = OWL("sameAs");
            var o = new UI.rdf.NamedNode(uri);
            var triple = new UI.rdf.Statement(s, p, o, stWhy);
            var sparqlService = new UI.rdf.UpdateManager(kb);
            sparqlService.delete_statement(triple, function(uri,success,error){
                if (!success) {
                    alert("Error.");
                } else {
                    alert("The triple has been deleted from the RDF file successfully.");
                    //kb.remove(triple);
                    //tagPane.render.DisplaySemantics();
                }
            });
        }


        // Display the current semantics of the tag
        tagPane.render.DisplaySemantics = function() {
            sem_div.innerHTML = "";
            var sem_sts = kb.each(subject, OWL("sameAs"), undefined, stWhy); //  @@@ This will fail as tabulator does smushing - tim
            var bold1 = myDocument.createElement("b");
            if (sem_sts.length == 0) {
                bold1.appendChild(myDocument.createTextNode("No owl:sameAs property found."));
                sem_div.appendChild(bold1);
            } else {
                bold1.appendChild(myDocument.createTextNode("Semantics"));
                sem_div.appendChild(bold1);
                sem_div.appendChild(myDocument.createElement("hr"));

                var sem_table = myDocument.createElement("table");
                sem_table.setAttribute('class', 'TagSemanticsTable');
                var tr = myDocument.createElement("tr");
                var td1 = myDocument.createElement("td");
                td1.setAttribute("width","120");
                td1.appendChild(myDocument.createTextNode("owl:sameAs"));
                tr.appendChild(td1);
                var td2 = myDocument.createElement("td");

                for (var i = 0; i < sem_sts.length; i++) {
                    var span = myDocument.createElement("span");
                    span.setAttribute("id","sameAs_"+i);
                    span.appendChild(myDocument.createTextNode(sem_sts[i].uri));
                    td2.appendChild(span);
                    var cb = myDocument.createElement("a");
                    cb.appendChild(myDocument.createTextNode("[x]"));
                    cb.setAttribute("id","rm_"+i);
                    cb.style.color = "#777777";
                    cb.addEventListener("click", tagPane.render.removeSameAs, false);
                    td2.appendChild(myDocument.createTextNode(" "));
                    td2.appendChild(cb);
                    td2.appendChild(myDocument.createElement("br"));
                }
                tr.appendChild(td2);
                sem_table.appendChild(tr);
                sem_div.appendChild(sem_table);
            }
        }


        tagPane.render.queryEndpoint = function() {
            var list = myDocument.getElementById("suggestList");
            list.options[0].text = "Querying SPARQL endpoint...";
            var es = myDocument.getElementById("endpoints");
            var selIndex = es.selectedIndex;
            var endpoint = es.options[selIndex].value;
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange=state_Change;
            var sparql_query = "query=";
            sparql_query = sparql_query + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ";
            sparql_query = sparql_query + "SELECT DISTINCT ?x WHERE ";
            sparql_query = sparql_query + "{ ?x rdfs:label ?l FILTER regex(?l, \"" + tag + "\", \"i\" ) }";
            xmlhttp.open("POST", endpoint, true);
            xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlhttp.send(sparql_query);
            function state_Change(){
                if (xmlhttp.readyState==4){
                    var cn = list.childNodes;
                    for (var i = 0; i < cn.length; i++) {
                        list.removeChild(cn[i]);
                    }
                    var data = (new DOMParser()).parseFromString(xmlhttp.responseText, "text/xml");
                    var uris = data.getElementsByTagName("uri");
                    for (var i = 0; i < uris.length; i++) {
                        var op = myDocument.createElement("option");
                        op.appendChild(myDocument.createTextNode(uris[i].textContent));
                        op.setAttribute("value",uris[i].textContent);
                        list.appendChild(op);
                    }
                    myDocument.getElementById("addButton1").disabled = false;
                }
            }
        }


        // Insert a triple saying (subject, owl:sameAs, selected_uri)
        // (From suggestion)
        tagPane.render.addProperty1 = function() {
            var list = myDocument.getElementById("suggestList");
            var selIndex = list.selectedIndex;
            uri = list.options[selIndex].value;
            if ((uri != undefined) && (uri != "")) {
                var s = subject;
                var p = OWL("sameAs");
                var o = new UI.rdf.NamedNode(uri);
                var triple = new UI.rdf.Statement(s, p, o, stWhy);
                var sparqlService = new UI.rdf.UpdateManager(kb);
                sparqlService.insert_statement(triple, function(uri,success,error){
                    if (!success) {
                        alert("Error.");
                    } else {
                        alert("The triple has been added to the RDF file successfully.");
                        kb.add(triple.subject, triple.predicate, triple.object, triple.why);
                        tagPane.render.DisplaySemantics();
                    }
                });
            }
        }


        // Insert a triple saying (subject, owl:sameAs, selected_uri)
        // Use given URI
        tagPane.render.addProperty2 = function() {
            var uri = myDocument.getElementById("sameAsURI").value;
            if ((uri != undefined) && (uri != "")) {
                var s = subject;
                var p = OWL("sameAs");
                var o = new UI.rdf.NamedNode(uri);
                var triple = new UI.rdf.Statement(s, p, o, stWhy);
                var sparqlService = new UI.rdf.UpdateManager(kb);
                sparqlService.insert_statement(triple, function(uri,success,error){
                    if (!success) {
                        alert("Error.");
                    } else {
                        alert("The triple has been added to the RDF file successfully.");
                        kb.add(triple.subject, triple.predicate, triple.object, triple.why);
                        tagPane.render.DisplaySemantics();
                    }
                });
            }
        }


        tagPane.render.EnableButton2 = function() {
            var uri = myDocument.getElementById("sameAsURI").value;
            if (uri == "") {
                myDocument.getElementById("addButton2").disabled = true;
            } else {
                myDocument.getElementById("addButton2").disabled = false;
            }
        }

        // Display the interface for adding semantics (sameAs properties)
        tagPane.render.DisplayAddSemantics = function() {

            var bold2 = myDocument.createElement("b");
            bold2.appendChild(myDocument.createTextNode("Add Semantics"));
            add_div.appendChild(bold2);
            add_div.appendChild(myDocument.createElement("hr"));

            var endpoints_select = myDocument.createElement("select");
            endpoints_select.setAttribute("id","endpoints");
            endpoints_select.setAttribute("class","controlSelect");
            var endpoints = ["http://wordnet.rkbexplorer.com/sparql/"];
            for (var i = 0; i < endpoints.length; i++) {
                var opt = myDocument.createElement("option");
                opt.appendChild(myDocument.createTextNode(endpoints[i]));
                opt.setAttribute("value",endpoints[i]);
                endpoints_select.appendChild(opt);
            }
            var bold3 = myDocument.createElement("b");
            bold3.appendChild(myDocument.createTextNode("SPARQL Endpoints: "));
            add_div.appendChild(bold3);
            add_div.appendChild(endpoints_select);

            var getbutton = myDocument.createElement("input");
            getbutton.setAttribute("class","controlButton");
            getbutton.setAttribute("id","suggestButton");
            getbutton.setAttribute("type","button");
            getbutton.setAttribute("value","Get Suggestions");
            getbutton.addEventListener("click",tagPane.render.queryEndpoint,false);
            add_div.appendChild(getbutton);
            add_div.appendChild(myDocument.createElement("br"));

            var bold4 = myDocument.createElement("b");
            bold4.appendChild(myDocument.createTextNode("1. Choose from: "));
            add_div.appendChild(bold4);

            var sg_list = myDocument.createElement("select");
            sg_list.setAttribute("class","controlSelect");
            sg_list.setAttribute("id","suggestList");
            var info = myDocument.createElement("option");
            info.appendChild(myDocument.createTextNode("No URI available."));
            sg_list.appendChild(info);
            var addbutton1 = myDocument.createElement("input");
            addbutton1.setAttribute("class","controlButton");
            addbutton1.setAttribute("id","addButton1");
            addbutton1.setAttribute("type","button");
            addbutton1.setAttribute("value","Add owl:sameAs");
            addbutton1.addEventListener("click",tagPane.render.addProperty1,false);
            addbutton1.disabled = true;
            add_div.appendChild(sg_list);
            add_div.appendChild(addbutton1);
            add_div.appendChild(myDocument.createElement("br"));

            var bold5 = myDocument.createElement("b");
            bold5.appendChild(myDocument.createTextNode("2. Give URI: "));
            add_div.appendChild(bold5);

            var uri_input = myDocument.createElement("input");
            uri_input.setAttribute("class","tagURIInput");
            uri_input.setAttribute("id","sameAsURI");
            uri_input.addEventListener("keyup",tagPane.render.EnableButton2,false);
            add_div.appendChild(uri_input);
            var addbutton2 = myDocument.createElement("input");
            addbutton2.setAttribute("class","controlButton");
            addbutton2.setAttribute("id","addButton2");
            addbutton2.setAttribute("type","button");
            addbutton2.setAttribute("value","Add owl:sameAs");
            addbutton2.addEventListener("click",tagPane.render.addProperty2,false);
            addbutton2.disabled = true;
            add_div.appendChild(addbutton2);

        }



        var sem_div = myDocument.createElement("div");
        sem_div.setAttribute('class', 'TagSemanticsPanel');
        var add_div = myDocument.createElement("div");
        add_div.setAttribute("class", "AddTagSemantics");

        tagPane.render.DisplaySemantics();
        if (editable) {
            tagPane.render.DisplayAddSemantics();
        }

        main_div.appendChild(sem_div);
        main_div.appendChild(add_div);

        return main_div;
    }

    tabulator.panes.register(tagPane, false);

// ends
