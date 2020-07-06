# An Operating System for [Solid](https://solidproject.org)

When you get a new Mac, it is immediately usable because it has Mac Os on it.  When you get a new phone, PC, or tablet, they come with or you quickly install an operating system which provides some basic functionality, and, more importantly, a framework for extending what you can do with it.  When you get a [Solid](https://solidproject.org) pod -- a chunk of data storage somewhere that you control -- then you should have an operating system which allows you to make immediate use of it, but also provides a framework for you to do more and more things with more and more people.

## Goals

Some of these have been achieved but there is a huge amount of work to do.

- SolidOS should be a complete web-technology-based operating system for any new computer or data store.

- When running as a native app, on laptop or desktop or mobile, it should allow the user to use their own local file system in very much the same way as a solid pod. (This currently works with Electron and rdflib). Users should be able to work **Local first**.

- The User Interface should accommodate a wide range of devices, screen sizes, bandwidth.  The project was originally targeted at laptop, and reactive design is important in new work.

- SolidOS, unlike a typical set of native applications, is very interconnected.  You can do anything with anything - so data from different applications interlinks in a more powerful way so as to solve real life problems powerfully and naturally. You can start a chat about anything, with anyone or combination of people who have solid IDs.  You can adopt anything as the target of a task you want to track later. You can like, flag, keyword, bookmark anything.  So one application will use others in a recursive way to get its job done.  

- You should be able to set SolidOS up for any **existing** folders you have full of things like photos and music, and it should let you listen to them, look at them, and share them very flexibly with anyone in the world.

- When used with a Solid pod, because that is on the web, SolidOS provides the **public view** -- the interactive interface -- that the user has with the rest of the world.  Like when everyone had their own home page on the web, they have that power again to express themselves and their affiliation and their products, and to court interaction, such as collaborative work with others, or commerce.  The way this public home page appears to others is very customizable, so the user, individual or business can be proud of it.

- SolidOS should be modular, **dynamically** loading new code modules in real time as a function of a user's preferences for handling different types of data with different new SolidOS applets, be it finance, fitness, or fishing.

- A module providing new functionality in a new domain should be able to appear as a module in SolidOS or as a stand-alone app, or both.

- The modularity of the system should allow you set yourself up with any set of apps, or indeed the user should be able to configure SolidOS to replace itself with the user's own choice of alternative SolidOS version.  All SolidOS implementations should allow the user to change this selection.

- SolidOS should allow people to create, bit by bit, a web of social linked data of their work and their play, and their lives.


## Deployment platforms

The current main way of getting SolidOS is as a big JS package, [mashlib.js](https://github.com/solid/mashlib)

The mashlib can be used as the core of a native application.  It has been tried on Mac OS using **electron**.
The mashlib has been used before, originally in various apps, in specific data interactions in different
domains. It has been used in a **browser extension** (in Firefox and later Chrome) to add data-handling
capacity as native to the browser itself.

## As a stand-alone web app

Here SolidOS some of the functionality is availble as a [stand-alone web app](https://solid.github.io/mashlib/dist/browse.html). 
This app allows you to look at what a given thing, like a folder in someone's pod,  looks like in SolidOS.  It doesn't have the general navigation, preferences, etc.

## SolidOS as a Mac App: Data Kitchen

The data kitchen is native Mac App which provides the SolidOS functionality to your solid pods, but also your local Mac files on your laptop.  Your Documents folder can be a Solid pod too!  This is very much in early experimental stage.  [JeffX's version on github](https://github.com/jeff-zucker/data-kitchen)

## SolidOS served from solid pod servers

Solid pod servers can serve this HTML view as a
sort ad-hoc rather crude browser extension, which loads the library and then tries to work as though
the browser had been extended to understand data.  This has been done by solid servers for
several years.

## The data browser hack: upgrading your browser

This refers to a specific way in which the SolidOS is deployed for users who at first only have a conventional web browser - a hypertext browser not a data browser.  It is a hack -- in the original computing sense of a crafty, though not beautiful, little thing which gets the job done.

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


There are many ways of developing with SolidOS and the mashlib


