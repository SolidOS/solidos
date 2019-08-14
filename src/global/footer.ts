import { Fetcher, IndexedFormula, NamedNode, sym } from "rdflib"
import panes from "solid-panes"
import { SolidSession } from "../../typings/solid-auth-client"
import { getName, getPod, getPodOwner } from "./utils"

export async function initFooter (store: IndexedFormula, fetcher: Fetcher) {
  const footer = document.getElementById("PageFooter")
  if (!footer) {
    return
  }

  const pod = getPod()
  const podOwner = await getPodOwner(pod, store, fetcher)
  panes.UI.authn.solidAuthClient.trackSession(rebuildFooter(footer, store, pod, podOwner))
}

function rebuildFooter (footer: HTMLElement, store: IndexedFormula, pod: NamedNode | null, podOwner: NamedNode | null) {
  return async (session: SolidSession | null) => {
    const user = session ? sym(session.webId) : null
    footer.innerHTML = ""
    footer.appendChild(await createControllerInfoBlock(store, user, pod, podOwner))
  }
}

function createControllerInfoBlock (store: IndexedFormula, user: NamedNode | null, pod: NamedNode | null, podOwner: NamedNode | null): HTMLElement {
  const profileLinkContainer = document.createElement("span")
  profileLinkContainer.classList.add("footer-pod-info")

  if (pod && podOwner) {
    const podLinkPre = document.createElement("span")
    podLinkPre.innerText = "You're visiting "

    const podLink = document.createElement("a")
    podLink.href = pod.uri
    podLink.innerText = "the Pod"

    const profileLinkPre = document.createElement("span")
    profileLinkPre.innerText = " controlled by "

    const profileLink = document.createElement("a")
    profileLink.href = podOwner.uri
    profileLink.innerText = getName(store, podOwner)
    profileLinkContainer.appendChild(podLinkPre)
    profileLinkContainer.appendChild(podLink)
    profileLinkContainer.appendChild(profileLinkPre)
    profileLinkContainer.appendChild(profileLink)
  } else {
    const podOwnerNotFoundInfo = document.createElement("span")
    podOwnerNotFoundInfo.innerText = "Unable to guess pod owner.."
    profileLinkContainer.appendChild(podOwnerNotFoundInfo)
  }

  const solidProjectLinkPre = document.createElement("span")
  solidProjectLinkPre.innerText = ". For more info, check out "

  const solidProjectLink = document.createElement("a")
  solidProjectLink.href = "https://solidproject.org"
  solidProjectLink.innerText = "solidproject.org"

  const solidProjectLinkPost = document.createElement("span")
  solidProjectLinkPost.innerText = "."

  profileLinkContainer.appendChild(solidProjectLinkPre)
  profileLinkContainer.appendChild(solidProjectLink)
  profileLinkContainer.appendChild(solidProjectLinkPost)

  return profileLinkContainer
}
