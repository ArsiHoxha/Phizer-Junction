//
//  MigraineWidget.swift
//  MigraineWidget
//
//  Migraine Risk Index Home Screen Widget
//

import WidgetKit
import SwiftUI

// MARK: - Widget Data Model
struct MigraineWidgetData: Codable {
    let riskPercentage: Int
    let riskLevel: String
    let riskColor: String
    let lastUpdate: String
    let topTriggers: [String]
    let todayMetrics: TodayMetrics
    
    struct TodayMetrics: Codable {
        let heartRate: Int?
        let hrv: Int?
        let stress: Int?
        let sleep: Int?
    }
}

// MARK: - Timeline Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> MigraineEntry {
        MigraineEntry(date: Date(), data: getPlaceholderData())
    }

    func getSnapshot(in context: Context, completion: @escaping (MigraineEntry) -> ()) {
        let entry = MigraineEntry(date: Date(), data: loadWidgetData() ?? getPlaceholderData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let entry = MigraineEntry(date: currentDate, data: loadWidgetData() ?? getPlaceholderData())
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    // Load data from shared app group
    private func loadWidgetData() -> MigraineWidgetData? {
        let appGroupID = "group.com.phizerjunction.migraine"
        guard let userDefaults = UserDefaults(suiteName: appGroupID),
              let jsonData = userDefaults.data(forKey: "widget_migraine_data") else {
            return nil
        }
        
        return try? JSONDecoder().decode(MigraineWidgetData.self, from: jsonData)
    }
    
    private func getPlaceholderData() -> MigraineWidgetData {
        return MigraineWidgetData(
            riskPercentage: 25,
            riskLevel: "Low",
            riskColor: "#10B981",
            lastUpdate: ISO8601DateFormatter().string(from: Date()),
            topTriggers: ["Stress", "Sleep"],
            todayMetrics: MigraineWidgetData.TodayMetrics(
                heartRate: 72,
                hrv: 45,
                stress: 3,
                sleep: 85
            )
        )
    }
}

struct MigraineEntry: TimelineEntry {
    let date: Date
    let data: MigraineWidgetData
}

// MARK: - Widget View
struct MigraineWidgetView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var widgetFamily

    var body: some View {
        switch widgetFamily {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Small Widget (Risk Display Only)
struct SmallWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color(hex: entry.data.riskColor).opacity(0.2),
                    Color(hex: entry.data.riskColor).opacity(0.1)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 8) {
                Text("Migraine Risk")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                // Circular Progress
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                        .frame(width: 80, height: 80)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(entry.data.riskPercentage) / 100)
                        .stroke(
                            Color(hex: entry.data.riskColor),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    
                    VStack(spacing: 2) {
                        Text("\(entry.data.riskPercentage)%")
                            .font(.system(size: 24, weight: .bold))
                        Text(entry.data.riskLevel)
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
                
                Text(timeAgo(from: entry.data.lastUpdate))
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
            }
            .padding()
        }
    }
}

