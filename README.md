# put.io sync

Synchronze directories from put.io to your local file system.

This script is intended to run as a cron job. put.io sync will.

put.io sync uses the put.io API v2.

- recreate your put.io file structure locally
- delete all files that allready have been downloaded from put.io
- delete empty directories from put.io

After downloading an file the script can optionaly notify you via Pushpin.

# Requirements

- node.js 0.10 or later (might work with older versions, havent tested it)
- [aria2](http://aria2.sourceforge.net/) download manager

# Installation

- `npm install`
- `cp config.sample.js config.js`
- you need to enter some API keys into the config.js file. look at the links inside this file

# Usage

Syncing directories from put.io to a local directory call:

`node sync.js -d put.io-directory-id -l /path/to/your/local/sync/dir`

If you want to sync TV shows you might so using the -s parameter. The script expects a subdirectory for every TV Show and will try to move TV shows directly to the correct dir.

`node sync.js -d put.io-tvshow-directory -s /path/to/your/tv-shows -l /path/were/all/the/rest/should/got/to`
