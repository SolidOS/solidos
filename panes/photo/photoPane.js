// Begin photoPane

var UI = require('solid-ui')

var photoPane

module.exports = photoPane = {}
photoPane.icon = tabulator.Icon.src.icon_photoPane
photoPane.name = 'photo'

// Parameters
var num_per_page = 5

// The bullet for the tags in the Tag Menu on the right
var tag_bullet = tabulator.Icon.src.icon_TinyTag

// Functions for formatting the tags and URLS of tags from the RDF statements
function FormatTags (str) {
  str = str.substring(0, str.length - 1)
  return str.substring(str.lastIndexOf('/') + 1, str.length)
}
function FormatImageURLThumbnail (str) {
  return str.substring(1, str.length - 5) + '_t.jpg'
}
function FormatImageURLMedium (str) {
  return str.substring(1, str.length - 5) + '_m.jpg'
}
function FormatImageURLBig (str) {
  return str.substring(1, str.length - 5) + '_b.jpg'
}

// namespace and shorthand for concepts in the tag ontology
var RDF = UI.rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
var RDFS = UI.rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#')
var TAGS = UI.rdf.Namespace('http://www.holygoat.co.uk/owl/redwood/0.1/tags/')
var PAC = UI.rdf.Namespace('http://dig.csail.mit.edu/2008/PAC/ontology/pac#')

function CompareTags (photo, checked) {
  if (checked.length == 0) {
    return true
  }
  var count = 0
  for (var i = 0; i < photo.length; i++) {
    for (var j = 0; j < checked.length; j++) {
      if (photo[i] == checked[j]) {
        count++
      }
    }
  }
  if (count == checked.length) {
    return true
  } else {
    return false
  }
}

photoPane.label = function (subject) {
  if (!UI.store.whether(subject, RDF('type'), PAC('PhotoAlbum'))) {
    return null
  }
  return 'Photo Album'
}

