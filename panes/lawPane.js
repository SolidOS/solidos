/*  Lawyer Pane
*
*  This pane shows the Lawyer's view of reasoning
*
*/

var UI = require('solid-ui')

var LawPane = module.exports = {};

LawPane.icon = tabulator.Icon.src.icon_LawPane;
LawPane.name = 'Law';

LawPane.label = function(subject) {

    stsJust = UI.store.statementsMatching(undefined, ap_just, undefined, subject);

        for (var j=0; j<stsJust.length; j++){
            if (stsJust[j].subject.termType == 'formula'){
            var sts = stsJust[j].subject.statements;
            for (var k=0; k<sts.length; k++){
                if (sts[k].predicate.toString() == ap_compliant.toString()){
                    stsCompliant = sts[k];
                	return "Lawyer's View";

                }
                if (sts[k].predicate.toString() == ap_nonCompliant.toString()){
                    stsNonCompliant = sts[k];
                    return "Lawyer's View";
               	}
               }
            }
        }

   return null;
};

//TODO handle more than one log file and policy file
//This is a very clumsy method and should be changed
//this returns the log and the policy file URIs from the full URI
//Fails when there are multiple logs and policy files
extractFileURIs = function(fullURI){
	var uris = [];
	var logPos = fullURI.search(/logFile=/);
	var rulPos = fullURI.search(/&rulesFile=/);
	uris.push(fullURI.substring(logPos+8, rulPos));
	uris.push(fullURI.substring(rulPos+11, fullURI.length));
	return uris;
}

LawPane.display = function(myDocument,obj){
	var div = myDocument.createElement("div");
	for (var i=0; i<obj.elements.length; i++) {
        switch(obj.elements[i].termType) {
            case 'symbol':
                var anchor = myDocument.createElement('a')
                anchor.setAttribute('href', obj.elements[i].uri)
                anchor.appendChild(myDocument.createTextNode(UI.utils.label(obj.elements[i])));
                div.appendChild(anchor);

            case 'literal':
            	if (obj.elements[i].value != undefined)
                	div.appendChild(myDocument.createTextNode(obj.elements[i].value));
        }
	}
	return div;
}

