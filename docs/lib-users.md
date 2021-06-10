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

A client *must* call `client.enable` to activate the `postMessage` event listener.  The library
event listener will validate the target origin of received messages, and correlate the messages
with any unresolved promises (see the section below on asynchronous calls).

**It is the responsibility of the EHR to verify that the messaging handle is valid!**

### Message creation

The client library provides a few different methods for constructing valid messages and responses.
If you wish to customize the messages or inspect them in any way before sending them, these methods
will be helpful.

Consider the following example.

```js
const launchProblemReview = client.createMessage('ui.launchActivity', {
  activityType: "problem-review",
  activityParameters: {
    problemLocation: "Condition/123"
  }
});
```

The client library uses the configured `smart_web_messaging_handle` and generates a unique message
ID to produce a message that looks like this.

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

If you're interested in submitting a pull request for the library, please visit the
[Maintainer Guide](./lib-maintainer.md).

Thank you!
