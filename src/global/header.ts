import $rdf, { IndexedFormula, NamedNode, sym } from "rdflib"
import namespace from "solid-namespace"
import panes from "solid-panes"
import { icon } from "./icon"
import { SolidSession } from "../../typings/solid-auth-client"
import { emptyProfile } from "./empty-profile"
import { throttle } from "../helpers/throttle"
import { getPod } from "./metadata"

const ns = namespace($rdf)

export async function initHeader (store: IndexedFormula) {
  const header = document.getElementById("PageHeader")
  if (!header) {
    return
  }

  const pod = getPod()
  panes.UI.authn.solidAuthClient.trackSession(rebuildHeader(header, store, pod))
}

function rebuildHeader (header: HTMLElement, store: IndexedFormula, pod: NamedNode) {
  return async (session: SolidSession | null) => {
    const user = session ? sym(session.webId) : null
    header.innerHTML = ""
    header.appendChild(await createBanner(store, pod, user))
  }
}

async function createBanner (store: IndexedFormula, pod: NamedNode, user: NamedNode | null): Promise<HTMLElement> {
  const podLink = document.createElement("a")
  podLink.href = pod.uri
  podLink.classList.add("header-banner__link")
  podLink.innerHTML = icon

  const menu = user
    ? await createUserMenu(store, user)
    : createLoginSignUpButtons()

  const banner = document.createElement("div")
  banner.classList.add("header-banner")
  banner.appendChild(podLink)
  banner.appendChild(menu)

  return banner
}

function createLoginSignUpButtons () {
  const profileLoginButtonPre = document.createElement("div")
  profileLoginButtonPre.classList.add("header-banner__login")
  profileLoginButtonPre.appendChild(panes.UI.authn.loginStatusBox(document, null, {}))
  return profileLoginButtonPre
}

async function openDashboardPane (outliner: any, pane: string) {
  const rows = document.querySelectorAll("#outline > tr > td > table > tr")
  if (rows.length < 2 && rows[0].parentNode) {
    const row = document.createElement("tr")
    const container = row.appendChild(document.createElement("td"))
    rows[0].parentNode.appendChild(row)
    return outliner.showDashboard(container, true)
  }
  const container = rows[rows.length - 1].childNodes[0]
  return outliner.showDashboard(container, true, pane)
}

function createUserMenuButton (label: string, onClick: EventListenerOrEventListenerObject): HTMLElement {
  const button = document.createElement("button")
  button.classList.add("header-user-menu__button")
  button.addEventListener("click", onClick)
  button.innerText = label
  return button
}

async function createUserMenu (store: IndexedFormula, user: NamedNode): Promise<HTMLElement> {
  const outliner = panes.getOutliner(document)

  const loggedInMenuList = document.createElement("ul")
  const menuItems = await getMenuItems(outliner)
  menuItems.forEach(item => {
    loggedInMenuList.appendChild(createUserMenuItem(createUserMenuButton(item.label, () => openDashboardPane(outliner, item.tabName || item.paneName))))
  })
  loggedInMenuList.appendChild(createUserMenuItem(createUserMenuButton("Log out", () => panes.UI.authn.solidAuthClient.logout())))

  const loggedInMenu = document.createElement("nav")
  loggedInMenu.classList.add("header-user-menu__navigation-menu")
  loggedInMenu.setAttribute("aria-hidden", "true")
  loggedInMenu.appendChild(loggedInMenuList)

  const loggedInMenuTrigger = document.createElement("button")
  loggedInMenuTrigger.classList.add("header-user-menu__trigger")
  loggedInMenuTrigger.type = "button"
  const profileImg = getProfileImg(store, user)
  if (typeof profileImg === "string") {
    loggedInMenuTrigger.innerHTML = profileImg
  } else {
    loggedInMenuTrigger.appendChild(profileImg)
  }

  const loggedInMenuContainer = document.createElement("div")
  loggedInMenuContainer.classList.add("header-banner__user-menu", "header-user-menu")
  loggedInMenuContainer.appendChild(loggedInMenuTrigger)
  loggedInMenuContainer.appendChild(loggedInMenu)

  const throttledMenuToggle = throttle((event: Event) => toggleMenu(event, loggedInMenuTrigger, loggedInMenu), 50)
  loggedInMenuTrigger.addEventListener("click", throttledMenuToggle)
  loggedInMenuContainer.addEventListener("mouseover", throttledMenuToggle)
  loggedInMenuContainer.addEventListener("mouseout", throttledMenuToggle)

  return loggedInMenuContainer
}

function createUserMenuItem (child: HTMLElement): HTMLElement {
  const menuProfileItem = document.createElement("li")
  menuProfileItem.classList.add("header-user-menu__list-item")
  menuProfileItem.appendChild(child)
  return menuProfileItem
}

async function getMenuItems (outliner: any): Promise<Array<{
  paneName: string;
  tabName?: string;
  label: string;
  icon: string;
}>> {
  return await outliner.getDashboardItems()
}

function getProfileImg (store: IndexedFormula, user: NamedNode): string | HTMLElement {
  const hasPhoto = (store.anyValue as any)(user, ns.vcard("hasPhoto"), null, user.doc())
  if (!hasPhoto) {
    return emptyProfile
  }
  const profileImage = document.createElement("div")
  profileImage.classList.add("header-user-menu__photo")
  profileImage.style.backgroundImage = `url("${hasPhoto}")`
  return profileImage
}

function toggleMenu (event: Event, trigger: HTMLButtonElement, menu: HTMLElement): void {
  const isExpanded = trigger.getAttribute("aria-expanded") === "true"
  const expand = event.type === "mouseover"
  const close = event.type === "mouseout"
  if (isExpanded && expand || !isExpanded && close) {
    return
  }
  trigger.setAttribute("aria-expanded", (!isExpanded).toString())
  menu.setAttribute("aria-hidden", isExpanded.toString())
}
