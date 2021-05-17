import { v4 } from "uuid";

// Sanity checking functions.

const expectedMessageType = Object.prototype.toString.call({});

function checkMessageType(message) {
  const type = Object.prototype.toString.call(message);
  if (type !== expectedMessageType) {
    console.error(
      `expected a message of type "${expectedMessageType}", got "${type}"!`
    );
  }
}

function checkClientStructure(client) {
  if (!client) {
    console.error('A SMART client is required to use this library!');
  }
  else if (!client.tokenResponse) {
    console.error('The provided SMART client has no tokenResponse attribute!');
  }
  if (!client.tokenResponse.smart_web_messaging_handle) {
    console.error(
      'SMART client is missing a smart_web_messaging_handle launch attribute!'
    );
  }
  if (!client.tokenResponse.smart_web_messaging_origin) {
    console.error(
      'SMART client is missing a smart_web_messaging_origin launch attribute!'
    );
  }
}

// Helper to enable the HTML5 postMessage API in the caller's context.

export function enablePostMessage(targetOrigin, callback) {
  const messageEventHandler = function (e) {
    if (e.origin === targetOrigin && e.data) {
      checkMessageType(e.data);
      callback(e.data);
    }
  }
  window.addEventListener('message', messageEventHandler, false);
}

// TODO: include the SWM IG version number here somewhere?
// TODO: include links in error messages to the relevant IG sections...
// TODO: create docstrings for all functions.

function getMessage(messageType, client) {
  if (!messageType) {
    console.error('Messages SHALL specify a messageType');
  }
  checkClientStructure(client);
  return {
    'messageType': messageType,
    'messagingHandle': client.tokenResponse.smart_web_messaging_handle || '',
    'messageId': v4(),
    'payload': {}
  }
}

function getResponse(responseToMessageId) {
  if (!responseToMessageId) {
    console.error('A response MUST have a responseToMessageId present.');
  }
  return {
    'responseToMessageId': responseToMessageId,
    'messageId': v4(),
    'payload': {},
  }
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
    'payload': {
      'status': status || '',
      'statusDetail': {
        'text': statusDetailText || '',
      }
    }
  }
}

export function getUiDoneResponse(responseToMessageId, status, statusDetailText) {
  return getUiResponse(responseToMessageId, status, statusDetailText);
}

export function getUiLaunchActivityMessage(client, activityType, activityParameters) {
  return {
    ...getMessage('ui.launchActivity', client),
    'payload': {
      'activityType': activityType,
      'activityParameters': activityParameters,
    }
  }
}

export function getUiLaunchActivityResponse(responseToMessageId, status, statusDetailText) {
  return getUiResponse(responseToMessageId, status, statusDetailText);  
}

function getScratchpadResponse(responseToMessageId, status, location, outcome) {
  const payload = { 'status': status };
  // Add the optional scratchpad response fields.
  if (location) {
    payload['location'] = location;
  }
  if (outcome) {
    payload['outcome'] = outcome;
  }
  return {
    ...getResponse(responseToMessageId),
    'payload': payload,
  }
}

export function getScratchpadCreateMessage(client, resource) {
  return {
    ...getMessage('scratchpad.create', client),
    'payload': {
      'resource': resource,
    }
  }
}

export function getScratchpadCreateResponse(responseToMessageId, status, location, outcome) {
  return getScratchpadResponse(responseToMessageId, status, location, outcome);
}

export function getScratchpadUpdateMessage(client, resource, location) {
  return {
    ...getMessage('scratchpad.update', client),
    'payload': {
      'location': location,
      'resource': resource,
    }
  }
}

export function getScratchpadUpdateResponse(responseToMessageId, status, location, outcome) {
  return getScratchpadResponse(responseToMessageId, status, location, outcome);
}

export function getScratchpadDeleteMessage(client, location) {
  return {
    ...getMessage('scratchpad.delete', client),
    'payload': {
      'location': location,
    }
  }
}

export function getScratchpadDeleteResponse(responseToMessageId, status, outcome) {
  return getScratchpadResponse(responseToMessageId, status, null, outcome);
}

export function sendMessage(client, message) {
  checkMessageType(message);
  checkClientStructure(client);
  const targetOrigin = client.tokenResponse.smart_web_messaging_origin;

  if (window.parent) {
    window.parent.postMessage(message, targetOrigin);
  } else if (window.opener) {
    window.opener.postMessage(message, targetOrigin);
  } else {
    console.error('Unable to send message - no receiver!');
  }
}

export function sendResponse(appWindow, message, appOrigin) {
  checkMessageType(message);
  appWindow.postMessage(message, appOrigin);
}