photoPane.render = function (subject, myDocument) {
  // Variables for holding current data and status
  var checkedTags = []
  var allPhotos = []
  var currentPhotos = []
  var allTags = []
  var current_page = 1 // Page number starts at 1
  var total_pages = 1 // To be determined by the data

  photoPane.render.FirstPage = function (e) {
    photoPane.render.PopulatePhotoList(1)
    photoPane.render.ShowControlButtons()
  }

  photoPane.render.LastPage = function (e) {
    photoPane.render.PopulatePhotoList(total_pages)
    photoPane.render.ShowControlButtons()
  }

  photoPane.render.NextPage = function (e) {
    photoPane.render.PopulatePhotoList(current_page + 1)
    photoPane.render.ShowControlButtons()
  }

  photoPane.render.PreviousPage = function (e) {
    photoPane.render.PopulatePhotoList(current_page - 1)
    photoPane.render.ShowControlButtons()
  }

  // Function for setting the control buttons and show page info
  photoPane.render.ShowControlButtons = function () {
    page_info_div.innerHTML = ''
    if (total_pages == 0) {
      current_page = 0
    }
    page_info_div.appendChild(myDocument.createTextNode('Page ' + current_page + ' of ' + total_pages))
    photo_begin_img.setAttribute('class', 'photoControlImg')
    photo_begin_img.addEventListener('click', photoPane.render.FirstPage, false)
    photo_end_img.setAttribute('class', 'photoControlImg')
    photo_end_img.addEventListener('click', photoPane.render.LastPage, false)
    photo_back_img.setAttribute('class', 'photoControlImg')
    photo_back_img.addEventListener('click', photoPane.render.PreviousPage, false)
    photo_next_img.setAttribute('class', 'photoControlImg')
    photo_next_img.addEventListener('click', photoPane.render.NextPage, false)
    if (current_page == 1) {
      photo_begin_img.setAttribute('class', 'photoControlImgInactive')
      photo_begin_img.removeEventListener('click', photoPane.render.FirstPage, false)
      photo_back_img.setAttribute('class', 'photoControlImgInactive')
      photo_back_img.removeEventListener('click', photoPane.render.PreviousPage, false)
    }
    if (current_page == total_pages) {
      photo_end_img.setAttribute('class', 'photoControlImgInactive')
      photo_end_img.removeEventListener('click', photoPane.render.LastPage, false)
      photo_next_img.setAttribute('class', 'photoControlImgInactive')
      photo_next_img.removeEventListener('click', photoPane.render.NextPage, false)
    }
    if (total_pages == 0) {
      photo_begin_img.setAttribute('class', 'photoControlImgInactive')
      photo_begin_img.removeEventListener('click', photoPane.render.FirstPage, false)
      photo_back_img.setAttribute('class', 'photoControlImgInactive')
      photo_back_img.removeEventListener('click', photoPane.render.PreviousPage, false)
      photo_end_img.setAttribute('class', 'photoControlImgInactive')
      photo_end_img.removeEventListener('click', photoPane.render.LastPage, false)
      photo_next_img.setAttribute('class', 'photoControlImgInactive')
      photo_next_img.removeEventListener('click', photoPane.render.NextPage, false)
    }
  }

  // Load photos URL and tags
  photoPane.render.LoadPhotoData = function () {
    // Retrieve the photos in the album (using the "Contains" property)
    var stsPhotos = UI.store.statementsMatching(subject, PAC('Contains'), undefined)
    for (var i = 0; i < stsPhotos.length; i++) {
      var photo = {}
      photo.URI = stsPhotos[i].object.toString()

      // For each tagging, retrieve all the associated tags
      var stsTaggings = UI.store.statementsMatching(stsPhotos[i].object, PAC('hasTagging'), undefined)
      for (var j = 0; j < stsTaggings.length; j++) {
        var tags = []
        var stsTags = UI.store.statementsMatching(stsTaggings[j].object, TAGS('associatedTag'), undefined)
        for (var k = 0; k < stsTags.length; k++) {
          var tag = UI.store.the(stsTags[k].object, RDFS('label'), undefined)
          tags.push(tag)
          if (allTags.indexOf(tag) == -1) {
            allTags.push(tag)
          }
        }
        photo.tags = tags
      }
      allPhotos.push(photo)
    }
  }

  // Populate the tag menu on the right
  photoPane.render.PopulateTagMenu = function () {
    allTags.sort()
    for (var i = 0; i < allTags.length; i++) {
      var tag = allTags[i]

      // Each Tag is contained in a div
      var tagItem = myDocument.createElement('span')
      tagItem.setAttribute('class', 'tagItem')
      tagItem.setAttribute('id', tag)
      tagItem.appendChild(myDocument.createTextNode(tag))
      tagItem.addEventListener('click', photoPane.render.UpdateCheckedTags, false)
      tag_menu_div.appendChild(tagItem)
    }
  }

  // Populate the Photo List panel on the left
  // Check which tags are selected and display the corresponding photos accordingly
  photoPane.render.PopulatePhotoList = function (page) {
    // Calculate the range of photos to be shown
    start = (page - 1) * num_per_page + 1
    end = start + num_per_page - 1
    if (end > currentPhotos.length) {
      end = currentPhotos.length
    }
    current_page = page

    photo_list_div.innerHTML = ''
    for (var i = (start - 1); i <= (end - 1); i++) {
      var photo_item_div = myDocument.createElement('div')
      photo_item_div.setAttribute('class', 'photoItem')

      var photo_frame_div = myDocument.createElement('div')
      photo_frame_div.setAttribute('class', 'photoFrame')

      var img = myDocument.createElement('img')
      img.setAttribute('src', FormatImageURLMedium(currentPhotos[i].URI))
      img.setAttribute('class', 'photoThumbnail')
      photo_frame_div.appendChild(img)
      photo_item_div.appendChild(photo_frame_div)

      var photo_item_tags_div = myDocument.createElement('div')
      photo_item_tags_div.setAttribute('class', 'photoListTags')

      // var img_link = myDocument.createElement("a")
      // img_link.setAttribute("href",currentPhotos[i].URI)
      // img_link.appendChild(myDocument.createTextNode(currentPhotos[i].URI))
      // photo_item_tags_div.appendChild(img_link)
      // photo_item_tags_div.appendChild(myDocument.createElement('br'))

      for (var j = 0; j < currentPhotos[i].tags.length; j++) {
        var tag_div = myDocument.createElement('div')
        tag_div.setAttribute('class', 'photoList_tag')
        tag_div.appendChild(myDocument.createTextNode(currentPhotos[i].tags[j]))
        photo_item_tags_div.appendChild(tag_div)
      }

      photo_item_div.appendChild(photo_item_tags_div)
      photo_list_div.appendChild(photo_item_div)
    }
  }

  // Update the array of checked tags.
  // This function is invoked when any checkbox is clicked
  photoPane.render.UpdateCheckedTags = function (e) {
    tag = e.target.id
    if (checkedTags.indexOf(tag) > -1) {
      var temp = []
      for (var i = 0; i < checkedTags.length; i++) {
        if (checkedTags[i] != tag) {
          temp.push(checkedTags[i])
        }
      }
      checkedTags = temp
      e.target.removeAttribute('class')
      e.target.setAttribute('class', 'tagItem')
    } else {
      checkedTags.push(tag)
      e.target.removeAttribute('class')
      e.target.setAttribute('class', 'tagItem_h')
    }
    photoPane.render.UpdateCurrentPhotos()
    photoPane.render.ShowControlButtons()
    photoPane.render.PopulatePhotoList(current_page)
  }

  // Update the array of photos to be shown at this moment
  // given the selected tags in the tag menu
  photoPane.render.UpdateCurrentPhotos = function () {
    currentPhotos = []
    if (checkedTags.length < 1) {
      currentPhotos = allPhotos
    } else {
      for (var i = 0; i < allPhotos.length; i++) {
        if (CompareTags(allPhotos[i].tags, checkedTags)) {
          currentPhotos.push(allPhotos[i])
        }
      }
    }
    current_page = 1
    if ((currentPhotos.length % num_per_page) > 0) {
      total_pages = parseInt(currentPhotos.length / num_per_page) + 1
    } else {
      total_pages = parseInt(currentPhotos.length / num_per_page)
    }
  }

  /*
  ===========================================================================
  Start creating the layout of the pane
  */

  // Create the main panel
  var main_div = myDocument.createElement('div')
  main_div.setAttribute('class', 'PhotoContentPane')
  main_div.setAttribute('id', 'PhotoContentPane')

  // Create the photo listing panel, add it to the main panel
  var photo_list_div = myDocument.createElement('div')
  photo_list_div.setAttribute('class', 'PhotoListPanel')
  photo_list_div.setAttribute('id', 'PhotoListPanel')
  main_div.appendChild(photo_list_div)

  // Create the info panel, add it to the main panel
  var info_div = myDocument.createElement('div')
  info_div.setAttribute('class', 'PhotoInfoPanel')
  info_div.setAttribute('id', 'PhotoInfoPanel')

  var photo_begin_img = myDocument.createElement('img')
  photo_begin_img.setAttribute('src', tabulator.Icon.src.icon_photoBegin)
  photo_begin_img.setAttribute('id', 'photoBeginButton')
  var photo_end_img = myDocument.createElement('img')
  photo_end_img.setAttribute('src', tabulator.Icon.src.icon_photoEnd)
  photo_end_img.setAttribute('id', 'photoEndButton')
  var photo_next_img = myDocument.createElement('img')
  photo_next_img.setAttribute('src', tabulator.Icon.src.icon_photoNext)
  photo_next_img.setAttribute('id', 'photoNextButton')
  var photo_back_img = myDocument.createElement('img')
  photo_back_img.setAttribute('src', tabulator.Icon.src.icon_photoBack)
  photo_back_img.setAttribute('id', 'photoBackButton')

  var page_info_div = myDocument.createElement('div')
  page_info_div.setAttribute('id', 'photoPageInfo')

  info_div.appendChild(photo_begin_img)
  info_div.appendChild(photo_back_img)
  info_div.appendChild(photo_next_img)
  info_div.appendChild(photo_end_img)
  info_div.appendChild(myDocument.createElement('br'))
  info_div.appendChild(page_info_div)
  main_div.appendChild(info_div)

  // Create the tag menu panel, add it to the main panel
  var tag_menu_div = myDocument.createElement('div')
  tag_menu_div.setAttribute('class', 'TagMenu')
  tag_menu_div.setAttribute('id', 'TagMenu')
  main_div.appendChild(tag_menu_div)

  /*
  ===========================================================================
  Call functions to populate the pane
  */

  photoPane.render.LoadPhotoData()
  photoPane.render.UpdateCurrentPhotos()
  photoPane.render.ShowControlButtons()
  photoPane.render.PopulatePhotoList(1)
  photoPane.render.PopulateTagMenu()

  return main_div
}

tabulator.panes.register(photoPane, false)

// End photoPane
