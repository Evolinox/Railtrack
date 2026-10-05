//
//  ModelData.swift
//  Rata
//
//  Created by Pascal Jedicke on 04.10.25.
//

/*
 Abstract:
 A class the app uses to store and manage model data.
 */

import Foundation
import SwiftUI
import MapKit
import CoreLocation

@Observable @MainActor
class ModelData {
    var searchString: String = ""
    
    // Core App Variables
    var showLayerSheet = false
    var showSettingsSheet = false
    var enableLiveTrains = true
    var enableConstruction = false
    var position: MapCameraPosition = .userLocation(fallback: .automatic)
    var isCenteredOnUser = false
    var selectedDetent: PresentationDetent = .height(350)
    var selectedMapType: RailwayTileOverlay.MapType = .standard
    var selectedTrain: Train?
    weak var mapView: MKMapView?
    
    // Haptic Feedback
    let hapticFeedback = UIImpactFeedbackGenerator(style: .medium)
}
