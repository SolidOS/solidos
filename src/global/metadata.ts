import $rdf, { Fetcher, IndexedFormula, NamedNode, sym } from 'rdflib'
import namespace from 'solid-namespace'

const ns = namespace($rdf)

export function getName (store: IndexedFormula, user: NamedNode): string {
  return store.anyValue(user, ns.vcard('fn'), null, user.doc()) ||
    store.anyValue(user, ns.foaf('name'), null, user.doc()) ||
    user.uri
}

export function getPod (): NamedNode {
  // @@ TODO: This is given that mashlib runs on NSS - might need to change when we want it to run on other Pod servers
  return sym(document.location.origin).site()
}

export async function getPodOwner (pod: NamedNode, store: IndexedFormula, fetcher: Fetcher): Promise<NamedNode | null> {
  // @@ TODO: This is given the structure that NSS provides - might need to change for other Pod servers
  const podOwner = sym(`${pod.uri}profile/card#me`)

  try {
    await fetcher.load(podOwner.doc())
    // @@ TODO: check back links to storage
  } catch (err) {
    console.log('Did NOT find pod owners profile at ' + podOwner)
    return null
  }
  if (podOwner) {
    const storageIsListedInPodOwnersProfile = store.holds(podOwner, ns.space('storage'), pod, podOwner.doc())
    if (!storageIsListedInPodOwnersProfile) {
      console.log(`** Pod owner ${podOwner} does NOT list pod ${pod} as storage`)
      return null
    }
  }
  return podOwner
}
