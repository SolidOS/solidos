#!/bin/bash

git checkout master
git pull
npm install solid-ui@latest chat-pane@latest contacts-pane@latest folder-pane@latest issue-pane@latest meeting-pane@latest source-pane@latest
git commit -am'npm install solid-ui@latest chat-pane@latest contacts-pane@latest folder-pane@latest issue-pane@latest meeting-pane@latest source-pane@latest'
npm version minor
npm publish -timeout=9999999
