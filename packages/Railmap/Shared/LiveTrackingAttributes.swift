//
//  LiveTrackingAttributes.swift
//  Rata
//
//  Created by Pascal Jedicke on 29.09.25.
//

import ActivityKit
import Foundation

struct LiveTrackingAttributes: ActivityAttributes {
    // Date to be updated ("Live")
    public struct ContentState: Codable, Hashable {
        var departureTime: Date
        var departureDelay: TimeInterval
        var arrivalTime: Date
        var arrivalDelay: TimeInterval
        var statusPlatform: String
        var statusMessage: String
        var progress: Double
    }
    // Date to be set at start
    var trainName: String
    var trainOperator: String
    var trainOperatorCode: String
    var departureStationCode: String
    var arrivalStationCode: String
}
