# mashlib and Data Browser

The mashlib (mashlib.js) is a solid-compatible data mashup library.  One major
use of it is as a data bowser for a personal data store.

## The data browser

How does the data browser work?

- The user goes with a normal web browser to access some data object (like an issue list)
- The server sees the browser doesn't understand the data natively
- The server send back a little placeholder HTML file, `databrowser.html` instead of the data
- The databrowser.html file loads the mashlib.js Javascript library, which can now understand the data
- The mashlib.js then re-requests the original data, but accepting data formats.
- The server supplies the actual data of the to-do list or whatever it was.
- The mashlib.js code provides an editable visualization on the data.

The mashlib human interface is *read-write*: where the user is allowed to edit, then it lets them edit the data and create new things.  It is *live*, in that often the data browser signed up (using a websocket) for any changes which other users make, so users screens are synchronized.

## History: Why "Mashlib"?

What is a data mashup?  A mashup is a web page which is build to out of data coming
from more that one source.  

https://en.wikipedia.org/wiki/Mashup_%28web_application_hybrid%29

 [my TED tallk on open data examples](https://www.ted.com/talks/tim_berners_lee_the_year_open_data_went_worldwide#t-81407)
 has some examples.

 Mashups are important because they are fun but because fundamentally the value
 of data is much greater when data of one source is combined with lined data from another,  
 because that is where you can get extra insights.
  [My TED tallk on open data examples](https://www.ted.com/talks/tim_berners_lee_the_year_open_data_went_worldwide#t-81407)
  has some examples.
Data mashups used to be all the range back 2012-2017 although the browser's [Same Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) in many cases makes them hard to do or impossible in a web app, as the data access are blocked by the browser code.

The mashlib started life motivated by the drive to build quick visualizations of data from different sources.   Typically, documents or query results are all loaded into the quadstore,  and so  the relationships between different things can be visualized.  
Progressively the mashlib evolved to allow types of data for personal information management (contacts, financial) and social (chat, shared documents, issue tracking, music, photos)
and also as a file browser for a Solid-compatible personal data store (files, folders, and sharing).

The mashlib solid-compaitible, and allows

## Goals

- The data bowser should be a complete web-based operating system for any new computer or data store.

- You should be able to set the data browser
