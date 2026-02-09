//
//  TrainView.swift
//  Rata
//
//  Created by Pascal Jedicke on 08.10.25.
//

import SwiftUI
import MapKit

struct TrainView: View {
    @Environment(ModelData.self) var modelData
    @State var liveActivity = LiveActivityModel()
    @State private var timer: Timer? = nil
    
    @State private var cachedTrain: Train?
    
    var body: some View {
        @Bindable var modelData = modelData
        let train = cachedTrain ?? modelData.selectedTrain
        var operatorIcon: Image {
            if let commuterLine = train?.commuterLine, !commuterLine.isEmpty {
                let commuterImageName = "hsl_" + commuterLine
                if UIImage(named: commuterImageName) != nil {
                    return Image(commuterImageName)
                } else {
                    return Image("hsl_Unknown")
                }
            }
            let operatorCode = train?.trainOperatorCode ?? "default"
            return Image(operatorCode)
        }
        ZStack {
            VStack {
                HStack {
                    operatorIcon
                        .resizable()
                        .scaledToFit()
                        .cornerRadius(22)
                        .frame(width: 44, height: 44)
                    Text(train?.trainName ?? "Train")
                        .font(.system(size: 18))
                        .bold()
                    if (train?.commuterLine != "") {
                        Text(train!.commuterLine)
                            .font(.system(size: 16))
                            .italic()
                    }
                    Spacer()
                    Button {
                        timer = Timer.scheduledTimer(withTimeInterval: 15.0, repeats: true) {_ in
                            liveActivity.updateLiveActivity()
                        }
                        liveActivity.startLiveActivity(train: modelData.selectedTrain!)
                        modelData.hapticFeedback.impactOccurred()
                    } label: {
                        Image(systemName: "widget.small")
                            .font(.system(size: 20))
                            .foregroundColor(.primary)
                            .padding()
                    }
                    .glassEffect(.regular.interactive(), in: Capsule())
                    Button {
                        modelData.hapticFeedback.impactOccurred()
                        modelData.selectedTrain = nil
                        modelData.mapView?.selectedAnnotations.forEach {
                            modelData.mapView?.deselectAnnotation($0, animated: true)
                        }
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 20))
                            .foregroundColor(.primary)
                            .padding()
                    }
                    .glassEffect(.regular.interactive(), in: Capsule())
                }
                ScrollView {
                    VStack {
                        HStack {
                            Text("TrainOperator")
                            Spacer()
                            Text(train?.trainOperator ?? "Operator")
                        }
                        .padding(.vertical, 4)
                        HStack {
                            Text("TrainCategory")
                            Spacer()
                            Text(train?.trainCategory ?? "Category")
                        }
                        .padding(.vertical, 4)
                        HStack {
                            Text("TrainSpeed")
                            Spacer()
                            Text("\(train?.speed ?? 0, specifier: "%.1f") km/h")
                        }
                        .padding(.vertical, 4)
                        HStack {
                            Text("Destination")
                            Spacer()
                            Text(train?.destinationStation!.stationName ?? "Destination")
                        }
                        .padding(.vertical, 4)
                    }
                    .padding()
                    .background(Color(.systemGray5))
                    .cornerRadius(22)
                    VStack {
                        if let train = train, !train.stops.isEmpty {
                            let grouped = groupedStops(from: train.stops)
                            ForEach(Array(grouped.enumerated()), id: \.element.id) { index, stop in
                                TrainServicePoint(servicePoint: stop, isDepartureStation: index == 0, isDestinationStation: index == grouped.count - 1)
                            }
                            
                        } else { }
                    }
                    .padding(.horizontal)
                    VStack {
                        HStack {
                            Text("Source")
                            Spacer()
                            Text(train?.dataSource ?? "No Source")
                        }
                        .padding(.vertical, 4)
                        HStack {
                            Text("Timestamp")
                            Spacer()
                            Text(train?.timestamp.map {
                                DateFormatter.localizedString(from: $0, dateStyle: .short, timeStyle: .short)
                            } ?? "Timestamp")
                        }
                        .padding(.vertical, 4)
                    }
                    .padding()
                    .background(Color(.systemGray5))
                    .cornerRadius(22)
                    Spacer()
                        .frame(height: 50)
                }
            }
            .padding()
            VStack {
                Spacer()
                Rectangle()
                    .fill(.ultraThinMaterial) // blur effect
                    .frame(height: 50)
                    .mask(
                        LinearGradient(
                            gradient: Gradient(stops: [
                                .init(color: .black.opacity(0), location: 0),
                                .init(color: .black, location: 1)
                            ]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .edgesIgnoringSafeArea(.bottom)
            }
        }
        .onAppear {
            cachedTrain = modelData.selectedTrain
        }
    }
    
    // MARK: - Group Stops by Station
    func groupedStops(from stops: [TrainStop]) -> [StationStopInfo] {
        var dict: [Int: StationStopInfo] = [:] // Keyed by station ID

        for stop in stops {
            let stationId = stop.station.id
            if var info = dict[stationId] {
                // Update arrival or departure if already exists
                if stop.type.uppercased() == "ARRIVAL" {
                    info.arrivalTime = stop.scheduledTime
                } else if stop.type.uppercased() == "DEPARTURE" {
                    info.departureTime = stop.scheduledTime
                }
                dict[stationId] = info
            } else {
                // Create new entry
                dict[stationId] = StationStopInfo(
                    station: stop.station,
                    arrivalTime: stop.type.uppercased() == "ARRIVAL" ? stop.scheduledTime : nil,
                    departureTime: stop.type.uppercased() == "DEPARTURE" ? stop.scheduledTime : nil,
                    track: stop.commercialTrack,
                )
            }
        }

        // Return as sorted array by departureTime or arrivalTime
        return dict.values.sorted {
            ($0.departureTime ?? $0.arrivalTime ?? Date.distantFuture)
                < ($1.departureTime ?? $1.arrivalTime ?? Date.distantFuture)
        }
    }
}

// MARK: - Helper Struct for Grouped Stops
struct StationStopInfo: Identifiable {
    let id = UUID()
    let station: Station
    var arrivalTime: Date?
    var departureTime: Date?
    var track: String?
}

#Preview {
    @Previewable @State var modelData = ModelData()
    TrainView()
        .environment(modelData)
}
