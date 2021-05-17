import { v4 } from "uuid";

// TODO: include the SWM IG version number here somewhere?
// TODO: provide a function to inspect the client structure for errors and refactor redundant error checking logic
// TODO: include links in error messages to the relevant IG sections...
// TODO: create docstrings for all functions.

function getMessage(messageType, client) {
  var messagingHandle = '';
  if (!messageType) {
    console.error('Messages SHALL specify a messageType');
  }
  if (!client) {
    console.error('SMART client required for this library.');
  }
  else if (!client.tokenResponse) {
    console.error('SMART client has no tokenResponse attribute!');
  } else {
    messagingHandle = client.tokenResponse.smart_web_messaging_handle;
  }
  if (!messagingHandle) {
    console.error('SMART client missing smart_web_messaging_handle launch attribute!');
  }
  return {
    'messageType': messageType,
    'messagingHandle': client.tokenResponse.smart_web_messaging_handle || '',
    'messageId': v4(),
    'payload': {}
  }
}

function getResponse(responseToMessageId) {
  // TODO: error if responseToMessageId is empty
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

export function sendMessage(targetWindow, client, message) {
  if (typeof(message) === 'string') {
    console.error('sendMessage expects a message object, not a string.');
  }
  if (!client) {
    console.error('sendMessage requires a SMART client');
  } else if (!client.tokenResponse) {
    console.error('SMART client missing tokenResponse!');
  } else {
    const targetOrigin = client.tokenResponse.smart_web_messaging_origin;
    if (!targetOrigin) {
      console.error(
        'SMART client tokenResponse has no smart_web_messaging_origin!'
      );
    }
    targetWindow.postMessage(message, targetOrigin);
  }
}
