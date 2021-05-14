import React, { useState, useEffect } from 'react';
import './App.css';
import * as swm from './swm';

// CONSIDER: pass around a mock smart launch client instead of 'messageHandle'.
const mockClient = {
  tokenResponse: {
    "access_token": "VGhpcyBpcyBhbiBleGFtcGxlIGFjY2Vzc190b2tlbiEK",
    "token_type": "bearer",
    "expires_in": 3600,
    "scope": "patient/Patient.read messaging/ui.launchActivity",
    "smart_web_messaging_origin": 'http://localhost:8000',
    "smart_web_messaging_handle": "RXhhbXBsZSBoYW5kbGUK",
    "state": "c3RhdGUgZXhhbXBsZSEK",
  }
}

function App() {
  const [message, setMessage] = useState("{}");
  const [messageFromEhr, setMessageFromEhr] = useState("");
  // TODO: allow the UI to modify these values from the SMART launch client
  const [messageHandle, setMessageHandle] = useState(
    mockClient.tokenResponse.smart_web_messaging_handle
  );
  const [targetOrigin, setTargetOrigin] = useState(
    mockClient.tokenResponse.smart_web_messaging_origin
  );

  var messageEventHandler = function (event) {
    console.log('XXX', event);
    if (event.origin === targetOrigin && event.data) {
      setMessageFromEhr(JSON.stringify(event.data, null, 2));
    }
  }
  window.addEventListener('message', messageEventHandler, false);
  
  function updateMessage(e) {
    // TODO: validate the message structure to expose problems with it.
    // TODO: only enable the SEND button when the e.target.value is valid.
    setMessage(e.target.value);
  }

  function stringify(message) {
    setMessage(JSON.stringify(message, null, 2));
  }

  function handshake() {
    stringify(swm.getHandshakeMessage(messageHandle));
  }

  function uiDone() {
    stringify(swm.getUiDoneMessage(messageHandle));
  }

  function uiLaunchActivity() {
    // TODO: make sure this jibes with the activity catalog examples.
    stringify(
      swm.getUiLaunchActivityMessage(
        messageHandle, 'problem-review', {
          'problemLocation': 'Condition/123',
        }
      )
    );
  }

  function scratchpadCreate() {
    stringify(
      swm.getScratchpadCreateMessage(
        messageHandle, {
          'resourceType': 'ServiceRequest',
          'status': 'draft',
        }
      )
    );
  }

  function scratchpadDelete() {
    // TODO: read the contents of the scratchpad to set the location?
    const location = 'MedicationRequest/456';
    stringify(swm.getScratchpadDeleteMessage(messageHandle, location));
  }

  function scratchpadUpdate() {
    // TODO: read the contents of the scratchpad to set the resource?
    const resource = {
      'resourceType': 'MedicationRequest',
      'id': '123',
      'status': 'draft',
    };
    const location = `${resource.resourceType}/${resource.id}`;
    stringify(
      swm.getScratchpadUpdateMessage(messageHandle, resource, location)
    );
  }

  function sendMessage() {
    console.log('Sending:', message);
    // TODO: use the swm library to send the message.
    setMessageFromEhr("Awaiting EHR response...");
  }

  function copyResponseToClipboard() {
    // This only works in Chrome when the iframe explicitly allows
    // clipboard write access via <iframe allow="clipboard-write" ...
    navigator.clipboard.writeText(messageFromEhr);
  }

  // Display a different title if not embedded or launched.
  var appTitle = 'This is an embedded demo SMART app.';
  if (window.parent === window.self) {
    appTitle = 'This is a demo SMART app which would be embedded in or launched from an EHR.';
    // TODO: populate a warning message that there is no EHR detected...
  }

  // Return the App component.
  return (
    <div className="App">
      <header className="App-header">
        <p>{appTitle}</p>
      </header>
      <main className="App-main">
        <div className="App-buttons">
          <p>Prepopulate message below with a</p>
          <button onClick={handshake}>status.handshake</button>
          <button onClick={uiDone}>ui.done</button>
          <button onClick={uiLaunchActivity}>ui.launchActivity</button>
          <button onClick={scratchpadCreate}>scratchpad.create</button>
          <button onClick={scratchpadUpdate}>scratchpad.update</button>
          <button onClick={scratchpadDelete}>scratchpad.delete</button>
        </div>
        <div className="message-panel">
          <div className="to-send">
            <p><i>Editable</i> SMART Web Message to send to EHR:</p>
            <textarea
              className="App-message"
              value={message}
              onChange={updateMessage}
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={window.parent === window.self}
            >SEND</button>
          </div>
          <div className="from-ehr">
            <p><i>Read-only</i> SMART Web Message EHR response:</p>
            <textarea
              className="App-message"
              value={messageFromEhr}
              readOnly={true}
            />
            <button
              className="copy-response"
              onClick={copyResponseToClipboard}
            >Copy to clipboard</button>
          </div>
        </div>
      </main>
      <footer className="App-footer">
        <a 
          target="_blank"
          rel="noreferrer noopener"      
          href='https://tinyurl.com/swm-c10n-code'
        >https://tinyurl.com/swm-c10n-code</a>
      </footer>
    </div>
  );
}

export default App;
