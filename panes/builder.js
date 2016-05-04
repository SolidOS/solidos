/*      Pane builder
**
**   This modules builds a pane from a RDF description.
**  See also: the Fresnel language.
*/







tabulator.panes.metaPane = {
    
    icon:  tabulator.Icon.src.icon_dataContents, // @@ fix
    
    name: 'dynmaic', // @@ fix
    
    label: function(subject) {
        var t, nt, ts = rdf.findTypesNT(subject);
        ps ={};
        for (nt in ts) {
            t = kb.fromNT(nt);
            ps = ps.concat(kb.each(t, UI.ns.ui('formDefinition')));
        }
        for (var i=0; i <ps.length; i++) {
            if (tabulator.panes.index[ps[i].uri] == undefined) { // New one
                var pane = {}; // Internal tabulator object
                var p = ps[i]; // The pane definition on the web
                pane.definition = p;
                pane.render = tabulator.panes.metaPane.render; // ie below
                pane.icon = image = kb.any(p, UI.ns.ui('icon'));
                pane.label = kb.any(p, UI.ns.ui('icon'));
                if (!p.label) p.label = UI.utils.label(p);
                pane.definition = p;
                tabulator.panes.index[ps[i].uri] = p;
                tabulator.panes.register(p, false); // no "Find all" button
            }
        }

        return null; // Never be displayed itself
    },


    // View the object in user-friendly way
    render: function(subject, myDocument) {

        var kb = UI.store;
        var ns = UI.ns;
        var div = myDocument.createElement("div")
        div.setAttribute('class', 'dataContentPane'); // @@

        p = self.definition;
        if (!p) throw "Dynamic pane should have a definition".
        var template = kb.any(p, ns.link('template'))
        // @@@ TBD
        
        // Because of smushing etc, this will not be a copy of the original source
        // We could instead either fetch and re-parse the source,
        // or we could keep all the pre-smushed triples.
        var sts = kb.statementsMatching(undefined, undefined, undefined, subject); // @@ slow with current store!
      return div
    }
};

tabulator.panes.register(tabulator.panes.dataContentPane, true);



// ENDS

