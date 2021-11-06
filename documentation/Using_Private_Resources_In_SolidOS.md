# Using Private Resources in SolidOS

## Short Answer : 

In SolidOS, always use solid-ui.authn.currentUser() to check login status or find the applicable webID; do not directly check
authSession.info.webId except during operations on the authSession itself.

* use me = authn.currentUser() in places not directly part of authSession management 
* use me = authn.authSession.info.webId during authSession operations
* use await authn.checkUser() when you need to activate a session after login
* check urls like http//foo/?uri=http://bar or web app and Dk will not function

## Longer answer :

We want the SolidOS experience of private resources like local file systems and cloud storages to be the same as for Pods except
that the user is treated as already logged-in for the private resources, assuming that they have their own authentication system
outside of Solid.  

An app - a deployment of mashlib/dist/browse.html - can mark itself as serving private resources that do not need Solid authentication.
For example a desktop app might serve local files or proxy to Dropbox files like so:
```
  window.SolidAppContext = {
    noAuth : 'http://localhost:3000/',
    webId : 'http://localhost:3000/localUser/profile/card#me',
  }
```
That says "when viewing pages on this private site, don't try to login or authenticate, use the webId I have supplied instead
and treat me as always logged in to this site".  If the private site has profiles, preferences, etc. SolidOS can now serve
them as they would to an authenticated page using that webId, for example displaying a dashboard.

From the point of view of SolidOS, this means that we should not directly use solid-ui.authn.authSession.webId as a way to treat
the user as logged in. Instead we should use the solid-ui.authn.currentUser() method which now does a check for the window.SolidAppContext.
Instead of checking for "is authenticated" this will check for "is logged in" which includes authenticated access to non-private sites AND
unauthenticated access to a private site.

Here's how the currentUser method (or technically, the appContext method it calls) knows which pages to authenticate: If the user has
specified a site as noAuth and the current location.href hostname is that site and the uri parameter of the location.href is also on
that site, treat it as a noAuth request.  So if the databrowser is being served from a private site AND the databrowser is viewing a 
page on that private site, don't require authentication check or login. But if the databrowser is served from the private site and
viewing a page on any other site, do require an authentication check and possible login.  This point is relevant everywhere, not just login - if you are using a URL, check to see if it is viewing one page from another page and do the action on the page being viewed.

The worst that happens if someone tries to spoof things is the UI lies about the user being logged in and when they try to access
something that requires Solid authentication, they'll get a 401.

