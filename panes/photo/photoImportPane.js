// Begin photoImportPane

/*
  This pane is for users to import their photos from Flickr
  The photos will be described using the photo access control ontology:
  http://people.csail.mit.edu/albert08/project/ont/pac.rdf
*/
var UI = require('solid-ui')

var photoImportPane = module.imports = {}
photoImportPane.icon = tabulator.Icon.src.icon_photoImportPane
photoImportPane.name = 'photo import'

// namespace and shorthand for concepts in the tag ontology
var RDF = UI.rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
var RDFS = UI.rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#')
var TAGS = UI.rdf.Namespace('http://www.holygoat.co.uk/owl/redwood/0.1/tags/')
var PAC = UI.rdf.Namespace('http://dig.csail.mit.edu/2008/PAC/ontology/pac#')

photoImportPane.label = function (subject) {
  var kb = UI.store
  if (subject.uri == undefined) {
    return null
  }
  var docURI = subject.uri.substring(0, subject.uri.lastIndexOf('#'))
  var outline = tabulator.outline
  var editable = outline.UserInput.sparqler.editable(docURI, kb)

  // alert(photoImportPane.render.ReadCookie("pacoidcookie_uri"))

  if (!kb.whether(subject, RDF('type'), PAC('PhotoAlbum'))) {
    return null
  }
  if (!kb.whether(subject, PAC('OwnerFlickrID'), undefined)) {
    return null
  }
  if (!editable) {
    return null
  }
  return 'Photo Album Import'
}

