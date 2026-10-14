(() => {
  "use strict";

  const announce = (id, message, error = false) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.textContent = message;
    target.classList.toggle("error", error);
  };

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copy);
      const text = target.value ?? target.textContent;
      if (!text) {
        announce("global-status", "Nothing to copy yet. Enter your details first.");
        target.focus();
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        const label = button.textContent;
        button.textContent = "Copied!";
        announce("global-status", `${label.replace("Copy ", "")} copied to clipboard.`);
        setTimeout(() => { button.textContent = label; }, 1800);
      } catch {
        if (typeof target.select === "function") target.select();
        announce("global-status", "Clipboard access was blocked. Select the field and copy it manually.");
      }
    });
  });

  document.getElementById("print-guide")?.addEventListener("click", () => window.print());

  const progressInputs = [...document.querySelectorAll("[data-progress]")];
  const progressKey = "fabric-field-lab-progress-v1";
  const updateProgress = () => {
    let completed = 0;
    for (let goal = 1; goal <= 4; goal++) {
      const tasks = progressInputs.filter((input) => input.dataset.goal === String(goal));
      const done = tasks.length > 0 && tasks.every((input) => input.checked);
      const state = document.querySelector(`[data-goal-state="${goal}"]`);
      if (state) {
        state.textContent = done ? "Goal complete" : tasks.some((input) => input.checked) ? "In progress" : "Ready when you are";
        state.classList.toggle("complete", done);
      }
      if (done) completed++;
    }
    const meter = document.getElementById("goal-progress");
    if (meter) {
      meter.value = completed;
      document.getElementById("progress-label").textContent = `${completed} of 4 goals complete`;
    }
  };
  if (progressInputs.length) {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || "{}");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Invalid checklist");
      progressInputs.forEach((input) => { input.checked = saved[input.dataset.progress] === true; });
    } catch {
      announce("progress-status", "Saved progress could not be read. Checklists still work, but may not persist.", true);
    }
    updateProgress();
    progressInputs.forEach((input) => input.addEventListener("change", () => {
      updateProgress();
      try {
        localStorage.setItem(progressKey, JSON.stringify(Object.fromEntries(progressInputs.map((item) => [item.dataset.progress, item.checked]))));
      } catch {
        announce("progress-status", "Your browser blocked saving progress. Keep this tab open to retain the checklist.", true);
      }
    }));
    document.getElementById("reset-progress").addEventListener("click", () => {
      progressInputs.forEach((input) => { input.checked = false; });
      updateProgress();
      try {
        localStorage.removeItem(progressKey);
        announce("progress-status", "Checklist reset. Your account reservation has not changed.");
      } catch {
        announce("progress-status", "Checklist cleared in this tab, but saved progress could not be removed.", true);
      }
    });
  }

  const panel = document.querySelector("[data-access-api]");
  if (!panel) return;
  const manualForm = document.getElementById("manual-form");
  const claimForm = document.getElementById("claim-form");
  const password = document.getElementById("account-password");
  const claimButton = document.getElementById("claim-button");
  const tokenKey = "fabric-field-lab-claim-v1";
  let reservedNumber = null;
  const showAccount = (number, secret = "", reserved = false) => {
    document.getElementById("credentials").hidden = false;
    document.getElementById("account-upn").value = `Fabric.User${number}.malv26@estdcorp.onmicrosoft.com`;
    document.getElementById("account-label").textContent = `User ${number} of 50${reserved ? " / Reserved for this browser" : " / Facilitator-assigned"}`;
    password.value = secret;
    if (reserved) {
      reservedNumber = number;
      document.getElementById("user-number").value = number;
      manualForm.querySelector("button").disabled = true;
      document.getElementById("user-number").disabled = true;
    }
  };
  document.getElementById("show-password").addEventListener("change", (event) => {
    password.type = event.target.checked ? "text" : "password";
  });
  manualForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (reservedNumber !== null) return;
    const number = Number(document.getElementById("user-number").value);
    if (!Number.isInteger(number) || number < 1 || number > 50) {
      announce("access-status", "Enter a whole user number from 1 to 50.", true);
      return;
    }
    showAccount(number);
    announce("access-status", "Username ready. Paste the password provided privately by your facilitator. This is not an online reservation.");
  });

  const api = panel.dataset.accessApi;
  if (!api) {
    document.getElementById("allocation-setup").hidden = false;
    return;
  }
  let endpoint;
  try {
    endpoint = new URL(api);
    if (endpoint.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    document.getElementById("allocation-setup").hidden = false;
    announce("access-status", "Online reservations are misconfigured. Contact your facilitator.", true);
    return;
  }
  claimForm.hidden = false;
  if (!navigator.locks) {
    claimForm.hidden = true;
    announce("access-status", "This browser cannot safely coordinate reservations across tabs. Use a current browser or ask your facilitator for an account.", true);
    return;
  }
  claimForm.addEventListener("submit", (event) => {
    event.preventDefault();
    navigator.locks.request("fabric-field-lab-claim", async () => {
    claimButton.disabled = true;
    claimButton.textContent = "Reserving...";
    const eventCodeInput = document.getElementById("event-code");
    try {
      let token = localStorage.getItem(tokenKey);
      if (!token) {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        token = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
        localStorage.setItem(tokenKey, token);
      }
      if (!/^[a-f0-9]{64}$/.test(token) || localStorage.getItem(tokenKey) !== token) {
        throw new Error("Your reservation token cannot be saved. Ask your facilitator for help; do not clear browser storage or claim in another browser.");
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventCode: eventCodeInput.value }),
        cache: "no-store",
        credentials: "omit",
        signal: AbortSignal.timeout(30000)
      });
      const result = await response.json();
      if (!response.ok) {
        const messages = {
          401: "The event code was not accepted. Check it with your facilitator.",
          403: "The event is closed or this website is not authorized.",
          409: "All 50 accounts are reserved. Ask your facilitator; do not reuse another attendee's number.",
          429: "Too many requests. Wait a moment, then retry in this same browser.",
          503: "Reservations are temporarily unavailable. Retry in this same browser to recover any completed reservation."
        };
        throw new Error(messages[response.status] || "Reservation failed. Contact your facilitator and retry in this same browser.");
      }
      if (!Number.isInteger(result.number) || result.number < 1 || result.number > 50 ||
          typeof result.password !== "string" || !result.password) {
        throw new Error("The reservation response was invalid. Contact your facilitator; do not claim in another browser.");
      }
      showAccount(result.number, result.password, true);
      eventCodeInput.value = "";
      announce("access-status", `User ${result.number} is reserved. Copy your username and password below. Returning in this browser will recover the same number.`);
      claimButton.textContent = "Recover my account";
    } catch (error) {
      const message = error instanceof TypeError || error.name === "TimeoutError"
        ? "Could not reach the reservation service. Retry in this same browser; your reservation token has been kept."
        : error.message;
      announce("access-status", message, true);
      claimButton.textContent = reservedNumber === null ? "Reserve my account" : "Recover my account";
    } finally {
      claimButton.disabled = false;
    }
    }).catch(() => {
      announce("access-status", "Your browser could not coordinate the reservation. Retry in this same browser or contact your facilitator.", true);
      claimButton.disabled = false;
    });
  });
})();
