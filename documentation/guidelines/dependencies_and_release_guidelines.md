
# 🤗 Welcome CONTRIBUTOR

This document talks about SolidOS stack Node versions and about work required upon release, in particular about dependency upgrades.

Table of content:

- [🤗 Welcome CONTRIBUTOR](#-welcome-contributor)
  - [Usage of Node versions in SolidOS](#usage-of-node-versions-in-solidos)
  - [Update Node version used in SolidOS](#update-node-version-used-in-solidos)
  - [Dependency upgrades](#dependency-upgrades)
    - [To update dependencies you can use](#to-update-dependencies-you-can-use)
  - [Checklist upon relase of a new SolidOS stack](#checklist-upon-relase-of-a-new-solidos-stack)

## Usage of Node versions in SolidOS

The local development should be build with the latest used Node version -> one can make sure this is the case by running `nvm use` in the root of the repo. This command will look for a `.nvmrc` file and use the node version in there.
However since all SolidOS stack is build into the mashlib.js at the ned -> the Node version used is not that important (still best practice to so do it so).

## Update Node version used in SolidOS

Once a year one should upgrade the used Node version. In April, each year, Node releases an even number Node version which will be taken into [LTS (long term support) releases](https://nodejs.org/en/about/releases/).

To upgrade the Node version in SolidOS:

- change the Node version in CI of each SolidOS affected repo (including release.yml if available)
  - keep the published node version in CI to at least one earlier version before latest release but make sure it is still in LTS by checking: <https://nodejs.org/en/about/releases/>
- change the officially development supported Node version on SolidOS stack mentioned in `.nvmrc`. The `.nvmrc` file is available on each repo, [for example on SolidOS repo](https://github.com/solid/solidos/blob/main/.nvmrc).

## Dependency upgrades

- one has different possibilities to check the dependency status of a repo: `npm outdated`, `npx npm-check-updates`, `npx npm-check`.
- patch ups versions can be updated without any concerns with `npm update` BUT it only works if the dependencies in package.json is with tilda (~). Tilda allows dependencies to ONLY be updated on the semver version. If a dependency has a caret (^) that dependency is updated also to latest minor release.

***Note:*** Our work follows the [Semantic Versioning practices](https://semver.org/) in which:
***Note:*** Given a version number MAJOR.MINOR.PATCH of a repository, increment the:

- MAJOR version when you make incompatible API changes,
- MINOR version when you add functionality in a backwards compatible manner, and
- PATCH version when you make backwards compatible bug fixes.

### To update dependencies you can use

- `npx npm-check-updates -u` which updates also major versions
- `npm update` which updates ONLY safe minor and patch versions

- it is also good to run a `npm audit` from time to time and run a `npm audit fix --force`

## Checklist upon relase of a new SolidOS stack

The following is a guideline of what should be considered upon a release. However, it should not be taken as an exhaustive list but more like a basic list.

- in each repository to be released you need to do a dependency upgrade with `npx npm-check-updates -u` -> this upgrades all dependencies to major versions. Afterwards one needs to make sure the repo builds and all tests pass
- each repository should be green in GitHub CI on the `main` branch
- build must follow a strict order becaused repositories depend on eachother. The priority is as follows:
  - rdflib
  - solid-logic
  - solid-ui
  - activitystreams-pane
  - chat-pane
  - contacts-pane
  - folder-pane
  - issue-pane
  - meeting-pane
  - profile-pane
  - source-pane
  - solid-panes
  - mashlib
  - NSS
  - solidos
***Note:*** The strict build order means for example, if you do a change in `solid-ui`, all following panes that make use of the `solid-ui` changes need to be also upgraded. And then `solid-panes` needs to mandatorily be upgraded to contain the new `solid-ui`version and because `solid-panes` version changes also `mashlib` version needs to change.

To ease these work, SolidOS contains a [release script](https://github.com/SolidOS/solidos/blob/main/scripts/release). However, the release script also updates ALL dependencies to major versions in ALL repos, which means the above steps MUST be done beforehand.
