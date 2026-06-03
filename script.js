const TIMER_LABEL = "Lab 9 timer";
const sampleUser = {
  id: 110,
  name: "Ada Console",
  course: "CSE 110",
  lab: "Error handling"
};

const sampleRows = [
  { operation: "8 + 2", result: 10, status: "ok" },
  { operation: "8 / 0", result: "error", status: "division blocked" },
  { operation: "not-a-number + 2", result: "error", status: "invalid input" }
];

class CalculatorError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "CalculatorError";
    this.details = details;
  }
}

class InvalidNumberError extends CalculatorError {
  constructor(fieldName, value) {
    super(`${fieldName} must be a valid number.`, { fieldName, value });
    this.name = "InvalidNumberError";
  }
}

class DivisionByZeroError extends CalculatorError {
  constructor() {
    super("Division by zero is not allowed.", { operator: "/" });
    this.name = "DivisionByZeroError";
  }
}

class CalculatorStateError extends CalculatorError {
  constructor(selector) {
    super(`Required calculator element was not found: ${selector}`, { selector });
    this.name = "CalculatorStateError";
  }
}

const form = document.querySelector("#calculator-form");
const statusPill = document.querySelector("#status-pill");
const resultOutput = document.querySelector("#result-output");
const consoleButtons = document.querySelector("#console-buttons");
const trackjsForm = document.querySelector("#trackjs-form");
const trackjsTokenInput = document.querySelector("#trackjs-token");
const trackjsStatus = document.querySelector("#trackjs-status");

function setStatus(message, type = "ready") {
  statusPill.textContent = message;
  statusPill.dataset.type = type;
}

function getNumber(selector, label) {
  const input = document.querySelector(selector);

  if (!input) {
    throw new CalculatorStateError(selector);
  }

  const value = Number(input.value);

  if (!Number.isFinite(value)) {
    throw new InvalidNumberError(label, input.value);
  }

  return value;
}

function calculate(first, second, operator) {
  switch (operator) {
    case "+":
      return first + second;
    case "-":
      return first - second;
    case "*":
      return first * second;
    case "/":
      if (second === 0) {
        throw new DivisionByZeroError();
      }
      return first / second;
    default:
      throw new CalculatorError("Unsupported operator selected.", { operator });
  }
}

function reportError(error, context = {}) {
  console.error("Lab 9 captured error", { error, context });

  if (window.TrackJS && typeof window.TrackJS.track === "function") {
    window.TrackJS.track(error);
  }
}

function handleCalculatorSubmit(event) {
  event.preventDefault();
  console.time("Calculator try/catch/finally");

  try {
    const first = getNumber("#first-number", "First number");
    const second = getNumber("#second-number", "Second number");
    const operator = document.querySelector("#operator")?.value;
    const result = calculate(first, second, operator);

    if (!resultOutput) {
      throw new CalculatorStateError("#result-output");
    }

    resultOutput.value = Number.isInteger(result) ? result : result.toFixed(4);
    setStatus("Calculated", "success");
    console.log("Calculation completed", { first, second, operator, result });
  } catch (error) {
    resultOutput.value = "Error";
    setStatus("Check input", "error");
    reportError(error, { feature: "calculator" });
  } finally {
    console.timeEnd("Calculator try/catch/finally");
    console.log("Calculator cleanup finished in finally.");
  }
}

function runConsoleDemo(demoName) {
  const outputNode = document.querySelector("#result-output");

  switch (demoName) {
    case "log":
      console.log("Console log demo", sampleUser);
      break;
    case "error":
      console.error("Console error demo", new CalculatorError("Sample console.error message."));
      break;
    case "count":
      console.count("Console count demo");
      break;
    case "warn":
      console.warn("Console warn demo: this warns without stopping the app.");
      break;
    case "assert":
      console.assert(Number(outputNode.value) < 100, "Console assert demo: result is not under 100.", {
        result: outputNode.value
      });
      break;
    case "clear":
      console.clear();
      console.log("Console was cleared, then this confirmation was logged.");
      break;
    case "dir":
      console.dir(outputNode);
      break;
    case "dirxml":
      console.dirxml(outputNode);
      break;
    case "groupStart":
      console.group("Console group demo");
      console.log("User", sampleUser);
      console.log("Rows", sampleRows);
      console.groupCollapsed("Nested collapsed details");
      console.log("Use Console Group End to close this group.");
      console.groupEnd();
      break;
    case "groupEnd":
      console.groupEnd();
      console.log("Closed the current console group.");
      break;
    case "table":
      console.table(sampleRows);
      break;
    case "timerStart":
      console.time(TIMER_LABEL);
      console.log("Timer started. Press End Timer to finish it.");
      break;
    case "timerEnd":
      console.timeEnd(TIMER_LABEL);
      break;
    case "trace":
      traceEntry();
      break;
    case "globalError":
      setTimeout(() => {
        throw new CalculatorError("Global error triggered from the button.", {
          source: "Trigger a Global Error"
        });
      }, 0);
      break;
    default:
      console.warn("Unknown console demo requested.", demoName);
  }
}

function traceEntry() {
  traceMiddle();
}

function traceMiddle() {
  traceLeaf();
}

function traceLeaf() {
  console.trace("Console trace demo");
}

function loadTrackJS(token) {
  const existingScript = document.querySelector("#trackjs-agent");
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.id = "trackjs-agent";
  script.src = "https://cdn.trackjs.com/agent/v3/latest/t.js";
  script.async = true;
  script.onload = () => {
    if (window.TrackJS && typeof window.TrackJS.install === "function") {
      window.TrackJS.install({
        token,
        application: "lab9",
        userId: "steven-nguyen"
      });
      window.TrackJS.track("Testing TrackJS from Lab 9");
    }
    trackjsStatus.textContent = "TrackJS enabled. Trigger a global error to verify the dashboard.";
    console.log("TrackJS agent loaded.");
  };
  script.onerror = () => {
    trackjsStatus.textContent = "TrackJS could not load. Check the token and network connection.";
  };
  document.head.append(script);
}

function handleTrackJSSubmit(event) {
  event.preventDefault();
  const token = trackjsTokenInput.value.trim();

  if (!token) {
    trackjsStatus.textContent = "Enter a TrackJS token before enabling remote monitoring.";
    return;
  }

  localStorage.setItem("lab9-trackjs-token", token);
  loadTrackJS(token);
}

window.onerror = function handleGlobalError(message, source, lineno, colno, error) {
  console.error("window.onerror caught a global error", {
    message,
    source,
    lineno,
    colno,
    error
  });
  reportError(error || new Error(String(message)), { feature: "window.onerror" });
};

window.addEventListener("error", (event) => {
  console.log("window error event observed", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno
  });
});

form.addEventListener("submit", handleCalculatorSubmit);

consoleButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-demo]");

  if (!button) {
    return;
  }

  runConsoleDemo(button.dataset.demo);
});

trackjsForm.addEventListener("submit", handleTrackJSSubmit);

const savedToken = localStorage.getItem("lab9-trackjs-token");
if (savedToken) {
  trackjsTokenInput.value = savedToken;
  loadTrackJS(savedToken);
}
