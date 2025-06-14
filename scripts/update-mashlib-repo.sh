#!/bin/bash

git checkout master
git pull
npm install rdflib@latest solid-namespace@latest solid-ui@latest solid-panes@latest
git commit -am'npm install rdflib@latest solid-namespace@latest solid-ui@latest solid-panes@latest'
npm version minor
npm publish -timeout=9999999
