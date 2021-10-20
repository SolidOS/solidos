# 🤗 Welcome to the home of SolidOS

[![Join the chat at https://gitter.im/solid/solidos](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/solid/solidos?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

If you made it here you must already have heard about [Solid](https://solidproject.org).
This space is home of the SolidOS code. Keep reading if you want to know:

- 🤔 [What is SolidOS](#-What-is-SolidOS)
    - [What you can do today with SolidOS](#What-you-can-do-today-with-SolidOS)
    - [Current SolidOS vision, mission and roadmap](#Current-SolidOS-vision,-mission-and-roadmap)
- 👩🏽‍💻 [SolidOS technical intro](#-solidos-technical-intro)
    - [SolidOS deeper technical topics](#solidos-deeper-technical-topics)
- 👯 [How the SolidOS team works](#-How-the-SolidOS-team-works)
    - [SolidOS team meetings](#SolidOS-team-meetings)
    - [SolidOS team instant chat](#SolidOS-team-instant-chat)
    - [SolidOS tasks](#SolidOS-tasks)  
- 🙋🏻 [How you can contribute and help SolidOS thrive](#-How-you-can-contribute-and-help-SolidOS-thrive)
    - [For anyone up to writing some code](#For-anyone-up-to-writing-some-code)
    - [For anyone who likes builds or releases or GitHub CI or deployments](#for-anyone-who-likes-builds-or-github-ci-or-releases-or-deployments)
    - [For anyone who likes writing text](#For-anyone-who-likes-writing-text)
    - [For anyone with an eye for design](#For-anyone-with-an-eye-for-design)

If you are looking for something else, let us try and guide you:

- for learning about Solid read [about Solid](https://github.com/solid/solid) and visit [solidproject.org](https://solidproject.org);
- to try out Solid head over to [getting started with Solid](https://solidproject.org/developers/tutorials/getting-started);
- for how SolidOS works [visit the user guide](https://github.com/solid/userguide) and [SolidOS project Pod](https://solidos.solidcommunity.net/);
- for the SolidOS stand-alone desktop app, visit [Data-Kitchen](https://github.com/solid/data-kitchen);
- for how the community works, go over to [solid process](https://github.com/solid/process);
- chat with others about Solid on the [forum](https://forum.solidproject.org/) and on [instant chats](https://gitter.im/solid/home);
- join an event over at [Solid events](https://solidproject.org/events);
- read the community code of conduct at [Solid CoC](https://github.com/solid/process/blob/main/code-of-conduct.md).

Further links:

- [SolidOS goals & roadmap](https://solidos.solidcommunity.net/Team/docs/SolidOSNorthStar.html);
- [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs);
- [SolidOS developer guide](https://github.com/solid/solidos/wiki);
- report a problem for SolidOS by [creating a git issues](https://github.com/solid/solidos/issues);
- have a new idea? Create a Solid [user story/new idea ticket](https://github.com/solid/user-stories);
- latests [Solid specification](https://github.com/solid/solid-spec) and [Specification overview](https://solid.github.io/specification/);
- [Solid history](https://gitlab.com/solid.community/support/-/wikis/Home/solid.community#solidcommunity).

## 🤔 What is SolidOS?
```
🌟🌟🌟 SolidOS is an Operating System for [Solid](https://solidproject.org).🌟🌟🌟
```

[Solid](https://solidproject.org) is developing into a booming ecosystem which involves: specifications 📃, tech stack 🛠, servers 💻 and apps 🕹. We, the SolidOS team, believe that this ecosystem needs also an Operating System.

When you get a new phone, PC, or tablet, they usually come with an operating system that provides some basic functionality to just get started and be productive. And, more importantly, you can personalize your OS to your needs by installing apps and, manage content, and much more.

Solid is not shiped with a piece of hardware (who knows, maybe in the future it will...). For now, you get into the ecosystem once you create a WebID and provision your own personal data store (Pod) ([see getting started with Solid](https://solidproject.org/developers/tutorials/getting-started)). Immediately after getting your new Solid WebID and Pod space, SolidOS is helping you to navigate the Solid ecosytem.

SolidOS is much more. SolidOS is showcasing the possibility of [Solid](https://solidproject.org) for the future, and we mean:

- true data ownership: management of personal data & authorization control;
- avoidance of vendor lock-in to services: easy moving to a different Pod or WebID provider;
- data reuse between applications: with help of data interoperability and data discoverability.

### What you can do today with SolidOS

Take a look at an example: [SolidOS project Pod](https://solidos.solidcommunity.net/). SolidOS implemented features:

- 📰 create a personal webpage,
- 📝 manage your WebID and the data about yourself,
- 📝 manage personal data/files on your Pod,
- 🤝 you can directly connect and engage with other people part of the ecosystem (add friends, chat..),
- 💡 make use of interconnected apps,
- 🔧 create your own app [with Inrupt's Solid Reach SDK](https://docs.inrupt.com/developer-tools/javascript/react-sdk/application/) or [get inspired from a blog post](https://solidos.solidcommunity.net/public/2021/BuildingSolidAppsUsingPublicData-V3.html),
- and more ([see SolidOS user guide](https://github.com/solid/userguide)).

### Current SolidOS vision, mission and roadmap

Read more about the current SolidOS 🌟 vision, goals 🎯 and 🚗 roadmap on the [SolidOS project Pod](https://solidos.solidcommunity.net/Team/docs/SolidOSNorthStar.html).

**Note:** SolidOS used to be known as (default) Data Browser and at times as mashlib. Read a [forum post](https://forum.solidproject.org/t/suggestion-penny-should-be-made-the-default-data-browser/4593) about it.

## 👩🏽‍💻 SolidOS technical intro

Lets take a look at an architecture diagram of SolidOS: 
![SolidOS architectural overview](documentation/architecture.svg)

As you can see, SolidOS is composed of serveral repositories:

- [rdflib.js](https://github.com/linkeddata/rdflib.js): Javascript RDF library for browsers and Node.js
- [solid-logic](https://github.com/solid/solid-logic): core business logic of SolidOS
- [mashlib](https://github.com/solid/mashlib/): a solid-compatible code library of application-level functionality for the world of Solid
- [solid-panes](https://github.com/solid/solid-panes): a set of core solid-compatible panes based on solid-ui
- [solid-ui](https://github.com/solid/solid-ui): User Interface widgets and utilities for Solid. Building blocks for solid-based apps

In the above diagram, SolidOS is deployed on the [Node Solid Server (NSS)](https://github.com/solid/node-solid-server) BUT it can also be set up to run on the [Community Solid Server (CSS)](https://github.com/solid/community-server) or on ANY Solid server. When you download the SolidOS code, locally, a NSS is also installed to have everything ready to develop.

### SolidOS deeper technical topics

For further details about each repository, please visit the according GitHub repo linked above.
For SolidOS related code know-how, make sure to also vist [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs) and the [SolidOS developer guide](https://github.com/solid/solidos/wiki).

## 👯 How the SolidOS team works

### SolidOS team meetings

The SolidOS team meets every week for a 1h touchdown. We discuss what was done over the week, what needs to be done and delegate tasks. Find the meeting time and link on the [SolidOS project Pod](https://solidos.solidcommunity.net/Team/2021/schedule/solidos-schedule.html). 

### SolidOS team instant chat

In between team meetings, we avidly communicate over at the [gitter SolidOS channel](https://gitter.im/solid/solidos). Drop by to chat with us, ask questions or simply say hi. 

### SolidOS tasks

We try to keep the [task manager](https://solidos.solidcommunity.net/public/Roadmap/Tasks/) up to date and plan on the Kanban the next milestones. 

### Additional usefull information

- Find answers over at [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs) or at the [SolidOS developer guide](https://github.com/solid/solidos/wiki).
- For an overall description how the whole ecosystem works head over to [solid process](https://github.com/solid/process).
- Make sure to get into discussion on the [forum](https://forum.solidproject.org/) and on Solid [instant chat channels](https://gitter.im/solid/home).
- Join an event over at [Solid events](https://solidproject.org/events).
- Read the community code of conduct [Solid CoC](https://github.com/solid/process/blob/main/code-of-conduct.md).

## 🙋🏽‍ How you can contribute and help SolidOS thrive

The SolidOS team is always looking for volunteers to help improve SolidOS. Pull Requests (PRs) and edits are always welcome from code to text to documentation. We are looking for UX designers, technical writers, frontend developers, backend developers, DevOps. Don't let the titles intimidate you, they are just some examples. You can also find your own place no matter the level of knowledge you are at. 

To check possible tasks you can help with, the best is to visit us on a [weekly team meeting](https://solidos.solidcommunity.net/Team/2021/schedule/solidos-schedule.html) or on the [instant chat](https://gitter.im/solid/solidos) and say 'Hi'. We will try out best to pair you up with a buddy to help you to get started. 

### For anyone up to writing some code

The SolidOS stack contains:
- [Node.js](https://nodejs.dev/)
- [Javascript](https://www.w3schools.com/js/) 
- [Typescript](https://www.typescriptlang.org/)
- [npm](https://www.npmjs.com/)
- [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) 
- [Lerna](https://lerna.js.org/)
- [GitHub CI](https://docs.github.com/en/actions/automating-builds-and-tests/about-continuous-integration)
- [bash scripts](https://www.gnu.org/software/bash/manual/html_node/index.html)

And it also makes use of:
- [Storybook](https://storybook.js.org/)
- [Webpack](https://webpack.js.org/)
- [Jest](https://jestjs.io/)
- [Cypress](https://www.cypress.io/)
- [Lint](https://en.wikipedia.org/wiki/Lint_%28software%29)
- [Babel](https://babeljs.io/)
- [Travis](https://travis-ci.org/) 

We keep track of stuff to do in Git issues of each repo. [Here](https://github.com/solid/solidos/issues) the link to the SolidOS open issues. But make sure to visit the underlying repos for specific issues (see: [SolidOS technical intro](#-SolidOS-technical-intro) for links).

#### SolidOS first time setup of code

```
git clone https://github.com/solid/solidos
cd solidos
nvm install 12.7.0 # to satisfy https://github.com/solid/mashlib/blob/main/.nvmrc
nvm install 12.19.1 # to satisfy https://github.com/linkeddata/rdflib.js/blob/main/.nvmrc
nvm install 13.14.0 # to satisfy https://github.com/solid/node-solid-server/blob/main/.nvmrc
# ... and maybe other versions if build errors tell you so ...
npm run setup
```

Run the above lines in a terminal of your choice to setup your SolidOS project folder. By default, some dependent repos are also set up for you:

- [rdflib.js](https://github.com/linkeddata/rdflib.js): Javascript RDF library for browsers and Node.js
- [solid-logic](https://github.com/solid/solid-logic): core business logic of SolidOS
- [mashlib](https://github.com/solid/mashlib/): a solid-compatible code library of application-level functionality for the world of Solid
- [solid-panes](https://github.com/solid/solid-panes): a set of core solid-compatible panes based on solid-ui
- [solid-ui](https://github.com/solid/solid-ui): User Interface widgets and utilities for Solid. Building blocks for solid-based apps
- [node-solid-server](https://github.com/solid/node-solid-server): the server that allows you to test your changes

You can start your server and test out your code with:

```
npm start
```

If you get into problems check out [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs) and ask us directly at [SolidOS team chat](https://gitter.im/solid/solidos).

***Note:*** The NPM scripts are using `bash` scripts. These might not work if you're developing on a Windows machine. Let us know, over at [SolidOS team chat](https://gitter.im/solid/solidos) if you want support for this.

#### Developing SolidOS code

Very likely you will want to make chnages in the dependent packages/repos of SolidOS (mashlib, solid-logic, solid-ui, solid-panes...). 

You have two choises:
- [work directly in SolidOS](#Work-directly-in-SolidOS)
- [work in the according dependent package](#Work-in-the-according-dependent-package)

##### Work directly in SolidOS

The `npm start` script contains a lerna command: `npx lerna bootstrap --force-local` which makes sure that packages are bootstrapped/taken from your local machine even if versions don't match. 

If you need to bootstrap any packages again (e.g. you've run `npm install` in any of the projects) and don't want to stop the server, you can do `npx lerna bootstrap --force-local` only. You do not need to stop the server and start it again (`npm start`).

Another option is to start SolidOS with the `npm run watch` script. This triggers the watch-script for mashlib, solid-ui, and solid-panes. If you want to run watch-script for rdflib or any of the panes, you'll have to open another terminal window, navigate to the respective project and start its watch-script doing `npm run watch`.

The output for the watch-script can be a bit difficult to interpret, since all output for mashlib, solid-ui, and solid-panes are presented in the same window. You might also consider having each watch scripts running in a separate terminal window. The downside using this approach is that at its worst, you'll have five separate watch-scripts running (in addition to the terminal window where you started the server) when working on a pane that needs to pick up a change in rdflib. If you find this unwieldy for your setup, or requiring too much resources, you should consider to [work in the according dependent package](#Work-in-the-according-dependent-package).

If a package is missing on SolidOS you can simply add it using the `add script` as detailed next.

###### Add dependency

You can add missing packages to your SolidOS local workspaces as follows:

```
npm run add <name-of-repo>
```

If there is package that is not mapped (part of the script already) you need to manually give the URL to the Git repo.

```
npm run add <name-of-repo> <git-url-of-repo>
```

###### Remove dependency

This removes a package and cleans up dependencies.

```
npm run delete <name-of-repo>
```

##### Work in the according dependent package 

Any changes you do in a project needs to be committed to their original repos and eventually be pushed to NPM manually (this is the part of Lerna that we do not use for this project).

Some projects require you to build a package before you can see changes, so check the various package.json files to see which scripts are available. You can usually do `npm run build`, and some also supports `npm run watch` which builds a new version each time you do a local change.

Be aware, the packages depend on one another. Here's a simplified view of the dependencies:

```
node-solid-server --> rdflib
node-solid-server --> mashlib --> rdflib
node-solid-server --> mashlib --> solid-panes --> rdflib
node-solid-server --> mashlib --> solid-panes --> solid-ui --> rdflib
node-solid-server --> mashlib --> solid-panes --> [pane project] --> solid-ui --> rdflib
```

This means that if you do a change in solid-panes and want to see the result on your local NSS, you need to make sure that mashlib compiles the changes as well. Similarly, if you do changes to solid-ui, and some pane relies on those changes, you need to make sure that the pane compiles those changes, that solid-panes compiles the changes from the pane, and finally that mashlib compiles the changes from solid-panes. This quickly becomes hard to track, so we've devised a couple of ways to mitigate this.

###### Debugging solid-panes using Solid Pane Tester

The [Solid Pane Tester](https://github.com/solid/solid-panes#development) is a powerful setup for developing the full stack, from rdflib, to solid-ui, to solid-panes, to mashlib, to node-solid-server. If you are just developing a pane then you will probably find the [Solid Pane Tester](https://github.com/solid/solid-panes#development) more useful. There, you will be able to see the effect of your changes in 5 seconds, whereas a full recompile takes more like 5 minutes. You can also just run the pane tester within this repository, at workspaces/solid-panes/dev/.

###### Debugging solid-ui using Storybook

To debug a component from solid-ui in isolation, when you do not need the surrounding solid-pane, you can [run storybook in the solid-ui repository](https://github.com/solid/solid-ui#Development).

###### Debugging solid-ui using Solid Pane Tester

To debug solid-ui within a pane, you can combine the solid-ui to solid-panes link with the Pane Tester. For instance, when debugging code from solid-ui that affects the Sharing pane, you might run `npm start` to set the links between the workspaces, then run `npm run watch` in the solid-ui workspace and use the [Solid Pane Tester](https://github.com/solid/solid-panes#development) in the solid-panes workspace, with the Sharing pane in workspaces/solid-panes/dev/pane/, to see how your edits in solid-ui affect the Sharing pane.

###### Debugging rdflib using Solid Pane Tester

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

Open http://localhost:9000 and run `renderPane('http://example.com/#me')` in the console to check if your setup works.

Then, under `workspaces/rdflib`, make your change, for instance add a console.log somewhere. It should then be enough to run `npm run watch` in `workspaces/rdflib` to make your changes in rdflib appear in the browser.

You can also combine this with `cd workspaces/solid-ui ; npm run watch` so that you can combine edits in rdflib with edits in solid-ui, but if you're only editing rdflib, the `npm run watch` in `workspaces/rdflib` should be enough.

### For anyone who likes builds or GitHub CI or releases or deployments

#### Builds

SolidOS contains different repositories (mashlib, solid-logic, solid-ui, solid-panes...). Each repository contains a `packacge.json` with `scripts`. Most repos contains a `npm run build` which is used to build the project. 

#### GitHub CI

When you push or PR a change to a repo, usually a git CI is activated and runs every time. An example is the [solid-panes workflow](https://github.com/solid/solid-panes/blob/main/.github/workflows/ci.yml). This CI YML can contain instructions to test and build the repo on different Node versions. If upon push or PR, an instruction fails, one should take care to fix it. 

#### Testing & releasing a new SolidOS version

In SolidOS, you will find a `bash scripts` under [scripts](https://github.com/solid/solidos/tree/main/scripts) which is related to releasing a new SolidOS version. The [release](https://github.com/solid/solidos/blob/main/scripts/release) script is also used to update dependencies in each repo.

As best practice, we deploy the new version on the [testserver](https://solidcommunity.net:8443/) as mentioned [here](https://github.com/solid/solidcommunity.net/wiki#solidcommunitynet8443-test-server-instance).

#### Deployment on solidcommunity.net server

```
More information can be also found over at the [server, solidcommunity.net, repo](https://github.com/solid/solidcommunity.net/wiki).
```

Before you start, make sure you have access to all the GitHub repos and all the npm packages. Using Ubuntu or alike, ssh into server as root.

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
nvm install 15
nvm use 15

ssh-keygen -t ed25519 -C "michiel+build@unhosted.org"
git config --global user.name "Solid OS Build (Michiel)"
git config --global user.email "michiel+build@unhosted.org"
cat .ssh/id_ed25519.pub
npm login
```

Log in to npm with your npm account and add the SSH public key to your GitHub account. Then continue:

```sh
git clone https://github.com/solid/solidos
cd solidos
npm run install-nvm
npm run release
```

### For anyone who likes writing text

SolidOS has quite some documentation around it which needs constant improvement. 
Places to start:
- for how SolidOS works [visit the user guide](https://github.com/solid/userguide) and [SolidOS project Pod](https://solidos.solidcommunity.net/);
- [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs);
- [SolidOS developer guide](https://github.com/solid/solidos/wiki).

We are open to suggestions to improve these resources from structure, translation, UI to content in general.

### For anyone with an eye for design

[Solid-ui](https://github.com/solid/solid-ui) does the heavy lifting to all things UI for SolidOS. 
Currently we use [Storybook](https://storybook.js.org/) to help develop components independent of other panes. Make sure to visit the [solid-ui readme](https://github.com/solid/solid-ui) for information of how to set it up and get started.
There is a second option to run Solid-ui on its own. Read about it at [Debugging solid-ui using Solid Pane Tester](#Debugging-solid-ui-using-Solid-Pane-Tester).

You can also find the current issues over at the [solid-ui issues](https://github.com/solid/solid-ui/issues). And some more information over at the [developer guide](https://github.com/solid/solidos/wiki/Solid-UI-tips).

SolidOS needs a lot of improvements on UI, including UX and styleguides. Maybe you are the one who can help out?

## License

If you are looking for something else, let us try and guide you:

- for learning about Solid read [about Solid](https://github.com/solid/solid) and visit [solidproject.org](https://solidproject.org);
- to try out Solid head over to [getting started with Solid](https://solidproject.org/developers/tutorials/getting-started);
- for how SolidOS works [visit the user guide](https://github.com/solid/userguide) and [SolidOS project Pod](https://solidos.solidcommunity.net/);
- for the SolidOS stand-alone desktop app, visit [Data-Kitchen](https://github.com/solid/data-kitchen);
- for how the community works, go over to [solid process](https://github.com/solid/process);
- chat with others about Solid on the [forum](https://forum.solidproject.org/) and on [instant chats](https://gitter.im/solid/home);
- join an event over at [Solid events](https://solidproject.org/events);
- read the community code of conduct at [Solid CoC](https://github.com/solid/process/blob/main/code-of-conduct.md).
