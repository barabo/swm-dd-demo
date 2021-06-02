# SMART Web Messaging Client Library

This client library is intended for use by EHR developers and app developers
who wish to enable SMART Web Messaging functionality in their software.

## Development

### Publish a new version

To publish a new version of the library into npm, you must first configure
your local npm to allow publishing new versions to https://www.npmjs.com/package/swm-client-lib

When ready to release a new version, please update the version number in
packages.json and check the bumped version in to git.

Publish the new version by running `npm run publish` - *not* - `npm publish`.
These commands do different things, and there is a *prepublish* script that
runs when you publish it the expected way.
