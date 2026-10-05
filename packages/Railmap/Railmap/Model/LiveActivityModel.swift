//
//  LiveActivityModel.swift
//  Rata
//
//  Created by Pascal Jedicke on 04.10.25.
//

import Foundation
import ActivityKit

@Observable
class LiveActivityModel {
    let railisService = RailisService()
    var liveActivity: Activity<LiveTrackingAttributes>? = nil
    private var trainId: Int = 0
    
    func tripProgress(departure: Date, arrival: Date, now: Date = Date()) -> Double {
        if now <= departure {
            return 0.0
        }
        if now >= arrival {
            return 1.0
        }
        let totalDuration = arrival.timeIntervalSince(departure)
        let elapsed = now.timeIntervalSince(departure)
        
        return elapsed / totalDuration
    }
    
    func statusMessage(trainCategory: String, departureStation: String, destinationStation: String) -> String {
        let status = String(
            localized: "\(trainCategory) from \(departureStation) to \(destinationStation)",
            table: "Localizable",
            comment: "Train Status Message"
        )
        return status
    }
    
    func startLiveActivity(train: Train) {
        trainId = train.id
        let attributes = LiveTrackingAttributes(
            trainName: train.trainName,
            trainOperator: train.trainOperator,
            trainOperatorCode: train.trainOperatorCode,
            departureStationCode: train.departureStation!.stationCode,
            arrivalStationCode: train.destinationStation!.stationCode
        )
        
        let initialState = LiveTrackingAttributes.ContentState(
            departureTime: train.departureScheduledTime!,
            departureDelay: (train.departureActualTime ?? train.departureScheduledTime!).timeIntervalSince(train.departureScheduledTime!),
            arrivalTime: train.destinationScheduledTime!,
            arrivalDelay: (train.destinationActualTime ?? train.destinationScheduledTime!).timeIntervalSince(train.destinationScheduledTime!),
            statusPlatform: "",
            statusMessage: statusMessage(trainCategory: train.trainCategory, departureStation: train.departureStation!.stationName, destinationStation: train.destinationStation!.stationName),
            progress: tripProgress(departure: train.departureActualTime ?? train.departureScheduledTime!, arrival: train.destinationActualTime ?? train.destinationScheduledTime!)
        )
        
        do {
            liveActivity = try Activity.request(attributes: attributes, content: ActivityContent(state: initialState, staleDate: nil))
        } catch {
            print("Error starting live activity: \(error)")
        }
    }
    
    func updateLiveActivity() {
        Task {
            do {
                let train = try await railisService.fetchUpdatedTrainDetails(id: trainId)
                
                let updatedState = LiveTrackingAttributes.ContentState(
                    departureTime: train.departureScheduledTime!,
                    departureDelay: (train.departureActualTime ?? train.departureScheduledTime!).timeIntervalSince(train.departureScheduledTime!),
                    arrivalTime: train.destinationScheduledTime!,
                    arrivalDelay: (train.destinationActualTime ?? train.destinationScheduledTime!).timeIntervalSince(train.destinationScheduledTime!),
                    statusPlatform: "",
                    statusMessage: statusMessage(trainCategory: train.trainCategory, departureStation: train.departureStation!.stationName, destinationStation: train.destinationStation!.stationName),
                    progress: tripProgress(departure: train.departureActualTime ?? train.departureScheduledTime!, arrival: train.destinationActualTime ?? train.destinationScheduledTime!)
                )
                print(updatedState)
                await liveActivity?.update(using: updatedState)
            }
        }
    }
}
