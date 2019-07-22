import $rdf, { Fetcher, IndexedFormula, NamedNode, sym } from "rdflib"
import namespace from "solid-namespace"
import panes from "solid-panes"
import { icon } from "./icon"
import { SolidSession } from "../../typings/solid-auth-client"

const ns = namespace($rdf)

export async function initHeader (store: IndexedFormula, fetcher: Fetcher) {
  const pod = getPod()
  const podOwnerProfile = getProfile(pod)
  await fetcher.load(podOwnerProfile)
  const header = document.getElementById("PageHeader")
  if (!header) {
    return
  }

  panes.UI.authn.solidAuthClient.trackSession(function(session: SolidSession | null) {
    const profile = session ? sym(session.webId) : null
    header.innerHTML = ''
    buildHeader(header, store, profile, pod, podOwnerProfile)
  })
}

function buildHeader(header: HTMLElement, store: IndexedFormula, profile: NamedNode | null, pod: NamedNode, podOwnerProfile: NamedNode) {
  header.appendChild(createPodLink(pod))
  if (!profile || (profile && !profile.equals(podOwnerProfile))) {
    header.appendChild(createProfileLink(store, podOwnerProfile))
  }
}

function createPodLink (pod: NamedNode): HTMLElement {
  const podLink = document.createElement("a")
  podLink.href = pod.uri
  podLink.classList.add("header-banner__link")
  podLink.innerHTML = icon

  const banner = document.createElement("div")
  banner.classList.add("header-banner")
  banner.appendChild(podLink)

  return banner
}

function createProfileLink (store: IndexedFormula, profile: NamedNode): HTMLElement {
  const profileLinkPre = document.createElement("span")
  profileLinkPre.innerText = "You're visiting the Pod controlled by "

  const profileLink = document.createElement("a")
  profileLink.href = profile.uri
  profileLink.classList.add("header-aside__link")
  profileLink.innerText = getName(store, profile)

  const profileLinkContainer = document.createElement("aside")
  profileLinkContainer.classList.add("header-aside")
  profileLinkContainer.appendChild(profileLinkPre)
  profileLinkContainer.appendChild(profileLink)
  return profileLinkContainer
}

function getName (store: IndexedFormula, profile: NamedNode): string {
  return (store.anyValue as any)(profile, ns.vcard("fn"), null, profile.doc()) ||
    (store.anyValue as any)(profile, ns.foaf("name"), null, profile.doc()) ||
    profile.uri
}

function getPod (): NamedNode {
  // TODO: This is given that mashlib runs on NSS - might need to change when we want it to run on other Pod servers
  return sym(document.location.origin)
}

function getProfile (origin: NamedNode): NamedNode {
  // TODO: This is given the structure that NSS provides - might need to change for other Pod servers
  return sym(`${origin.uri}/profile/card#me`)
}