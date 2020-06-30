#An Operating System for Solid

[![NPM Package](https://img.shields.io/npm/v/mashlib.svg)](https://www.npmjs.com/package/mashlib)

The mashlib (`mashlib.js`) is a solid-compatible code library of application-level functionality for the world of Solid. One major
use of it is as a "data browser" for a personal data store.

## Goals

- The data browser should be a complete web-based operating system for any new computer or data store.

- When running as a native app, on laptop or desktop or mobile, it should allow the user to use their own local file system in very much the same way as a solid pod. (This currently works with Electron and rdflib). Users should be able to work **Local first**.

- The User Interface should accommodate a wide range of devices, screen sizes, bandwidth.  The project was originally targeted at laptop, and reactive design is important in new work.

- The data browser, unlike a typical set of native applications, is very interconnected.  You can do anything with anything - so data from different applications interlinks in a more powerful way so as to solve real life problems powerfully and naturally. You can start a chat about anything, with anyone.  You can adopt anything as the target of a task you want to track later. You can like, flag, keyword, bookmark anything.  So one application will use others in a recursive way to get its job done.  

- You should be able to set the data browser up for any **existing** folders you have full of things like photos and music, and it should let you listen to them, look at them, and share them very flexibly with anyone in the world.

- When used with a Solid pod, because that is on the web, the data browser provides the **public view** -- the interactive interface -- that the user has with the rest of the world.  Like when everyone had their own home page on the web, they have that power again to express themselves and their affiliation and their products, and to court interaction, such as collaborative work with others, or commerce.  The way this public home page appears to others is very customizable, so the user, individual or business can be proud of it.

- The data browser should be modular, **dynamically** loading new code modules in real time as a function of a user's preferences for handling different types of data with different new data browser applets, be it finance, fitness, or fishing.

- A module providing new functionality in a new domain should be able to appear as a module in the data browser or as a stand-alone app, or both.

- The modularity of the system should allow you set yourself up with any set of apps, or indeed the user should be able to configure the data browser to replace itself with the user's own choice of alternative data browser.  All data browsers should allow the user to change this selection.

- The data browser should allow people to create, bit by bit, a web of social linked data of their work and their play, and their lives.


## Typical uses

The mashlib can be used as the core of a native application.  It has been tried on Mac OS using **electron**. 
The mashlib has been used before, originally in various apps, in specific data interactions in different
domains. It has been used in a **browser extension** (in Firefox and later Chrome) to add data-handling
capacity as native to the browser itself. Several (personal) data stores will serve this HTML view as a
sort of poor person's data browser extension, which loads the library and then tries to work as though
the browser had been extended to understand data.

## The data browser hack: upgrading your browser

This refers to a specific way in which the mashlib is deployed for users who at first only have a conventional web browser - a hypertext browser not a data browser.  It is a hack -- in the original computing sense of a crafty, though not beautiful, little thing which gets the job done.

How does the data browser work?

1. The user goes with a normal web browser to access some data object (like a to-do list).
1. The server sees the browser doesn't understand the data natively.
1. The server sends back a little placeholder HTML file, `databrowser.html`, instead of the data.
1. The `databrowser.html` file loads the `mashlib.js` Javascript library, which can now understand the data.
1. The `mashlib.js` then re-requests the original data, but accepting data formats.
1. The server supplies the actual data of the to-do list or whatever it was.
1. The `mashlib.js` code provides an editable visualization on the data.

The mashlib human interface is *read-write*: where the user is allowed to edit: it lets them edit the data and create new things.  It is *live*, in that often the data browser signed up (using a websocket) for any changes which other users make, so users' screens are synchronized.

A major limitation of their data browser hack is that current web browsers are made to distrust any code loaded from one domain that uses data from another domain.  This makes it hard, strangely complicated, and sometimes impossible to do some things.

## History: Why "Mashlib"?

What is a data mashup?  [A mashup](https://en.wikipedia.org/wiki/Mashup_%28web_application_hybrid%29)
is a web page which is built out of data coming from more than one source.  

 Mashups are important because they are fun and because fundamentally, the value
 of data is much greater when data of one source is combined with linked data from another, because that is where you can get extra insights.
  [My TED talk on open data examples](https://www.ted.com/talks/tim_berners_lee_the_year_open_data_went_worldwide#t-81407)
  has some examples.
Data mashups were all the rage back 2012-2017, although the browser's [Same Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) in many cases makes them hard to do or impossible in a web app, as the data access is blocked by the browser code.

The mashlib started life motivated by the drive to build quick visualizations of data from different sources. Typically, documents or query results are all loaded into the quadstore, so the relationships between different things can be visualized.  The "tabulator" project developed the original mashlib.

Progressively, the mashlib evolved to allow types of data for personal information management (contacts, etc) and social (chat, shared documents, issue tracking, music, photos) and also as a file browser for a Solid-compatible personal data store (files, folders, and sharing). Now, the mashlib is a general-purpose tool for doing all kinds of useful things.

It is an extensible platform, and is never finished.  Do help!  


## Local development
- Here is the [Travis build space](https://travis-ci.org/solid/mashlib/builds)

For local development, we recommend using [mashlib-dev](https://github.com/inrupt/mashlib-dev) to set up your development environment.
