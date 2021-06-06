/**
 * TODO
 *  [ ] static library details via function swm.getCapabilities
 *  [ ] insert discovery data into handshake
 *  [ ] include links in error messages to the relevant IG sections...
 *  [ ] create docstrings for all functions.
 *  [ ] provide typescript types for all functions?
 *  [ ] include the SWM lib or IG version number here somewhere?
          import * as meta from './package.json';
          export async function getLibraryDetails() {
            return await meta.default;
          }
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

  get messagingHandle() {
    return this.swmHandle;
  }

  set messagingHandle(newHandle) {
    this.swmHandle = newHandle;
  }

  get targetOrigin() {
    return this.swmOrigin;
  }

  set targetOrigin(newOrigin) {
    if (this.swmOrigin === newOrigin) {
      return;
    }
    checkTargetOrigin(newOrigin);
    if (this.isEnabled) {
      // TODO: raise exception instead?
      console.log('Disabling an enabled client upon target origin change.');
      this.disable();
    }
    this.swmOrigin = newOrigin;
  }

  /**
   * Enables a message handling callback for all incoming messages.
   *
   * @param {callback} messageHandler handles messages received from a caller.
   */
  enable(messageHandler) {
    const listener = function (e) {
      if (e.origin === this.swmOrigin && e.data) {
        checkIsObject(e.data);
        messageHandler(e.data);
      }
    }.bind(this);
    this.window.addEventListener('message', listener, false);
    this.unsubscribe = () => {
      this.window.removeEventListener('message', listener, false);
    };
  }

  /**
   * Disables all incoming messages, and prevents sending of new messages.
   */
  disable() {
    if (this === null) return; // IGNORE: for dev work when using React HMR
    if (this.isEnabled) {
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

  createMessage(messageType, payload = {}) {
    return createMessage(messageType, this.swmHandle, payload);
  }

  createResponse(message, payload = {}) {
    return createResponse(message.messageId, payload);
  }

  send(messageType, payload = {}) {
    this.sendMessage(this.createMessage(messageType, payload));
  }

  sendMessage(message) {
    checkIsObject(message);
    const ehrOrigin = this.swmOrigin;
    if (ehrOrigin !== new URL(ehrOrigin).origin) {
      console.error(`Invalid message origin: '${ehrOrigin}'`);
    }
    if (this.window.parent) {
      this.window.parent.postMessage(message, ehrOrigin);
    } else if (this.window.opener) {
      this.window.opener.postMessage(message, ehrOrigin);
    } else {
      console.error('Unable to send message - no receiver!');
    }
  }

  respondTo(message, payload, messageSource) {
    this.sendResponse(this.createResponse(message, payload), messageSource);
  }

  sendResponse(response, messageSource) {
    checkIsObject(response);
    if (this.swmOrigin !== new URL(this.swmOrigin).origin) {
      console.error(`Invalid response origin: '${this.swmOrigin}'`);
    }
    messageSource.postMessage(response, this.swmOrigin);
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
  const objectTypeRepr = Object.prototype.toString.call({}); // [object Object]
  const type = Object.prototype.toString.call(message);
  if (type !== objectTypeRepr) {
    console.error(
      `expected a message of type "${objectTypeRepr}", got "${type}"!`,
    );
  }
}

export function createMessage(messageType, messagingHandle, payload) {
  return {
    messageType,
    messagingHandle,
    messageId: v4(),
    payload,
  };
}

export function createResponse(responseToMessageId, payload) {
  return {
    responseToMessageId,
    messageId: v4(),
    payload,
  };
}
