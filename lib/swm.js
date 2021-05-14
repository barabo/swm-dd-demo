import { v4 } from "uuid";

// TODO: include the SWM IG version number here somewhere?

function getMessage(messageType, messagingHandle) {
  if (!messageType) {
    console.error('Messages SHALL specify a messageType');
  }
  if (!messagingHandle) {
    console.error('Messages SHALL specify a messagingHandle');
  }
  return {
    'messageType': messageType,
    'messagingHandle': messagingHandle,
    'messageId': v4(),
    'payload': {}
  }
}

function getResponse(responseToMessageId) {
  return {
    'responseToMessageId': responseToMessageId,
    'messageId': v4(),
    'payload': {},
  }
}

export function getHandshakeMessage(messagingHandle) {
  return getMessage('status.handshake', messagingHandle);
}

export function getHandshakeResponse(responseToMessageId) {
  return getResponse(responseToMessageId);
}

export function getUiDoneMessage(messagingHandle) {
  return getMessage('ui.done', messagingHandle);
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

export function getUiLaunchActivityMessage(messagingHandle, activityType, activityParameters) {
  return {
    ...getMessage('ui.launchActivity', messagingHandle),
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

export function getScratchpadCreateMessage(messagingHandle, resource) {
  return {
    ...getMessage('scratchpad.create', messagingHandle),
    'payload': {
      'resource': resource,
    }
  }
}

export function getScratchpadCreateResponse(responseToMessageId, status, location, outcome) {
  return getScratchpadResponse(responseToMessageId, status, location, outcome);
}

export function getScratchpadUpdateMessage(messagingHandle, resource, location) {
  return {
    ...getMessage('scratchpad.update', messagingHandle),
    'payload': {
      'location': location,
      'resource': resource,
    }
  }
}

export function getScratchpadUpdateResponse(responseToMessageId, status, location, outcome) {
  return getScratchpadResponse(responseToMessageId, status, location, outcome);
}

export function getScratchpadDeleteMessage(messagingHandle, location) {
  return {
    ...getMessage('scratchpad.delete', messagingHandle),
    'payload': {
      'location': location,
    }
  }
}

export function getScratchpadDeleteResponse(responseToMessageId, status, outcome) {
  return getScratchpadResponse(responseToMessageId, status, null, outcome);
}

export function sendMessage(targetWindow, targetOrigin, message) {
  targetWindow.postMessage(message, targetOrigin);
}
