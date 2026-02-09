//
//  TrainServicePoint.swift
//  Rata
//
//  Created by Pascal Jedicke on 13.10.25.
//

import SwiftUI

struct TrainServicePoint: View {
    let servicePoint: StationStopInfo
    let isDepartureStation: Bool
    let isDestinationStation: Bool
    
    var body: some View {
        HStack{
            if isDepartureStation || isDestinationStation {
                if let time = isDepartureStation ? servicePoint.departureTime : servicePoint.arrivalTime {
                    Text(time.formatted(date: .omitted, time: .shortened))
                        .font(.title2)
                        .bold()
                        .frame(width: 65)
                }
            } else {
                VStack(alignment: .leading, spacing: 2) {
                    if let arrival = servicePoint.arrivalTime {
                        Text(arrival.formatted(date: .omitted, time: .shortened))
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .frame(width: 65)
                    }
                    if let departure = servicePoint.departureTime {
                        Text(departure.formatted(date: .omitted, time: .shortened))
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .frame(width: 65)
                    }
                }
            }
            Text(servicePoint.station.stationName)
            Spacer()
            Text(servicePoint.track ?? "")
        }
        .padding(.bottom, 4)
    }
}
