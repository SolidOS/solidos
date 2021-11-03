# 🤗 Welcome to the repo of SolidOS

<img src="https://raw.githubusercontent.com/solid/community-server/main/templates/images/solid.svg" alt="[Solid logo]" height="150" align="right"/>

[![MIT license](https://img.shields.io/github/license/solid/solidos)](https://github.com/solid/solidos/blob/main/LICENSE.md)
[![SolidOS issues](https://img.shields.io/github/issues/solid/solidos)](https://github.com/solid/solidos/issues)
[![Join the chat at https://gitter.im/solid/solidos](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/solid/solidos)

If you made it here you must already have heard about [Solid](https://solidproject.org).
This space is home to the SolidOS code. Keep reading if you want to know:

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
- 🆕 [Getting started with the SolidOS code](#Getting-started-with-the-SolidOS-code)
    - [SolidOS first time setup of code](#SolidOS-first-time-setup-of-code)
    - [How to make changes in repos](#How-to-make-changes-in-repos)
- 📜 [License](#License)
- 🎤 [Feedback and questions](#-Feedback-and-questions)

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
🌟🌟🌟 SolidOS is an Operating System for Solid. 🌟🌟🌟
```

[Solid](https://solidproject.org) is developing into a booming ecosystem which involves: specifications 📃, tech stack 🛠, servers 💻 and apps 🕹. We, the SolidOS team, believe that this ecosystem needs also an Operating System.

When you get a new phone, PC, or tablet, they usually come with an operating system that provides some basic functionality to just get started and be productive. And, more importantly, you can personalize your OS to your needs by installing apps and, managing content, and much more.

Solid is not shipped with a piece of hardware (who knows, maybe in the future it will...). For now, you get into the ecosystem once you create a WebID and provision your own personal data store (Pod) ([see getting started with Solid](https://solidproject.org/developers/tutorials/getting-started)). Immediately after getting your new Solid WebID and Pod space, SolidOS is helping you to navigate the Solid ecosystem.

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

Let's take a look at an architecture diagram of SolidOS: 
![SolidOS architectural overview](documentation/architecture.svg)

As you can see, SolidOS is composed of several repositories:

- [rdflib.js](https://github.com/linkeddata/rdflib.js): Javascript RDF library for browsers and Node.js
- [solid-logic](https://github.com/solid/solid-logic): core business logic of SolidOS
- [mashlib](https://github.com/solid/mashlib/): a solid-compatible code library of application-level functionality for the world of Solid
- [solid-panes](https://github.com/solid/solid-panes): a set of core solid-compatible panes based on solid-ui
- [solid-ui](https://github.com/solid/solid-ui): User Interface widgets and utilities for Solid. Building blocks for solid-based apps

In the above diagram, SolidOS is deployed on the [Node Solid Server (NSS)](https://github.com/solid/node-solid-server) BUT it can also be set up to run on the [Community Solid Server (CSS)](https://github.com/solid/community-server) or on ANY Solid compliant server. When you download the SolidOS code, locally, a NSS is also installed to have everything ready to develop.

### SolidOS deeper technical topics

For further details about each repository, please visit the according to GitHub repo linked above.
For SolidOS related code know-how, make sure to also visit [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs) and the [SolidOS developer guide](https://github.com/solid/solidos/wiki).

## 👯 How the SolidOS team works

### SolidOS team meetings

The SolidOS team meets every week for a 1h touchdown. We discuss what was done over the week, what needs to be done and delegate tasks. Find the meeting time and link on the [SolidOS project Pod](https://solidos.solidcommunity.net/Team/2021/schedule/solidos-schedule.html). 

### SolidOS team instant chat

In between team meetings, we avidly communicate over at the [gitter SolidOS channel](https://gitter.im/solid/solidos). Drop by to chat with us, ask questions or simply say hi. 

### SolidOS tasks

For daily tasks we have a [GitHub prioritization board](https://github.com/solid/solidos/projects/1).
For a longer term roadmap we use a Solid [task manager](https://solidos.solidcommunity.net/public/Roadmap/Tasks/) and plan on Kanban the next milestones. 

### Additional useful information

- Find answers over at [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs) or at the [SolidOS developer guide](https://github.com/solid/solidos/wiki).
- For an overall description of how the whole ecosystem works head over to [solid process](https://github.com/solid/process).
- Make sure to get into discussions on the [forum](https://forum.solidproject.org/) and on Solid [instant chat channels](https://gitter.im/solid/home).
- Join an event over at [Solid events](https://solidproject.org/events).
- Read the community code of conduct [Solid CoC](https://github.com/solid/process/blob/main/code-of-conduct.md).

## 🙋🏽‍ How you can contribute and help SolidOS thrive

The SolidOS team is always looking for volunteers to help improve SolidOS. Pull Requests (PRs) and edits are always welcome from code, to text, to style. We are looking for UX designers, technical writers, frontend developers, backend developers, DevOps. Don't let the titles intimidate you, they are just some examples. You can also find your own place no matter the level of knowledge you are at. 

To check possible tasks you can help with, the best is to visit us on a [weekly team meeting](https://solidos.solidcommunity.net/Team/2021/schedule/solidos-schedule.html) or on the [instant chat](https://gitter.im/solid/solidos) and say 'Hi'. We will try out best to pair you up with a buddy to help you to get started. 

### For anyone up to writing some code

We keep track of stuff to do in Git issues of each repo. [Here](https://github.com/solid/solidos/issues) is the link to the SolidOS open issues. But make sure to visit the underlying repos for specific issues (see: [SolidOS technical intro](#-SolidOS-technical-intro) for links).

#### Developing SolidOS code

Very likely you will want to make changes in the dependent packages/repos of SolidOS (mashlib, solid-logic, solid-ui, solid-panes...). 

You have two choices:
- [work directly in SolidOS](#Work-directly-in-SolidOS)
- [work in the according dependent package](#Work-in-the-according-dependent-package)

##### Work directly in SolidOS

The `npm start` script contains a lerna command: `npx lerna bootstrap --force-local` which makes sure that packages are bootstrapped/taken from your local machine even if versions don't match. 

If you need to bootstrap any packages again (e.g. you've run `npm install` in any of the projects) and don't want to stop the server, you can do `npx lerna bootstrap --force-local` only. You do not need to stop the server and start it again (`npm start`).

Another option is to start SolidOS with the `npm run watch` script. This triggers the watch-script for mashlib, solid-ui, and solid-panes. If you want to run watch-script for rdflib or any of the panes, you'll have to open another terminal window, navigate to the respective project and start its watch-script doing `npm run watch`.

The output for the watch-script can be a bit difficult to interpret since all output for mashlib, solid-ui, and solid-panes are presented in the same window. You might also consider having each watch scripts running in a separate terminal window. The downside of using this approach is that at its worst, you'll have five separate watch-scripts running (in addition to the terminal window where you started the server) when working on a pane that needs to pick up a change in rdflib. If you find this unwieldy for your setup, or require too many resources, you should consider to [work in the according dependent package](#Work-in-the-according-dependent-package).

##### Work in the according dependent package 

Any changes you do in a project need to be committed to their original repos and eventually be pushed to NPM manually (this is the part of Lerna that we do not use for this project).

Some projects require you to build a package before you can see changes, so check the various package.json files to see which scripts are available. You can usually do `npm run build`, and some also support `npm run watch` which builds a new version each time you do a local change.

Be aware, the packages depend on one another. Here's a simplified view of the dependencies:

```
node-solid-server --> rdflib
node-solid-server --> mashlib --> rdflib
node-solid-server --> mashlib --> solid-panes --> rdflib
node-solid-server --> mashlib --> solid-panes --> solid-ui --> rdflib
node-solid-server --> mashlib --> solid-panes --> [pane project] --> solid-ui --> rdflib
```

This means that if you do a change in solid-panes and want to see the result on your local NSS, you need to make sure that mashlib compiles the changes as well. Similarly, if you do changes to solid-ui, and some pane relies on those changes, you need to make sure that the pane compiles those changes, that solid-panes compiles the changes from the pane, and finally that mashlib compiles the changes from solid-panes. This quickly becomes hard to track, so we've devised a couple of ways to mitigate this.

Read about in detail how each pane can be debugged over at the [Solid developer guide](https://github.com/solid/solidos/wiki/1.-SolidOS-know-how#debugging-panesrepos-standalone-without-running-whole-solidos)

### For anyone who likes builds or GitHub CI or releases or deployments

#### Builds

SolidOS contains different repositories (mashlib, solid-logic, solid-ui, solid-panes...). Each repository contains a `packacge.json` with `scripts`. Most repos contain a `npm run build` which is used to build the project. 

#### GitHub CI

When you push or PR a change to a repo, usually a git CI is activated and runs every time. An example is the [solid-panes workflow](https://github.com/solid/solid-panes/blob/main/.github/workflows/ci.yml). This CI YML can contain instructions to test and build the repo on different Node versions. If upon push or PR, an instruction fails, one should take care to fix it. 

#### Testing & releasing a new SolidOS version

In SolidOS, you will find a `bash scripts` under [scripts](https://github.com/solid/solidos/tree/main/scripts) which is related to releasing a new SolidOS version. The [release](https://github.com/solid/solidos/blob/main/scripts/release) script is also used to update dependencies in each repo.

Following best practices, we deploy the new version on the [testserver](https://solidcommunity.net:8443/) as mentioned [here](https://github.com/solid/solidcommunity.net/wiki#solidcommunitynet8443-test-server-instance).

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

SolidOS has quite some documentation around it that needs constant improvement. 
Places to start:
- for how SolidOS works [visit the user guide](https://github.com/solid/userguide) and [SolidOS project Pod](https://solidos.solidcommunity.net/);
- [SolidOS FAQs](https://github.com/solid/solidos/wiki/FAQs);
- [SolidOS developer guide](https://github.com/solid/solidos/wiki).

We are open to suggestions to improve these resources from structure, translation, UI to content in general.

### For anyone with an eye for design

[Solid-ui](https://github.com/solid/solid-ui) does the heavy lifting to all things UI for SolidOS. 
Currently, we use [Storybook](https://storybook.js.org/) to help develop components independent of other panes. Make sure to visit the [solid-ui readme](https://github.com/solid/solid-ui) for information on how to set it up and get started.
There is a second option to run Solid-ui on its own. Read about it at [Debugging solid-ui using Solid Pane Tester](#Debugging-solid-ui-using-Solid-Pane-Tester).

You can also find the current issues over at the [solid-ui issues](https://github.com/solid/solid-ui/issues). And some more information over at the [developer guide](https://github.com/solid/solidos/wiki/Solid-UI-tips).

SolidOS needs a lot of improvements on UI, including UX and style-guides. Maybe you are the one who can help out?

## 🆕 Getting started with the SolidOS code

### SolidOS first time setup of code

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

### How to make changes in repos

As a newcomer, you do not have direct access to the repos. In this case, you can still contribute through Pull Requests (PRs). First, navigate to the repo you want to work on and create a fork. Make your changes on your fork and then create a PR. We will be notified and you will receive feedback on your changes. For more details on how to do this, visit the GitHub documentation which explains it much better than we ever could.

If you do have direct access to the repos, it is usual to create a branch for your changes and then a PR. A PR helps you receive feedback and lets us know easily about any changes to the code. Read more about Pull Requests over at the GitHub documentation.

Make sure to read more about working with branches and missing repos over at the [SolidOS developer guide](https://github.com/solid/solidos/wiki/1.-SolidOS-know-how#dealing-with-github-branches)

## 📜 License

The SolidOS code is available under the MIT License.

## 🎤 Feedback and questions

Don't hesitate to [chat with us on gitter](https://gitter.im/solid/home) or [report a bug](https://github.com/solid/solidos/issues).

## If you are looking for something else, let us try and guide you:

- for learning about Solid read [about Solid](https://github.com/solid/solid) and visit [solidproject.org](https://solidproject.org);
- to try out Solid head over to [getting started with Solid](https://solidproject.org/developers/tutorials/getting-started);
- for how SolidOS works [visit the user guide](https://github.com/solid/userguide) and [SolidOS project Pod](https://solidos.solidcommunity.net/);
- for the SolidOS stand-alone desktop app, visit [Data-Kitchen](https://github.com/solid/data-kitchen);
- for how the community works, go over to [solid process](https://github.com/solid/process);
- chat with others about Solid on the [forum](https://forum.solidproject.org/) and on [instant chats](https://gitter.im/solid/home);
- join an event over at [Solid events](https://solidproject.org/events);
- read the community code of conduct at [Solid CoC](https://github.com/solid/process/blob/main/code-of-conduct.md).
