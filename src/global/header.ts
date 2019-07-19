import { Fetcher, IndexedFormula, NamedNode, sym } from "rdflib"

export async function initHeader(store: IndexedFormula, fetcher: Fetcher) {
  const podUrl = getPodUrl()
  const profileUrl = getProfileUrl(podUrl)
  await fetcher.load(profileUrl)
  console.log(store)
}

function getPodUrl(): NamedNode {
  // TODO: This is given that mashlib runs on NSS - might need to change when we want it to run on other Pod servers
  return sym(document.location.origin)
}

function getProfileUrl(origin: NamedNode): NamedNode {
  // TODO: This is given the structure that NSS provides - might need to change for other Pod servers
  return sym(`${origin.uri}/profile/card#me`)
}