photoImportPane.render = function (subject, myDocument) {
  var kb = UI.store
  var new_photos = []
  var docURI = subject.uri.substring(0, subject.uri.lastIndexOf('#'))
  var stWhy = new UI.rdf.NamedNode(docURI)

  // ##########################################################################
  photoImportPane.render.ReadCookie = function (name) {
    var nameEQ = name + '='
    var ca = myDocument.cookie.split(';')
    for (var i = 0;i < ca.length;i++) {
      var c = ca[i]
      while (c.charAt(0) == ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  // #########################################################################

  // #########################################################################
  // Get information of the photo album

  // Obtain the photos currently included in the album
  var existing_photos = []
  ps = kb.each(subject, PAC('Contains'), undefined, stWhy)
  for (i = 0; i < ps.length; i++) {
    existing_photos.push(ps[i].uri)
  }

  // Owner of the album
  var owner = kb.the(subject, PAC('Owner'), undefined)

  // Tags in the album
  var existing_tags = []
  var tag_uris = {}
  var ts = kb.each(undefined, RDF('type'), TAGS('Tag'), stWhy)
  for (i = 0; i < ts.length; i++) {
    var label = kb.the(ts[i], RDFS('label'), undefined, stWhy)
    existing_tags.push(label.toString())
    tag_uris[label] = ts[i].uri
  }
  // #########################################################################

  // A function to insert a photo and its metadata to the RDF file using SPARQL
  photoImportPane.render.InsertPhotoItem = function (e) {
    var id = e.target.id
    id = id.substring(id.lastIndexOf('_') + 1, id.length)

    var time = new Date()
    var taggingID = time.getTime()

    // insert triples into the RDF file
    var triples = []
    var tagging = new UI.rdf.NamedNode(docURI + '#tagging' + taggingID)
    var photo = new UI.rdf.NamedNode(new_photos[id].url)

    triples.push(new UI.rdf.Statement(subject, PAC('Contains'), photo, stWhy))
    triples.push(new UI.rdf.Statement(photo, PAC('hasTagging'), tagging, stWhy))
    triples.push(new UI.rdf.Statement(tagging, TAGS('taggedResource'), photo, stWhy))
    triples.push(new UI.rdf.Statement(tagging, TAGS('taggedBy'), owner, stWhy))

    for (var i = 0; i < new_photos[id].tags.length; i++) {
      tag = new_photos[id].tags[i]
      var tag_uri = docURI + '#' + tag
      var seeAlso = 'http://www.flickr.com/photos/tags/' + tag
      if (existing_tags.indexOf(tag) == -1) {
        tag_ref = new UI.rdf.NamedNode(tag_uri)
        triples.push(new UI.rdf.Statement(tag_ref, RDF('type'), TAGS('Tag'), stWhy))
        triples.push(new UI.rdf.Statement(tag_ref, RDFS('seeAlso'), new UI.rdf.NamedNode(seeAlso), stWhy))
        triples.push(new UI.rdf.Statement(tag_ref, RDFS('label'), new UI.rdf.Literal(tag), stWhy))
      }
      triples.push(new UI.rdf.Statement(tagging, TAGS('associatedTag'), new UI.rdf.NamedNode(tag_uri), stWhy))
      existing_tags.push(tag)
      tag_uris[tag] = tag_uri
    }

    photoImportPane.render.InsertTriples(triples, id)
  }

  // A function to remove a photo when the close icon is pressed
  photoImportPane.render.RemovePhotoItem = function (e) {
    var id = e.target.id
    id = id.substring(id.lastIndexOf('_') + 1, id.length)
    var item = myDocument.getElementById(id)
    photoPanel.removeChild(item)
  }

  /* A function for creating a panel for a photo
     Require parameters: 1. URL of the photo (img src)
                         2. tags (an array)
                         3. ID of this DIV element
  */
  photoImportPane.render.CreatePhotoPanel = function (url, tags, id) {
    var photo_item_div = myDocument.createElement('div')
    photo_item_div.setAttribute('class', 'photoItem')
    photo_item_div.setAttribute('id', id)
    var photo_frame_div = myDocument.createElement('div')
    photo_frame_div.setAttribute('class', 'photoFrame')

    var img = myDocument.createElement('img')
    img.setAttribute('src', url)
    img.setAttribute('class', 'photoThumbnail')
    photo_frame_div.appendChild(img)
    photo_item_div.appendChild(photo_frame_div)

    var photo_item_tags_div = myDocument.createElement('div')
    photo_item_tags_div.setAttribute('class', 'photoListTags')

    for (var j = 0; j < tags.length; j++) {
      var tag_div = myDocument.createElement('div')
      tag_div.setAttribute('class', 'photoList_tag')
      tag_div.appendChild(myDocument.createTextNode(tags[j]))
      photo_item_tags_div.appendChild(tag_div)
    }

    photo_item_div.appendChild(photo_item_tags_div)

    // Add control buttons
    var controls = myDocument.createElement('div')
    controls.setAttribute('class', 'controls')

    var addButton = myDocument.createElement('input')
    addButton.setAttribute('type', 'button')
    addButton.setAttribute('value', 'Add to Album')
    addButton.setAttribute('class', 'controlButton')
    addButton.setAttribute('id', 'addButton_' + id.toString())
    addButton.addEventListener('click', photoImportPane.render.InsertPhotoItem, false)

    var closeButton = myDocument.createElement('input')
    closeButton.setAttribute('type', 'button')
    closeButton.setAttribute('value', 'Remove')
    closeButton.setAttribute('class', 'controlButton')
    closeButton.setAttribute('id', 'closeButton_' + id.toString())
    closeButton.addEventListener('click', photoImportPane.render.RemovePhotoItem, false)

    controls.appendChild(addButton)
    controls.appendChild(closeButton)
    photo_item_div.appendChild(controls)

    return photo_item_div
  }

  photoImportPane.render.InsertTriples = function (triples, id) {
    // var st = new RDFStatement(PAC('PhotoAlbum'),PAC('Owner'),ME('me'))
    var sparqlService = new UI.rdf.UpdateManager(kb)
    sparqlService.insert_statement(triples, function (uri, success, error) {
      if (!success) {
        alert('Error.')
      } else {
        alert('The photo has been added to the photo album successfully.')
        for (var i = 0; i < triples.length; i++) {
          triples[i] = kb.add(triples[i].subject, triples[i].predicate, triples[i].object, triples[i].why)
        }
        var item = myDocument.getElementById(id)
        photoPanel.removeChild(item)
      }
    })
  }

  // Code for handling the download of Flickr Data
  // The Callback function for JSON data from Flickr
  jsonFlickrApi = function (rsp) {
    if (rsp.stat != 'ok') {
      alert('Cannot download data from Flickr.')
      return
    }
    // Clear the content of the photo list
    photoPanel.innerHTML = ''
    // Populating the List of photos
    for (var i = 0; i < rsp.photos.photo.length; i++) {
      var id = rsp.photos.photo[i].id
      var secret = rsp.photos.photo[i].secret
      var server = rsp.photos.photo[i].server
      var farm = rsp.photos.photo[i].farm
      var tags = rsp.photos.photo[i].tags.split(' ')
      var url = 'http://farm' + farm + '.static.flickr.com/' + server + '/' + id + '_' + secret + '.jpg'
      var url_m = 'http://farm' + farm + '.static.flickr.com/' + server + '/' + id + '_' + secret + '_m.jpg'
      // If it is already in the album, skip the photo
      if (existing_photos.indexOf(url) > -1) {
        continue
      }

      // Add the photo to the array for future retrieval
      var temp_photo = { }
      temp_photo.tags = tags
      temp_photo.url = url
      pid = farm + ':' + server + ':' + id + ':' + secret
      new_photos[pid] = temp_photo

      photoPanel.appendChild(photoImportPane.render.CreatePhotoPanel(url_m, tags, pid))
    }

  }
  // Function for Using the Flickr JSON API to obtain photo data
  photoImportPane.render.LoadFlickrData = function () {
    var xmlhttp = new XMLHttpRequest()
    xmlhttp.onreadystatechange = state_Change
    var url = 'http://api.flickr.com/services/rest/'
    url += '?method=flickr.photos.search'
    url += '&format=json'
    url += '&api_key=a297e6a8695bb83d82d816da8545f925'
    url += '&user_id=30507791@N04'
    url += '&per_page=20'
    url += '&extras=tags'
    xmlhttp.open('GET', url, true)
    xmlhttp.send(null)
    function state_Change () {
      if (xmlhttp.readyState == 4) {
        var data = eval('(' + xmlhttp.responseText + ')')
      }
    }
  }

  // Create the main panel
  var main_div = myDocument.createElement('div')
  main_div.setAttribute('class', 'photoImportContentPane')
  main_div.setAttribute('id', 'photoImportContentPane')

  var FlickrID = ''
  var stsFlickrID = kb.statementsMatching(undefined, PAC('OwnerFlickrID'), undefined)
  FlickrID = stsFlickrID[0].object.toString()

  var title_div = myDocument.createElement('div')
  var titlespan = myDocument.createElement('span')
  titlespan.setAttribute('class', 'photoImportTitle')
  titlespan.appendChild(myDocument.createTextNode('Import Photos from Flickr'))
  title_div.setAttribute('id', 'photoImportTitle')
  title_div.appendChild(titlespan)
  title_div.appendChild(myDocument.createElement('br'))
  title_div.appendChild(myDocument.createTextNode('Your Flickr Photo ID: '))
  title_div.appendChild(myDocument.createTextNode(FlickrID))
  title_div.appendChild(myDocument.createElement('br'))
  title_div.appendChild(myDocument.createElement('br'))

  // Create the DIV element for holding the photo list
  var photoPanel = myDocument.createElement('div')
  photoPanel.setAttribute('class', 'LoadPhotoPanel')
  photoPanel.setAttribute('id', 'LoadPhotoPanel')

  photoImportPane.render.LoadFlickrData()

  main_div.appendChild(title_div)
  main_div.appendChild(photoPanel)

  return main_div
}

tabulator.panes.register(photoImportPane, false)

// End photoImportPane
