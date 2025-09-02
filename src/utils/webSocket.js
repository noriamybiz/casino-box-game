// composables/useWebSocket.js
import { ref, onUnmounted } from "vue";

let socket = null;
let isConnecting = false;
const isConnected = ref(false);
const listeners = new Map();
const connectionPromises = []; // Store pending connection promises

// reconnect state
let reconnectInterval = 1000;
const maxInterval = 10000;
let reconnectTimer = null;

export function webSocket() {
  const connectWebSocket = (url, token) => {
    return new Promise((resolve, reject) => {
      if (socket && isConnected.value) {
        console.warn("WebSocket already connected.");
        resolve(socket);
        return;
      }

      if (isConnecting) {
        console.warn("WebSocket is already connecting...");
        reject(new Error("Already connecting"));
        return;
      }

      if (!token) {
        reject(new Error("Missing auth token for WebSocket connection"));
        return;
      }

      isConnecting = true;
      socket = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

      // Store resolve/reject for later
      connectionPromises.push({ resolve, reject });

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        isConnected.value = true;
        isConnecting = false;
        reconnectInterval = 1000;

        // Resolve all pending connection promises
        connectionPromises.forEach(({ resolve }) => resolve(socket));
        connectionPromises.length = 0;

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

        // Reject all pending connection promises
        connectionPromises.forEach(({ reject }) =>
          reject(new Error("Connection closed"))
        );
        connectionPromises.length = 0;

        scheduleReconnect(url, token);
      };

      socket.onerror = (err) => {
        console.error("⚠️ WebSocket error:", err);

        // Reject all pending connection promises
        connectionPromises.forEach(({ reject }) => reject(err));
        connectionPromises.length = 0;

        socket.close();
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
    });
  };

  const scheduleReconnect = (url, token) => {
    if (reconnectTimer) return;

    reconnectTimer = setTimeout(() => {
      console.log(`🔄 Attempting reconnect... (${reconnectInterval}ms)`);
      reconnectTimer = null;
      reconnectInterval = Math.min(reconnectInterval * 2, maxInterval);
      connectWebSocket(url, token).catch((err) => {
        console.error("Reconnect failed:", err);
      });
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
    reconnectInterval = 1000;
    return connectWebSocket(url, token);
  };

  const sendMessage = (message) => {
    if (socket && isConnected.value) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ Cannot send, WebSocket not connected");
      throw new Error("WebSocket not connected");
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

  const waitForConnection = (timeout = 5000) => {
    return new Promise((resolve, reject) => {
      if (isConnected.value) {
        resolve(true);
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, timeout);

      const checkConnection = () => {
        if (isConnected.value) {
          clearTimeout(timer);
          resolve(true);
        }
      };

      // Check periodically
      const interval = setInterval(checkConnection, 100);

      // Also clear interval when done
      setTimeout(() => {
        clearInterval(interval);
      }, timeout);
    });
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
    connectionPromises.length = 0;
  });

  return {
    connectWebSocket,
    reconnectWebSocket,
    sendMessage,
    addListener,
    removeListener,
    isConnected,
    waitForConnection,
  };
}

// // composables/useWebSocket.js
// import { ref, onUnmounted } from "vue";

// let socket = null;
// let isConnecting = false;
// const isConnected = ref(false);
// const listeners = new Map(); // store event callbacks

// // reconnect state
// let reconnectInterval = 1000; // start with 1s
// const maxInterval = 10000; // cap at 10s
// let reconnectTimer = null;

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

//       // reset backoff when successful
//       reconnectInterval = 1000;
//       if (reconnectTimer) {
//         clearTimeout(reconnectTimer);
//         reconnectTimer = null;
//       }
//     };

//     socket.onclose = () => {
//       console.log("❌ WebSocket disconnected");
//       isConnected.value = false;
//       socket = null;
//       isConnecting = false;

//       scheduleReconnect(url, token);
//     };

//     socket.onerror = (err) => {
//       console.error("⚠️ WebSocket error:", err);
//       socket.close(); // will trigger onclose → scheduleReconnect
//     };

//     socket.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.type && listeners.has(data.type)) {
//           console.log(`📩 Received: ${JSON.stringify(data)}`);
//           listeners.get(data.type).forEach((cb) => cb(data));
//         }
//       } catch (e) {
//         console.error("Failed to parse message:", e);
//       }
//     };

//     return socket;
//   };

//   const scheduleReconnect = (url, token) => {
//     if (reconnectTimer) return; // already scheduled

//     reconnectTimer = setTimeout(() => {
//       console.log(`🔄 Attempting reconnect... (${reconnectInterval}ms)`);
//       reconnectTimer = null;
//       reconnectInterval = Math.min(reconnectInterval * 2, maxInterval); // backoff
//       connectWebSocket(url, token);
//     }, reconnectInterval);
//   };

//   const reconnectWebSocket = (url, token) => {
//     if (socket) {
//       try {
//         socket.close();
//       } catch (err) {
//         console.warn("Failed to close existing socket:", err);
//       }
//     }
//     socket = null;
//     isConnected.value = false;
//     reconnectInterval = 1000; // reset backoff
//     return connectWebSocket(url, token);
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
//     if (reconnectTimer) {
//       clearTimeout(reconnectTimer);
//       reconnectTimer = null;
//     }
//   });

//   return {
//     connectWebSocket,
//     reconnectWebSocket, // 👈 explicit reconnect
//     sendMessage,
//     addListener,
//     removeListener,
//     isConnected,
//   };
// }

// // // composables/useWebSocket.js
// // import { ref, onUnmounted } from "vue";

// // let socket = null;
// // let isConnecting = false;
// // const isConnected = ref(false);
// // const listeners = new Map(); // store event callbacks

// // export function webSocket() {
// //   const connectWebSocket = (url, token) => {
// //     if (socket && isConnected.value) {
// //       console.warn("WebSocket already connected.");
// //       return socket;
// //     }

// //     if (isConnecting) {
// //       console.warn("WebSocket is already connecting...");
// //       return socket;
// //     }

// //     if (!token) {
// //       throw new Error("Missing auth token for WebSocket connection");
// //     }

// //     isConnecting = true;
// //     socket = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

// //     socket.onopen = () => {
// //       console.log("✅ WebSocket connected");
// //       isConnected.value = true;
// //       isConnecting = false;
// //     };

// //     socket.onclose = () => {
// //       console.log("❌ WebSocket disconnected");
// //       isConnected.value = false;
// //       socket = null;
// //       isConnecting = false;
// //     };

// //     socket.onmessage = (event) => {
// //       try {
// //         const data = JSON.parse(event.data);
// //         if (data.type && listeners.has(data.type)) {
// //           console.log(`Received on ${JSON.stringify(data)}`);
// //           listeners.get(data.type).forEach((cb) => cb(data));
// //         }
// //       } catch (e) {
// //         console.error("Failed to parse message:", e);
// //       }
// //     };

// //     return socket;
// //   };

// //   const sendMessage = (message) => {
// //     if (socket && isConnected.value) {
// //       socket.send(JSON.stringify(message));
// //     } else {
// //       console.warn("⚠️ Cannot send, WebSocket not connected");
// //     }
// //   };

// //   const addListener = (type, callback) => {
// //     if (!listeners.has(type)) {
// //       listeners.set(type, []);
// //     }
// //     listeners.get(type).push(callback);
// //   };

// //   const removeListener = (type, callback) => {
// //     if (listeners.has(type)) {
// //       listeners.set(
// //         type,
// //         listeners.get(type).filter((cb) => cb !== callback)
// //       );
// //     }
// //   };

// //   onUnmounted(() => {
// //     if (socket) {
// //       socket.close();
// //       socket = null;
// //     }
// //   });

// //   return {
// //     connectWebSocket,
// //     sendMessage,
// //     addListener,
// //     removeListener,
// //     isConnected,
// //   };
// // }
