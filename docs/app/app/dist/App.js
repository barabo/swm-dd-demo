import React, {useCallback, useEffect, useState} from "../../_snowpack/pkg/react.js";
import "./App.css.proxy.js";
import * as swm from "./swm.js";
const mockClient = {
  tokenResponse: {
    access_token: "VGhpcyBpcyBhbiBleGFtcGxlIGFjY2Vzc190b2tlbiEK",
    token_type: "bearer",
    expires_in: 3600,
    scope: "patient/Patient.read messaging/ui.launchActivity",
    smart_web_messaging_origin: "http://localhost:8000",
    smart_web_messaging_handle: "RXhhbXBsZSBoYW5kbGUK",
    state: "c3RhdGUgZXhhbXBsZSEK"
  }
};
function App() {
  const [message, setMessage] = useState("{}");
  const [response, setResponse] = useState("");
  const [messageHandle, setMessageHandle] = useState(mockClient.tokenResponse.smart_web_messaging_handle);
  const [targetOrigin, setTargetOrigin] = useState(mockClient.tokenResponse.smart_web_messaging_origin);
  const init = useCallback(() => {
    swm.enablePostMessage(targetOrigin, (r) => {
      setResponse(JSON.stringify(r, null, 2));
    });
  }, [targetOrigin]);
  useEffect(init, [init]);
  function openConfig() {
    document.getElementById("config-panel").showModal();
  }
  function updateMessageHandle(e) {
    setMessageHandle(e.target.value);
  }
  function updateTargetOrigin(e) {
    setTargetOrigin(e.target.value);
  }
  function closeConfig() {
    configSave();
    document.getElementById("config-panel").close();
  }
  function configSave() {
    mockClient.tokenResponse.smart_web_messaging_handle = messageHandle;
    mockClient.tokenResponse.smart_web_messaging_origin = targetOrigin;
  }
  function updateMessage(e) {
    setMessage(e.target.value);
  }
  function stringify(message2) {
    setMessage(JSON.stringify(message2, null, 2));
  }
  function handshake() {
    stringify(swm.getHandshakeMessage(mockClient));
  }
  function uiDone() {
    stringify(swm.getUiDoneMessage(mockClient));
  }
  function uiLaunchActivity() {
    stringify(swm.getUiLaunchActivityMessage(mockClient, "problem-review", {
      problemLocation: "Condition/123"
    }));
  }
  function scratchpadCreate() {
    stringify(swm.getScratchpadCreateMessage(mockClient, {
      resourceType: "ServiceRequest",
      status: "draft"
    }));
  }
  function scratchpadDelete() {
    const location = "MedicationRequest/456";
    stringify(swm.getScratchpadDeleteMessage(mockClient, location));
  }
  function scratchpadUpdate() {
    const resource = {
      resourceType: "MedicationRequest",
      id: "123",
      status: "draft"
    };
    const location = `${resource.resourceType}/${resource.id}`;
    stringify(swm.getScratchpadUpdateMessage(mockClient, resource, location));
  }
  function sendMessage() {
    try {
      const m = JSON.parse(message);
      swm.checkMessageType(m);
      setResponse("Failed to send message to EHR!");
      swm.sendMessage(mockClient, m);
      setResponse("Awaiting EHR response...");
    } catch (e) {
      setResponse(e.message);
      console.error("failed to send message", e);
    }
  }
  function copyResponseToClipboard() {
    navigator.clipboard.writeText(response);
  }
  var appTitle = "This demo SMART app is embedded in an EHR.";
  if (window.parent === window.self) {
    appTitle = "No EHR detected for this demo SMART app; SEND is disabled!";
  }
  return /* @__PURE__ */ React.createElement("div", {
    className: "App"
  }, /* @__PURE__ */ React.createElement("header", {
    className: "App-header"
  }, /* @__PURE__ */ React.createElement("p", null, appTitle), /* @__PURE__ */ React.createElement("button", {
    className: "config-button",
    onClick: openConfig
  }, "configure")), /* @__PURE__ */ React.createElement("main", {
    className: "App-main"
  }, /* @__PURE__ */ React.createElement("dialog", {
    className: "config-panel",
    id: "config-panel"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "config-header"
  }, /* @__PURE__ */ React.createElement("div", null, "App Settings"), /* @__PURE__ */ React.createElement("button", {
    className: "close-config",
    onClick: closeConfig
  }, "Close")), /* @__PURE__ */ React.createElement("div", {
    className: "config-settings"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "config-field"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "config-label"
  }, /* @__PURE__ */ React.createElement("p", null, "Messaging Handle")), /* @__PURE__ */ React.createElement("div", {
    className: "config-text-value"
  }, /* @__PURE__ */ React.createElement("input", {
    type: "text",
    value: messageHandle,
    onChange: updateMessageHandle
  }))), /* @__PURE__ */ React.createElement("div", {
    className: "config-field"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "config-label"
  }, /* @__PURE__ */ React.createElement("p", null, "EHR Origin")), /* @__PURE__ */ React.createElement("div", {
    className: "config-text-value"
  }, /* @__PURE__ */ React.createElement("input", {
    type: "text",
    value: targetOrigin,
    onChange: updateTargetOrigin
  }))))), /* @__PURE__ */ React.createElement("div", {
    className: "App-buttons"
  }, /* @__PURE__ */ React.createElement("p", null, "Prepopulate message below with a"), /* @__PURE__ */ React.createElement("button", {
    onClick: handshake
  }, "status.handshake"), /* @__PURE__ */ React.createElement("button", {
    onClick: uiDone
  }, "ui.done"), /* @__PURE__ */ React.createElement("button", {
    onClick: uiLaunchActivity
  }, "ui.launchActivity"), /* @__PURE__ */ React.createElement("button", {
    onClick: scratchpadCreate
  }, "scratchpad.create"), /* @__PURE__ */ React.createElement("button", {
    onClick: scratchpadUpdate
  }, "scratchpad.update"), /* @__PURE__ */ React.createElement("button", {
    onClick: scratchpadDelete
  }, "scratchpad.delete")), /* @__PURE__ */ React.createElement("div", {
    className: "message-panel"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "to-send"
  }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement("i", null, "Editable")), " ", "SMART Web Message to send to EHR:"), /* @__PURE__ */ React.createElement("textarea", {
    className: "App-message",
    value: message,
    onChange: updateMessage
  }), /* @__PURE__ */ React.createElement("button", {
    className: "send-button",
    onClick: sendMessage,
    disabled: window.parent === window.self
  }, "SEND")), /* @__PURE__ */ React.createElement("div", {
    className: "from-ehr"
  }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement("i", null, "Read-only")), " ", "SMART Web Message EHR response:"), /* @__PURE__ */ React.createElement("textarea", {
    disabled: true,
    className: "App-message",
    value: response,
    readOnly: true
  }), /* @__PURE__ */ React.createElement("button", {
    className: "copy-response",
    onClick: copyResponseToClipboard
  }, "Copy to clipboard")))), /* @__PURE__ */ React.createElement("footer", {
    className: "App-footer"
  }, /* @__PURE__ */ React.createElement("a", {
    target: "_blank",
    rel: "noreferrer noopener",
    href: "https://tinyurl.com/swm-c10n-code"
  }, "https://tinyurl.com/swm-c10n-code")));
}
export default App;
