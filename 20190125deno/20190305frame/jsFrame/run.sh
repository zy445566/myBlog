#!/usr/bin/env bash
if [ "$1" == "deno" ]
then
    deno ./engineMiddle/deno/index.js 
else
    NODE_OPTIONS='--experimental-vm-modules --experimental-modules --loader ./engineMiddle/node/custom-loader.mjs' node ./engineMiddle/node/index.js
fi