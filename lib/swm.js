import { v4 } from 'uuid';

/**
 * Maps the registered postMessage targetOrigins to the associated window objects.
 */
const handlers = new Map();

// Sanity checking functions.

export function checkIsListening(window) {
  // Complain if we don't have a way to receive a response from the receiver.
  if (![...handlers.values()].includes(window)) {
    console.error('No listener configured - unable to receive from target!');
  }
}

export function checkIsObject(message) {
  const objectTypeRepr = Object.prototype.toString.call({});
  const type = Object.prototype.toString.call(message);
  if (type !== objectTypeRepr) {
    console.error(
      `expected a message of type "${objectTypeRepr}", got "${type}"!`,
    );
  }
}

export function checkStructure(client) {
  if (!client) {
    console.error('A SMART client is required to use this library!');
  } else if (!client.tokenResponse) {
    console.error('The provided SMART client has no tokenResponse attribute!');
  }
  if (!client.tokenResponse.smart_web_messaging_handle) {
    console.error(
      'SMART client is missing a smart_web_messaging_handle launch attribute!',
    );
  }
  if (!client.tokenResponse.smart_web_messaging_origin) {
    console.error(
      'SMART client is missing a smart_web_messaging_origin launch attribute!',
    );
  }
}

// Helper to enable the HTML5 postMessage API in the caller's context.
export function enablePostMessage(targetOrigin, callback) {
  const handler = function (e) {
    if (e.origin === targetOrigin && e.data) {
      checkIsObject(e.data);
      callback(e.data);
    }
  };
  handlers.set(targetOrigin, window);
  window.addEventListener('message', handler, false);
  return () => {
    handlers.delete(targetOrigin);
    window.removeEventListener('message', handler, false);
  };
}

// TODO: include the SWM lib or IG version number here somewhere?
//   import { version } from './package.json';  // ???
// TODO: include links in error messages to the relevant IG sections...
// TODO: create docstrings for all functions.
// TODO: provide typescript types for all functions?

function getMessage(messageType, client) {
  if (!messageType) {
    console.error('Messages SHALL specify a messageType');
  }
  checkStructure(client);
  return {
    messageType: messageType,
    messagingHandle: client.tokenResponse.smart_web_messaging_handle || '',
    messageId: v4(),
    payload: {},
  };
}

function getResponse(responseToMessageId) {
  if (!responseToMessageId) {
    console.error('A response MUST have a responseToMessageId present.');
  }
  return {
    responseToMessageId: responseToMessageId,
    messageId: v4(),
    payload: {},
  };
}

export function getHandshakeMessage(client) {
  return getMessage('status.handshake', client);
}

export function getHandshakeResponse(responseToMessageId) {
  return getResponse(responseToMessageId);
}

export function getUiDoneMessage(client) {
  return getMessage('ui.done', client);
}

function getUiResponse(responseToMessageId, status, statusDetailText) {
  return {
    ...getResponse(responseToMessageId),
    payload: {
      status: status || '',
      statusDetail: {
        text: statusDetailText || '',
      },
    },
  };
}

export function getUiDoneResponse(
  responseToMessageId,
  status,
  statusDetailText,
) {
  return getUiResponse(responseToMessageId, status, statusDetailText);
}

export function getUiLaunchActivityMessage(
  client,
  activityType,
  activityParameters,
) {
  return {
    ...getMessage('ui.launchActivity', client),
    payload: {
      activityType: activityType,
      activityParameters: activityParameters,
    },
  };
}

export function getUiLaunchActivityResponse(
  responseToMessageId,
  status,
  statusDetailText,
) {
  return getUiResponse(responseToMessageId, status, statusDetailText);
}

function getScratchpadResponse(responseToMessageId, status, location, outcome) {
  const payload = { status: status };
  // Add the optional scratchpad response fields.
  if (location) {
    payload['location'] = location;
  }
  if (outcome) {
    payload['outcome'] = outcome;
  }
  return {
    ...getResponse(responseToMessageId),
    payload: payload,
  };
}

export function getScratchpadCreateMessage(client, resource) {
  return {
    ...getMessage('scratchpad.create', client),
    payload: {
      resource: resource,
    },
  };
}

export function getScratchpadCreateResponse(
  responseToMessageId,
  status,
  location,
  outcome,
) {
  return getScratchpadResponse(responseToMessageId, status, location, outcome);
}

export function getScratchpadUpdateMessage(client, resource, location) {
  return {
    ...getMessage('scratchpad.update', client),
    payload: {
      location: location,
      resource: resource,
    },
  };
}

export function getScratchpadUpdateResponse(
  responseToMessageId,
  status,
  location,
  outcome,
) {
  return getScratchpadResponse(responseToMessageId, status, location, outcome);
}

export function getScratchpadDeleteMessage(client, location) {
  return {
    ...getMessage('scratchpad.delete', client),
    payload: {
      location: location,
    },
  };
}

export function getScratchpadDeleteResponse(
  responseToMessageId,
  status,
  outcome,
) {
  return getScratchpadResponse(responseToMessageId, status, null, outcome);
}

export function sendMessage(smartLaunchClient, message) {
  checkIsListening(document.defaultView);
  checkIsObject(message);
  checkStructure(smartLaunchClient);
  const ehrOrigin = smartLaunchClient.tokenResponse.smart_web_messaging_origin;
  if (ehrOrigin !== new URL(ehrOrigin).origin) {
    console.error(`Invalid message origin: '${ehrOrigin}'`);
  }
  if (window.parent) {
    window.parent.postMessage(message, ehrOrigin);
  } else if (window.opener) {
    window.opener.postMessage(message, ehrOrigin);
  } else {
    console.error('Unable to send message - no receiver!');
  }
}

export function sendResponse(appWindow, message, appOrigin) {
  checkIsListening(document.defaultView);
  checkIsObject(message);
  if (appOrigin !== new URL(appOrigin).origin) {
    console.error(`Invalid response origin: '${appOrigin}'`);
  }
  appWindow.postMessage(message, appOrigin);
}
