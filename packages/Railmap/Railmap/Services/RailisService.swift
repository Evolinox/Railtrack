//
//  RailisService.swift
//  Rata
//
//  Created by Pascal Jedicke on 06.10.25.
//

import Foundation

class RailisService {
    enum Config {
        static var railisBearerToken: String {
            guard let token = Bundle.main.infoDictionary?["RailisBearerToken"] as? String else {
                fatalError("Bearer token missing in Info.plist")
            }
            return token
        }
        static var railisUrlBase: String {
            guard let url = Bundle.main.infoDictionary?["RailisUrlBase"] as? String else {
                fatalError("Base URL missing in Info.plist")
            }
            return url
        }
    }
    
    func fetchLiveTrains() async throws -> [Train] {
        let url = URL(string: "\(Config.railisUrlBase)/v1/traffic/trains")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(Config.railisBearerToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode([Train].self, from: data)
    }

    
    func fetchUpdatedTrainDetails(id: Int) async throws -> Train {
        let url = URL(string: "\(Config.railisUrlBase)/v1/traffic/trains/\(id)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(Config.railisBearerToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(Train.self, from: data)
    }
}
