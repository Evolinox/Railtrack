//
//  LiveTrainsViewModel.swift
//  Rata
//
//  Created by Pascal Jedicke on 06.10.25.
//

import Foundation
import Combine

@MainActor
class LiveTrainsViewModel: ObservableObject {
    @Published var trains: [Train] = []
    private let service = RailisService()
    private var timer: Timer?
    
    init() {
        Task {
            await fetchRailisTrains()
        }
        
        timer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            Task { await self?.fetchRailisTrains() }
        }
    }
    
    func fetchRailisTrains() async {
        do {
            let data = try await service.fetchLiveTrains()
            self.trains = data
            print("Fetched latest Traindata from Railis")
        } catch {
            print("Error while fetching Data from Railis! \(error)")
        }
    }
    
    deinit {
        timer?.invalidate()
        timer = nil
    }
}

struct Station: Decodable {
    let id: Int
    let stationCode: String
    let stationName: String
    let latitude: Double
    let longitude: Double
}

struct TrainStop: Decodable {
    let id: Int
    let type: String
    let commercialStop: Bool
    let trainStopping: Bool
    let cancelled: Bool
    let scheduledTime: Date?
    let actualTime: Date?
    let differenceInMinutes: Int?
    let commercialTrack: String?
    let stopOrder: Int

    let station: Station
}

struct Train: Identifiable, Decodable {
    let id: Int
    let trainName: String
    let trainOperator: String
    let trainOperatorCode: String
    let trainCategory: String
    let countryCode: String
    let commuterLine: String
    let latitude: Double
    let longitude: Double
    let speed: Double
    let timestamp: Date?
    let dataSource: String?

    let departureStation: Station?
    let destinationStation: Station?

    let departureScheduledTime: Date?
    let departureActualTime: Date?
    let destinationScheduledTime: Date?
    let destinationActualTime: Date?

    let stops: [TrainStop]
}

