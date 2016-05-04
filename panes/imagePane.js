/*   Image Pane
**
**  This outline pane contains the document contents for an Image document
*/
var UI = require('solid-ui')

module.exports ={
    icon: tabulator.Icon.src.icon_imageContents,

    name: 'image',

    label: function(subject) {
        var kb = UI.store;
        var ns = UI.ns;

        if (!kb.anyStatementMatching(
            subject, UI.ns.rdf( 'type'),
            kb.sym('http://purl.org/dc/terms/Image'))) // NB: Not dc: namespace!
            return null;

        //   See aslo the source pane, which has lower precedence.

        var contentTypeMatch = function(kb, x, contentTypes) {
            var cts = kb.fetcher.getHeader(x, 'content-type');
            if (cts) {
                for (var j=0; j<cts.length; j++) {
                    for (var k=0; k < contentTypes.length; k++) {
                        if (cts[j].indexOf(contentTypes[k]) >= 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        var suppressed = [ 'application/pdf'];
        if (contentTypeMatch(kb, subject, suppressed)) return null;

        return "view";
    },

    render: function(subject, myDocument) {
        var div = myDocument.createElement("div")
        div.setAttribute('class', 'imageView')
        var img = myDocument.createElement("IMG")
        img.setAttribute('src', subject.uri) // w640 h480
        img.setAttribute('style','max-width: 100%; max-height: 100%;')
//        div.style['max-width'] = '640';
//        div.style['max-height'] = '480';
        var tr = myDocument.createElement('TR')  // why need tr?
        tr.appendChild(img)
        div.appendChild(tr)
        return div
    }
}

//ends
