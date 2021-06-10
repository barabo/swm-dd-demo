# Library Maintenance

This document is intended for anyone who wishes to participate in developing
changes or features to the client codebase.

If you're looking for information on how to use the client library, see the
[User Guide](./README.md).

### Publish a new version

To publish a new version of the library into npm, you must first configure
your local npm to allow publishing new versions to
[https://www.npmjs.com/package/swm-client-lib](https://www.npmjs.com/package/swm-client-lib)

When ready to release a new version, please update the version number in both
`package.json` and in the module itself, `swm.js`.

#### `package.json`

```json
{
  "name": "swm-client-lib",
  "version": "0.3.5",
  UPDATE THIS ^^^^^
  "description": "A SMART Web Messaging Client Library",
  "main": "swm.js",
  "exports": {
    ".": {
      "browser": {
        "default": "./swm.js"
      }
    }
  },
...
```

#### `swm.js`

```js
/**
 * Returns client capabilities.
 *
 * @returns A collection of client capabilities.
 */
export function getCapabilities() {
  return {
    version: '0.3.5',  // UPDATED WITH EACH PUBLISHED RELEASE
    igVersion: 'STU1',
    supportedMessageTypes: [
      'status.handshake',
      'ui.done',
      'ui.launchActivity',
      'scratchpad.create',
      'scratchpad.read',
      'scratchpad.update',
      'scratchpad.delete',
    ],
  };
}
```

Publish the new version by running `npm run publish` - *not* - `npm publish`.
These commands do different things, and there is a *prepublish* script that
runs when you publish it the expected way.

Here's an example command line session showing the publication and release of `v0.3.5`.

```sh
can@msft-mbp ~/code/swm-dd-demo/lib (main) $ npm run publish

> swm-client-lib@0.3.5 prepublish
> bash prepublish.sh

Ensuring a clean build...

> swm-client-lib@0.3.5 lint
> prettier --check swm.js

Checking formatting...
All matched files use Prettier code style!
Ensuring a fresh build...

> swm-client-lib@0.3.5 build
> snowpack build

[24:12:10] [snowpack] ! building files...
[24:12:10] [snowpack] ✔ files built. [0.02s]
[24:12:10] [snowpack] ! building dependencies...
[24:12:10] [snowpack] ✔ dependencies built. [0.19s]
[24:12:10] [snowpack] ! writing to disk...
[24:12:10] [snowpack] ✔ write complete. [0.01s]
[24:12:10] [snowpack] ▶ Build Complete!
OK to publish new version: 0.3.5
Running 'npm publish' from the build directory!
npm notice 
npm notice 📦  swm-client-lib@0.3.5
npm notice === Tarball Contents === 
npm notice 776B  README.md               
npm notice 46B   meta/pkg/import-map.json
npm notice 3.1kB meta/pkg/uuid.js        
npm notice 6.6kB meta/pkg/uuid.js.map    
npm notice 851B  package.json            
npm notice 8.1kB swm.js                  
npm notice === Tarball Details === 
npm notice name:          swm-client-lib                          
npm notice version:       0.3.5                                   
npm notice filename:      swm-client-lib-0.3.5.tgz                
npm notice package size:  5.6 kB                                  
npm notice unpacked size: 19.5 kB                                 
npm notice shasum:        e0d7c6d656bd15a317dd27fb0fbe1af87f68d053
npm notice integrity:     sha512-BSDdyOua3vYwf[...]uyisTfa+m/Z5A==
npm notice total files:   6                                       
npm notice 
⸨░░░░░░░░░░░░░░░░░░⸩ ⠼ : notice
> swm-client-lib@0.3.5 publish
> echo PUBLISHED

PUBLISHED░░░░░░░░░░⸩ ⠼ : notice
+ swm-client-lib@0.3.5

> swm-client-lib@0.3.5 publish
> echo PUBLISHED

PUBLISHED

can@msft-mbp ~/code/swm-dd-demo/lib (main) $ git add build/

can@msft-mbp ~/code/swm-dd-demo/lib (main) $ git commit -m "v0.3.5 release"
[main 9ee1db9] v0.3.5 release
 2 files changed, 12 insertions(+), 8 deletions(-)

can@msft-mbp ~/code/swm-dd-demo/lib (main) $ git push
Enumerating objects: 25, done.
Counting objects: 100% (21/21), done.
Delta compression using up to 12 threads
Compressing objects: 100% (13/13), done.
Writing objects: 100% (13/13), 1.28 KiB | 1.28 MiB/s, done.
Total 13 (delta 10), reused 0 (delta 0)
remote: Resolving deltas: 100% (10/10), completed with 5 local objects.
```
