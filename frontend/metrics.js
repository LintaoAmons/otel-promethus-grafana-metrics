import { metrics } from "https://cdn.jsdelivr.net/npm/@opentelemetry/api@1.7.0/+esm";
import { OTLPMetricExporter } from "https://cdn.jsdelivr.net/npm/@opentelemetry/exporter-metrics-otlp-http@0.45.1/+esm";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "https://cdn.jsdelivr.net/npm/@opentelemetry/sdk-metrics@1.18.1/+esm";
import { Resource } from "https://cdn.jsdelivr.net/npm/@opentelemetry/resources@1.18.1/+esm";
import { SemanticResourceAttributes } from "https://cdn.jsdelivr.net/npm/@opentelemetry/semantic-conventions@1.18.1/+esm";

// Initialize OpenTelemetry
const initOpenTelemetry = () => {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "demo-frontend",
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
  });

  const meterProvider = new MeterProvider({
    resource: resource,
  });

  const metricExporter = new OTLPMetricExporter({
    url: "/v1/metrics",  // Changed to use relative path through nginx proxy
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000,
  });

  meterProvider.addMetricReader(metricReader);
  metrics.setGlobalMeterProvider(meterProvider);

  return meterProvider.getMeter("demo-frontend");
};

const meter = initOpenTelemetry();

// Create metrics
const clickCounter = meter.createCounter("frontend_button_clicks", {
  description: "Number of times the button was clicked",
  unit: "clicks",
});

const latencyHistogram = meter.createHistogram("frontend_operation_latency", {
  description: "Latency of frontend operations",
  unit: "ms",
});

let clickCount = 0;

// Functions to record metrics
window.incrementCounter = () => {
  clickCount++;
  document.getElementById("clickCount").textContent = clickCount;

  clickCounter.add(1, {
    button_name: "click_me",
    page: "demo",
  });

  updateStatus("Counter incremented!");
};

window.recordLatency = () => {
  const latency = Math.floor(Math.random() * 1000) + 50;

  latencyHistogram.record(latency, {
    operation: "random_latency",
    source: "frontend",
  });

  updateStatus(`Recorded latency: ${latency}ms`);
};

const updateStatus = (message) => {
  const status = document.getElementById("status");
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "Ready to send metrics...";
  }, 2000);
};

// Initialize display
document.getElementById("clickCount").textContent = clickCount;