LawPane.render = function(subject, myDocument) {
    var kb = UI.store
	var collapse_icon = tabulator.Icon.src.icon_collapse;
	var expand_icon = tabulator.Icon.src.icon_expand;

	LawPane.render.show = function(evt){
		evt["target"].src = collapse_icon;
		evt["target"].removeEventListener('click',LawPane.render.show, false);
		evt["target"].addEventListener('click',LawPane.render.hide, false);
		var id = evt["target"].id.toString().substring(4); //images have ids 'img_n' where 'n' is the id we are seeking
		myDocument.getElementById("td_"+id).setAttribute('style','display:block');

	}

	LawPane.render.hide = function(evt){
		evt["target"].src = expand_icon;
		evt["target"].removeEventListener('click',LawPane.render.hide, false);
		evt["target"].addEventListener('click',LawPane.render.show, false);
		var id = evt["target"].id.toString().substring(4); //images have ids 'img_n' where 'n' is the id we are seeking
		myDocument.getElementById("td_"+id).setAttribute('style','display:none');
	}

    var div = myDocument.createElement("div");
   div.setAttribute('class', 'instancePane')
   div.setAttribute('style', '  border-top: solid 1px #777; border-bottom: solid 1px #777; margin-top: 0.5em; margin-bottom: 0.5em ')

    //Extract the log and policy files
    var uris = extractFileURIs(myDocument.location.toString());
    var policy = uris.pop();
    var log = uris.pop();

    //Retrieve policy file to get the description of the policy
	var xmlhttp = UI.rdf.Util.XMLHTTPFactory();
	xmlhttp.onreadystatechange=state_Change;
	xmlhttp.open("GET",policy,true);
	xmlhttp.send(null);
	function state_Change(){
		if (xmlhttp.readyState==4 && xmlhttp.status==200){
			var policy_text = xmlhttp.responseText.toString();
			var start_index = policy_text.search("rdfs:comment");
			var end_index = 0;
			if (start_index > -1){
				var newStr = policy_text;
				end_index = newStr.slice(start_index).search(/";/); //"
			}
			var rule_statement = policy_text.substring(start_index+"rdfs:comment".length+2, start_index+end_index);
			if (myDocument.getElementById('td_2') != null)
				myDocument.getElementById('td_2').innerHTML = rule_statement;
		  }
	}


    var stsJust = kb.statementsMatching(undefined, ap_just, undefined, subject);

 	// TODO: & FIXME: There could be a bug here, but that all depends on the format of the proof tree
 	// {non-compliant/compliant} air:description (the description) stuff could appear more than once
 	// The code here wil push all that to 'stsDescAll'
 	// The problem is there is no direct correlation with these initial description statements and once
 	// that are obtained by following the rule names
 	var stsDescAll = [];
 	var stsAnalysisAll = [];
 	var stsDesc = kb.statementsMatching(undefined, ap_description, undefined, subject);
    for (var j=0; j<stsDesc.length; j++){
	    if (stsDesc[j].subject.termType == 'formula' && stsDesc[j].object.termType == 'collection'){
	    	    stsAnalysisAll.push(LawPane.display(myDocument, stsDesc[j].object));
		}
	}
	var stsFound = [];
	for (var j=0; j<stsJust.length; j++){
	    if (stsJust[j].subject.termType == 'formula'){
	        var sts = stsJust[j].subject.statements;
	        for (var k=0; k<sts.length; k++){
	            if (sts[k].predicate.toString() == ap_compliant.toString() ||
	            	sts[k].predicate.toString() == ap_nonCompliant.toString()){
	                stsFound.push(sts[k]);
	            }
	        }
	        if (stsJust[j].object.termType == 'bnode'){
            	var ruleNameSts = kb.statementsMatching(stsJust[j].object, ap_ruleName, undefined, subject);
            	var ruleNameFound =	ruleNameSts[0].object; // This would be the initial rule name

            	var terminatingCondition = kb.statementsMatching(ruleNameFound, ap_just, ap_prem, subject);
				while (terminatingCondition[0] == undefined){
	            	var currentRule = kb.statementsMatching( undefined, undefined, ruleNameFound, subject);
	            	if (currentRule[0].object.termType == 'collection'){
			    	    stsDescAll.push(LawPane.display(myDocument, currentRule[0].object));
	                }
	        		var currentRuleSts = kb.statementsMatching(currentRule[0].subject, ap_just, undefined, subject);
				   	var nextRuleSts = kb.statementsMatching(currentRuleSts[0].object, ap_ruleName, undefined, subject);
				   	ruleNameFound = nextRuleSts[0].object;
			   		terminatingCondition = kb.statementsMatching(ruleNameFound, ap_just, ap_prem, subject);
				}
	        }
	   	}
	}

    //Create the Issue div

    var div_issue = myDocument.createElement("div");
    div_issue.setAttribute('class', 'title');
    var table_issue = myDocument.createElement("table");
    var tr_issue = myDocument.createElement("tr");
    var td_img_issue = myDocument.createElement("td");
    var img_issue = myDocument.createElement("img");
    img_issue.setAttribute("src", collapse_icon);
    img_issue.id = "img_1";
    img_issue.addEventListener('click',LawPane.render.hide, false);
    td_img_issue.appendChild(img_issue);
    tr_issue.appendChild(td_img_issue);
    var td_issue = myDocument.createElement("td");
    td_issue.appendChild(myDocument.createTextNode('Issue:'));
    tr_issue.appendChild(td_issue);
    table_issue.appendChild(tr_issue);
    div_issue.appendChild(table_issue);

    var div_issue_data = myDocument.createElement("div");
    div_issue_data.setAttribute('class', 'irfac');
    div_issue_data.id = "td_1";
 //   div_issue_data.setAttribute('style','display:none');
    var table_issue_data = myDocument.createElement("table");
    var tr_issue_data = myDocument.createElement('tr');
    var td_issue_dummy = myDocument.createElement('td');
    td_issue_dummy.appendChild(myDocument.createTextNode(' '));
    tr_issue_data.appendChild(td_issue_dummy);
	var td_issue_data = myDocument.createElement('td');
    td_issue_data.appendChild(myDocument.createTextNode('Whether the transactions in '));
    var a_log = myDocument.createElement('a')
    a_log.setAttribute('href', log)
    a_log.appendChild(myDocument.createTextNode("log"));
    td_issue_data.appendChild(a_log);
    td_issue_data.appendChild(myDocument.createTextNode(' comply with '));
    var a_policy = myDocument.createElement('a')
    a_policy.setAttribute('href', policy)
    a_policy.appendChild(myDocument.createTextNode(UI.utils.label(stsFound[0].object)));
    td_issue_data.appendChild(a_policy);
    tr_issue_data.appendChild(td_issue_data);
    table_issue_data.appendChild(tr_issue_data);
    div_issue_data.appendChild(table_issue_data);

    div.appendChild(div_issue);
    div.appendChild(div_issue_data);

    //End of Issue

    //Create the Rules div

    var div_rule = myDocument.createElement("div");
    div_rule.setAttribute('id', 'div_rule');
    div_rule.setAttribute('class', 'title');

    var table_rule = myDocument.createElement("table");
    var tr_rule = myDocument.createElement("tr");
    var td_img_rule = myDocument.createElement("td");
    var img_rule = myDocument.createElement("img");
    img_rule.setAttribute("src", collapse_icon);
    img_rule.id = "img_2";
    img_rule.addEventListener('click',LawPane.render.hide, false);
    td_img_rule.appendChild(img_rule);
    tr_rule.appendChild(td_img_rule);
    var td_rule = myDocument.createElement("td");
    td_rule.appendChild(myDocument.createTextNode('Rule:'));
    tr_rule.appendChild(td_rule);
    table_rule.appendChild(tr_rule);
    div_rule.appendChild(table_rule);
    div.appendChild(div_rule);

	var div_rule_data = myDocument.createElement("div");
//    div_rule_data.setAttribute('style','display:none');
    div_rule_data.setAttribute('class', 'irfac');
    div_rule_data.id = 'td_2';
    var table_rule_data = myDocument.createElement("table");
    var tr_rule_data = myDocument.createElement('tr');
    var td_rule_dummy = myDocument.createElement('td');
    td_rule_dummy.appendChild(myDocument.createTextNode(' '));
    tr_rule_data.appendChild(td_rule_dummy);
	var td_rule_data = myDocument.createElement('td');
    td_rule_data.id = 'td_2';
    td_rule_data.appendChild(myDocument.createTextNode('Rule(s) is/are specified in '));
    var a_policy = myDocument.createElement('a')
    a_policy.setAttribute('href', policy)
    a_policy.appendChild(myDocument.createTextNode(policy));
    td_rule_data.appendChild(a_policy);
    tr_rule_data.appendChild(td_rule_data);
	table_rule_data.appendChild(tr_rule_data);
    div_rule_data.appendChild(table_rule_data);
    div.appendChild(div_rule_data);

    //End of Rules

    //Create the Facts div

    var div_facts = myDocument.createElement("div");
    div_facts.setAttribute('id', 'div_facts');
    div_facts.setAttribute('class', 'title');
    var table_facts = myDocument.createElement("table");
    var tr_facts = myDocument.createElement("tr");
    var td_img_facts = myDocument.createElement("td");
    var img_facts = myDocument.createElement("img");
    img_facts.setAttribute("src", collapse_icon);
    img_facts.id = "img_3";
    img_facts.addEventListener('click',LawPane.render.hide, false);
    td_img_facts.appendChild(img_facts);
    tr_facts.appendChild(td_img_facts);
    var td_facts = myDocument.createElement("td");
    td_facts.appendChild(myDocument.createTextNode('Facts:'));
    tr_facts.appendChild(td_facts);
    table_facts.appendChild(tr_facts);
	div_facts.appendChild(table_facts);
	div.appendChild(div_facts);

	var div_facts_data = myDocument.createElement("div");
    div_facts_data.id = 'td_3';
    div_facts_data.setAttribute('class', 'irfac');
//   div_facts_data.setAttribute('style','display:none');
    var table_facts_data = myDocument.createElement("table");
	var tr_facts_data = myDocument.createElement('tr');
    var td_facts_dummy = myDocument.createElement('td');
    td_facts_dummy.appendChild(myDocument.createTextNode(' '));
    tr_facts_data.appendChild(td_facts_dummy);
    var td_facts_data = myDocument.createElement('td');
	var table_inner = myDocument.createElement("table");
    var tr = myDocument.createElement("tr");
    var td = myDocument.createElement("td");
	var list = myDocument.createElement("ul");
    for (var i=stsDescAll.length-1; i>=0; i--){
    	var li = myDocument.createElement("li");
    	li.appendChild(stsDescAll[i]);
    	list.appendChild(li);
    }
    td.appendChild(list);
    tr.appendChild(td);
	table_inner.appendChild(tr);
	td_facts_data.appendChild(table_inner);
	tr_facts_data.appendChild(td_facts_data);
    table_facts_data.appendChild(tr_facts_data);
    div_facts_data.appendChild(table_facts_data);
	div.appendChild(div_facts_data);

    //End of Facts

    //Create the Analysis div

    var div_analysis = myDocument.createElement("div");
    div_analysis.setAttribute('id', 'div_analysis');
    div_analysis.setAttribute('class', 'title');
    var table_analysis = myDocument.createElement("table");
    var tr_analysis = myDocument.createElement("tr");
    var td_img_analysis = myDocument.createElement("td");
    var img_analysis = myDocument.createElement("img");
    img_analysis.setAttribute("src", collapse_icon);
    img_analysis.id = "img_4";
    img_analysis.addEventListener('click',LawPane.render.hide, false);
    td_img_analysis.appendChild(img_analysis);
    tr_analysis.appendChild(td_img_analysis);
    var td_analysis = myDocument.createElement("td");
    td_analysis.appendChild(myDocument.createTextNode('Analysis:'));
    tr_analysis.appendChild(td_analysis);
    table_analysis.appendChild(tr_analysis);
	div_analysis.appendChild(table_analysis);
	div.appendChild(div_analysis);

	var div_analysis_data = myDocument.createElement("div");
    div_analysis_data.id = 'td_4';
   	div_analysis_data.setAttribute('class', 'irfac');
//    div_analysis_data.setAttribute('style','display:none');
    var table_analysis_data = myDocument.createElement("table");
	var tr_analysis_data = myDocument.createElement('tr');
    var td_analysis_dummy = myDocument.createElement('td');
    td_analysis_dummy.appendChild(myDocument.createTextNode(' '));
    tr_analysis_data.appendChild(td_analysis_dummy);
    var td_analysis_data = myDocument.createElement('td');
    var table_inner = myDocument.createElement("table");
    var tr = myDocument.createElement("tr");
    var td = myDocument.createElement("td");
    for (var i=0; i<stsAnalysisAll.length; i++){
    	td.appendChild(stsAnalysisAll[i]);
    }
    tr.appendChild(td);
	table_inner.appendChild(tr);
	td_analysis_data.appendChild(table_inner);
	tr_analysis_data.appendChild(td_analysis_data);
    table_analysis_data.appendChild(tr_analysis_data);
    div_analysis_data.appendChild(table_analysis_data);
    div.appendChild(div_analysis_data);

    //End of Analysis

    //Create the Conclusion div

    var div_conclusion = myDocument.createElement("div");
    div_conclusion.setAttribute('id', 'div_conclusion');
    div_conclusion.setAttribute('class', 'title');
    var table_conclusion = myDocument.createElement("table");
    var tr_conclusion = myDocument.createElement("tr");
    var td_img_conclusion = myDocument.createElement("td");
    var img_conclusion = myDocument.createElement("img");
    img_conclusion.setAttribute("src", collapse_icon);
    img_conclusion.id = "img_5";
    img_conclusion.addEventListener('click',LawPane.render.hide, false);
    td_img_conclusion.appendChild(img_conclusion);
    tr_conclusion.appendChild(td_img_conclusion);
    var td_conclusion = myDocument.createElement("td");
    td_conclusion.appendChild(myDocument.createTextNode('Conclusion:'));
    tr_conclusion.appendChild(td_conclusion);
    table_conclusion.appendChild(tr_conclusion);
	div_conclusion.appendChild(table_conclusion);
	div.appendChild(div_conclusion);

	var div_conclusion_data = myDocument.createElement("div");
    div_conclusion_data.id = 'td_5';
    div_conclusion_data.setAttribute('class', 'irfac');
//    div_conclusion_data.setAttribute('style','display:none');
    var table_conclusion_data = myDocument.createElement("table");
	var tr_conclusion_data = myDocument.createElement('tr');
    var td_conclusion_dummy = myDocument.createElement('td');
    td_conclusion_dummy.appendChild(myDocument.createTextNode(' '));
    tr_conclusion_data.appendChild(td_conclusion_dummy);
    var td_conclusion_data = myDocument.createElement('td');
	var table_inner = myDocument.createElement("table");
	for (var i=0; i<stsFound.length; i++){
            var tr = myDocument.createElement("tr");
            var td_intro = myDocument.createElement("td");
            td_intro.appendChild(myDocument.createTextNode('The transaction - '));
            tr.appendChild(td_intro);

            var td_s = myDocument.createElement("td");
            var a_s = myDocument.createElement('a')
            a_s.setAttribute('href', stsFound[i].subject.uri)
            a_s.appendChild(myDocument.createTextNode(UI.utils.label(stsFound[i].subject)));
            td_s.appendChild(a_s);
            tr.appendChild(td_s);

            var td_is = myDocument.createElement("td");
            td_is.appendChild(myDocument.createTextNode(' is '));
            tr.appendChild(td_is);

            var td_p = myDocument.createElement("td");
            td_p.appendChild(myDocument.createTextNode(UI.utils.label(stsFound[i].predicate)));
			tr.appendChild(td_p);

            var td_o = myDocument.createElement("td");
            var a_o = myDocument.createElement('a')
            a_o.setAttribute('href', stsFound[i].object.uri)
            a_o.appendChild(myDocument.createTextNode(UI.utils.label(stsFound[i].object)));
            td_o.appendChild(a_o);
            tr.appendChild(td_o);
            table_inner.appendChild(tr);
	}
	td_conclusion_data.appendChild(table_inner);
	tr_conclusion_data.appendChild(td_conclusion_data);
    table_conclusion_data.appendChild(tr_conclusion_data);
    div_conclusion_data.appendChild(table_conclusion_data);
    div.appendChild(div_conclusion_data);

    //End of Conclusion


    return div;

}


//ends
