module.exports = {
  icon: tabulator.Icon.src.icon_CVPane, // This icon should be defined in 'test.js' and 'tabulate.js'

  name: 'CV',

  label:
  /*function(subject)
  { return 'CV '
  },*/
  function (subject) { // 'subject' is the source of the document
    if (tabulator.preferences.get('me') == subject.uri)
      // the criteria for displaying the pane is satisfied
      return 'CV' // "the string that would be the title for the icon"
    else
      return null
  },

  render: function (subject, CVdocument) { // 'subject' is the source of the document
    // 'document' is the HTML document element we are attaching elements to

    var kb = UI.store
    var me = kb.sym(tabulator.preferences.get('me'))
    var foaf = RDFNamespace('http://xmlns.com/foaf/0.1/')
    var myName = kb.any(me, foaf('family_name')) + kb.any(me, foaf('givenname'))

    var content = CVdocument.createElement('div')
    content.className = 'CVclass'


    // for a School:
    var schoolForm = CVdocument.createElement('form')
    // School:
    var school = CVdocument.createElement('input')
    school.type = 'text'
    var schoolString = CVdocument.createTextNode('school:')
    schoolForm.appendChild(schoolString)
    schoolForm.appendChild(school)
    // eduStartDate:
    var eduStartDate = CVdocument.createElement('input')
    eduStartDate.type = 'text'
    var eduStartDateString = CVdocument.createTextNode('start date:')
    schoolForm.appendChild(eduStartDateString)
    schoolForm.appendChild(eduStartDate)
    // eduEndDate:
    var eduEndDate = CVdocument.createElement('input')
    eduEndDate.type = 'text'
    var eduEndDateString = CVdocument.createTextNode('end date:')
    schoolForm.appendChild(eduEndDateString)
    schoolForm.appendChild(eduEndDate)
    // eduMajor:
    var eduMajor = CVdocument.createElement('input')
    eduMajor.type = 'text'
    var eduMajorString = CVdocument.createTextNode('major:')
    schoolForm.appendChild(eduMajorString)
    schoolForm.appendChild(eduMajor)

    var schoolSubmit = CVdocument.createElement('input')
    schoolSubmit.type = 'submit'
    schoolForm.appendChild(schoolSubmit)

    // for a Company:
    var companyForm = CVdocument.createElement('form')
    // Company:
    var company = CVdocument.createElement('input')
    company.type = 'text'
    var companyString = CVdocument.createTextNode('company:')
    companyForm.appendChild(companyString)
    companyForm.appendChild(company)
    // startDate:
    var startDate = CVdocument.createElement('input')
    startDate.type = 'text'
    var startDateString = CVdocument.createTextNode('start date:')
    companyForm.appendChild(startDateString)
    companyForm.appendChild(startDate)
    // endDate:
    var endDate = CVdocument.createElement('input')
    endDate.type = 'text'
    var endDateString = CVdocument.createTextNode('end date:')
    companyForm.appendChild(endDateString)
    companyForm.appendChild(endDate)

    var companySubmit = CVdocument.createElement('input')
    companySubmit.type = 'submit'
    companyForm.appendChild(companySubmit)


    // for a Language:
    var tongueForm = CVdocument.createElement('form')
    var tongue = CVdocument.createElement('input')
    tongue.type = 'text'
    var tongueString = CVdocument.createTextNode('language:')
    tongueForm.appendChild(tongueString)
    tongueForm.appendChild(tongue)

    var tongueSubmit = CVdocument.createElement('input')
    tongueSubmit.type = 'submit'
    tongueForm.appendChild(tongueSubmit)


    // The Menu:
    var menu = CVdocument.createElement('select')
    var optionCompany = CVdocument.createElement('option')
    optionCompany.innerHTML = 'add a work history entry'
    menu.appendChild(optionCompany)
    var optionSchool = CVdocument.createElement('option')
    optionSchool.innerHTML = 'add an education entry'
    menu.appendChild(optionSchool)
    var optionLanguage = CVdocument.createElement('option')
    optionLanguage.innerHTML = 'add an language entry'
    menu.appendChild(optionLanguage)
    content.appendChild(menu)

    var displayForm = function () {
      if (menu.options[menu.selectedIndex].text == 'add a work history entry') {
        content.appendChild(companyForm)
      }
      else if (menu.options[menu.selectedIndex].text == 'add an education entry') {
        content.appendChild(schoolForm)
      }
      else if (menu.options[menu.selectedIndex].text == 'add an language entry') {
        content.appendChild(tongueForm)
      }
    }

    var currentForm = function () {
      if (companyForm.parentNode == content) {
        var currentForm = companyForm
      }
      else if (schoolForm.parentNode == content) {
        var currentForm = schoolForm
      }
      else if (tongueForm.parentNode == content) {
        var currentForm = tongueForm
      }
      return currentForm
    }


    var removeForm = function () {
      content.removeChild(currentForm())
    }

    displayForm()

    var switchForms = function () {
      removeForm()
      displayForm()
    }

    menu.addEventListener('change', switchForms, false)

    var sparqlUpdater = new sparql(kb)
    var RDF = UI.ns.rdf
    var infoDump = kb.sym('http://dig.csail.mit.edu/2007/wiki/sandbox/cv')
    var cv = RDFNamespace('http://purl.org/captsolo/resume-rdf/0.2/base#')

    var companyUpdate = function () {
      var callback = function () {
        alert('COMPANY stuff is DONE')
      }
      var companyURI = kb.sym('http://dig.csail.mit.edu/2007/wiki/sandbox/cv#' + myName + 'C' + company.value)
      var batch = [
        new RDFStatement(me, cv('employedIn'), companyURI, infoDump),
        new RDFStatement(companyURI, RDF('title'), company.value, infoDump),
        new RDFStatement(companyURI, cv('startDate'), startDate.value, infoDump),
        new RDFStatement(companyURI, cv('endDate'), endDate.value, infoDump),
      ]
      sparqlUpdater.insert_statement(batch, callback)
    }

    var schoolUpdate = function () {
      var callback = function () {
        alert('SCHOOL stuff is DONE')
      }
      var schoolURI = kb.sym('http://dig.csail.mit.edu/2007/wiki/sandbox/cv#' + myName + 'S' + school.value)
      var batch = [
        new RDFStatement(me, cv('studiedIn'), schoolURI, infoDump),
        new RDFStatement(schoolURI, RDF('title'), school.value, infoDump),
        new RDFStatement(schoolURI, cv('eduStartDate'), eduStartDate.value, infoDump),
        new RDFStatement(schoolURI, cv('eduEndDate'), eduEndDate.value, infoDump),
        new RDFStatement(schoolURI, cv('eduMajor'), eduMajor.value, infoDump),
      ]
      sparqlUpdater.insert_statement(batch, callback)
    }

    var tongueUpdate = function () {
      var callback = function () {
        alert('LANGUAGE stuff is DONE')
      }
      var tongueURI = kb.sym('http://dig.csail.mit.edu/2007/wiki/sandbox/cv#' + myName + 'L' + tongue.value)
      var batch = [
        new RDFStatement(me, cv('languageSkill'), tongueURI, infoDump),
      ]
      sparqlUpdater.insert_statement(batch, callback)
    }



    companyForm.addEventListener('submit', companyUpdate, false)
    schoolForm.addEventListener('submit', schoolUpdate, false)
    tongueForm.addEventListener('submit', tongueUpdate, false)


    return content
  }
}
