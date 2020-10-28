#!/bin/bash

git checkout master
git pull
npm install solid-ui@latest
git commit -am'npm install solid-ui@latest'
npm version minor
npm publish -timeout=9999999
