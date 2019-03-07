#!/usr/bin/env bash
if [ "$1" == "deno" ]
then
    deno --allow-read --allow-write --allow-net --allow-env ./engineMiddle/deno/mod.js
else
    NODE_OPTIONS='--experimental-vm-modules --experimental-modules --loader ./engineMiddle/node/custom-loader.mjs' node ./engineMiddle/node/index.js
fi