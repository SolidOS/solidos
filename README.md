# mashlib and Data Browser

The mashlib (`mashlib.js`) is a solid-compatible data mashup library.  One major
use of it is as a data browser for a personal data store.

## Typical uses

The mashlib has been used before, originally in various apps, in specific data interactions in different domains.
It has been used in a browser extension (in Firefox and later Chrome) to add data-handling capacity
as native to the browser itself. Currently it is used as the core as  aort or poor persons
browser extension, the data browser, which loads the library and then tries to work as though the
browser had been extended to understand data.

## The data browser

How does the data browser work?

1. The user goes with a normal web browser to access some data object (like a to-do list).
1. The server sees the browser doesn't understand the data natively.
1. The server sends back a little placeholder HTML file, `databrowser.html`, instead of the data.
1. The `databrowser.html` file loads the `mashlib.js` Javascript library, which can now understand the data.
1. The `mashlib.js` then re-requests the original data, but accepting data formats.
1. The server supplies the actual data of the to-do list or whatever it was.
1. The `mashlib.js` code provides an editable visualization on the data.

The mashlib human interface is *read-write*: where the user is allowed to edit: it lets them edit the data and create new things.  It is *live*, in that often the data browser signed up (using a websocket) for any changes which other users make, so users' screens are synchronized.

## History: Why "Mashlib"?

What is a data mashup?  [A mashup](https://en.wikipedia.org/wiki/Mashup_%28web_application_hybrid%29)
is a web page which is built out of data coming from more than one source.  

 Mashups are important because they are fun and because fundamentally, the value
 of data is much greater when data of one source is combined with linked data from another, because that is where you can get extra insights.
  [My TED talk on open data examples](https://www.ted.com/talks/tim_berners_lee_the_year_open_data_went_worldwide#t-81407)
  has some examples.
Data mashups were all the rage back 2012-2017, although the browser's [Same Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) in many cases makes them hard to do or impossible in a web app, as the data access is blocked by the browser code.

The mashlib started life motivated by the drive to build quick visualizations of data from different sources.   Typically, documents or query results are all loaded into the quadstore, so the relationships between different things can be visualized.  The "tabulator" project developed the original mashlib.

Progressively, the mashlib evolved to allow types of data for personal information management (contacts, etc) and social (chat, shared documents, issue tracking, music, photos) and also as a file browser for a Solid-compatible personal data store (files, folders, and sharing). Now, the mashlib is a general-purpose tool for doing all kinds of useful things.

It is an extensible platform, and is never finished.  Do help!  

## Goals

- The data browser should be a complete web-based operating system for any new computer or data store.

- You should be able to set the data browser up for any existing folders you have full of things like photos and music, and it should let you listen to them, look at them, and share them very flexibly with anyone in the world.

- The data browser should be modular, loading new code modules in real time as a function of a user's preferences for handling different types of data with different new data browser applets, be it finance, fitness, or fishing.

- The data browser should allow people to create, bit by bit, a web of social linked data of their work and their play, and their lives.

timbl 2018

- Here is the [Travis build space](https://travis-ci.org/linkeddata/mashlib/builds)
