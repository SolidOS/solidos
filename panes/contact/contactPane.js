/*   Contact AddressBook Pane
**
**  This outline pane allows a user to interact with an contact,
to change its state according to an ontology, comment on it, etc.
**
** See aslo things like
**  http://www.w3.org/TR/vcard-rdf/
**  http://tools.ietf.org/html/rfc6350
**  http://www.iana.org/assignments/vcard-elements/vcard-elements.xhtml
**
** I am using in places single quotes strings like 'this'
** where internationalization ("i18n") is not a problem, and double quoted
** like "this" where the string is seen by the user and so I18n is an issue.
*/

var UI = require('solid-ui')

if (typeof console === 'undefined') { // e.g. firefox extension. Node and browser have console
  console = {}
  console.log = function (msg) { UI.log.info(msg);}
}

// These used to be in js/init/icons.js but are better in the pane.
// tabulator.Icon.src.icon_contactCard = tabulator.iconPrefix + 'js/panes/contact/card.png'
// tabulator.Icon.tooltips[tabulator.Icon.src.icon_contactCard] = 'Contact'

module.exports = {
  icon: UI.icons.iconBase + 'noun_99101.svg', // changed from embedded icon 2016-05-01

  name: 'contact',

  // Does the subject deserve an contact pane?
  label: function (subject) {
    var kb = UI.store
    var ns = UI.ns
    var t = kb.findTypeURIs(subject)
    if (t[ns.vcard('Individual').uri]) return 'Contact'
    if (t[ns.vcard('Organization').uri]) return 'contact'
    if (t[ns.vcard('Group').uri]) return 'Group'
    if (t[ns.vcard('AddressBook').uri]) return 'Address book'
    return null // No under other circumstances
  },

  mintNew: function (newBase, context) {
    var dom = context.dom, me = context.me, div = context.div
    var appInstanceNoun = 'address book'

    var complain = function (message) {
      div.appendChild(UI.widgets.errorMessageBlock(dom, message, 'pink'))
    }

    var bookContents = '@prefix vcard: <http://www.w3.org/2006/vcard/ns#>.\n\
@prefix ab: <http://www.w3.org/ns/pim/ab#>.\n\
@prefix dc: <http://purl.org/dc/elements/1.1/>.\n\
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.\n\
\n\
<#this> a vcard:AddressBook;\n\
    dc:title "New address Book";\n\
    vcard:nameEmailIndex <people.ttl>;\n\
    vcard:groupIndex <groups.ttl>. \n\n'

    bookContents += '<#this> <http://www.w3.org/ns/auth/acl#owner> <' + me.uri + '>.\n\n'

    var toBeWritten = [
      { to: 'index.html', contentType: 'text/html' },
      { to: 'book.ttl', content: bookContents, contentType: 'text/turtle' },
      { to: 'groups.ttl', content: '', contentType: 'text/turtle' },
      { to: 'people.ttl', content: '', contentType: 'text/turtle'},
      { to: '', existing: true, aclOptions: { defaultForNew: true}},
    ]

    var newAppPointer = newBase + 'index.html'; // @@ assuming we can't trust server with bare dir

    var offline = UI.widgets.offlineTestID()
    if (offline) {
      toBeWritten.push({to: 'local.html', from: 'local.html', contentType: 'text/html' })
      newAppPointer = newBase + 'local.html' // kludge for testing
    }

    // @@ Ask user abut ACLs?

    //
    //   @@ Add header to PUT     If-None-Match: *       to prevent overwrite
    //

    var claimSuccess = function (uri, appInstanceNoun) { // @@ delete or grey other stuff
      console.log('Files created. App ready at ' + uri)
      var p = div.appendChild(dom.createElement('p'))
      p.setAttribute('style', 'font-size: 140%;')
      p.innerHTML =
        "Your <a href='" + uri + "'><b>new " + appInstanceNoun + '</b></a> is ready. ' +
        "<br/><br/><a href='" + uri + "'>Go to new " + appInstanceNoun + '</a>'
    }

    var doNextTask = function () {
      if (toBeWritten.length === 0) {
        claimSuccess(newAppPointer, appInstanceNoun)
      } else {
        var task = toBeWritten.shift()
        console.log('Creating new file ' + task.to + ' in new instance ')
        var dest = $rdf.uri.join(task.to, newBase) //
        var aclOptions = task.aclOptions || {}
        var checkOKSetACL = function (uri, ok) {
          if (ok) {
            UI.widgets.setACLUserPublic(dest, me, aclOptions, function () {
              if (ok) {
                doNextTask()
              } else {
                complain('Error setting access permisssions for ' + task.to)
              }
            })
          } else {
            complain('Error writing new file ' + task.to)
          }
        }

        if ('content' in task) {
          UI.widgets.webOperation('PUT', dest,
            { data: task.content, saveMetadata: true, contentType: task.contentType},
            checkOKSetACL)
        } else if ('existing' in task) {
          checkOKSetACL(true, dest)
        } else {
          throw 'copy not expected'
          // var from = task.from || task.to // default source to be same as dest
          // UI.widgets.webCopy(base + from, dest, task.contentType, checkOKSetACL)
        }
      }
    }

    doNextTask()
  },

  render: function (subject, dom) {
    var kb = UI.store
    var ns = UI.ns
    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/')
    var DCT = $rdf.Namespace('http://purl.org/dc/terms/')
    var div = dom.createElement('div')
    var cardDoc = subject.doc()

    div.setAttribute('class', 'contactPane')

    var commentFlter = function (pred, inverse) {
      if (!inverse && pred.uri ==
        'http://www.w3.org/2000/01/rdf-schema#comment') return true
      return false
    }

    var complainIfBad = function (ok, body) {
      if (!ok) {
        console.log('Error: ' + body)
      }
    }

    var thisPane = this

    var timestring = function () {
      var now = new Date()
      return '' + now.getTime()
    // http://www.w3schools.com/jsref/jsref_obj_date.asp
    }

    var gen_uuid = function () { // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Unused and untested but could be handy: a facetted browser view
    //
    var addressBookAsTable = function () {
      var query = new $rdf.Query(UI.utils.label(subject))
      var vars = ['contact', 'name', 'em', 'email']
      var v = {} // The RDF variable objects for each variable name
      vars.map(function (x) {query.vars.push(v[x] = $rdf.variable(x))})

      query.pat.add(v['contact'], ns.vcard('fn'), v['name'])
      query.pat.add(v['contact'], ns.vcard('hasEmail'), v['em'])
      query.pat.add(v['contact'], ns.vcard('value'), v['email'])
      query.pat.optional = []

      var propertyList = kb.any(subject, ns.wf('propertyList')) // List of extra properties
      // console.log('Property list: '+propertyList) //
      if (propertyList) {
        var properties = propertyList.elements
        for (var p = 0; p < properties.length; p++) {
          var prop = properties[p]
          var vname = '_prop_' + p
          if (prop.uri.indexOf('#') >= 0) {
            vname = prop.uri.split('#')[1]
          }
          query.vars.push(v[vname] = $rdf.variable(vname))
          var oneOpt = new $rdf.IndexedFormula()
          query.pat.optional.push(oneOpt)
          oneOpt.add(v['contact'], prop, v[vname])
        }
      }

      var tableDiv = UI.widgets.renderTableViewPane(dom, {'query': query,
      /*             'hints': {
                       '?created': { 'cellFormat': 'shortDate'},
                       '?state': { 'initialSelection': selectedStates }}
                       */
      })

      div.appendChild(tableDiv)

      if (tableDiv.refresh) { // Refresh function
        var refreshButton = dom.createElement('button')
        refreshButton.textContent = 'refresh'
        refreshButton.addEventListener('click', function (e) {
          var nameEmailIndex = kb.any(subject, ns.vcard('nameEmailIndex'))
          UI.store.fetcher.unload(nameEmailIndex)
          UI.store.fetcher.nowOrWhenFetched(nameEmailIndex.uri, undefined, function (ok, body) {
            if (!ok) {
              console.log('Cant refresh data:' + body)
            } else {
              tableDiv.refresh()
            }
          })
        }, false)
        div.appendChild(refreshButton)
      } else {
        console.log('No refresh function?!')
      }
    }

    // ///////////////////// Reproduction: Spawn a new instance of this app

    var newAddressBookButton = function (thisAddressBook) {
      return UI.widgets.newAppInstance(dom,
        {noun: 'address book', appPathSegment: 'contactorator.timbl.com'}, function (ws, newBase) {
          thisPane.clone(thisAddressBook, newBase, {me: me, div: div, dom: dom})
        })
    } // newAddressBookButton

    // /////////////////////////////////////////////////////////////////////////////

    var updater = new UI.rdf.UpdateManager(kb)
    UI.widgets.preventBrowserDropEvents(dom)

    var plist = kb.statementsMatching(subject)
    var qlist = kb.statementsMatching(undefined, undefined, subject)

    var t = kb.findTypeURIs(subject)

    var me_uri = tabulator.preferences.get('me')
    var me = me_uri ? kb.sym(me_uri) : null

    var context = { target: subject, me: me, noun: 'address book',
    div: div, dom: dom}; // missing: statusRegion

    // Reload resorce then

    var reloadStore = function (store, callBack) {
      UI.store.fetcher.unload(store)
      UI.store.fetcher.nowOrWhenFetched(store.uri, undefined, function (ok, body) {
        if (!ok) {
          console.log('Cant refresh data:' + body)
        } else {
          callBack()
        }
      })
    }

    // Refresh the DOM tree

    var refreshTree = function (root) {
      if (root.refresh) {
        root.refresh()
        return
      }
      for (var i = 0; i < root.children.length; i++) {
        refreshTree(root.children[i])
      }
    }

    //    Render a 3-column browser for an address book or a group
    //
    var renderThreeColumnBrowser = function (books, context, options) {
      kb.fetcher.load(books).then(function (xhr) {
        renderThreeColumnBrowser2(books, context, options)
      }).catch(function (err) {complain(err)})
    }
    var renderThreeColumnBrowser2 = function (books, context, options) {
      var classLabel = UI.utils.label(ns.vcard('AddressBook'))
      var IndividualClassLabel = UI.utils.label(ns.vcard('Individual'))

      var book = books[0] // for now
      var groupIndex = kb.any(book, ns.vcard('groupIndex'))
      var selectedGroups = {}

      var title = kb.any(book, ns.dc('title'))
      if (title && typeof window !== 'undefined' && window.title) {
        window.title = title.value; // @@ only when the outermmost pane
      }
      title = title ? title.value : classLabel

      var doGroupsForBook = function (book) {
        kb.load(book).then(function (xhr) {
          var nameEmailIndex = kb.any(book, ns.vcard('nameEmailIndex'))
          var groupIndex = kb.any(book, ns.vcard('groupIndex'))
          var selectedGroups = {}
          var title = kb.any(book, ns.dc('title'))
          title = title ? title.value : classLabel
        // @@ Todo
        })
          .catch(function (err) {UI.widgets.complain(context, err)})
      }

      // var cats = kb.each(book, ns.wf('contactCategory')) // zero or more

      //  Write a new contact to the web
      //
      var createNewContact = function (book, name, selectedGroups, callback) {
        var nameEmailIndex = kb.any(book, ns.vcard('nameEmailIndex'))

        var uuid = gen_uuid()
        var x = book.uri.split('#')[0]
        var doc = kb.sym(x.slice(0, x.lastIndexOf('/') + 1) + 'Person/' + uuid + '.ttl')
        var person = kb.sym(doc.uri + '#this')

        // Sets of statements to different files
        var agenda = [ // Patch the main index to add the person

          [   $rdf.st(person, ns.vcard('inAddressBook'), book, nameEmailIndex), // The people index
            $rdf.st(person, ns.vcard('fn'), name, nameEmailIndex) ]
        ]

        // @@ May be missing email - sync that differently

        // sts.push(new $rdf.Statement(person, DCT('created'), new Date(), doc));  ??? include this?
        for (var gu in selectedGroups) {
          var g = kb.sym(gu)
          var gd = g.doc()
          agenda.push([  $rdf.st(g, ns.vcard('hasMember'), person, gd),
            $rdf.st(person, ns.vcard('fn'), name, gd)
          ])
        }

        var updateCallback = function (uri, success, body) {
          if (!success) {
            dump("Error: can't update " + uri + ' for new contact:' + body + '\n')
            callback(false, "Error: can't update " + uri + ' for new contact:' + body)
          } else {
            if (agenda.length > 0) {
              dump('Patching ' + agenda[0] + '\n')
              updater.update([], agenda.shift(), updateCallback)
            } else { // done!
              dump('Done patching. Now reading back in.\n')
              UI.store.fetcher.nowOrWhenFetched(doc, undefined, function (ok, body) {
                if (ok) {
                  dump('Read back in OK.\n')
                  callback(true, person)
                } else {
                  dump('Read back in FAILED: ' + body + '\n')
                  callback(false, body)
                }
              })
            }
          }
        }

        UI.store.fetcher.nowOrWhenFetched(nameEmailIndex, undefined, function (ok, message) {
          if (ok) {
            dump(' People index must be loaded\n')
            updater.put(doc, [
              $rdf.st(person, ns.vcard('fn'), name, doc),
              $rdf.st(person, ns.rdf('type'), ns.vcard('Individual'), doc) ],
              'text/turtle', updateCallback)
          } else {
            dump('Error loading people index!' + nameEmailIndex.uri + ': ' + message)
            callback(false, 'Error loading people index!' + nameEmailIndex.uri + ': ' + message + '\n')
          }
        })

      }

      // Write new group to web
      // Creates an empty new group file and adds it to the index
      //
      var saveNewGroup = function (book, name, callback) {
        var gix = kb.any(book, ns.vcard('groupIndex'))

        var x = book.uri.split('#')[0]
        var gname = name.replace(' ', '_')
        var doc = kb.sym(x.slice(0, x.lastIndexOf('/') + 1) + 'Group/' + gname + '.ttl')
        var group = kb.sym(doc.uri + '#this')
        dump(' New group will be: ' + group + '\n')

        UI.store.fetcher.nowOrWhenFetched(gix, undefined, function (ok, message) {
          if (ok) {
            dump(' Group index must be loaded\n')
            updater.update([],
              [ $rdf.st(book, ns.vcard('includesGroup'), group, gix),
                $rdf.st(group, ns.rdf('type'), ns.vcard('Group'), gix),
                $rdf.st(group, ns.vcard('fn'), name, gix) ], function (uri, success, body) {
                if (ok) {
                  updater.put(doc, [], 'text/turtle', function (uri, ok, body) {
                    callback(ok, ok ? group : "Can't save new group file " + doc + body)
                  })
                } else {
                  callback(ok, 'Could not update group index ' + body) // fail
                }
              })
          } else {
            dump('Error loading people index!' + gix.uri + ': ' + message)
            callback(false, 'Error loading people index!' + gix.uri + ': ' + message + '\n')
          }
        })

      }

      // Form to get the name of a new thing before we create it
      var getNameForm = function (dom, kb, classLabel, selectedGroups, gotNameCallback) {
        var form = dom.createElement('div') // form is broken as HTML behaviour can resurface on js error

        UI.store.fetcher.removeCallback('done', 'expand'); // @@ experimental -- does this kill the re-paint? no
        UI.store.fetcher.removeCallback('fail', 'expand'); // @@ ??

        // classLabel = UI.utils.label(ns.vcard('Individual'))
        form.innerHTML = '<h2>Add new ' +
          classLabel + '</h2><p>name of new ' + classLabel + ':</p>'
        var namefield = dom.createElement('input')
        namefield.setAttribute('type', 'text')
        namefield.setAttribute('size', '100')
        namefield.setAttribute('maxLength', '2048') // No arbitrary limits
        namefield.select() // focus next user input

        var gotName = function () {
          namefield.setAttribute('class', 'pendingedit')
          namefield.disabled = true
          gotNameCallback(true, book, namefield.value, selectedGroups)
        }

        namefield.addEventListener('keyup', function (e) {
          if (e.keyCode == 13) {
            gotName()
          }
        }, false)
        form.appendChild(namefield)

        var br = form.appendChild(dom.createElement('br'))

        var cancel = form.appendChild(dom.createElement('button'))
        cancel.setAttribute('type', 'button')
        cancel.innerHTML = 'Cancel'
        cancel.addEventListener('click', function (e) {
          form.parentNode.removeChild(form)
          gotNameCallback(false)
        }, false)

        var b = form.appendChild(dom.createElement('button'))
        b.setAttribute('type', 'button')
        b.innerHTML = 'Continue'
        b.addEventListener('click', function (e) {
          gotName()
        }, false)

        return form
      }

      // //////////////////////////// Three-column Contact Browser

      UI.store.fetcher.nowOrWhenFetched(groupIndex.uri, book, function (ok, body) {
        if (!ok) return console.log('Cannot load group index: ' + body)

        // organization-name is a hack for Mac records with no FN which is mandatory.
        var nameFor = function (x) {
          var name = kb.any(x, ns.vcard('fn')) ||
            kb.any(x, ns.foaf('name')) || kb.any(x, ns.vcard('organization-name'))
          return name ? name.value : '???'
        }

        var filterName = function (name) {
          var filter = searchInput.value.trim().toLowerCase()
          if (filter.length === 0) return true
          var parts = filter.split(' ') // Each name part must be somewhere
          for (var j = 0; j < parts.length; j++) {
            var word = parts[j]
            if (name.toLowerCase().indexOf(word) < 0) return false
          }
          return true
        }

        var searchFilterNames = function () {
          for (var i = 0; i < peopleMainTable.children.length; i++) {
            var row = peopleMainTable.children[i]
            row.setAttribute('style',
              filterName(nameFor(row.subject)) ? '' : 'display: none;')
          }
        }

        var selectAllGroups = function (selectedGroups, groupsMainTable, callback) {
          var todo = groupsMainTable.children.length
          var badness = []
          for (var k = 0; k < groupsMainTable.children.length; k++) {
            var groupRow = groupsMainTable.children[k]
            var group = groupRow.subject

            var groupList = kb.sym(group.uri.split('#')[0])
            selectedGroups[group.uri] = true

            kb.fetcher.nowOrWhenFetched(groupList.uri, undefined, function (ok, message) {
              if (!ok) {
                var msg = "Can't load group file: " + groupList + ': ' + message
                badness.push(msg)
                return complainIfBad(ok, msg)
              }
              groupRow.setAttribute('style', 'background-color: #cce;')
              refreshNames(); // @@ every time??
              todo -= 1
              if (!todo) {
                if (callback) callback(badness.length === 0, badness)
              }
            })
          } // for each row
        }

        var toolsPane = function (selectedGroups, groupsMainTable) {
          var kb = UI.store, ns = UI.ns
          var updater = new UI.rdf.UpdateManager(kb)
          var ACL = UI.ns.acl, VCARD = UI.ns.vcard
          var doc = $rdf.sym(book.uri.split('#')[0]) // The ACL is actually to the doc describing the thing

          var pane = dom.createElement('div')
          var table = pane.appendChild(dom.createElement('table'))
          table.setAttribute('style', 'font-size:120%; margin: 1em; border: 0.1em #ccc ;')
          var headerRow = table.appendChild(dom.createElement('tr'))
          headerRow.textContent = UI.utils.label(book) + ' - tools'
          headerRow.setAttribute('style', 'min-width: 20em; padding: 1em; font-size: 150%; border-bottom: 0.1em solid red; margin-bottom: 2em;')

          var statusRow = table.appendChild(dom.createElement('tr'))
          var statusBlock = statusRow.appendChild(dom.createElement('div'))
          statusBlock.setAttribute('style', 'padding: 2em;')
          var MainRow = table.appendChild(dom.createElement('tr'))
          var box = MainRow.appendChild(dom.createElement('table'))
          var bottomRow = table.appendChild(dom.createElement('tr'))

          context = { target: book, me: me, noun: 'address book',
          div: pane, dom: dom, statusRegion: statusBlock }

          box.appendChild(UI.widgets.ACLControlBox(book, dom, 'book', function (ok, body) {
            if (!ok) box.innerHTML = 'ACL control box Failed: ' + body
          }))

          //
          UI.widgets.registrationControl(
            context, book, ns.vcard('AddressBook'))
            .then(function (box) {
              pane.appendChild(box)
            }).catch(function (e) {UI.widgets.complain(context, e)})

          //  Output stats in line mode form
          var p = MainRow.appendChild(dom.createElement('pre'))
          var log = function (message) {
            p.textContent += message + '\n'
          }

          var stats = function () {
            var totalCards = kb.each(undefined, VCARD('inAddressBook'), book).length
            log('' + totalCards + ' cards loaded. ')
            var groups = kb.each(book, VCARD('includesGroup'))
            log('' + groups.length + ' total groups. ')
            var gg = [], g
            for (g in selectedGroups) {
              gg.push(g)
            }
            log('' + gg.length + ' selected groups. ')
          }

          var statButton = pane.appendChild(dom.createElement('button'))
          statButton.textContent = 'Statistics'
          statButton.addEventListener('click', stats)

          var loadIndexButton = pane.appendChild(dom.createElement('button'))
          loadIndexButton.textContent = 'Load main index'
          loadIndexButton.addEventListener('click', function (e) {
            loadIndexButton.setAttribute('style', 'background-color: #ffc;')

            var nameEmailIndex = kb.any(book, ns.vcard('nameEmailIndex'))
            UI.store.fetcher.nowOrWhenFetched(nameEmailIndex, undefined, function (ok, message) {
              if (ok) {
                loadIndexButton.setAttribute('style', 'background-color: #cfc;')
                log(' People index has been loaded\n')
              } else {
                loadIndexButton.setAttribute('style', 'background-color: #fcc;')
                log('Error: People index has NOT been loaded' + message + '\n')
              }
            })
          })

          var check = MainRow.appendChild(dom.createElement('button'))
          check.textContent = 'Check inidividual card access of selected groups'
          check.addEventListener('click', function (event) {

            var gg = [], g
            for (g in selectedGroups) {
              gg.push(g)
            }

            for (var i = 0; i < gg.length; i++) {
              var g = kb.sym(gg[i])
              var a = kb.each(g, ns.vcard('hasMember'))
              log(UI.utils.label(g) + ': ' + a.length + ' members')
              for (var j = 0; j < a.length; j++) {
                var card = a[j]
                log(UI.utils.label(card))
                function doCard (card) {
                  UI.widgets.fixIndividualCardACL(card, log, function (ok, message) {
                    if (ok) {
                      log('Sucess for ' + UI.utils.label(card))
                    } else {
                      log('Failure for ' + UI.utils.label(card) + ': ' + message)
                    }
                  })
                }
                doCard(card)
              }
            }
          })

          var checkGroupless = MainRow.appendChild(dom.createElement('button'))
          checkGroupless.textContent = 'Find inidividuals with no group'
          checkGroupless.addEventListener('click', function (event) {
            log('Loading groups...')
            selectAllGroups(selectedGroups, groupsMainTable, function (ok, message) {
              if (!ok) {
                log('Failed: ' + message)
                return
              }

              var nameEmailIndex = kb.any(book, ns.vcard('nameEmailIndex'))
              UI.store.fetcher.nowOrWhenFetched(nameEmailIndex, undefined,
                function (ok, message) {
                  log('Loaded groups and name index.')
                  var reverseIndex = {}, groupless = []
                  for (var i = 0; i < groups.length; i++) {
                    var g = groups[i]
                    var a = kb.each(g, ns.vcard('hasMember'))
                    log(UI.utils.label(g) + ': ' + a.length + ' members')
                    for (var j = 0; j < a.length; j++) {
                      reverseIndex[a[j].uri] = true
                    }
                  }

                  var cards = kb.each(undefined, VCARD('inAddressBook'), book)
                  log('' + cards.length + ' total cards')
                  var c, card
                  for (c = 0; c < cards.length; c++) {
                    if (!reverseIndex[cards[c].uri]) {
                      groupless.push(cards[c])
                      log('   groupless ' + UI.utils.label(cards[c]))
                    }
                  }
                  log('' + groupless.length + ' groupless cards.')
                })
            })
          })

          return pane
        }

        // //////////////////   Body of 3-column browser

        var bookTable = dom.createElement('table')
        bookTable.setAttribute('style', 'border-collapse: collapse; margin-right: 0;')
        div.appendChild(bookTable)
        var bookHeader = bookTable.appendChild(dom.createElement('tr'))
        var bookMain = bookTable.appendChild(dom.createElement('tr'))
        var bookFooter = bookTable.appendChild(dom.createElement('tr'))
        var groupsHeader = bookHeader.appendChild(dom.createElement('td'))
        var peopleHeader = bookHeader.appendChild(dom.createElement('td'))
        var cardHeader = bookHeader.appendChild(dom.createElement('td'))
        var groupsMain = bookMain.appendChild(dom.createElement('td'))
        var groupsMainTable = groupsMain.appendChild(dom.createElement('table'))
        var peopleMain = bookMain.appendChild(dom.createElement('td'))
        var peopleMainTable = peopleMain.appendChild(dom.createElement('table'))

        var groupsFooter = bookFooter.appendChild(dom.createElement('td'))
        var peopleFooter = bookFooter.appendChild(dom.createElement('td'))
        var cardFooter = bookFooter.appendChild(dom.createElement('td'))

        var searchDiv = cardHeader.appendChild(dom.createElement('div'))
        // searchDiv.setAttribute('style', 'border: 0.1em solid #888; border-radius: 0.5em')
        var searchInput = cardHeader.appendChild(dom.createElement('input'))
        searchInput.setAttribute('type', 'text')
        searchInput.setAttribute('style', 'border: 0.1em solid #444; border-radius: 0.5em; width: 100%;')
        // searchInput.addEventListener('input', searchFilterNames)
        searchInput.addEventListener('input', function (e) {
          searchFilterNames()
        })

        var cardMain = bookMain.appendChild(dom.createElement('td'))
        cardMain.setAttribute('style', 'margin: 0;') // fill space available
        var dataCellStyle = 'padding: 0.1em;'

        groupsHeader.textContent = 'groups'
        groupsHeader.setAttribute('style', 'min-width: 10em; padding-bottom 0.2em;')

        var allGroups = groupsHeader.appendChild(dom.createElement('button'))
        allGroups.textContent = 'All'
        allGroups.setAttribute('style', 'margin-left: 1em; font-size: 80%')
        allGroups.addEventListener('click', function (event) {
          allGroups.state = allGroups.state ? 0 : 1
          peopleMainTable.innerHTML = ''; // clear in case refreshNames doesn't work for unknown reason
          if (allGroups.state) {
            selectAllGroups(selectedGroups, groupsMainTable)
          } else {
            selectedGroups = {}
            refreshGroupsSelected()
          }
        }) // on button click

        peopleHeader.textContent = 'name'
        peopleHeader.setAttribute('style', 'min-width: 18em;')
        peopleMain.setAttribute('style', 'overflow:scroll;')

        var groups

        var sortGroups = function () {
          var gs = []
          groups = []
          if (options.foreignGroup) {
            groups.push(['', kb.any(options.foreignGroup, ns.vcard('fn')), options.foreignGroup])
          }
          books.map(function (book) {
            var gs = book ? kb.each(book, ns.vcard('includesGroup')) : []
            var gs2 = gs.map(function (g) {return [ book, kb.any(g, ns.vcard('fn')), g] })
            groups = groups.concat(groups)
          })
          groups.sort()
        }

        var cardPane = function (dom, subject, paneName) {
          var p = tabulator.panes.byName(paneName)
          var d = p.render(subject, dom)
          d.setAttribute('style', 'border: 0.1em solid #444; border-radius: 0.5em')
          return d
        }

        var compareForSort = function (self, other) {
          var s = nameFor(self)
          var o = nameFor(other)
          if (s && o) {
            s = s.toLowerCase()
            o = o.toLowerCase()
            if (s > o) return 1
            if (s < o) return -1
          }
          if (self.uri > other.uri) return 1
          if (self.uri < other.uri) return -1
          return 0
        }

        // In a LDP work, deletes the whole document describing a thing
        // plus patch out ALL mentiosn of it!    Use with care!
        // beware of other dta picked up from other places being smushed
        // together and then deleted.

        var deleteThing = function (x) {
          var ds = kb.statementsMatching(x).concat(kb.statementsMatching(undefined, undefined, x))
          var targets = {}
          ds.map(function (st) {targets[st.why.uri] = st;})
          var agenda = [] // sets of statements of same dcoument to delete
          for (var target in targets) {
            agenda.push(ds.filter(function (st) { return st.why.uri = target }))
            dump('Deleting ' + agenda[agenda.length - 1].length + ' from ' + target)
          }
          function nextOne () {
            if (agenda.length > 0) {
              updater.update(agenda.shift(), [], function (uri, ok, body) {
                nextOne()
              })
            } else {
              var doc = kb.sym(x.uri.split('#')[0])
              dump('Deleting resoure ' + doc)
              updater.deleteResource(doc)
            }
          }
          nextOne()
        }

        var refreshNames = function () {
          var cards = [], ng = 0
          for (var u in selectedGroups) {
            if (selectedGroups[u]) {
              var a = kb.each(kb.sym(u), ns.vcard('hasMember'))
              // dump('Adding '+ a.length + ' people from ' + u + '\n')
              cards = cards.concat(a)
              ng += 1
            }
          }
          cards.sort(compareForSort); // @@ sort by name not UID later
          for (var k = 0; k < cards.length - 1;) {
            if (cards[k].uri === cards[k + 1].uri) {
              cards.splice(k, 1)
            } else {
              k++
            }
          }

          peopleMainTable.innerHTML = '' // clear
          peopleHeader.textContent = (cards.length > 5 ? '' + cards.length + ' contacts' : 'contact')

          for (var j = 0; j < cards.length; j++) {
            var personRow = peopleMainTable.appendChild(dom.createElement('tr'))
            var personLeft = personRow.appendChild(dom.createElement('td'))
            var personRight = personRow.appendChild(dom.createElement('td'))
            personLeft.setAttribute('style', dataCellStyle)
            var person = cards[j]
            var name = nameFor(person)
            personLeft.textContent = name
            personRow.subject = person

            var setPersonListener = function toggle (personLeft, person) {
              UI.widgets.deleteButtonWithCheck(dom, personRight, 'contact', function () {
                deleteThing(person)
                refreshNames()
                cardMain.innerHTML = ''
              })
              personRow.addEventListener('click', function (event) {
                event.preventDefault()
                cardMain.innerHTML = 'loading...'
                var cardURI = person.uri.split('#')[0]
                UI.store.fetcher.nowOrWhenFetched(cardURI, undefined, function (ok, message) {
                  cardMain.innerHTML = ''
                  if (!ok) return complainIfBad(ok, "Can't load card: " + cardURI + ': ' + message)
                  // dump("Loaded card " + cardURI + '\n')
                  cardMain.appendChild(cardPane(dom, person, 'contact'))
                  cardMain.appendChild(dom.createElement('br'))
                  var anchor = cardMain.appendChild(dom.createElement('a'))
                  anchor.setAttribute('href', person.uri)
                  anchor.textContent = '->'
                })
              })
            }
            setPersonListener(personRow, person)
          }
          searchFilterNames()

        }

        var refreshGroupsSelected = function () {
          for (var i = 0; i < groupsMainTable.children.length; i++) {
            var row = groupsMainTable.children[i]
            if (row.subject) {
              row.setAttribute('style', selectedGroups[row.subject.uri] ? 'background-color: #cce;' : '')
            }
          }
        }

        // Check every group is in the list and add it if not.

        var syncGroupTable = function () {
          var foundOne
          sortGroups()

          for (i = 0; i < groupsMainTable.children.length; i++) {
            var row = groupsMainTable.children[i]
            row.trashMe = true
          }

          for (var g = 0; g < groups.length; g++) {
            var book = groups[g][0]
            var name = groups[g][1]
            var group = groups[g][2]

            // selectedGroups[group.uri] = false
            foundOne = false

            for (var i = 0; i < groupsMainTable.children.length; i++) {
              var row = groupsMainTable.children[i]
              if (row.subject && row.subject.sameTerm(group)) {
                row.trashMe = false
                foundOne = true
                break
              }
            }
            if (!foundOne) {
              var groupRow = groupsMainTable.appendChild(dom.createElement('tr'))
              groupRow.subject = group
              groupRow.setAttribute('style', dataCellStyle)
              groupRow.textContent = name
              var foo = function toggle (groupRow, group, name) {
                UI.widgets.deleteButtonWithCheck(dom, groupRow, 'group ' + name, function () {
                  deleteThing(group)
                  syncGroupTable()
                })
                groupRow.addEventListener('click', function (event) {
                  event.preventDefault()
                  var groupList = kb.sym(group.uri.split('#')[0])
                  if (!event.altKey) {
                    selectedGroups = {}; // If alt key pressed, accumulate multiple
                  }
                  selectedGroups[group.uri] = ! selectedGroups[group.uri]
                  refreshGroupsSelected()
                  peopleMainTable.innerHTML = ''; // clear in case refreshNames doesn't work for unknown reason

                  kb.fetcher.nowOrWhenFetched(groupList.uri, undefined, function (ok, message) {
                    if (!ok) return complainIfBad(ok, "Can't load group file: " + groupList + ': ' + message)
                    refreshNames()

                    if (!event.altKey) { // If only one group has beeen selected show ACL
                      cardMain.innerHTML = ''
                      cardMain.appendChild(UI.widgets.ACLControlBox(group, dom, 'group', function (ok, body) {
                        if (!ok) cardMain.innerHTML = 'Failed: ' + body
                      }))
                    }
                  })
                }, true)
              }
              foo(groupRow, group, name)
            } // if not foundOne
          } // loop g

          for (i = 0; i < groupsMainTable.children.length; i++) {
            var row = groupsMainTable.children[i]
            if (row.trashMe) {
              groupsMainTable.removeChild(row)
            }
          }
          refreshGroupsSelected()
        } // syncGroupTable

        syncGroupTable()

        // New Contact button
        var newContactButton = dom.createElement('button')
        var container = dom.createElement('div')
        newContactButton.setAttribute('type', 'button')
        if (!me) newContactButton.setAttribute('disabled', 'true')
        UI.widgets.checkUser(book.doc(), function (uri) {
          newContactButton.removeAttribute('disabled')
        })
        container.appendChild(newContactButton)
        newContactButton.innerHTML = 'New Contact' // + IndividualClassLabel
        peopleFooter.appendChild(container)

        var createdNewContactCallback1 = function (ok, person) {
          dump('createdNewContactCallback1 ' + ok + ' - ' + person + '\n')
          cardMain.innerHTML = ''
          if (ok) {
            cardMain.appendChild(cardPane(dom, person, 'contact'))
          } // else no harm done delete form
        }

        newContactButton.addEventListener('click', function (e) {
          // b.setAttribute('disabled', 'true');  (do we need o do this?)
          cardMain.innerHTML = ''

          var nameEmailIndex = kb.any(book, ns.vcard('nameEmailIndex'))
          UI.store.fetcher.nowOrWhenFetched(nameEmailIndex, undefined, function (ok, message) {
            if (ok) {
              dump(' People index has been loaded\n')
            } else {
              dump('Error: People index has NOT been loaded' + message + '\n')
            }
          // Just a heads up, actually used later.
          })
          // cardMain.appendChild(newContactForm(dom, kb, selectedGroups, createdNewContactCallback1))
          cardMain.appendChild(getNameForm(dom, kb, 'Contact', selectedGroups,
            function (ok, subject, name, selectedGroups) {
              if (!ok) return // cancelled by user
              createNewContact(subject, name, selectedGroups, function (success, body) {
                if (!success) {
                  console.log("Error: can't save new contact:" + body)
                } else {
                  cardMain.innerHTML = ''
                  refreshNames() // Add name to list of group
                  cardMain.appendChild(cardPane(dom, body, 'contact'))
                }
              })
            }))
        }, false)

        // New Group button
        var newGroupButton = groupsFooter.appendChild(dom.createElement('button'))
        newGroupButton.setAttribute('type', 'button')
        newGroupButton.innerHTML = 'New Group' // + IndividualClassLabel
        newGroupButton.addEventListener('click', function (e) {
          // b.setAttribute('disabled', 'true');  (do we need o do this?)
          cardMain.innerHTML = ''
          var groupIndex = kb.any(book, ns.vcard('groupIndex'))
          UI.store.fetcher.nowOrWhenFetched(groupIndex, undefined, function (ok, message) {
            if (ok) {
              dump(' Group index has been loaded\n')
            } else {
              dump('Error: Group index has NOT been loaded' + message + '\n')
            }
          })
          // cardMain.appendChild(newContactForm(dom, kb, selectedGroups, createdNewContactCallback1))
          cardMain.appendChild(getNameForm(dom, kb, 'Group', selectedGroups,
            function (ok, book, name, selectedGroups) {
              if (!ok) return // cancelled by user
              saveNewGroup(book, name, function (success, body) {
                if (!success) {
                  console.log("Error: can't save new group:" + body)
                  cardMain.innerHTML = 'Failed to save group' + body
                } else {
                  selectedGroups = {}
                  selectedGroups[body.uri] = true
                  syncGroupTable() // Refresh list of groups

                  cardMain.innerHTML = ''
                  cardMain.appendChild(UI.widgets.ACLControlBox(body, dom, 'group', function (ok, body) {
                    if (!ok) cardMain.innerHTML = 'Group sharing setup failed: ' + body
                  }))
                }
              })
            }))
        }, false)

        // Tools button
        var toolsButton = cardFooter.appendChild(dom.createElement('button'))
        toolsButton.setAttribute('type', 'button')
        toolsButton.innerHTML = 'Tools'
        toolsButton.addEventListener('click', function (e) {
          cardMain.innerHTML = ''
          cardMain.appendChild(toolsPane(selectedGroups, groupsMainTable))
        })

        cardFooter.appendChild(newAddressBookButton(book))

      })

      div.appendChild(dom.createElement('hr'))
    //  div.appendChild(newAddressBookButton(book))       // later
    // end of AddressBook instance
    } // renderThreeColumnBrowser

    //              Render a single contact Individual

    if (t[ns.vcard('Individual').uri] || t[ns.vcard('Organization').uri]) { // https://timbl.rww.io/Apps/Contactator/individualForm.ttl
      var individualFormDoc = kb.sym(tabulator.iconPrefix + 'js/panes/contact/individualForm.ttl')
      // var individualFormDoc = kb.sym('https://timbl.rww.io/Apps/Contactator/individualForm.ttl')
      var individualForm = kb.sym(individualFormDoc.uri + '#form1')

      UI.store.fetcher.nowOrWhenFetched(individualFormDoc.uri, subject, function drawContactPane (ok, body) {
        if (!ok) return console.log('Failed to load form ' + individualFormDoc.uri + ' ' + body)
        var predicateURIsDone = {}
        var donePredicate = function (pred) {
          predicateURIsDone[pred.uri] = true
        }

        donePredicate(ns.rdf('type'))
        donePredicate(ns.dc('title'))
        donePredicate(ns.dc('modified'))

        ;[ 'hasUID', 'fn', 'hasEmail', 'hasTelephone', 'hasName',
          'hasAddress', 'note'].map(function (p) {
          donePredicate(ns.vcard(p))
        })

        var setPaneStyle = function () {
          var types = kb.findTypeURIs(subject)
          var mystyle = 'padding: 0.5em 1.5em 1em 1.5em; '
          var backgroundColor = null
          for (var uri in types) {
            backgroundColor = kb.any(kb.sym(uri), kb.sym('http://www.w3.org/ns/ui#backgroundColor'))
            if (backgroundColor) break
          }
          backgroundColor = backgroundColor ? backgroundColor.value : '#fff' // default white
          mystyle += 'background-color: ' + backgroundColor + '; '
          div.setAttribute('style', mystyle)
        }
        setPaneStyle()

        UI.widgets.checkUserSetMe(cardDoc)

        var img = div.appendChild(dom.createElement('img'))
        img.setAttribute('style', 'max-height: 10em; border-radius: 1em; margin: 0.7em;')
        UI.widgets.setImage(img, subject)

        UI.widgets.appendForm(dom, div, {}, subject, individualForm, cardDoc, complainIfBad)

        //   Comment/discussion area
        /*
        var messageStore = kb.any(tracker, ns.wf('messageStore'))
        if (!messageStore) messageStore = kb.any(tracker, ns.wf('doc'))
        div.appendChild(UI.widgets.messageArea(dom, kb, subject, messageStore))
        donePredicate(ns.wf('message'))
        */

        div.appendChild(dom.createElement('tr'))
          .setAttribute('style', 'height: 1em') // spacer

        // Remaining properties from whatever ontollogy
        tabulator.outline.appendPropertyTRs(div, plist, false,
          function (pred, inverse) {
            return !(pred.uri in predicateURIsDone)
          })
        tabulator.outline.appendPropertyTRs(div, qlist, true,
          function (pred, inverse) {
            return !(pred.uri in predicateURIsDone)
          })

      }) // End nowOrWhenFetched tracker

      // Alas force ct for github.io
      // was:  ,{ 'forceContentType': 'text/turtle'}

      // /////////////////////////////////////////////////////////

      //          Render a Group instance

    } else if (t[ns.vcard('Group').uri]) {
      // If we have a main address book, then render this group as a guest group withn it
      UI.widgets.findAppInstances(context, ns.vcard('AddressBook'))
        .then(function (context) {
          var addressBooks = context.instances
          if (addressBooks.length > 0) {
            var book = addressBooks[0]
            var options = { foreignGroup: subject}
            renderThreeColumnBrowser(addressBooks, context, options)
          } else {
            renderThreeColumnBrowser([], context, options)
          // @@ button to Make a new addressBook
          }
        }).catch(function (e) {
          UI.widgets.complain(context, e)
        })

    //          Render a AddressBook instance
    } else if (t[ns.vcard('AddressBook').uri]) {
      renderThreeColumnBrowser([subject], context, {})
    } else {
      console.log('Error: Contact pane: No evidence that ' + subject + ' is anything to do with contacts.')
    }
    if (!tabulator.preferences.get('me')) {
      console.log('(You do not have your Web Id set. Sign in or sign up to make changes.)')
    } else {
      // console.log("(Your webid is "+ tabulator.preferences.get('me')+")")
    }

    // /////////////// Fix user when testing on a plane

    if (tabulator.mode === 'webapp' && typeof document !== 'undefined' &&
      document.location && ('' + document.location).slice(0, 16) === 'http://localhost') {
      me = kb.any(subject, UI.ns.acl('owner')) // when testing on plane with no webid
      console.log('Assuming user is ' + me)
    }
    return div
  }
}

// ends
