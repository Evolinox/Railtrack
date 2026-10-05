//
//  RailwayMap.swift
//  Rata
//
//  Created by Pascal Jedicke on 04.10.25.
//

import SwiftUI
import MapKit

// MARK: - MKMapView Wrapper with OpenRailwayMap Overlay
struct RailwayMapWrapper: UIViewRepresentable {
    var modelData: ModelData
    @Binding var position: MapCameraPosition
    @Binding var isCenteredOnUser: Bool
    @Binding var selectedDetent: PresentationDetent
    @Binding var mapType: RailwayTileOverlay.MapType
    @Binding var isLiveTrainsEnabled: Bool
    @Binding var selectedTrain: Train?
    
    var trains: [Train]
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView(frame: .zero)
        mapView.showsUserLocation = true
        mapView.mapType = .standard
        mapView.isPitchEnabled = false
        mapView.isRotateEnabled = false
        mapView.pointOfInterestFilter = .excludingAll
        mapView.delegate = context.coordinator
        
        // OpenRailwayMap overlay
        let overlay = RailwayTileOverlay(mapType: mapType)
        mapView.addOverlay(overlay, level: .aboveRoads)
        context.coordinator.currentOverlay = overlay
        
        modelData.mapView = mapView
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        let bottomInset: CGFloat = selectedDetent == .height(350) || selectedTrain != nil ? 345 : 50
        mapView.layoutMargins = UIEdgeInsets(top: 0, left: 0, bottom: bottomInset, right: 0)

        // Only center on user if requested
        if isCenteredOnUser, let userLocation = mapView.userLocation.location {
            let region = MKCoordinateRegion(
                center: userLocation.coordinate,
                latitudinalMeters: 1000,
                longitudinalMeters: 1000
            )
            mapView.setRegion(region, animated: true)
        }
        
        if let train = selectedTrain {
            let coordinate = CLLocationCoordinate2D(latitude: train.latitude, longitude: train.longitude)
            let region = MKCoordinateRegion(
                center: coordinate,
                latitudinalMeters: 1000,
                longitudinalMeters: 1000
            )
            mapView.setRegion(region, animated: true)
        }
        
        // Update map overlay if type changed
        if let currentOverlay = context.coordinator.currentOverlay,
           currentOverlay.mapType != mapType {
            mapView.removeOverlay(currentOverlay)
            let newOverlay = RailwayTileOverlay(mapType: mapType)
            mapView.addOverlay(newOverlay, level: .aboveRoads)
            context.coordinator.currentOverlay = newOverlay
        }
        
