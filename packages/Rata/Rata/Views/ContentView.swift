//
//  ContentView.swift
//  Rata
//
//  Created by Pascal Jedicke on 22.09.25.
//

import SwiftUI
import MapKit

struct ContentView: View {
    @Environment(ModelData.self) var modelData
    
    private var isSheetPresented: Binding<Bool> {
        Binding {
            modelData.showLayerSheet || modelData.showSettingsSheet || modelData.selectedTrain != nil
        } set: { newValue in
            if !newValue {
                modelData.showLayerSheet = false
                modelData.showSettingsSheet = false
                modelData.selectedTrain = nil
            }
        }
    }
    
    let locationManager = CLLocationManager()
    
    var body: some View {
        @Bindable var modelData = modelData
        ZStack {
            MapView()
            VStack {
                Rectangle()
                    .fill(.ultraThinMaterial) // blur effect
                    .frame(height: 50)
                    .mask(
                        LinearGradient(
                            gradient: Gradient(stops: [
                                .init(color: .black, location: 0),
                                .init(color: .black.opacity(0), location: 1)
                            ]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .edgesIgnoringSafeArea(.top)
                Spacer()
            }
            VStack {
                Button {
                    modelData.showLayerSheet.toggle()
                    modelData.hapticFeedback.impactOccurred()
                } label: {
                    Image(systemName: "square.2.layers.3d.top.filled")
                        .font(.system(size: 20))
                        .frame(width: 50, height: 50)
                }
                .buttonStyle(.plain)
                
                Button {
                    modelData.position = .userLocation(fallback: .automatic)
                    modelData.isCenteredOnUser.toggle()
                    modelData.hapticFeedback.impactOccurred()
                } label: {
                    Image(systemName: modelData.isCenteredOnUser ? "location.fill" : "location")
                        .font(.system(size: 20))
                        .frame(width: 50, height: 50)
                }
                .buttonStyle(.plain)
            }
            .glassEffect(.regular.interactive(), in: Capsule())
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
            .padding()
        }
        .sheet(isPresented: .constant(true)) {
            SheetView()
                .presentationDetents([.height(70), .height(350), .large], selection: $modelData.selectedDetent)
                .interactiveDismissDisabled()
                .presentationBackgroundInteraction(.enabled)
                .sheet(isPresented: isSheetPresented) {
                    if (modelData.showLayerSheet) {
                        LayersView()
                            .presentationDetents([.height(350)])
                    }
                    if (modelData.showSettingsSheet) {
                        SettingsView()
                            .presentationDetents([.large])
                    }
                    if (modelData.selectedTrain != nil) {
                        TrainView()
                            .presentationDetents([.height(350), .large])
                            .presentationBackgroundInteraction(.enabled)
                            .ignoresSafeArea(.container, edges: .bottom)
                    }
                }
        }
    }
}

#Preview {
    @Previewable @State var modelData = ModelData()
    ContentView()
        .environment(modelData)
}
