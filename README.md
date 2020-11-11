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

## Help wanted

Do join helping us develop SolidOS. 
PRs are always welcome.
We can add you to the [solidOS team](https://solidos.solidcommunity.net/profile/card#me), which has a [pod](https://solidos.solidcommunity.net/) and some [solid space](https://solidos.solidcommunity.net/Team/) to work.
There is a solid pod the SolidOS 

# Development

The scripts in this repository are intended to ease the development of Solid OS.

It allows you to install automatically several of the component repositories of the Solid OS system, and coordinate their development.

It uses a subset of the functionality in [Lerna](https://lerna.js.org/) to bootstrap the various projects. Do note that you cannot use it to manage multi-package repositories like you normally would want to with Lerna.

The NPM scripts are using bash scripts. These might not work if you're developing on a Windows machine. Let us know if you want support for this.

Many of the repositories used in this project uses [Node Version Manager](https://github.com/nvm-sh/nvm) to maintain the Node version used to build the project. Be sure to have it installed.

## First time setup

```
git clone https://github.com/solid/solidos
cd solidos
npm run setup
``` 

Run this the first time you setup your folder. By default this sets up some repos for you:

- [mashlib](https://github.com/solid/mashlib/): the glue that puts everything together
- [node-solid-server](https://github.com/solid/node-solid-server): the server that allows you to test your changes
- [solid-panes](https://github.com/solid/solid-panes): the part that handles everything reg panes
- [solid-ui](https://github.com/solid/solid-ui): a lot of reusable code for solid-panes and the various pane-repos 

Any changes you do in this projects need to be committed to their original repos and eventually be pushed to NPM manually (this is the part of Lerna that we do not use for this project).

You can start your server and test out your code with:

```
npm start
```

An important part of this script is that it bootstraps the various packages using Lerna. If you for some reason (e.g. you've run `npm install` in any of the projects) need to bootstrap the packages again and don't want to stop the server, you can do `npx lerna bootstrap --force-local` (the `--force-local` makes sure that packages are bootstrapped even if versions don't match).

Some projects require you to build a package before you can see changes, so check the various package.json files to see which scripts are available. You can usually do `npm run build`, and some also supports `npm run watch` which builds a new version each time you do a local change.

## Debugging strategies

There are a couple of ways you can test and debug your changes to the various projects. Before we go into the details, here's a simplified view of the dependencies:

```
node-solid-server --> rdflib
node-solid-server --> mashlib --> rdflib
node-solid-server --> mashlib --> solid-panes --> rdflib
node-solid-server --> mashlib --> solid-panes --> solid-ui --> rdflib
node-solid-server --> mashlib --> solid-panes --> [pane project] --> solid-ui --> rdflib
```

This means that if you do a change in solid-panes and want to see the result on your local NSS, you need to make sure that mashlib compiles the changes as well. Similarly, if you do changes to solid-ui, and some pane relies on those changes, you need to make sure that the pane compiles those changes, that solid-panes compiles the changes from the pane, and finally that mashlib compiles the changes from solid-panes. This quickly becomes hard to track, so we've devised a couple of ways to mitigate this.

### Debugging solid-panes using Solid Pane Tester

This repository is a powerful setup for developing the full stack, from rdflib, to solid-ui, to solid-panes, to mashlib, to node-solid-server. If you are just developing a pane then you will probably find the [Solid Pane Tester](https://github.com/solid/solid-panes#development) more useful. There, you will be able to see the effect of your changes in 5 seconds, whereas a full recompile takes more like 5 minutes. You can also just run the pane tester within this repository, at workspaces/solid-panes/dev/.

### Debugging solid-ui

### using storybook

To debug a component from solid-ui in isolation, when you do not need the surrounding solid-pane, you
can [run storybook in the solid-ui repository](https://github.com/solid/solid-ui#Development).
 
#### using Solid Pane Tester

To debug solid-ui within a pane, you can combine the solid-ui to solid-panes link with the Pane Tester. For instance
 when debugging code from solid-ui that affects the Sharing pane, you might run `npm start` to set the links between the workspaces, then run `npm run watch` in the solid-ui workspace and use the [Solid Pane Tester](https://github.com/solid/solid-panes#development) in the solid-panes workspace, with the Sharing pane in workspaces/solid-panes/dev/pane/, to see how your edits in solid-ui affect the Sharing pane.

### Debugging rdflib using Solid Pane Tester
Run:
```sh
npm run add rdflib
cd workspaces/rdflib
npm install
npm run build:esm
cd ../..
npm start
[Ctrl+C]
cd workspaces/solid-ui
npm run build-lib
```

In another terminal window, run `cd workspaces/solid-panes/dev/ ; npx webpack-dev-server`.

Edit `workspaces/solid-panes/dev/pane/` to have the pane you want to debug.
Open http://localhost:9000 and run `renderPane('http://example.com/#me')` in the console to check
if your setup works.
Then, under `workspaces/rdflib`, make your change, for instance add a console.log somewhere. It
should then be enough to run `npm run watch` in `workspaces/rdflib` to make your changes in
rdflib appear in the browser.

You can also combine this with `cd workspaces/solid-ui ; npm run watch` so that you can combine
edits in rdflib with edits in solid-ui, but if you're only editing rdflib, the
`npm run watch` in `workspaces/rdflib` should be enough.

### Debugging using NSS and watch scripts

You can also test changes directly on the instance of NSS that starts when running `npm start` in this repository. There is a watch-script that you can start doing `npm run watch` that triggers the watch-script for mashlib, solid-ui, and solid-panes. If you want to run watch-script for rdflib or any of the panes, you'll have to open another terminal window, navigate to the respective project and start its watch-script doing `npm run watch`.

The output for the watch-script can be a bit difficult to interpret, since all output for mashlib, solid-ui, and solid-panes are presented in the same window, so you might also consider having each watch scripts running in a separate terminal window. The downside using this approach is that at its worst you'll have five separate watch-scripts running (in addition to the terminal window where you started the server) when working on a pane that needs to pick up a change in rdflib. If you find this unwieldy for your setup, or requiring too much resources, you should consider the Solid Pane Tester strategy instead.

## Add dependency

You can add other projects to your workspaces to do local changes. We've mapped most projects that are related to mashlib for you, so you can simply do:

```
npm run add <name-of-repo>
```

For the projects that we haven't mapped you need to manually give the URL to the Git repo.

```
npm run add <name-of-repo> <git-url-of-repo>
```

## Remove dependency

This removes the dependency itself and cleans up dependencies.

```
npm run delete <name-of-repo>
```

## Troubleshooting

If you for some reason aren't able to get your setup working, you should double-check that Lerna actually manages to bootstrap the repositories. One way of doing this is to check node_modules in one of them and verify that the dependency that should be bootstrapped is actually a symlink to the corresponding repository (e.g. check that `workspaces/mashlib/node_modules/solid-ui` links to `workspaces/solid-ui` ). If it doesn't, it is usually because of different version (e.g. mashlib expects a newer version of solid-ui than the one you have locally). Make sure that these are aligned, then bootstrap again by running `npm start` or do it manually with `npx lerna bootstrap` (must be run in the root of this repo).

## Release the stack

When you made a change in one of the repositories and you want that change to be included in a new version of Solid OS / NSS, do the following:
* make sure you have access to all the github repo's and all the npm package (ask Tim or Michiel if needed)
* get a VPS running Ubuntu, for instance at https://digitalocean.com, and ssh into it as root
```sh
tmux new
adduser --shell /bin/bash --home /home/build --ingroup sudo build
su - build
whoami
sudo whoami
```
Then:
```s
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.0/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

ssh-keygen -t ed25519 -C "michiel+build@unhosted.org"
git config --global user.name "Solid OS Build (Michiel)"
git config --global user.email "michiel+build@unhosted.org"
cat .ssh/id_ed25519.pub
nvm install 15
nvm use 15
npm login
```

Log in to npm with your npm account and add the SSH public key to your GitHub account. Then continue:
```sh
git clone https://github.com/solid/solidos
cd solidos
npm install
npm run prepare
npm run release
```
