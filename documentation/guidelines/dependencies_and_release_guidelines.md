
# 🤗 Welcome CONTRIBUTOR

This document talks about SolidOS stack Node versions and about work required upon release, in particular about dependency upgrades.

Table of contents:

- [🤗 Welcome CONTRIBUTOR](#-welcome-contributor)
  - [Usage of Node versions in SolidOS](#usage-of-node-versions-in-solidos)
  - [Update Node version used in SolidOS](#update-node-version-used-in-solidos)
  - [Dependency upgrades](#dependency-upgrades)
    - [To update dependencies you can use](#to-update-dependencies-you-can-use)
  - [Checklist upon relase of a new SolidOS stack](#checklist-upon-relase-of-a-new-solidos-stack)

## Usage of Node versions in SolidOS

Local development should be built with the latest used Node version. One can make sure this is the case by running `nvm use` in the root of the repo. This command will look for a file named `.nvmrc`, and use the node version specified therein.
Since the whole SolidOS stack is built into the `mashlib.js` at the end, the Node version used is not vitally important, but best practice is still to so do it so.

## Update Node version used in SolidOS

Once a year, you should upgrade the Node version you're using. In April of each year, Node releases an even-numbered Node version which will be taken into [LTS (long term support) releases](https://nodejs.org/en/about/releases/).

To upgrade the Node version in SolidOS:

- change the Node version in CI of each affected SolidOS repo (including `release.yml` if available)
  - ensure the published node version in CI is at least one version earlier than latest release, but make sure it is still in LTS by checking the [Node Releases](https://nodejs.org/en/about/releases/)
- update the officially supported development Node version on SolidOS stack mentioned in `.nvmrc`. The `.nvmrc` file is available on each repo, [for example on SolidOS repo](https://github.com/solid/solidos/blob/main/.nvmrc).

## Dependency upgrades

- there are a few ways to check the dependency status of a repo, such as `npm outdated`, `npx npm-check-updates`, and `npx npm-check`.
- patch-up versions can be updated without any concern using `npm update` BUT this only works if the dependencies in `package.json` include tilde (`~`). Tilde allows dependencies to ONLY be updated on the semver version. If a dependency has a caret (`^`), that dependency is also updated to latest minor release.

***Note:*** Our work follows the [Semantic Versioning practices](https://semver.org/) in which, given a version number `MAJOR.MINOR.PATCH` of a repository, increment the:

- `MAJOR` version when you make incompatible API changes
- `MINOR` version when you add functionality in a backwards compatible manner
- `PATCH` version when you make bug fixes in a backwards compatible manner

### To update dependencies you can use

- `npm update` which updates ONLY safe minor and patch versions
- `npx npm-check-updates -u` which also updates major versions

- it is also good to run an `npm audit` from time to time, and run a `npm audit fix --force` as needed

## Checklist upon relase of a new SolidOS stack

The following is a guideline of what should be considered upon a release. It is not an exhaustive list, but covers most situations.

- In each repository to be released, you need to do a dependency upgrade with `npx npm-check-updates -u`. This upgrades all dependencies to major versions. Afterwards, you need to make sure the repo builds and all tests pass.
- The `main` branch of each repository should be green in GitHub CI.
- The build must follow a strict order because the repositories depend on each other. The priority is as follows:
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

To ease this work, SolidOS contains a [release script](https://github.com/SolidOS/solidos/blob/main/scripts/release); however, the release script also updates ALL dependencies in ALL repos to major versions, which means the above steps MUST be done beforehand.
