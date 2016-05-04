/*      View Source Pane
**
**  This pane shows the raw content of formats which are normaly parsed
**   normally for dignostic purposes 
**   @@ Syntax colouring would of course be great
**   e.g. Maybe http://google-code-prettify.googlecode.com/svn/trunk/README.html
*/


tabulator.panes.sourcePane = {
    
    icon:  tabulator.Icon.src.icon_source, // @@
    
    name: 'source',
    
    label: function(subject) {

        var allowed = ['application/x-javascript',
                        'text/n3', 'text/turtle', 
                        // 'text/plain',
                       'text/html','application/xhtml+xml','text/css'];
 
        var dispalyable = function(kb, x, displayables) {
            var cts = kb.fetcher.getHeader(x, 'content-type');
            if (cts) {
                for (var j=0; j<cts.length; j++) {
                    for (var k=0; k < displayables.length; k++) {
                        if (cts[j].indexOf(displayables[k]) >= 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        
        var t = kb.findTypeURIs(subject);
   
        if (t[ns.link('WebPage').uri]) return "view source";
        
        if (cts.length && (cts[0].slice(0,5) === 'text/' 
            || cts[0].indexOf('+xml') >= 0)
            ) return "view source";
    

        if (displayable(kb, subject, allowed)) return "View source";
        
        return null;
    },


    // View the data in a file in user-friendly way
    render: function(subject, myDocument) {

        var kb = UI.store;
        var div = myDocument.createElement("div")
        div.setAttribute('class', 'sourcePane');

        var pre = myDocument.createElement('pre');
        
        // @@ Now find the content
        
        div.appendChild(pre);
        return div
    }
};

tabulator.panes.register(tabulator.panes.sourcePane, false);




//ends

