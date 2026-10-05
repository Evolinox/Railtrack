//
//  LiveTrackingActivity.swift
//  LiveTrackingActivity
//
//  Created by Pascal Jedicke on 29.09.25.
//

import SwiftUI
import WidgetKit
import ActivityKit

struct LiveTrackingActivity: Widget {
    func compactRemainingTime(departureTime: Date?, arrivalTime: Date?) -> String {
        guard let departure = departureTime, let arrival = arrivalTime else {
            return "--"
        }

        let now = Date()

        // If we're before departure → show time until departure
        if now < departure {
            let diff = departure.timeIntervalSince(now)
            return formatTimeInterval(diff)
        }
        // If we've departed but not yet arrived → show time until arrival
        else if now < arrival {
            let diff = arrival.timeIntervalSince(now)
            return formatTimeInterval(diff)
        }
        // If we've already arrived → show "--"
        else {
            return "--"
        }
    }

    private func formatTimeInterval(_ interval: TimeInterval) -> String {
        let totalMinutes = Int(interval / 60)
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60

        if hours > 0 {
            return "\(hours)h\(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LiveTrackingAttributes.self) { context in
            // Lock screen/banner UI
            LiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    VStack{
                        HStack {
                            Image(context.attributes.trainOperatorCode)
                                .resizable()
                                .scaledToFit()
                                .frame(width: 20, height: 20)
                                .clipShape(Circle())
                                .padding(.leading, 8)
                            Text(context.attributes.trainName)
                                .foregroundColor(.gray)
                                .font(.subheadline)
                            Spacer()
                        }
                        HStack {
                            Text(context.attributes.departureStationCode)
                                .font(.title)
                                .fixedSize(horizontal: true, vertical: true)
                            Text(context.state.departureTime.addingTimeInterval(context.state.departureDelay), style: .time)
                                .foregroundColor(context.state.departureDelay > 300 ? .red : .green)
                                .font(.title2)
                                .fixedSize(horizontal: true, vertical: true)
                            Gauge(value: context.state.progress) {
                                EmptyView()
                            }
                            .gaugeStyle(.accessoryLinear)
                            Text(context.state.arrivalTime.addingTimeInterval(context.state.arrivalDelay), style: .time)
                                .foregroundColor(context.state.arrivalDelay > 300 ? .red : .green)
                                .font(.title2)
                                .fixedSize(horizontal: true, vertical: true)
                            Text(context.attributes.arrivalStationCode)
                                .font(.title)
                                .fixedSize(horizontal: true, vertical: true)
                        }
                        HStack {
                            if (context.state.departureDelay > 60) {
                                Text("+ \(Int(context.state.departureDelay / 60)) m")
                            } else {
                                Text(" ")
                            }
                            Spacer()
                            if (context.state.arrivalDelay > 60) {
                                Text("+ \(Int(context.state.arrivalDelay / 60)) m")
                            } else {
                                Text(" ")
                            }
                        }
                        .font(.system(size: 12, weight: .thin))
                        .italic()
                        Spacer()
                        Divider()
                        HStack {
                            VStack(alignment: .leading) {
                                Text(context.state.statusMessage)
                                    .foregroundColor(.gray)
                                    .font(.system(size: 16))
                            }
                            Spacer()
                            if (!context.state.statusPlatform.isEmpty) {
                                HStack {
                                    Image(systemName: "figure.walk.suitcase.rolling")
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 24, height: 24)
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(Color.blue)
                                            .frame(width: 24, height: 24)
                                        Text(context.state.statusPlatform)
                                            .font(.system(size: 20, weight: .bold))
                                    }
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .offset(y: -30)
                    .padding(.vertical)
                }
            } compactLeading: {
                Text(compactRemainingTime(
                    departureTime: context.state.departureTime,
                    arrivalTime: context.state.arrivalTime
                ))
                    .foregroundColor(context.state.departureDelay > 300 ? .red : .green)
                
            } compactTrailing: {
                if (!context.state.statusPlatform.isEmpty) {
                    HStack {
                        Image(systemName: "figure.walk.suitcase.rolling")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 16, height: 16)
                        ZStack {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.blue)
                                .frame(width: 20, height: 20)
                            Text(context.state.statusPlatform)
                                .font(.system(size: 18, weight: .bold))
                        }
                    }
                } else {
                    Image(context.attributes.trainOperatorCode)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 20, height: 20)
                        .clipShape(Circle())
                }
                    
            } minimal: {
                Image(systemName: "tram")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)
                    .clipShape(Circle())
                    
            }
        }
    }
}

struct LiveActivityView: View {
    let context: ActivityViewContext<LiveTrackingAttributes>
    
    var body: some View {
        VStack {
            HStack {
                Image(context.attributes.trainOperatorCode)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)
                    .clipShape(Circle())
                Text(context.attributes.trainName)
                    .foregroundColor(.gray)
                    .font(.headline)
                Text(context.attributes.trainOperator)
                    .foregroundColor(.gray)
                    .font(.system(size: 12, weight: .thin))
                    .italic()
                Spacer()
            }
            
            HStack {
                Text(context.attributes.departureStationCode)
                    .font(.title)
                    .fixedSize(horizontal: true, vertical: true)
                Text(context.state.departureTime.addingTimeInterval(context.state.departureDelay), style: .time)
                    .foregroundColor(context.state.departureDelay > 300 ? .red : .green)
                    .font(.title2)
                    .fixedSize(horizontal: true, vertical: true)
                Gauge(value: context.state.progress) {
                    EmptyView()
                }
                .tint(.white)
                .gaugeStyle(.accessoryLinear)
                Text(context.state.arrivalTime.addingTimeInterval(context.state.arrivalDelay), style: .time)
                    .foregroundColor(context.state.arrivalDelay > 300 ? .red : .green)
                    .font(.title2)
                    .fixedSize(horizontal: true, vertical: true)
                Text(context.attributes.arrivalStationCode)
                    .font(.title)
                    .fixedSize(horizontal: true, vertical: true)
            }
            HStack {
                if (context.state.departureDelay > 60) {
                    Text("+ \(Int(context.state.departureDelay / 60)) m")
                }
                Spacer()
                if (context.state.arrivalDelay > 60) {
                    Text("+ \(Int(context.state.arrivalDelay / 60)) m")
                }
            }
            .font(.system(size: 12, weight: .thin))
            .italic()
            Divider()
            HStack {
                VStack(alignment: .leading) {
                    Text(context.state.statusMessage)
                        .foregroundColor(.gray)
                        .font(.system(size: 16))
                }
                Spacer()
                if (!context.state.statusPlatform.isEmpty) {
                    HStack {
                        Image(systemName: "figure.walk.suitcase.rolling")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.blue)
                                .frame(width: 24, height: 24)
                            Text(context.state.statusPlatform)
                                .font(.system(size: 20, weight: .bold))
                        }
                    }
                }
            }
        }
        .padding()
    }
}

#Preview(as: .dynamicIsland(.expanded),
         using: LiveTrackingAttributes(trainName: "T 7334", trainOperator: "North Rail Oy", trainOperatorCode: "operail", departureStationCode: "KVLA", arrivalStationCode: "SIJ"
         )) {

    LiveTrackingActivity()
    
} contentStates: {
    LiveTrackingAttributes.ContentState(departureTime: Calendar.current.date(from: DateComponents(hour: 7, minute: 25))!, departureDelay: 505, arrivalTime: Calendar.current.date(from: DateComponents(hour: 14, minute: 47))!, arrivalDelay: 0, statusPlatform: "", statusMessage: "Cargo", progress: 0.45
    )
}

