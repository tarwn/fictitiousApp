#!/bin/sh

cd $TRAVIS_BUILD_DIR/build/launchready
npm install
node build.js $LR_APPLICATIONID --appId=$LR_APPID --apiKey=$LR_APIKEY --name="TravisCI-$TRAVIS_BUILD_NUMBER" --baseURL=https://$TRAVIS_APP_NAME_STAGING.azurewebsites.net --savePath=results.xml --errorOnFailure=101
