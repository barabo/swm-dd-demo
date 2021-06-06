/**
 * TODO
 *  [ ] static library details via function swm.getCapabilities
 *  [ ] insert discovery data into handshake
 *  [ ] getMessage(messageType, ...) getters
 *  [ ] sendMessage(messageType, ...)
 *  [ ] client.send('status.handshake'), client.respondTo(message, ...{})
 */
import { v4 } from 'uuid';

/**
 * A client object to help make SMART Web Messaging calls and state management
 * easy.
 */
export class Client {
  /**
   * Constructs a SMART Web Messaging Client.
   *
   * @param {string} swmHandle A string assigned by the EHR to identify a user session, required by the messaging API.
   * @param {string} swmOrigin The target origin of the message recipient.
   */
  constructor(swmHandle, swmOrigin) {
    checkTargetOrigin(swmOrigin);
    this.swmHandle = swmHandle;
    this.swmOrigin = swmOrigin;
    this.unsubscribe = undefined;
    this.window = document.defaultView;
  }

  set messagingHandle(newHandle) {
    this.swmHandle = newHandle;
  }

  set targetOrigin(newOrigin) {
    if (this.swmOrigin === newOrigin) {
      return;
    }
    checkTargetOrigin(newOrigin);
    if (this.isEnabled()) {
      console.log('Disabling an enabled client upon target origin change.');
      this.disable();
    }
    this.swmOrigin = newOrigin;
  }

  /**
   * Enables a message handling callback for all incoming messages.
   *
   * @param {callback} messageHandler
   */
  enable(messageHandler) {
    const listener = function (e) {
      if (e.origin === this.swmOrigin && e.data) {
        checkIsObject(e.data);
        messageHandler(e.data);
      }
    };
    this.window.addEventListener('message', listener, false);
    this.unsubscribe = () => {
      this.window.removeEventListener('message', listener, false);
    };
  }

  /**
   * Disables all incoming messages, and prevents sending of new messages.
   */
  disable() {
    if (this.isEnabled()) {
      this.unsubscribe();
    }
    this.unsubscribe = undefined;
  }

  /**
   * Returns true when the client has been enabled, otherwise returns false.
   */
  get isEnabled() {
    return this.unsubscribe !== undefined;
  }
}

// Sanity checking functions.

export function checkTargetOrigin(targetOrigin) {
  if (targetOrigin !== new URL(targetOrigin).origin) {
    console.warn('targetOrigin is not normalized', targetOrigin);
  }
  const ancestors = document.defaultView.location.ancestorOrigins;
  if (ancestors.length && !ancestors.contains(targetOrigin)) {
    console.warn(
      `targetOrigin ${targetOrigin}, is not an ancestor origin`,
      ancestors,
    );
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

// TODO: include the SWM lib or IG version number here somewhere?
//   import * as meta from './package.json';
//   export async function getLibraryDetails() {
//     return await meta.default;
//   }

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
    payload: { location, resource },
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
  checkIsObject(message);
  if (appOrigin !== new URL(appOrigin).origin) {
    console.error(`Invalid response origin: '${appOrigin}'`);
  }
  appWindow.postMessage(message, appOrigin);
}
