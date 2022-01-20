# Redefining the fetch method in rdflib and SolidOS

An app may wish to redefine the method rdflib and SolidOS use to read and write data.  One reason is to handle protocols other than https:, e.g. file: or browser:.  Another reason would be local-first replicating fetches.  Once rdflib's fetch is redefined, the new fetch will be used by all fetcher methods (load, webOperation, update, etc). 

## An app using *rdflib*
Can override the fetch globally 
```
     window.solidFetch = myFetchMethod  // in browser 
     global.solidFetch = myFetchMethod  // in nodejs
```
Or modify a specific fetcher
```
    myFetcher = $rdf.fetcher(kb,{fetch:myFetchMethod})
```

## An app using mashlib or panes
Can override the fetch globally
```
   panes.UI.store.fetcher._fetch = myFetchMethod
```

## Additional details

Please keep in mind that rdflib's fetcher object does a lot more than simply fetch a document, it loads the headers and other details into the store and performs various checks.  Redefining the *fetch* only redfines the actual reading and writing, all other parts of what the fetcher does remain in place.  This includes checking authentication status when needed.  Redefining the fetch has *no* impact on the authentication process, to alter that see [the documentation on private resources in SolidOS](https://github.com/solid/solidos/blob/main/documentation/Using_Private_Resources_In_SolidOS.md).  

The fetcher object's other activities mean that the fetch you redfine must conform to the Solid REST protocols - content-types are required for methods that write, wac-allow headers are expected in responses, etc.  Without these, your fetch will fail somewhere within rdflib or SolidOS.  The [Solid Rest]() library provides an in-client version of REST that reads incoming headers and sends back appropriate Solid REST responses.  An app wishing to redefine the fetch will need to use Solid Rest or an equivalent layer that interprets incoming requests and formulates outgoing responses.

## Note for SolidOS developers

Within the SolidOS stack, please do not ever use window.fetch or cross-fetch unless you are certain it will not interfere with user-defined fetches.  Instead use `fetcher.webOperation()` which will respect any user defined fetch and fallback to cross-fetch or Inrupt fetch when needed.

## A code example

This example creates a trivial fetch method that does nothing but return a new Response object, which, by default has a status of 200.  We then try to fetch a non-existant URI.  The default fetch gives 404 and the altered fetch 200 for the same URI.  This proves we have redefined the fetch.
```
const myFetchMethod = async ()=> { return new Response(); }                            
                                                                                       
const $rdf = require('rdflib');                                                        
const uri = 'https://example.com/fribble-frabble';                                     
                                                                                       
(async()=>{                                                                            
  let kb = $rdf.graph();                                                               
  const defaultFetcher = $rdf.fetcher(kb);                                             
  const alteredFetcher = $rdf.fetcher(kb,{fetch:myFetchMethod});                       
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
