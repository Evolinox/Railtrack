//
//  RailisService.swift
//  Rata
//
//  Created by Pascal Jedicke on 06.10.25.
//

import Foundation

class RailisService {
    func fetchLiveTrains() async throws -> [Train] {
        let url = URL(string: "http://192.168.178.23:3000/v1/traffic/trains")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        let bearerToken = "lalilu"
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode([Train].self, from: data)
    }

    
    func fetchUpdatedTrainDetails(id: Int) async throws -> Train {
        let url = URL(string: "http://192.168.178.23:3000/v1/traffic/trains/\(id)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        let bearerToken = "lalilu"
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(Train.self, from: data)
    }
}
