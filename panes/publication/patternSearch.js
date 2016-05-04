/*
    Why patternSearch was created:
        Bibliographical data can be represented in many different ways. The
        goal of patternSearch is to provide a convenient way of establishing
        searching patterns and alternatives, so as to be able to collect data
        from a document without having to resort to nested arrays or complic-
        ated logical structures.
        These patterns are represented as trees of nodes, each of which has
        its own searching and fetch methods. Intermediary nodes fetch
        what their children nodes return; end nodes fetch literals (or URIs).
        If one specific pattern fails to encounter data, then fetch attempts
        to use the following patterns. Nested arrays of literals and contain-
        ers are returned and then parsed.

        search methods always begin with search; fetch methods also follow
        this pattern.

        This is used by the publication pane, which was a student project
*/

module.exports  = { // Encapsulates all of the methods and classes
    /*****************************
     *     Main Node Class       *
     *****************************/
    anchor = this;
    this.PatternNode = function(searchMethod, fetchMethod, children) {
        this.searchMethod = searchMethod;
        this.fetchMethod = fetchMethod;
        this.children = children;
    }
    this.PatternNode.prototype.fetch = function(subject) {
        if(subject == null) return null;
        if(subject.type === 'Symbol')
            UI.store.fetcher.requestURI(getBaseURI(subject.uri));
        return this.fetchMethod(this.searchMethod(subject), this.children);
    }
    this.PatternNode.prototype.toString = function() {
        if(this.children) {
            var str = "{children:[\n";
            for(var i = 0;i < this.children.length;i++)
                str += "        "+this.children[i].toString();
            return str+"          ]};\n";
        }
        else
            return "END\n";
    }

    /******************************
     *       Fetch Methods        *
     ******************************/
    this.fetchSingle = function(subjects) {
        if(isEmpty(subjects)) return null;
        else if(subjects[0].termType === 'literal' || subjects[0].termType === 'symbol')
            return new DataContainer([subjects[0].toString()]);
        else return null;
    }

    this.fetchMultiple = function(subjects) {
        if(isEmpty(subjects)) return null;
        var dataContainers = new Array();
        for(var i = 0;i < subjects.length;i++)
            if(subjects[i] == null) continue;
            else if(subjects[i].termType === 'literal' || subjects[i].termType === 'symbol')
                dataContainers.push(new DataContainer([subjects[i].toString()]));
        if(isEmpty(dataContainers)) return null;
        else return dataContainers;
    }

    this.fetchSingleOr = function(subjects, children) {
        if(isEmpty(subjects) || isEmpty(children)) return null;
        for(var i = 0;i < subjects.length;i++)
            for(var j = 0;j < children.length;j++) {
                var fetchedData = children[j].fetch(subjects[i]);
                if(fetchedData != null) return fetchedData;
            }
        return null;
    }

    this.fetchAnd = function(subjects, children) { // Children of And nodes must not return arrays
        if(isEmpty(subjects) || isEmpty(children)) return null;
        for(var i = 0;i < subjects.length;i++) {
            var dataContainer = new DataContainer();
            for(var j = 0;j < children.length;j++) {
                var fetchedData = children[j].fetch(subjects[i]);
                if(isEmpty(fetchedData) || fetchedData instanceof Array) break;
                else if(fetchedData instanceof DataContainer) dataContainer.appendData(fetchedData); //@@
            }
            if(dataContainer.data.length == children.length) return dataContainer;
        }
        return null;
    }

    this.fetchMultipleOr = function(subjects, children) {
        if(isEmpty(subjects) || isEmpty(children)) return null;
        var dataContainers = new Array();
        for(var i = 0;i < subjects.length;i++)
            for(var j = 0;j < children.length;j++) {
                var fetchedData = children[j].fetch(subjects[i]);
                if(isEmpty(fetchedData)) continue;
                else {
                    if(fetchedData instanceof DataContainer) dataContainers.push(fetchedData);
                    else if(fetchedData instanceof Array) // In case one child returns multiple DataContainers
                        for(var k = 0;k < fetchedData.length;k++)
                            dataContainers.push(fetchedData[k]);
                    break;
                }
            }
        if(dataContainers.length == 0) return null;
        else return dataContainers;
    }

    //this.fetchMultipleAggregate = function(


    /****************************
     *     Search Methods       *
     ****************************/
    this.searchByPredicate = function(uri) {
        return function(subject) {
            var triples = UI.store.statementsMatching(subject, uri);
            if(isEmpty(triples)) return new Array();
            return getObjects(triples);
        }
    }

    this.searchByObjectType = function(uri) {
        return function(subject) {
            var triples = UI.store.statementsMatching(subject,null,null,null);
            var objects = getObjects(triples);
            var matchingTriples = new Array();
            if(isEmpty(triples)) return matchingTriples;
            for(var i = 0;i < objects.length;i++)
                if(UI.store.whether(objects[i],UI.ns.rdf('type'),uri))
                    matchingTriples.push(triples[i]);
            return getObjects(matchingTriples);
        }
    }

    this.searchBlankPatternNode = function() {
        return function(subject) {
            return [subject];
        }
    }


    /********************************
     *  Utility Methods & Classes   *
     ********************************/
    function DataContainer(data) {
        if(data == null || data == undefined) this.data = new Array();
        else this.data = data;
    }
    DataContainer.prototype.appendData = function(data) {
        this.data.push(data);
    }

    function isEmpty(array) {
        if(array == null) return true;
        else if(array.length == 0) return true;
        else return false;
    }

    function getObjects(triples) {
        if(isEmpty(triples)) return new Array();
        var objects = new Array();
        for(var i = 0;i < triples.length;i++)
            objects.push(triples[i].object);
        return objects;
    }

    // Returns an array of strings
    this.parseResults = function(results) {
        if(isEmpty(results)) return null;
        var values = new Array();
        if(results instanceof Array) {
            for(var i = 0;i < results.length;i++) {
                var subValues = anchor.parseResults(results[i]);
                if(subValues == null) continue;
                else if(subValues instanceof Array)
                    for(var j = 0;j < subValues.length;j++)
                        values.push(subValues[j]);
            }
        }
        else if(results instanceof DataContainer) {
            var datum = "";
            for(var i = 0;i < results.data.length;i++) {
                var str = "";
                if(results.data[i] instanceof Array) {
                    if(results.data[i][0].constructor === String) // "Hello" instanceof String -> false
                        str = results.data[i].toString();
                    else if(results.data[i][0] instanceof DataContainer)
                        str = this.parseResults(results.data[i][0]);
                }
                else if(results.data[i].constructor === String)
                    str = results.data[i].toString();
                else if(results.data[i] instanceof DataContainer)
                    str = this.parseResults(results.data[i]);
                datum += str;
                if(i < results.data.length-1) datum += " ";
            }
            values.push(datum);
        }
        return values;
    }

    function getBaseURI(uri) {
        if(uri.indexOf('#') >= 0)
            return uri.substring(0,uri.indexOf('#'));
        else
            return uri;
    }

    this.debugStatement = function(obj) {
        if(obj == null) alert('null');
        else alert(obj.toSource());
        return obj;
    }


    /**********************************
     *   Shortcuts & Abbreviations    *
     **********************************/
    this.MultipleOrTypeNode = function(uri, children) {
        return new this.PatternNode(this.searchByObjectType(uri),this.fetchMultipleOr,children);
    }
    this.MultipleOrPredicateNode = function(uri, children) {
        return new this.PatternNode(this.searchByPredicate(uri),this.fetchMultipleOr,children);
    }
    this.MultipleTypeEndNode = function(uri) {
        return new this.PatternNode(this.searchByObjectType(uri),this.fetchMultiple);
    }
    this.MultiplePredicateEndNode = function(uri) {
        return new this.PatternNode(this.searchByPredicate(uri),this.fetchMultiple);
    }
    this.SingleOrTypeNode = function(uri, children) {
        return new this.PatternNode(this.searchByObjectType(uri),this.fetchSingleOr,children);
    }
    this.SingleOrPredicateNode = function(uri, children) {
        return new this.PatternNode(this.searchByPredicate(uri),this.fetchSingleOr,children);
    }
    this.SingleTypeEndNode = function(uri) {
        return new this.PatternNode(this.searchByObjectType(uri),this.fetchSingle);
    }
    this.SinglePredicateEndNode = function(uri) {
        return new this.PatternNode(this.searchByPredicate(uri),this.fetchSingle);
    }
    this.AndTypeNode = function(uri, children) {
        return new this.PatternNode(this.searchByObjectType(uri),this.fetchAnd,children);
    }
    this.AndPredicateNode = function(uri, children) {
        return new this.PatternNode(this.searchByPredicate(uri),this.fetchAnd,children);
    }
    this.MultipleOrBlankNode = function(children) {
        return new this.PatternNode(this.searchBlankPatternNode(),this.fetchMultipleOr,children);
    }
    this.SingleOrBlankNode = function(children) {
        return new this.PatternNode(this.searchBlankPatternNode(),this.fetchSingleOr,children);
    }
    this.AndBlankNode = function(children) {
        return new this.PatternNode(this.searchBlankPatternNode(),this.fetchAnd,children);
    }

    this.MOTN = this.MultipleOrTypeNode;
    this.MOPN = this.MultipleOrPredicateNode;
    this.MTEN = this.MultipleTypeEndNode;
    this.MPEN = this.MultiplePredicateEndNode;
    this.SOTN = this.SingleOrTypeNode;
    this.SOPN = this.SingleOrPredicateNode;
    this.STEN = this.SingleTypeEndNode;
    this.SPEN = this.SinglePredicateEndNode;
    this.APN = this.AndPredicateNode;
    this.ATN = this.AndTypeNode;
    this.MOBN = this.MultipleOrBlankNode;
    this.SOBN = this.SingleOrBlankNode;
    this.ABN = this.AndBlankNode;

    /*********************************
     *    Special Syntax Parser      *
     *********************************/
    this.parseToTree = function(stringTree) {
        // takes in another tree that is placed within brackets and integrates it into the new tree
        function reallocate(tree) { // this function was a pain to debug
            var numberOfSpaces = new Array();
            var treeArray = stringTree.split("\n");
            for(var i = 0;i < treeArray.length;i++) {
                var leftBrackets = indicesOf("[",treeArray[i]);
                var rightBrackets = indicesOf("]",treeArray[i]);
                var toBeAdded = 0;
                if(leftBrackets.length > 0)
                    toBeAdded = treeArray[i].lastIndexOf(">",leftBrackets[leftBrackets.length-1])-(leftBrackets.length)+3;
                var toBePopped = rightBrackets.length;
                var spaces = sumArray(numberOfSpaces);

                treeArray[i] = createBlankString(spaces) + treeArray[i];
                if(toBeAdded > 0) numberOfSpaces.push(toBeAdded);
                for(;toBePopped > 0;toBePopped--)
                    numberOfSpaces.pop();
                treeArray[i] = treeArray[i].replace(/\[/g,"").replace(/\]/g,"");
            }
            var newTree = "";
            for(var i = 0;i < treeArray.length;i++)
                newTree += treeArray[i]+(i+1==treeArray.length?"":"\n");
            return newTree;
        }
        // Sums the members of an array
        function sumArray(arr) {
            var sum = 0;
            for(var i = 0;i < arr.length;i++)
                sum += arr[i];
            return sum;
        }
        // Creates a blank string of length size
        function createBlankString(size) {
            var str = "";
            for(var i = 0;i < size;i++)
                str += " ";
            return str;
        }
        // replaces the chars between begIndex and endIndex;
        // inclusive and non-inclusive, respectively; with newStr
        function insertString(str,newStr,begIndex, endIndex) {
            return str.substring(0,begIndex).concat(newStr).concat(str.substring(endIndex));
        }
        // Returns the level of the node in the tree
        function nodeLevel(currentIndex,currentLine,indicesLevels) {
            for(var line = currentLine-1;line >= 0;line--)
                for(var index = indicesLevels[line].length-1;index >= 0;index--)
                    if(indicesLevels[line][index] == null) break;
                    else if(indicesLevels[line][index][0] == currentIndex &&
                           (index == 0 || indicesLevels[line][index-1] != null))
                        return indicesLevels[line][index][1];
            return indicesLevels[currentLine][indicesLevels[currentLine].length-1][1]+1;
        }
        // Returns an array of the indices of the char ch in str
        function indicesOf(ch,str) {
            var indices = new Array();
            var index = str.indexOf(ch);
            while(index != -1) {
                indices.push(index);
                index = str.indexOf(ch,index+1);
            }
            return indices;
        }

        // Builds a two-dimensional array of doubles with the level and index of each '>'
        alert("StringTree:\n"+stringTree);
        var reallocatedString = reallocate(stringTree).replace(/ \^/g," >^");
        alert("ReallocatedString:\n"+reallocatedString);
        var splicedString = reallocatedString.split("\n");
        var indicesLevels = new Array();
        for(var line = 0;line < splicedString.length;line++) {
            indicesLevels.push(new Array());
            var lineIndices = indicesOf(">",splicedString[line]);
            var levelOffset = 0;
            if(line > 0) levelOffset = nodeLevel(lineIndices[0],line,indicesLevels);
            else { lineIndices.push(0); lineIndices.sort(function(a,b){return a - b;}); }
            for(var nullLevel = 0;nullLevel < levelOffset;nullLevel++)
                indicesLevels[line].push(null);
            for(var level = 0;level < lineIndices.length;level++)
                indicesLevels[line].push([lineIndices[level],level+levelOffset])
        }
        alert(indicesLevels.toSource());


        // Builds a two-dimensional array of nodes resembling the original string
        var stringTree = new Array();
        for(var line = 0;line < indicesLevels.length;line++) {
            stringTree.push(new Array());
            var level = 0;
            for(;level < indicesLevels[line].length && indicesLevels[line][level] == null;level++)
                stringTree[line].push(null);
            for(;level < indicesLevels[line].length;level++) {
                var start = indicesLevels[line][level][0];
                if(level+1 < indicesLevels[line].length) {
                    var end = indicesLevels[line][level+1][0];
                    stringTree[line].push(splicedString[line].substring(start,end)
                    .replace(/ /g,"").replace(/>/g,""));
                }
                else
                    stringTree[line].push(splicedString[line].substring(start)
                    .replace(/ /g,"").replace(/>/g,""));
            }
        }
        alert(stringTree.toSource());
        // ^^ WORKS TILL HERE

        function instantiateNode(nodeString) {
            if(nodeString == null) return null;
            else if(nodeString.length == 0) return anchor.SOBN();
            else if(nodeString.indexOf("^") != -1) return nodeString;
            var nodeString = nodeString.replace(/\(/g,"").replace(/\)/g,"");
            var params = nodeString.split(",");
            if(params[0] === "S" && params[1] === "O" && params[3]) {
                if(params[2] === "T") return anchor.SOTN(params[3]);
                else if(params[2] === "P") return anchor.SOPN(params[3]);
            }
            else if(params[0] === "M" && params[1] === "O" && params[3]) {
                if(params[2] === "T") return anchor.MOTN(params[3]);
                else if(params[2] === "P") return anchor.MOPN(params[3]);
            }
            else if(params[0] === "S" && params[1] === "O" && params[2] === "N")
                return anchor.SOBN();
            else if(params[0] === "S" && params[3]) {
                if(params[2] === "T") return anchor.STEN(params[3]);
                else if(params[2] === "P") return anchor.SPEN(params[3]);
            }
            else if(params[0] === "M" && params[3]) {
                if(params[2] === "T") return anchor.MTEN(params[3]);
                else if(params[2] === "P") return anchor.MPEN(params[3]);
            }
            else if(params[1] === "A")
                return anchor.ABN();
            alert("Unrecognized node string value: "+params.toSource());
            return nodeString;
        }

        var instantiatedNodes = new Array();
        for(var line = 0;line < stringTree.length;line++) {
            var lineInstantiatedNodes = new Array();
            instantiatedNodes.push(lineInstantiatedNodes);
            for(var level = 0;level < indicesLevels[line].length;level++)
                lineInstantiatedNodes.push(instantiateNode(stringTree[line][level]));
        }
        alert(instantiatedNodes.toSource());

        function linkNodes(nodes,line,level) {
            if(nodes[line].length == level+1) return nodes[line][level];
            nodes[line][level].children = new Array();
            for(var endingLine = line;nodes[endingLine]&&(nodes[endingLine][level]===null||endingLine==line);endingLine++);
            alert("Number of possible children: "+endingLine);
            for(var i = line;i < endingLine;i++) {
                var childrenLevel = level+1;
                if(nodes[i] && nodes[i][childrenLevel]) {
                    if(nodes[i][childrenLevel].constructor === String) {
                        var numNodes = indicesOf("^",nodes[i][childrenLevel]).length;
                        for(var j=i-1;numNodes > 0 && j >= 0;j--) {
                            if(nodes[j] != null && numNodes == 1)
                                nodes[i][childrenLevel] = nodes[j][childrenLevel];
                            if(nodes[j] != null) numNodes--;
                        }
                        if(numNodes > 0) nodes[line][level].children.push(null);
                        else nodes[line][level].children.push(nodes[i][childrenLevel]);
                    }
                    else
                        nodes[line][level].children.push(linkNodes(nodes,i,childrenLevel));
                }
            }
            return nodes[line][level];
        }

        return linkNodes(instantiatedNodes,0,0);
    }
    function printArr(arr) {
        str = "";
        for(var i = 0;i < arr.length;i++)
            str += arr[i]+"\n";
        return str;
    }
}




/* Unused functions

        // Gets two bracket indices, within which there are no brackets
        function getBrackets(tree) {
            var left = indicesOf("[",tree);
            var right = indicesOf("]",tree);
            if(left.length != right.length) alert("Unequal number of brackets");
            if(left.length == 0 || right.length == 0) return [];
            var pair = [left[0],right[0]];
            for(var l = 0;l < left.length;l++)
                for(var r = 0;r < right.length;r++)
                    if(right[r]-left[l]<pair[1]-pair[0] && right[r]-left[l]>0) {
                        minim = right[r] - left[l];
                        pair = [left[l],right[r]];
                    }
            return pair;
        }

        // Returns the first char in a string that is not a space
        function firstNonspace(lineString) {
            return lineString.indexOf(lineString.replace(/ /g,"").charAt(0));
        }

*/
