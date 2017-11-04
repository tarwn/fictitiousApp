#!/bin/bash

cd launchready
npm install
node build.js $LR_APPLICATIONID --appId=$LR_APPID --apiKey=$LR_APIKEY --name="CircleCI-$CIRCLE_BUILD_NUM" --baseURL=$1 --savePath=results.xml
