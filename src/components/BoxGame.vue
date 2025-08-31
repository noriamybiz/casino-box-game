update below to use the paymentResults being returned above

<template>
  <div id="app" :class="{ reshuffling: isReshuffling }">
    <h1 class="title">Choose Your Lucky Box</h1>
    <p class="subtitle">Click on a box to reveal your surprise</p>

    <div class="led-display">
      <div class="led-text">TRY YOUR LUCK!</div>
    </div>

    <!-- <div class="casino-header">
      <div class="online-players">
        <span class="dot"></span>
        <span>{{ onlinePlayers }} Online</span>
      </div>

      <div class="recent-winners">
        <div
          v-for="(winner, index) in recentWinners"
          :key="index"
          class="winner-item"
        >
          🎉 <strong>{{ winner.name }}</strong> won
          <span class="amount">${{ winner.amount }}</span>
        </div>
      </div>
    </div> 

    <h1 class="section-title">🎰 Casino Winner Announcements 🎰</h1>-->

    <div class="casino-header">
      <div class="winner-messages">
        <div
          v-for="(message, index) in winnerMessages"
          :key="index"
          :class="['winner-message', { active: currentMessageIndex === index }]"
        >
          <span class="winner-icon">🎉</span>
          <span class="winner-name">{{ message.name }}</span> won
          <span class="amount">${{ message.amount.toLocaleString() }}</span> on
          <span class="game">{{ message.game }}</span
          >!
        </div>
      </div>

      <!--<div class="recent-winners">
        <div
          v-for="(winner, index) in recentWinners"
          :key="index"
          class="winner-item"
        >
          🎉 <strong class="winner-name">{{ winner.name }}</strong> won
          <span class="amount">${{ winner.amount.toLocaleString() }}</span> on
          <span class="game">{{ winner.game }}</span>
        </div>
      </div>-->
    </div>

    <!--<div class="instructions">
      <h3>How It Works</h3>
      <ul>
        <li>
          The component displays rotating winner announcements instead of online
          player count
        </li>
        <li>
          Each message shows a different player name, amount won, and game
        </li>
        <li>Messages transition smoothly with fade animations</li>
        <li>Recent winners are displayed on the right side</li>
        <li>
          Data is randomly generated but can be connected to a real backend
        </li>
      </ul>
    </div> -->

    <div class="box-container" :class="{ disabled: isReshuffling }">
      <div
        v-for="box in boxes"
        :key="box.id"
        class="box"
        :class="{
          selected: box.selected,
          'shadow-pulse': box.selected,
          loading: box.loading,
          disabled: isProcessing || isReshuffling,
        }"
        @click="handleBoxClick(box.id)"
        :style="{
          '--hue': boxHues[box.id - 1],
          '--delay': box.id * 0.1 + 's',
        }"
      >
        <div class="box-content">
          <div v-if="box.loading" class="box-loader"></div>
          <template v-else>
            <div class="box-icon">🎁</div>
            <div class="box-number">#{{ box.displayId }}</div>
          </template>
        </div>
        <div class="box-glow"></div>
      </div>
    </div>

    <!-- Results Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" :class="modalType">
        <button class="modal-close" @click="closeModal">×</button>

        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
        </div>

        <div class="modal-body">
          <div class="ussd-results">
            <div
              v-for="(value, index) in boxValues"
              :key="index"
              class="ussd-line"
              :class="{
                'winning-box':
                  modalType === 'win' && boxes[index].id === pendingRequest,
                'losing-box':
                  modalType === 'lose' && boxes[index].id === pendingRequest,
              }"
            >
              <span class="ussd-label">Box {{ boxes[index].displayId }}:</span>
              <span class="ussd-value">${{ value }}</span>
            </div>
            <div class="ussd-line selected-line">
              <span class="ussd-label"
                >Selected Box (#{{ selectedBoxDisplayId }}):</span
              >
              <span class="ussd-value" :class="modalType">
                ${{ selectedBoxValue }}
              </span>
            </div>
          </div>

          <div class="prize-animation" v-if="modalType === 'win'">
            <div class="coins-falling">
              <div
                class="coin"
                v-for="n in 15"
                :key="n"
                :style="coinStyle(n)"
              ></div>
            </div>
          </div>

          <div class="result-message" :class="modalType">
            {{ resultMessage }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-button" @click="closeModal">OK</button>
        </div>
      </div>
    </div>

    <div
      v-if="showAuthModal"
      class="modal-overlay"
      @click.self="closeAuthModal"
    >
      <div class="modal-content">
        <button class="modal-close" @click="closeAuthModal">×</button>

        <!-- Dynamic modal header based on paymentError -->
        <div class="modal-header" :class="{ 'error-header': paymentError }">
          <h2>{{ paymentError ? "PAYMENT ERROR" : "Login Required" }}</h2>
        </div>

        <div class="modal-body">
          <!-- Show payment error if it exists -->
          <div v-if="paymentError" class="payment-error-container">
            <div class="error-icon">⚠️</div>
            <p class="payment-error-message">{{ paymentError }}</p>
            <button class="retry-button" @click="closeAuthModal">OK</button>
          </div>

          <!-- Show normal auth flow if no payment error -->
          <template v-else>
            <div class="step-indicator">
              <div
                class="step"
                :class="{ completed: authStep > 1, active: authStep === 1 }"
              >
                1
              </div>
              <div
                class="step"
                :class="{ completed: authStep > 2, active: authStep === 2 }"
              >
                2
              </div>
            </div>

            <div v-if="authStep === 1" class="auth-form">
              <div class="form-group">
                <label for="mobile">Mobile Number</label>
                <input
                  type="tel"
                  id="mobile"
                  class="form-control"
                  v-model="mobileNumber"
                  placeholder="Enter your mobile number"
                  :disabled="isSendingOTP"
                />
                <div v-if="mobileError" class="error-message">
                  {{ mobileError }}
                </div>
              </div>
              <button
                class="auth-button"
                @click="sendOTP"
                :disabled="isSendingOTP || !isValidMobile"
              >
                {{ isSendingOTP ? "Sending..." : "Send OTP" }}
              </button>
            </div>

            <div v-if="authStep === 2" class="auth-form">
              <div class="form-group">
                <label>Enter OTP</label>
                <p class="countdown" v-if="otpCountdown > 0">
                  OTP sent to {{ mobileNumber }}. Expires in
                  {{ otpCountdown }} seconds.
                </p>
                <p class="countdown" v-else>
                  OTP has expired.
                  <span class="resend-link" @click="resendOTP">Resend OTP</span>
                </p>
                <div class="otp-container">
                  <input
                    v-for="index in 6"
                    :key="index"
                    ref="otpInputs"
                    v-model="otp[index - 1]"
                    class="otp-input"
                    type="text"
                    maxlength="1"
                    @input="onOtpInput(index, $event)"
                    @keydown.delete="onOtpDelete(index, $event)"
                    :disabled="isVerifyingOTP"
                  />
                </div>
                <div v-if="otpError" class="error-message">{{ otpError }}</div>
                <div v-if="otpSuccess" class="success-message">
                  {{ otpSuccess }}
                </div>
              </div>
              <button
                class="auth-button"
                @click="verifyOTP"
                :disabled="isVerifyingOTP || !isOtpComplete"
              >
                {{ isVerifyingOTP ? "Verifying..." : "Verify OTP" }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Auth Modal
    <div
      v-if="showAuthModal"
      class="modal-overlay"
      @click.self="closeAuthModal"
    >
      <div class="modal-content">
        <button class="modal-close" @click="closeAuthModal">×</button>

        <div class="modal-header">
          <h2>Login Required</h2>
        </div>

        <div class="modal-body">
          <div class="step-indicator">
            <div
              class="step"
              :class="{ completed: authStep > 1, active: authStep === 1 }"
            >
              1
            </div>
            <div
              class="step"
              :class="{ completed: authStep > 2, active: authStep === 2 }"
            >
              2
            </div>
          </div>

          <div v-if="authStep === 1" class="auth-form">
            <div class="form-group">
              <label for="mobile">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                class="form-control"
                v-model="mobileNumber"
                placeholder="Enter your mobile number"
                :disabled="isSendingOTP"
              />
              <div v-if="mobileError" class="error-message">
                {{ mobileError }}
              </div>
            </div>
            <button
              class="auth-button"
              @click="sendOTP"
              :disabled="isSendingOTP || !isValidMobile"
            >
              {{ isSendingOTP ? "Sending..." : "Send OTP" }}
            </button>
          </div>

          <div v-if="authStep === 2" class="auth-form">
            <div class="form-group">
              <label>Enter OTP</label>
              <p class="countdown" v-if="otpCountdown > 0">
                OTP sent to {{ mobileNumber }}. Expires in
                {{ otpCountdown }} seconds.
              </p>
              <p class="countdown" v-else>
                OTP has expired.
                <span class="resend-link" @click="resendOTP">Resend OTP</span>
              </p>
              <div class="otp-container">
                <input
                  v-for="index in 6"
                  :key="index"
                  ref="otpInputs"
                  v-model="otp[index - 1]"
                  class="otp-input"
                  type="text"
                  maxlength="1"
                  @input="onOtpInput(index, $event)"
                  @keydown.delete="onOtpDelete(index, $event)"
                  :disabled="isVerifyingOTP"
                />
              </div>
              <div v-if="otpError" class="error-message">{{ otpError }}</div>
              <div v-if="otpSuccess" class="success-message">
                {{ otpSuccess }}
              </div>
            </div>
            <button
              class="auth-button"
              @click="verifyOTP"
              :disabled="isVerifyingOTP || !isOtpComplete"
            >
              {{ isVerifyingOTP ? "Verifying..." : "Verify OTP" }}
            </button>
          </div>
        </div>
      </div>
    </div> -->

    <div v-if="isProcessing" class="global-loader">
      <div class="spinner"></div>
      <div>Processing your selection...</div>
    </div>

    <div v-if="isReshuffling" class="reshuffle-message">
      Shuffling boxes... Please wait!
    </div>
  </div>
</template>

<script>
import confetti from "canvas-confetti";
import { GetProvider } from "@/utils/validateMobileNumber.js";
import { webSocket } from "@/utils/webSocket";
import { saveToken, getToken } from "@/utils/authStorage";
import _ from "lodash";

export default {
  name: "App",
  data() {
    return {
      boxes: [],
      boxHues: [0, 60, 120, 180, 240, 300],
      ws: null,
      isProcessing: false,
      isReshuffling: false,
      pendingRequest: null,
      showModal: false,
      modalType: "",
      boxValues: [], // Will be populated from server
      selectedBoxValue: 0,
      onlinePlayers: 0,
      recentWinnersz: [],
      isLoggedIn: true,
      showAuthModal: false,
      authStep: 1, // 1: Mobile input, 2: OTP input
      mobileNumber: "",
      mobileError: "",
      isSendingOTP: false,
      otp: ["", "", "", "", "", ""],
      otpError: "",
      otpSuccess: "",
      isVerifyingOTP: false,
      otpCountdown: 120, // 2 minutes
      otpTimer: null,
      pendingBoxId: null, // Store the box ID that was clicked before auth
      isConnected: false,
      paymentError: "",
      currentMessageIndex: 0,
      winnerMessages: [
        { name: "John D.", amount: 2450, game: "Slot Machine" },
        { name: "Sarah M.", amount: 12500, game: "Poker" },
        { name: "Mike T.", amount: 5200, game: "Roulette" },
        { name: "Lisa K.", amount: 8700, game: "Blackjack" },
        { name: "Alex R.", amount: 15600, game: "Baccarat" },
      ],
      recentWinners: [
        { name: "Emma W.", amount: 3200, game: "Slots" },
        { name: "David L.", amount: 8100, game: "Poker" },
        { name: "Olivia P.", amount: 5400, game: "Roulette" },
      ],
    };
  },
  computed: {
    modalTitle() {
      return this.modalType === "win" ? "🎉 Congratulations!" : "😢 Try Again";
    },
    resultMessage() {
      return this.modalType === "win"
        ? "You won! Your selection was correct!"
        : "Sorry! Your selection was incorrect.";
    },
    selectedBoxIndex() {
      return this.boxes.findIndex((b) => b.selected);
    },
    selectedBoxDisplayId() {
      const box = this.boxes.find((b) => b.selected);
      return box ? box.displayId : 0;
    },
    isValidMobile() {
      // Simple mobile validation - adjust based on your requirements
      console.log(
        `Record is ${JSON.stringify(GetProvider(this.mobileNumber))}`
      );
      return (
        GetProvider(this.mobileNumber)?.status === "success" &&
        GetProvider(this.mobileNumber)?.provider.toLowerCase() === "safaricom"
      );
    },
    isOtpComplete() {
      return this.otp.join("").length === 6;
    },
  },
  watch: {
    isLoggedIn(newVal) {
      if (!newVal) {
        this.showAuthModal = true;
        this.resetSelection();
      }
    },
  },
  created() {
    this.initializeBoxes();
    // pull the composable instance
    const {
      connectWebSocket,
      sendMessage,
      addListener,
      isConnected,
      reconnectWebSocket,
    } = webSocket();

    // save for later use in methods
    this.connectWebSocket = connectWebSocket;
    this.sendMessage = sendMessage;
    this.addListener = addListener;
    this.isConnectedRef = isConnected;
    this.reconnectWebSocket = reconnectWebSocket;
  },
  mounted() {
    let token = getToken();
    if (!token) {
      token = "guest_" + Math.random().toString(36).substring(2, 10);
    }
    this.connectWebSocket(
      "wss://websocket-hibernation-server.credosaffi.workers.dev/websocket",
      token
    );

    // track connection state reactively
    this.unwatch = this.$watch(
      () => this.isConnectedRef.value,
      (val) => {
        this.isConnected = val;
      },
      { immediate: true }
    );

    this.addListener("otpSent", (payload) => {
      console.log("✅ OTP sent:", payload);
      this.$toast.success(`OTP sent to ${payload.phone}`);
    });

    // Listen for OTP error
    this.addListener("otpError", (payload) => {
      console.error("❌ OTP error:", payload);
      //this.$toast.error(`OTP error: ${payload.message}`);
      this.otpError = payload.message;
    });

    this.addListener("paymentInitiated", (payload) => {
      console.error("Payment initiated:", payload);
      //this.$toast.error(`OTP error: ${payload.message}`);
      // this.otpError = payload.message;
    });

    this.addListener("paymentResult", (payload) => {
      console.error("Payment initiated:", payload);
      //this.$toast.error(`OTP error: ${payload.message}`);
      // this.otpError = payload.message;
      this.handleResponse(payload);
    });

    this.addListener("otpVerified", (payload) => {
      console.error("otpVerified", payload);
      this.isVerifyingOTP = false;
      if (payload.success) {
        this.otpSuccess = "OTP verified successfully!";
        saveToken(payload.token, 3600);
        this.reconnectWebSocket(
          "wss://websocket-hibernation-server.credosaffi.workers.dev/websocket",
          payload.token
        );

        setTimeout(() => {
          this.isLoggedIn = true;
          this.closeAuthModal();

          // ✅ If a box was pending selection before OTP,
          // continue with that action
          if (this.pendingBoxId) {
            this.sendMessage({
              action: "selectBox",
              boxId: this.pendingBoxId,
            });
            this.pendingBoxId = null; // reset
          }
        }, 1000);
      } else {
        this.otpError = "Invalid OTP. Please try again.";
      }
    });

    this.addListener("Unauthorized", (payload) => {
      console.error("Unauthorized:", payload);
      //this.$toast.error(`OTP error: ${payload.message}`);
      // this.otpError = payload.message;
      this.isLoggedIn = false;

      console.log(`Is logged in ${this.isLoggedIn}`);
    });

    // Example: Listen for chat messages
    this.addListener("chat", (payload) => {
      console.log("📩 New chat:", payload);
    });
    // Start rotating messages
    this.startMessageRotation();

    // Simulate adding new winners occasionally
    setInterval(() => {
      this.addNewWinner();
    }, 10000);
  },

  beforeUnmount() {
    if (this.unwatch) this.unwatch();
  },
  methods: {
    initializeBoxes() {
      // Create initial boxes with shuffled display IDs
      const displayIds = _.shuffle([1, 2, 3, 4, 5, 6]);
      this.boxes = Array.from({ length: 6 }, (_, index) => ({
        id: index + 1, // Actual ID (1-6)
        displayId: displayIds[index], // Displayed number (shuffled)
        selected: false,
        loading: false,
        result: null,
      }));
      this.boxHues = _.shuffle(this.boxHues);
    },
    shuffleBoxPositions() {
      // Shuffle both the positions and display IDs
      const newDisplayIds = _.shuffle(this.boxes.map((b) => b.displayId));

      this.boxes = _.shuffle(
        this.boxes.map((box, index) => ({
          ...box,
          displayId: newDisplayIds[index],
          selected: false,
          loading: false,
        }))
      );

      this.boxHues = _.shuffle(this.boxHues);
    },
    async reshuffleBoxes() {
      this.isReshuffling = true;
      await this.animateShuffle();
      this.shuffleBoxPositions();
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.isReshuffling = false;
    },
    updateOnlinePlayers(count) {
      this.onlinePlayers = count;
    },
    addWinner(name, amount) {
      this.recentWinners.unshift({ name, amount });
      if (this.recentWinners.length > 5) {
        this.recentWinners.pop();
      }
    },
    coinStyle() {
      return {
        left: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 2 + 1}s`,
        animationDelay: `${Math.random() * 0.5}s`,
        opacity: Math.random() * 0.5 + 0.5,
      };
    },
    // connectWebSocket() {
    //   this.ws = new WebSocket("ws://localhost:8081");

    //   this.ws.onmessage = (event) => {
    //     try {
    //       const response = JSON.parse(event.data);

    //       if (
    //         response.type === "initialValues" ||
    //         response.type === "newValues"
    //       ) {
    //         console.log(`Response values are ${response.boxValues}`);
    //         this.boxValues = response.boxValues;
    //         return;
    //       }

    //       if (response.type === "paymentInitiated") {
    //         console.log(response.message);
    //         return;
    //       }

    //       if (response.type === "paymentResult") {
    //         console.log(response.message);
    //         this.handleResponse(response);
    //         //  return;
    //       }

    //       // this.handleResponse(response);
    //     } catch (err) {
    //       console.error("Error parsing WebSocket message:", err);
    //       this.resetSelection();
    //     }
    //   };

    //   this.ws.onopen = () => console.log("✅ WebSocket connected");
    //   this.ws.onerror = (err) => {
    //     console.error("❌ WebSocket error", err);
    //     this.resetSelection();
    //   };
    //   this.ws.onclose = () => setTimeout(() => this.connectWebSocket(), 3000);
    // },
    handleBoxClick: _.debounce(
      function (boxId) {
        if (this.isProcessing || this.isReshuffling) return;
        if (!this.isLoggedIn) {
          // Store the box ID and show auth modal
          this.pendingBoxId = boxId;
          this.showAuthModal = true;
          return;
        }
        this.selectBox(boxId);
      },
      300,
      { leading: true, trailing: false }
    ),
    selectBox(boxId) {
      // 🔒 Guard check here too (in case isLoggedIn changes after handleBoxClick)
      if (!this.isLoggedIn) {
        console.warn("❌ User not logged in, stopping selectBox");
        this.showAuthModal = true;
        return;
      }
      if (this.isProcessing || this.isReshuffling) return;

      this.isProcessing = true;
      this.pendingRequest = boxId;
      this.playSound("click");

      this.resetBoxStates();
      const box = this.boxes.find((b) => b.id === boxId);
      if (box) box.loading = true;

      try {
        this.sendMessage({
          action: "selectBox",
          boxId,
        });
      } catch (err) {
        console.error("Failed to send message:", err);
        this.resetSelection();
      }
    },
    handleResponse(response) {
      console.log(
        `wasssssuuuuppppp ${this.pendingRequest} response boxId = ${response}`
      );

      if (response.status === "failed") {
        (this.paymentError = response.message), (this.showAuthModal = true);
        this.resetSelection();
        return;
      }

      if (this.pendingRequest !== response.boxId) return;

      const box = this.boxes.find((b) => b.id === response.boxId);
      if (!box) return;

      box.loading = false;
      box.selected = true;
      box.result = response.result;

      // Update box values from server response
      this.boxValues = response.boxValues;
      this.selectedBoxValue = response.selectedValue;

      // Use the actual box value from the server
      const selectedBoxIndex = box.id - 1; // Box IDs are 1-6, array is 0-5
      const actualBoxValue = response.boxValues[selectedBoxIndex];

      // Show the actual value if win, 0 if lose
      this.selectedBoxValue = response.isWin ? actualBoxValue : 0;

      this.modalType = response.result;
      this.showModal = true;

      if (response.result === "win") {
        this.playSound("win");
        if (this.selectedBoxValue >= 5000) {
          this.playSound("jackpot");
        }
        this.fireConfetti();
      } else {
        this.playSound("lose");
      }

      this.pendingRequest = null;
      this.isProcessing = false;
    },
    async closeModal() {
      this.showModal = false;
      await this.reshuffleBoxes();
    },
    // Auth Modal Methods
    closeAuthModal() {
      this.showAuthModal = false;
      this.authStep = 1;
      this.mobileNumber = "";
      this.mobileError = "";
      this.otp = ["", "", "", "", "", ""];
      this.otpError = "";
      this.otpSuccess = "";
      this.clearOtpTimer();
      this.pendingBoxId = null;
      this.paymentError = "";
    },
    clearOtpTimer() {
      if (this.otpTimer) {
        clearInterval(this.otpTimer);
        this.otpTimer = null;
      }
    },
    sendOTP() {
      if (!this.isValidMobile) {
        this.mobileError = "Please enter a valid mobile number";
        return;
      }

      this.mobileError = "";
      this.isSendingOTP = true;

      try {
        // Use the Vue-safe WebSocket sendMessage
        this.sendMessage({
          action: "sendOTP",
          mobileNumber: this.mobileNumber,
        });

        // Assume OTP request sent successfully → advance step
        this.authStep = 2;
        this.startOtpTimer();
      } catch (err) {
        console.error("❌ Failed to send OTP:", err);
        this.mobileError = "Failed to send OTP. Please try again.";
      } finally {
        this.isSendingOTP = false;
      }
    },
    startOtpTimer() {
      this.clearOtpTimer();
      this.otpCountdown = 120;

      this.otpTimer = setInterval(() => {
        this.otpCountdown--;

        if (this.otpCountdown <= 0) {
          this.clearOtpTimer();
        }
      }, 1000);
    },
    onOtpInput(index, event) {
      const value = event.target.value;

      // Move to next input if a digit was entered
      if (value && index < 6) {
        this.$refs.otpInputs[index].focus();
      }
    },
    verifyOTP() {
      if (!this.isOtpComplete) {
        this.otpError = "Please enter the complete OTP";
        return;
      }

      this.otpError = "";
      this.isVerifyingOTP = true;

      // 🔹 Send OTP verification request to server
      this.sendMessage({
        action: "verifyOTP",
        clientId: this.mobileNumber,
        otp: this.otp.join(""),
      });

      // 🔹 The response should be handled in your WebSocket listener
      // Example (place this in your ws.onmessage or addListener):
      //
      // this.addListener("otpVerified", (payload) => {
      //   this.isVerifyingOTP = false;
      //
      //   if (payload.success) {
      //     this.otpSuccess = "OTP verified successfully!";
      //
      //     setTimeout(() => {
      //       this.isLoggedIn = true;
      //       this.closeAuthModal();
      //
      //       // ✅ If a box was pending selection before OTP,
      //       // continue with that action
      //       if (this.pendingBoxId) {
      //         this.sendMessage({
      //           action: "selectBox",
      //           boxId: this.pendingBoxId,
      //         });
      //         this.pendingBoxId = null; // reset
      //       }
      //     }, 1000);
      //
      //   } else {
      //     this.otpError = "Invalid OTP. Please try again.";
      //   }
      // });
    },
    onOtpDelete(index, event) {
      console.log(event);
      // Move to previous input if backspace was pressed on empty field
      if (!this.otp[index - 1] && index > 1) {
        this.$refs.otpInputs[index - 2].focus();
      }
    },
    animateShuffle() {
      return new Promise((resolve) => {
        const boxes = document.querySelectorAll(".box");
        let completed = 0;

        boxes.forEach((box, index) => {
          setTimeout(() => {
            box.style.transform = "translateY(-20px) rotateY(180deg)";
            box.style.opacity = "0";

            setTimeout(() => {
              box.style.transform = "";
              box.style.opacity = "";
              completed++;

              if (completed === boxes.length) resolve();
            }, 300);
          }, index * 100);
        });
      });
    },
    resetBoxStates() {
      this.boxes.forEach((b) => {
        b.selected = false;
        b.loading = false;
      });
    },
    resetSelection() {
      this.isProcessing = false;
      this.isReshuffling = false;
      this.pendingRequest = null;
      this.resetBoxStates();
    },
    fireConfetti() {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [
          "#ff0000",
          "#00ff00",
          "#0000ff",
          "#ffff00",
          "#ff00ff",
          "#00ffff",
        ],
      });
    },
    playSound(type) {
      const sounds = {
        click: "/sounds/chip-click.wav",
        win: "/sounds/coins-falling.wav",
        lose: "/sounds/card-shuffle.wav",
        jackpot: "/sounds/jackpot-bells.wav",
      };
      const audio = new Audio(sounds[type]);
      audio.play().catch((e) => console.log("Audio play failed:", e));
    },
    startMessageRotation() {
      setInterval(() => {
        this.currentMessageIndex =
          (this.currentMessageIndex + 1) % this.winnerMessages.length;
      }, 3000);
    },
    addNewWinner() {
      const names = [
        "Chris J.",
        "Mia K.",
        "Daniel S.",
        "Sophia L.",
        "James B.",
      ];
      const games = ["Slots", "Poker", "Roulette", "Blackjack", "Baccarat"];

      const newWinner = {
        name: names[Math.floor(Math.random() * names.length)],
        amount: Math.floor(Math.random() * 10000) + 1000,
        game: games[Math.floor(Math.random() * games.length)],
      };

      // Add to recent winners (limit to 5)
      this.recentWinners.unshift(newWinner);
      if (this.recentWinners.length > 5) {
        this.recentWinners.pop();
      }

      // Also add to rotating messages
      this.winnerMessages.push(newWinner);
    },
    updateWinnerMessages(messages) {
      this.winnerMessages = messages;
      this.currentMessageIndex = 0;
    },
  },
};
</script>

<style>
/* Base Styles */
:root {
  --box-size: clamp(100px, 15vw, 140px);
  --transition-speed: 0.4s;
}

body {
  background: radial-gradient(circle at center, #1a3a1a 0%, #0d1f0d 100%),
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%231a3a1a" width="50" height="50" x="0" y="0"/><rect fill="%231a3a1a" width="50" height="50" x="50" y="50"/></svg>');
  background-size: 10px 10px;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  text-align: center;
  color: #2c3e50;
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
}

#app.reshuffling .box {
  pointer-events: none;
  filter: grayscale(50%);
  opacity: 0.7;
}

.reshuffle-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  z-index: 100;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.05);
  }
}

.title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 800;
}

.subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 3rem;
}

.led-display {
  background: #111;
  padding: 15px;
  border-radius: 5px;
  margin: 20px auto;
  max-width: 500px;
  border: 3px solid #333;
}

.led-text {
  color: #ff0;
  font-family: "Courier New", monospace;
  font-size: 1.5rem;
  text-align: center;
  text-shadow: 0 0 5px #ff0, 0 0 10px #ff0;
  animation: led-pulse 1s infinite alternate;
}

@keyframes led-pulse {
  from {
    opacity: 0.8;
  }
  to {
    opacity: 1;
  }
}

.casino-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, #1a2a3a 0%, #2c3e50 100%);
  padding: 15px 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  color: #fff;
  flex-wrap: wrap;
}

.online-players {
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.online-players .dot {
  width: 10px;
  height: 10px;
  background: #4caf50;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;
}

.recent-winners {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 60px;
  overflow: hidden;
  font-size: 0.9rem;
}

.winner-item {
  animation: slideIn 0.5s ease forwards;
  color: #ffd700;
}

.winner-item .amount {
  color: #00ffea;
  font-weight: bold;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.box-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--box-size), 1fr));
  gap: 1.5rem;
  justify-content: center;
  max-width: 450px;
  margin: 0 auto;
}

.box-container.disabled {
  pointer-events: none;
}

.box {
  position: relative;
  width: var(--box-size);
  height: var(--box-size);
  margin: 0 auto;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    hsl(var(--hue), 80%, 70%) 0%,
    hsl(var(--hue), 80%, 50%) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  transform: translateY(0) scale(1);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  opacity: 0;
  animation: box-appear 0.5s ease-out var(--delay) forwards;
  border: 2px solid transparent;
}

.box:hover:not(.disabled) {
  transform: translateY(-5px) scale(1.03);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.8);
}

.box.selected {
  transform: translateY(-10px) scale(1.1) rotateY(10deg);
  filter: brightness(1.1);
}

.box.selected .box-glow {
  opacity: 1;
  transform: scale(1.2);
}

.box.disabled {
  pointer-events: none;
  opacity: 0.7;
  cursor: not-allowed;
}

.box-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.box-icon {
  font-size: 3rem;
  line-height: 1;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.box-number {
  font-size: 1.2rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.box-loader {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

.losing-box {
  opacity: 0.6;
  text-decoration: line-through;
}

.win-text {
  color: #4caf50;
  font-weight: bold;
}

.lose {
  color: #f44336;
}

.box-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  opacity: 0;
  transition: all var(--transition-speed) ease;
  z-index: 1;
}

.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1000;
}

.global-loader .spinner {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes box-appear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.shadow-pulse {
  animation: shadow-pulse 1.5s infinite ease-in-out;
}

@keyframes shadow-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.animate-pop {
  animation: pop 0.3s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modal-appear 0.3s ease-out;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-content.win {
  border-top: 6px solid #4caf50;
}

.modal-content.lose {
  border-top: 6px solid #f44336;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

/* USSD Results Style */
.ussd-results {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  font-family: monospace;
  margin-bottom: 20px;
}

.ussd-line {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #ddd;
}

.ussd-line:last-child {
  border-bottom: none;
}

.selected-line {
  font-weight: bold;
  color: #333;
}

.ussd-label {
  color: #666;
}

.ussd-value {
  color: #222;
}

/* Prize animation */
.prize-animation {
  position: relative;
  height: 100px;
  overflow: hidden;
  margin: 20px 0;
}

.coins-falling {
  position: absolute;
  width: 100%;
  height: 100%;
}

.coin {
  position: absolute;
  width: 30px;
  height: 30px;
  background: gold;
  border-radius: 50%;
  top: -50px;
  animation: coin-fall linear infinite;
  box-shadow: inset -3px -3px 5px rgba(0, 0, 0, 0.3);
}

.coin:before {
  content: "$";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #000;
  font-weight: bold;
}

@keyframes coin-fall {
  to {
    transform: translateY(150px) rotate(360deg);
  }
}

.result-message {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  font-size: 1.1rem;
  margin-top: 15px;
}

.result-message.win {
  background: #e8f5e9;
  color: #2e7d32;
}

.result-message.lose {
  background: #ffebee;
  color: #c62828;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  text-align: right;
}

.modal-button {
  background: #2196f3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.modal-button:hover {
  background: #0b7dda;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Auth Modal Styles */
.auth-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

/* .otp-container {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.otp-input {
  flex: 1;
  text-align: center;
  font-size: 18px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
} */

.otp-container {
  display: flex;
  gap: 8px; /* spacing between boxes */
  justify-content: center;
}

.otp-input {
  width: 40px; /* fixed width */
  height: 40px; /* fixed height (square) */
  text-align: center;
  font-size: 18px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
}

.otp-input:focus {
  border-color: #4caf50; /* highlight on focus */
  box-shadow: 0 0 3px rgba(76, 175, 80, 0.5);
}

.countdown {
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.resend-link {
  color: #2196f3;
  cursor: pointer;
  text-decoration: underline;
}

.error-message {
  color: #f44336;
  font-size: 14px;
  margin-top: 5px;
}

.success-message {
  color: #4caf50;
  font-size: 14px;
  margin-top: 5px;
}

.auth-button {
  background: #2196f3;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  margin-top: 10px;
}

.auth-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.auth-button:hover:not(:disabled) {
  background: #0b7dda;
}

.step-indicator {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.step {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 10px;
  font-weight: bold;
}

.step.active {
  background: #2196f3;
  color: white;
}

.step.completed {
  background: #4caf50;
  color: white;
}
/* Add these styles to your CSS */
.error-header {
  background-color: #ffebee;
  color: #c62828;
  border-bottom: 2px solid #ef5350;
}

.payment-error-container {
  text-align: center;
  padding: 20px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.payment-error-message {
  color: #c62828;
  font-size: 1.1rem;
  margin-bottom: 20px;
  line-height: 1.5;
}

.retry-button {
  background-color: #ef5350;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.retry-button:hover {
  background-color: #d32f2f;
}
.container {
  max-width: 800px;
  width: 100%;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.casino-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  border: 1px solid gold;
  margin-bottom: 30px;
}

.winner-messages {
  position: relative;
  /* padding: 12px 20px; */
  background: linear-gradient(
    90deg,
    rgba(255, 215, 0, 0.2),
    rgba(255, 215, 0, 0.1)
  );
  border-radius: 8px;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.winner-message {
  position: absolute;
  width: 100%;
  left: 0;
  padding: 0 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.winner-message.active {
  opacity: 1;
  transform: translateY(0);
}

.winner-icon {
  color: gold;
  margin-right: 8px;
  font-size: 1.2em;
}

.winner-name {
  color: #ffdd00;
  font-weight: bold;
}

.amount {
  color: #00ff00;
  font-weight: bold;
}

.recent-winners {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.winner-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 6px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.section-title {
  text-align: center;
  margin-bottom: 20px;
  color: gold;
  font-size: 28px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.instructions {
  background: rgba(0, 0, 0, 0.6);
  padding: 15px;
  border-radius: 10px;
  margin-top: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.instructions h3 {
  color: gold;
  margin-bottom: 10px;
}

.instructions ul {
  padding-left: 20px;
  line-height: 1.6;
}

.instructions li {
  margin-bottom: 8px;
}
</style>
