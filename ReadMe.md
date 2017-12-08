
Folder structure
==================

THis is a mix of special files and application files. Some of the special files are
specific to build services, deployment environments, etc.

* .circleci/config.yml - CircleCI Build Config (Location Required)
* app/* - the Node JS app, typically deployed on it's own
* azure/web.config - a web.config for azure web sites, copied to app/ before deploy
* build/* - scripts for various buld processes, needs organization
* .travis.yml - Travis CI config (Location Required)
* Procfile - Heroku environment config (Location Required)
