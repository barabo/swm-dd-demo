# SMART Web Messaging Client Library

This client library is intended for use by EHR developers and app developers
who wish to enable SMART Web Messaging functionality in their software.

## Installation

```sh
npm install --save swm-client-lib
```

## Browser Usage

This module currently only supports ES6 imports, so in your code please import it like this:

```js
import * as swm from 'swm-client-lib'
```

## Setup

### Messaging Handle

To use SMART Web Messaging in your app, you must provide a valid messaging handle with each
message sent to the EHR.  This value is provided to you in the launch context parameters of
the SMART Launch client.

This parameter is the `smart_web_messaging_handle`.

### Target Origin

The HTML5 `postMessage` API also requires that a `targetOrigin` parameter be provided so
the browser can enable origin validation for received messages.  As an app developer, you
must provide the EHR origin, which is also provided to you in the SMART Launch client as a
launch context parameter.

This parameter is the `smart_web_messaging_origin`.

### SWM Client

To create a client in your code, provide the two parameters mentioned above.

```js
const client = swm.Client(messagingHandle, targetOrigin);
```

Once the client is created, you must enable a collection of callbacks to handle the possible
message events.

The client expects an object with the following structure.

```js
const receivers = {
  receiveMessage: <message callback>,
  receiveResponse: <response callback>,
  receiveError: <error callback>,
};
```

So, for exmaple, an *app* might create *this* client.

```js
client.enable({
  // Note: it's uncommon for an App to receive a message - typically only responses are expected.
  receiveMessage: console.warn,

  receiveResponse: (r) => {
    if (r.status === '200 OK') {
      console.log('GREAT!');
    } else {
      console.log('Uh Oh!', r)
    }
  },

  receiveError: console.error,
});
```

While an *EHR* might create *this* client.

```js
client.enable({
  receiveMessage: (m) => {
    if (m.messageType === 'status.handshake') {
      handshakeResponse(m);
    } else {
      console.warn('unknown message type', m.messageType);
    }
  },

  // Note: it's uncommon for an EHR to receive a response - typically only messages are expected.
  receiveResponse: console.warn,

  receiveError: console.error,
});
```

A client *must* call `client.enable` to activate the `postMessage` event listener.  The library event listener will validate the target origin of received messages, and correlate the messages with any unresolved promises (see the section below on asynchronous calls).

**It is the responsibility of the EHR to verify that the messaging handle is valid!**

### Message creation

The client library provides a few different methods for constructing valid messages and responses.  If you wish to customize the messages or inspect them in any way before sending them, these methods will be helpful.

Consider the following example.

```js
const launchProblemReview = client.createMessage('ui.launchActivity', {
  activityType: "problem-review",
  activityParameters: {
    problemLocation: "Condition/123"
  }
});
```

The client library uses the configured `smart_web_messaging_handle` and generates a unique message ID to produce a message that looks like this.

```json
{
  "messageType": "ui.launchActivity",
  "messagingHandle": "RXhhbXBsZSBoYW5kbGUK",
  "messageId": "e6cd18b7-ba90-4bc1-a415-b522bfebb0ac",
  "payload": {
    "activityType": "problem-review",
    "activityParameters": {
      "problemLocation": "Condition/123"
    }
  }
}
```

The message can then be sent in a separate call using the `sendMessage` call.

```js
client.sendMessage(launchProblemReview);
```

Another way to do the same thing is with the `client.send` call.

```js
client.send('ui.launchActivity', {
  activityType: "problem-review",
  activityParameters: {
    problemLocation: "Condition/123"
  }
});
```

### Asynchronous calls

The client also supports asynchronous calls for a better app development experience.

For example, the following app code results in a handshake message being sent to the EHR and the
EHR response object printed to the console.

```js
client.getMessageResponse('status.handshake').then(console.log);
```

## Library Development

The remainder of this document is intended for library maintainers.  Thank you!

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
