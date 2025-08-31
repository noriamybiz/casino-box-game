// composables/useWebSocket.js
import { ref, onUnmounted } from "vue";

let socket = null;
let isConnecting = false;
const isConnected = ref(false);
const listeners = new Map(); // store event callbacks

// reconnect state
let reconnectInterval = 1000; // start with 1s
const maxInterval = 10000; // cap at 10s
let reconnectTimer = null;

export function webSocket() {
  const connectWebSocket = (url, token) => {
    if (socket && isConnected.value) {
      console.warn("WebSocket already connected.");
      return socket;
    }

    if (isConnecting) {
      console.warn("WebSocket is already connecting...");
      return socket;
    }

    if (!token) {
      throw new Error("Missing auth token for WebSocket connection");
    }

    isConnecting = true;
    socket = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      isConnected.value = true;
      isConnecting = false;

      // reset backoff when successful
      reconnectInterval = 1000;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    socket.onclose = () => {
      console.log("❌ WebSocket disconnected");
      isConnected.value = false;
      socket = null;
      isConnecting = false;

      scheduleReconnect(url, token);
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
      socket.close(); // will trigger onclose → scheduleReconnect
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type && listeners.has(data.type)) {
          console.log(`📩 Received: ${JSON.stringify(data)}`);
          listeners.get(data.type).forEach((cb) => cb(data));
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    return socket;
  };

  const scheduleReconnect = (url, token) => {
    if (reconnectTimer) return; // already scheduled

    reconnectTimer = setTimeout(() => {
      console.log(`🔄 Attempting reconnect... (${reconnectInterval}ms)`);
      reconnectTimer = null;
      reconnectInterval = Math.min(reconnectInterval * 2, maxInterval); // backoff
      connectWebSocket(url, token);
    }, reconnectInterval);
  };

  const reconnectWebSocket = (url, token) => {
    if (socket) {
      try {
        socket.close();
      } catch (err) {
        console.warn("Failed to close existing socket:", err);
      }
    }
    socket = null;
    isConnected.value = false;
    reconnectInterval = 1000; // reset backoff
    return connectWebSocket(url, token);
  };

  const sendMessage = (message) => {
    if (socket && isConnected.value) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ Cannot send, WebSocket not connected");
    }
  };

  const addListener = (type, callback) => {
    if (!listeners.has(type)) {
      listeners.set(type, []);
    }
    listeners.get(type).push(callback);
  };

  const removeListener = (type, callback) => {
    if (listeners.has(type)) {
      listeners.set(
        type,
        listeners.get(type).filter((cb) => cb !== callback)
      );
    }
  };

  onUnmounted(() => {
    if (socket) {
      socket.close();
      socket = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  return {
    connectWebSocket,
    reconnectWebSocket, // 👈 explicit reconnect
    sendMessage,
    addListener,
    removeListener,
    isConnected,
  };
}

// // composables/useWebSocket.js
// import { ref, onUnmounted } from "vue";

// let socket = null;
// let isConnecting = false;
// const isConnected = ref(false);
// const listeners = new Map(); // store event callbacks

// export function webSocket() {
//   const connectWebSocket = (url, token) => {
//     if (socket && isConnected.value) {
//       console.warn("WebSocket already connected.");
//       return socket;
//     }

//     if (isConnecting) {
//       console.warn("WebSocket is already connecting...");
//       return socket;
//     }

//     if (!token) {
//       throw new Error("Missing auth token for WebSocket connection");
//     }

//     isConnecting = true;
//     socket = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

//     socket.onopen = () => {
//       console.log("✅ WebSocket connected");
//       isConnected.value = true;
//       isConnecting = false;
//     };

//     socket.onclose = () => {
//       console.log("❌ WebSocket disconnected");
//       isConnected.value = false;
//       socket = null;
//       isConnecting = false;
//     };

//     socket.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.type && listeners.has(data.type)) {
//           console.log(`Received on ${JSON.stringify(data)}`);
//           listeners.get(data.type).forEach((cb) => cb(data));
//         }
//       } catch (e) {
//         console.error("Failed to parse message:", e);
//       }
//     };

//     return socket;
//   };

//   const sendMessage = (message) => {
//     if (socket && isConnected.value) {
//       socket.send(JSON.stringify(message));
//     } else {
//       console.warn("⚠️ Cannot send, WebSocket not connected");
//     }
//   };

//   const addListener = (type, callback) => {
//     if (!listeners.has(type)) {
//       listeners.set(type, []);
//     }
//     listeners.get(type).push(callback);
//   };

//   const removeListener = (type, callback) => {
//     if (listeners.has(type)) {
//       listeners.set(
//         type,
//         listeners.get(type).filter((cb) => cb !== callback)
//       );
//     }
//   };

//   onUnmounted(() => {
//     if (socket) {
//       socket.close();
//       socket = null;
//     }
//   });

//   return {
//     connectWebSocket,
//     sendMessage,
//     addListener,
//     removeListener,
//     isConnected,
//   };
// }
