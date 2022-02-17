# This documentation talk about the Sep 2021 auth upgrade in SolidOS

SolidOS underwent a major refactoring in which the deprecated [solid-auth-client](https://github.com/solid/solid-auth-client/blob/main/src/solid-auth-client.js) lib was exchnaged with the [solid-auth-client] lib. At that time the changed code was part of solid-ui, see [here](https://github.com/solid/solid-ui/blob/a25381feb9279d98ee58f59aef03fc05bc6fe021/src/authn/authn.ts) a previous solid-ui version that contains the old authn. 
The new authentication refactoring was fully merged in [this version](https://github.com/solid/solid-ui/blob/da0a788397049a2b53eea42d2b893cf1c2f7d92e/src/authn/authn.ts) (still in solid-ui). 
As of February 2022 this part of the code was further refactored and is now part of solid-logic.

## What has changed?

### Code review

For a detailed view of what changed, the team had a code review which was recorded and stored in the team videos, look for [auth-upgrade code review](https://solidos.solidcommunity.net/public/SolidOS%20team%20meetings/SolidOS_team_videos.html). At the same location find also videos about a knowledge transfer regarding the new authentication (look for 'solid OIDC').

### UX upon login from NSS

There was also a diagram created before and after auth upgrade to record the UX upon login when one comes from the server. See diagrams [here](https://github.com/solid/solidos/discussions/54).

## How does this affect the SolidOS developer?

### Login

A compact code example how to login using SolidOS code is:
```
import { sym } from "rdflib";
import { default as pane } from "../src";
import { context, fetcher } from "./context";
import { authn, authSession } from "solid-logic";
import * as UI from "solid-ui";

const loginBanner = document.getElementById("loginBanner");
const webId = document.getElementById("webId");

loginBanner.appendChild(UI.login.loginStatusBox(document, null, {}));

async function finishLogin() {
  await authSession.handleIncomingRedirect();
  const session = authSession;
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    webId.innerHTML = "Logged in as: " + authn.currentUser().uri;
  } else {
    webId.innerHTML = "";
  }
}

finishLogin();
```

Full code is in [profile-pane](https://github.com/solid/profile-pane/blob/main/dev/index.ts).

A code example to use login in a website by embedding mashlib.js is in the [SolidOS Databrowser Webapp](https://github.com/solid/mashlib/blob/main/static/browse.html).

### Redirects

One of the biggest changes is probably how login redirects behave. Lets say your application A is under a domain https://applicationAdomain.com and your login code is activated under this domain A BUT after a successfull login you want to redirect the user to domain B (another domain). Well, this will not work anymore!
The fact that you could before, login to domainA and get redirected to domainB was quite debatable a security gap. However, the fact that you cannot do that anymore is restrictive for some use cases. 
You are invited to read further about it [here](https://github.com/inrupt/solid-client-authn-js/issues/1473#issuecomment-908202681).
Workarounds and hacks are welcome to be reported, let us know on <https://gitter.im/solid/solidos> gitter channel is you found any. Do handle with care.

## How does this effect other developer?

### Login code must be adapted in all previous Solid Apps

All previous Solid Apps should be updated to be able to work with the current Solid Server. This effort is recorded in [this ticket](https://github.com/solid/team/issues/19). The ticket also shows further examples how to upgrade and which Apps are affected. 

### Login from an iFrame

One cannot login/logout from an iFrame anymore. 
