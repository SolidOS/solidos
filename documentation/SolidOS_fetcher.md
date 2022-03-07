# SolidOS Fetcher
## Redefining the fetch method in rdflib and SolidOS

An app may wish to redefine the method rdflib and SolidOS use to read and write data.  One reason is to handle protocols other than https:, e.g. file: or browser:.  Another reason would be local-first replicating fetches.  Once rdflib's fetch is redefined, the new fetch will be used by all fetcher and updateManager methods (load, webOperation, update, etc). 

### An app using *rdflib*
Can override the fetch globally 
```
     window.solidFetch = myFetchMethod  // in browser 
     global.solidFetch = myFetchMethod  // in nodejs
```
Or modify a specific fetcher
```
    myFetcher = $rdf.fetcher(store,{fetch:myFetchMethod})
```

### An app using mashlib or panes
Can override the fetch globally
```
   panes.UI.store.fetcher._fetch = myFetchMethod
```

### Additional details

Please keep in mind that rdflib's fetcher object does a lot more than simply fetch a document, it loads the headers and other details into the store and performs various checks.  Redefining the *fetch* only redefines the actual reading and writing, all other parts of what the fetcher does remain in place.  This includes checking authentication status when needed.  Redefining the fetch has no necessary impact on the authentication process, to alter that see [the documentation on private resources in SolidOS](https://github.com/solid/solidos/blob/main/documentation/Using_Private_Resources_In_SolidOS.md).  

The fetcher object's other activities mean that the fetch you redefine must conform to the Solid REST Protocol - content-types are required for methods that write, wac-allow headers are expected in responses, etc.  Without these, you can do a simple fetcher.webOperation but fetcher.load and updateManager.update will fail somewhere within rdflib or SolidOS.  The [Solid Rest](https://github.com/solid/solid-rest) library provides an in-client version of REST that reads incoming headers and sends back appropriate Solid REST responses.  An app wishing to redefine the fetch will need to use Solid Rest or an equivalent layer that interprets incoming requests and formulates outgoing responses.

### Note for SolidOS developers

Within the SolidOS stack, please do not ever use `window.fetch` or `cross-fetch` unless you are certain it will not interfere with user-defined fetches.  Instead use `fetcher.webOperation()` which will respect any user defined fetch and fallback to cross-fetch or Inrupt authenticated fetch when needed.

### A code example

This example creates a trivial fetch method that does nothing but return a new Response object, which, by default has a status of 200.  We then try to fetch a non-existant URI.  The default fetch gives 404 and the altered fetch 200 for the same URI.  This proves we have redefined the fetch.
```
const $rdf = require('rdflib');                                                        
const store = $rdf.graph();                                                               
const uri = 'https://example.com/fribble-frabble';                                     

const myFetchMethod = async ()=> { return new Response(); }                            
const defaultFetcher = $rdf.fetcher(store);                                             
const alteredFetcher = $rdf.fetcher(store,{fetch:myFetchMethod});                       
                                                                                       
(async()=>{                                                                            
  console.log('Default fetch status : '+ await getStatus(uri,defaultFetcher));         
  console.log('Altered fetch status : '+ await getStatus(uri,alteredFetcher));         
})();                                                                                  
                                                                                       
async function getStatus(uri,fetcher){                                                 
  try {                                                                                
    response = await fetcher.webOperation('GET',uri);                                  
    return response.status;                                                            
  }                                                                                    
  catch(e){                                                                            
    return e.response.status;                                                          
  }                                                                                    
}    
```

See also [the original issue on github](https://github.com/solid/solidos/issues/72)

## Requesting public data through using the fetcher

Each `store` (or rdflib.graph()) has a fetcher (see [code in rdflib](https://github.com/linkeddata/rdflib.js/blob/f8a0b35364313157f6af511738e830881f18f312/src/index.ts#L125). And so does the `store` in SolidOS, see [code in solid-logic](https://github.com/solid/solid-logic/blob/1f5bc16a9b5eaa2af97267ec8e48b66a8cc4a2c2/src/logic/SolidLogic.ts#L37)).

The rdflib fetcher has code which tries to fetch a URL on the web, first with credentials, after a failed request with credentials it checkes without (see [code](https://github.com/linkeddata/rdflib.js/blob/f8a0b35364313157f6af511738e830881f18f312/src/fetcher.ts#L1847)).

Tim BL: "It is a pain that you can’t just look up a URI online, in general without knowing an extra bit of data “is it public”. This sort of breaks the web a bit."

When you as a web app do a http request with the credentials omitted, then the browser is kinder to you CORS wise. It allows access to servers which use the “*” wildcard for origins they trust.
For public data, therefore, it is good to force credentials to be omiteed. You don’t want the fetcher trying to log into wikidata with solidOS for example.

The possibility to omit credentials is also used in the SolidOS fetcher (see [code in solid-logic](https://github.com/solid/solid-logic/blob/1f5bc16a9b5eaa2af97267ec8e48b66a8cc4a2c2/src/logic/solidLogicSingleton.ts#L6)). And is propagated in [solid-ui for wikidata](https://github.com/solid/solid-ui/blob/c5a8888d6cb61363bc0445be007e3c96de593338/src/widgets/forms/autocomplete/publicData.ts#L98) and [solid-ui SPARQL query](https://github.com/solid/solid-ui/blob/c5a8888d6cb61363bc0445be007e3c96de593338/src/widgets/forms/autocomplete/publicData.ts#L376).
