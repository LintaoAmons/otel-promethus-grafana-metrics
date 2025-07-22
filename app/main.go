package main

import (
    "context"
    "log"
    "math/rand"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
    "go.opentelemetry.io/otel/metric"
    sdkmetric "go.opentelemetry.io/otel/sdk/metric"
    "go.opentelemetry.io/otel/sdk/resource"
    semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
)

func main() {
    ctx := context.Background()

    // 创建 OTLP gRPC exporter
    exporter, err := otlpmetricgrpc.New(ctx,
        otlpmetricgrpc.WithEndpoint("otel-collector:4317"),
        otlpmetricgrpc.WithInsecure(),
    )
    if err != nil {
        log.Fatal("Failed to create exporter:", err)
    }

    // 创建资源信息
    res := resource.NewWithAttributes(
        semconv.SchemaURL,
        semconv.ServiceNameKey.String("demo-app"),
        semconv.ServiceVersionKey.String("1.0.0"),
    )

    // 创建 MeterProvider
    mp := sdkmetric.NewMeterProvider(
        sdkmetric.WithResource(res),
        sdkmetric.WithReader(sdkmetric.NewPeriodicReader(exporter,
            sdkmetric.WithInterval(5*time.Second))),
    )
    otel.SetMeterProvider(mp)

    // 创建 meter 和 instruments
    meter := otel.Meter("demo-app")
    
    requestCounter, _ := meter.Int64Counter("http_requests_total",
        metric.WithDescription("Total HTTP requests"))
    
    responseTimeHistogram, _ := meter.Float64Histogram("http_request_duration_seconds",
        metric.WithDescription("HTTP request duration in seconds"))

    // 模拟应用程序运行
    log.Println("Demo app started, sending metrics...")
    
    for {
        // 模拟 HTTP 请求
        method := []string{"GET", "POST", "PUT"}[rand.Intn(3)]
        status := []string{"200", "404", "500"}[rand.Intn(3)]
        
        // 增加计数器
        requestCounter.Add(ctx, 1,
            metric.WithAttributes(
                attribute.String("method", method),
                attribute.String("status", status),
            ))
        
        // 记录响应时间
        duration := rand.Float64() * 2.0 // 0-2秒
        responseTimeHistogram.Record(ctx, duration,
            metric.WithAttributes(
                attribute.String("method", method),
                attribute.String("status", status),
            ))
        
        time.Sleep(time.Duration(rand.Intn(3)+1) * time.Second)
    }
}