        // Handle live trains
        context.coordinator.updateTrainAnnotations(in: mapView, trains: trains, visible: isLiveTrainsEnabled)
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(selectedTrainEntry: $selectedTrain)
    }
    
    class Coordinator: NSObject, MKMapViewDelegate {
        var currentOverlay: RailwayTileOverlay?
        private var currentTrainAnnotations: [Int: MKPointAnnotation] = [:]
        private var currentTrains: [Int: Train] = [:]
        private var selectedTrainEntry: Binding<Train?>
        
        init(selectedTrainEntry: Binding<Train?>) {
            self.selectedTrainEntry = selectedTrainEntry
        }
        
        // MARK: Overlay Renderer
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let tileOverlay = overlay as? MKTileOverlay {
                return MKTileOverlayRenderer(tileOverlay: tileOverlay)
            }
            return MKOverlayRenderer()
        }
        
        // MARK: Train Annotation
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard !(annotation is MKUserLocation) else { return nil }
            
            let identifier = "TrainAnnotation"
            var view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)
            
            if view == nil {
                view = MKAnnotationView(annotation: annotation, reuseIdentifier: identifier)
                view?.canShowCallout = false
            } else {
                view?.annotation = annotation
            }
            
            if let trainAnnotation = annotation as? TrainAnnotation {
                let baseImage: UIImage?
                if (trainAnnotation.commuterLine != "") {
                    baseImage = UIImage(named: "hsl_" + trainAnnotation.commuterLine) ?? UIImage(named: "hsl_Unknown")
                } else {
                    baseImage = UIImage(named: trainAnnotation.operatorCode) ?? UIImage(named: "default")
                }
                if let image = baseImage {
                    let targetSize = CGSize(width: 30, height: 30)
                    let renderer = UIGraphicsImageRenderer(size: targetSize, format: UIGraphicsImageRendererFormat.default())

                    let scaledImage = renderer.image { context in
                        // Create circular clipping path (optional)
                        let circlePath = UIBezierPath(ovalIn: CGRect(origin: .zero, size: targetSize))
                        circlePath.addClip()

                        // Compute proportional scaling
                        let aspect = min(targetSize.width / image.size.width,
                                         targetSize.height / image.size.height)
                        let newSize = CGSize(width: image.size.width * aspect,
                                             height: image.size.height * aspect)
                        let x = (targetSize.width - newSize.width) / 2
                        let y = (targetSize.height - newSize.height) / 2

                        // Draw your operator logo into the transparent context
                        image.draw(in: CGRect(origin: CGPoint(x: x, y: y), size: newSize))
                    }

                    view?.image = scaledImage.withRenderingMode(.alwaysOriginal)
                    view?.centerOffset = CGPoint(x: 0, y: 0) // Um die Node über der Koordinate zu haben -> -targetSize.height / 2
                }

            }
            
            return view
        }
        
        func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
            guard let trainAnnotation = view.annotation as? TrainAnnotation else { return }
            if let train = currentTrains[trainAnnotation.id] {
                selectedTrainEntry.wrappedValue = train
            }
        }
        
        func mapView(_ mapView: MKMapView, didDeselect view: MKAnnotationView) {
            selectedTrainEntry.wrappedValue = nil
        }
        
        func updateTrainAnnotations(in mapView: MKMapView, trains: [Train], visible: Bool) {
            currentTrains = Dictionary(uniqueKeysWithValues: trains.map { ($0.id, $0) })
            // if LiveTrains should be hidden, remove all annotations
            if !visible {
                mapView.removeAnnotations(Array(currentTrainAnnotations.values))
                currentTrainAnnotations.removeAll()
                return
            }
            // remove annotations for trains, that are gone
            let existingTrainIds = Set(currentTrainAnnotations.keys)
            let newTrainIds = Set(trains.map { $0.id })
            let removedTrainIds = existingTrainIds.subtracting(newTrainIds)
            for id in removedTrainIds {
                if let annotation = currentTrainAnnotations[id] {
                    mapView.removeAnnotation(annotation)
                    currentTrainAnnotations.removeValue(forKey: id)
                }
            }
            // update or add new annotation for trains
            for train in trains {
                if let annotation = currentTrainAnnotations[train.id] {
                    annotation.coordinate = CLLocationCoordinate2D(latitude: train.latitude, longitude: train.longitude)
                } else {
                    let annotation = TrainAnnotation(id: train.id, title: train.trainName, coordinate: CLLocationCoordinate2D(latitude: train.latitude, longitude: train.longitude), operatorCode: train.trainOperatorCode, commuterLine: train.commuterLine)
                    mapView.addAnnotation(annotation)
                    currentTrainAnnotations[train.id] = annotation
                }
            }
        }
    }
}

// MARK: - OpenRailwayMap Tile Overlay
class RailwayTileOverlay: MKTileOverlay {
    enum MapType: String, CaseIterable, Identifiable {
        case standard
        case maxspeed
        case electrification
        case gauge
        
        var id: String { self.rawValue }
        
        var label: String {
            switch self {
            case .standard: return "MapStandard"
            case .electrification: return "MapElectrification"
            case .gauge: return "MapGauge"
            case .maxspeed: return "MapSpeedlimit"
            }
        }
        
        var image: String {
            switch self {
            case .standard: return "MapStandard"
            case .electrification: return "MapElectrification"
            case .gauge: return "MapGauge"
            case .maxspeed: return "MapSpeedlimit"
            }
        }
    }
    
    var mapType: MapType
    
    init(mapType: MapType = .electrification) {
        self.mapType = mapType
        let template = "https://{s}.tiles.openrailwaymap.org/\(mapType.rawValue)/{z}/{x}/{y}.png"
        super.init(urlTemplate: template)
        self.canReplaceMapContent = false
        self.tileSize = CGSize(width: 256, height: 256)
        self.minimumZ = 0
        self.maximumZ = 19
    }
    
    override func url(forTilePath path: MKTileOverlayPath) -> URL {
        let subdomains = ["a", "b", "c"]
        let s = subdomains[(path.x + path.y) % subdomains.count]
        let urlString = "https://\(s).tiles.openrailwaymap.org/\(mapType.rawValue)/\(path.z)/\(path.x)/\(path.y).png"
        return URL(string: urlString)!
    }
}

// MARK: Custom Train Annotation
class TrainAnnotation: MKPointAnnotation {
    let id: Int
    let operatorCode: String
    let commuterLine: String
    
    init(id: Int, title: String, coordinate: CLLocationCoordinate2D, operatorCode: String, commuterLine: String) {
        self.id = id
        self.operatorCode = operatorCode
        self.commuterLine = commuterLine
        super.init()
        self.title = title
        self.coordinate = coordinate
    }
}