// MARK: - Medium Widget (Risk + Triggers)
struct MediumWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: entry.data.riskColor).opacity(0.15),
                    Color(hex: entry.data.riskColor).opacity(0.05)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            HStack(spacing: 16) {
                // Left: Risk Display
                VStack(spacing: 8) {
                    Text("Risk")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    ZStack {
                        Circle()
                            .stroke(Color.gray.opacity(0.2), lineWidth: 6)
                            .frame(width: 70, height: 70)
                        
                        Circle()
                            .trim(from: 0, to: CGFloat(entry.data.riskPercentage) / 100)
                            .stroke(
                                Color(hex: entry.data.riskColor),
                                style: StrokeStyle(lineWidth: 6, lineCap: .round)
                            )
                            .frame(width: 70, height: 70)
                            .rotationEffect(.degrees(-90))
                        
                        VStack(spacing: 0) {
                            Text("\(entry.data.riskPercentage)%")
                                .font(.system(size: 20, weight: .bold))
                            Text(entry.data.riskLevel)
                                .font(.system(size: 8))
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Divider()
                
                // Right: Triggers & Metrics
                VStack(alignment: .leading, spacing: 8) {
                    if !entry.data.topTriggers.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Active Triggers")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            
                            ForEach(entry.data.topTriggers.prefix(3), id: \.self) { trigger in
                                HStack(spacing: 4) {
                                    Circle()
                                        .fill(Color(hex: entry.data.riskColor))
                                        .frame(width: 4, height: 4)
                                    Text(trigger)
                                        .font(.caption)
                                        .lineLimit(1)
                                }
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Metrics
                    HStack(spacing: 12) {
                        if let hr = entry.data.todayMetrics.heartRate {
                            MetricView(icon: "heart.fill", value: "\(hr)", color: .red)
                        }
                        if let hrv = entry.data.todayMetrics.hrv {
                            MetricView(icon: "waveform.path.ecg", value: "\(hrv)", color: .blue)
                        }
                    }
                    .font(.caption2)
                    
                    Text(timeAgo(from: entry.data.lastUpdate))
                        .font(.system(size: 8))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding()
        }
    }
}

// MARK: - Large Widget (Full Details)
struct LargeWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: entry.data.riskColor).opacity(0.15),
                    Color(hex: entry.data.riskColor).opacity(0.05)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 16) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        Text("Migraine Risk Index")
                            .font(.headline)
                        Text(timeAgo(from: entry.data.lastUpdate))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Image(systemName: "brain.head.profile")
                        .font(.title2)
                        .foregroundColor(Color(hex: entry.data.riskColor))
                }
                
                // Risk Circle
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                        .frame(width: 120, height: 120)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(entry.data.riskPercentage) / 100)
                        .stroke(
                            Color(hex: entry.data.riskColor),
                            style: StrokeStyle(lineWidth: 12, lineCap: .round)
                        )
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(-90))
                    
                    VStack(spacing: 4) {
                        Text("\(entry.data.riskPercentage)%")
                            .font(.system(size: 36, weight: .bold))
                        Text(entry.data.riskLevel)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Triggers
                if !entry.data.topTriggers.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Active Triggers")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        ForEach(entry.data.topTriggers, id: \.self) { trigger in
                            HStack {
                                Circle()
                                    .fill(Color(hex: entry.data.riskColor))
                                    .frame(width: 6, height: 6)
                                Text(trigger)
                                    .font(.subheadline)
                                Spacer()
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                
                // Health Metrics
                VStack(alignment: .leading, spacing: 8) {
                    Text("Today's Metrics")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 16) {
                        if let hr = entry.data.todayMetrics.heartRate {
                            MetricCardView(icon: "heart.fill", label: "HR", value: "\(hr)", color: .red)
                        }
                        if let hrv = entry.data.todayMetrics.hrv {
                            MetricCardView(icon: "waveform.path.ecg", label: "HRV", value: "\(hrv)", color: .blue)
                        }
                        if let sleep = entry.data.todayMetrics.sleep {
                            MetricCardView(icon: "bed.double.fill", label: "Sleep", value: "\(sleep)%", color: .purple)
                        }
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Helper Views
struct MetricView: View {
    let icon: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(value)
        }
    }
}

struct MetricCardView: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(8)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Helper Functions
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

func timeAgo(from isoString: String) -> String {
    let formatter = ISO8601DateFormatter()
    guard let date = formatter.date(from: isoString) else {
        return "Unknown"
    }
    
    let now = Date()
    let components = Calendar.current.dateComponents([.minute, .hour], from: date, to: now)
    
    if let hours = components.hour, hours > 0 {
        return "\(hours)h ago"
    } else if let minutes = components.minute, minutes > 0 {
        return "\(minutes)m ago"
    } else {
        return "Just now"
    }
}

// MARK: - Widget Configuration
@main
struct MigraineWidget: Widget {
    let kind: String = "MigraineWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MigraineWidgetView(entry: entry)
        }
        .configurationDisplayName("Migraine Risk")
        .description("Monitor your migraine risk index at a glance")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Preview
struct MigraineWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            MigraineWidgetView(entry: MigraineEntry(
                date: Date(),
                data: MigraineWidgetData(
                    riskPercentage: 65,
                    riskLevel: "High",
                    riskColor: "#F97316",
                    lastUpdate: ISO8601DateFormatter().string(from: Date()),
                    topTriggers: ["Stress", "Poor Sleep", "Weather"],
                    todayMetrics: MigraineWidgetData.TodayMetrics(
                        heartRate: 78,
                        hrv: 32,
                        stress: 7,
                        sleep: 65
                    )
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            MigraineWidgetView(entry: MigraineEntry(
                date: Date(),
                data: MigraineWidgetData(
                    riskPercentage: 25,
                    riskLevel: "Low",
                    riskColor: "#10B981",
                    lastUpdate: ISO8601DateFormatter().string(from: Date()),
                    topTriggers: [],
                    todayMetrics: MigraineWidgetData.TodayMetrics(
                        heartRate: 72,
                        hrv: 48,
                        stress: 3,
                        sleep: 85
                    )
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
        }
    }
}
