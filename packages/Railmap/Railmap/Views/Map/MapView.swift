//
//  MapView.swift
//  Rata
//
//  Created by Pascal Jedicke on 02.10.25.
//

import SwiftUI
import MapKit

struct MapView: View {
    @Environment(ModelData.self) var modelData
    @StateObject private var viewModel = LiveTrainsViewModel()
    
    let locationManager = CLLocationManager()
    
    var body: some View {
        @Bindable var modelData = modelData
        RailwayMapWrapper(modelData: modelData, position: $modelData.position, isCenteredOnUser: $modelData.isCenteredOnUser, selectedDetent: $modelData.selectedDetent, mapType: $modelData.selectedMapType, isLiveTrainsEnabled: $modelData.enableLiveTrains, selectedTrain: $modelData.selectedTrain, trains: viewModel.trains)
            .onAppear {
                locationManager.requestWhenInUseAuthorization()
            }
            .ignoresSafeArea()
            .safeAreaPadding(.bottom, 40)
    }
}

#Preview {
    @Previewable @State var modelData = ModelData()
    MapView()
        .environment(modelData)
}
