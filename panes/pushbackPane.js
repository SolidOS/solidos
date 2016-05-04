/** PushBack Pane
*   This pane will "push back" changes to legacy data sources via Tabulator (right now it only supports Twitter)
*   uses pushback code from http://code.google.com/p/pushback
*   oshani@mit.edu
*/

tabulator.panes.pushbackPane = {
    icon: tabulator.Icon.src.icon_pushbackPane,
    
    name: 'pushback',
    
    label: function(subject) { return 'pushback';},
    
    render: function(subject, myDocument) {
        var div = myDocument.createElement("div");
        div.setAttribute('id', 'pushbackPane');
        //We can support different types of applications or any combinations of those supporting the pushback operation through a generic form
        var apps = []; //to support different apps
        div.appendChild(pushbackForm(subject, myDocument, apps));
        return div;

    }
};

tabulator.panes.register(tabulator.panes.pushbackPane, false);

//This function should handle all the UI manipulations
pushbackForm = function(subject, doc, apps){
        
        var pbdiv = doc.createElement("div");
        pbdiv.setAttribute("id","pb");
        
        var form = doc.createElement("form");
        form.setAttribute("id","twitterform");
        form.setAttribute("action","");
        form.setAttribute("about","./fo1"); //@@ this is wrong!
        form.setAttribute("typeof","http://ld2sd.deri.org/pb/ns#RDForm");
        
        var fieldset = doc.createElement("fieldset");
        
        var legend = doc.createElement("p");
        legend.appendChild(doc.createTextNode("Send Updates to Twitter"));
        
        var div1 = doc.createElement("div");
        div1.setAttribute("rel","http://ld2sd.deri.org/pb/ns#field");
        div1.setAttribute("style","margin:10px");
        
        var div2 = doc.createElement("div");
        div2.setAttribute("about","./fo1.f1"); //@@ this is also very wrong!
        div2.setAttribute("typeof","http://ld2sd.deri.org/pb/ns#UpdateableField");
        
        var label = doc.createElement("label");
        label.setAttribute("rel","http://ld2sd.deri.org/pb/ns#key");
        label.setAttribute("resource","http://ld2sd.deri.org/pushback/rdforms/rdform2.html#twitmsg");
        label.setAttribute("property","http://purl.org/dc/terms/title");
        label.setAttribute("for","bugactive"); //@@huh??
        
        var div3 = doc.createElement("div");
        div3.setAttribute("rel","http://ld2sd.deri.org/pb/ns#value");
        
        var div4 = doc.createElement("div");
        div4.setAttribute("about","./fo1.f1.val");
        div4.setAttribute("typeof","http://ld2sd.deri.org/pb/ns#FieldValue");
        
        var txtinput = doc.createElement("textarea");
        txtinput.setAttribute("id","message");
        txtinput.setAttribute("rows","2");
        txtinput.setAttribute("cols","70");
        txtinput.setAttribute("property","http://www.w3.org/1999/02/22-rdf-syntax-ns#value");
        txtinput.setAttribute("value","");
        
        var buttondiv = doc.createElement("div");
        
        var btninput = doc.createElement("input");
        btninput.setAttribute("type","button");
        btninput.setAttribute("value","Submit");
        btninput.addEventListener("click",pushback, false);
        
        var resultdiv = doc.createElement("div");
        resultdiv.setAttribute("id","result");
        
        buttondiv.appendChild(btninput);
        div4.appendChild(txtinput);
        div3.appendChild(div4);
        div2.appendChild(label);
        div2.appendChild(div3);
        div1.appendChild(div2);
        fieldset.appendChild(legend);
        fieldset.appendChild(div1);
        fieldset.appendChild(buttondiv);
        form.appendChild(fieldset);
        form.appendChild(resultdiv);
        pbdiv.appendChild(form);
        pbdiv.appendChild(resultdiv);
        pbdiv.setAttribute("style","border: 2px solid black");
        return pbdiv;
        
}

// ends
