//
//  LayersView.swift
//  Rata
//
//  Created by Pascal Jedicke on 25.09.25.
//

import SwiftUI

struct LayersView: View {
    @Environment(ModelData.self) var modelData
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        @Bindable var modelData = modelData
        VStack {
            ZStack {
                Text("MapLayer")
                    .font(.system(size: 18))
                    .bold()
                    .frame(maxWidth: .infinity, alignment: .center)
                HStack {
                    Spacer()
                    Button {
                        modelData.showLayerSheet.toggle()
                        modelData.hapticFeedback.impactOccurred()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 20))
                            .foregroundColor(.primary)
                            .padding()
                    }
                    .glassEffect(.regular.interactive(), in: Capsule())
                }
            }
            HStack {
                // Button for Standard Layer
                Button {
                    modelData.selectedMapType = .standard
                    modelData.hapticFeedback.impactOccurred()
                } label: {
                    Image(colorScheme == .dark ? "MapTypeStandardDark" : "MapTypeStandard")
                        .resizable()
                        .scaledToFit()
                        .cornerRadius(22)
                        .frame(width: 80, height: 80)
                }
                .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 22))
                Spacer()
                // Button for Speed Layer
                Button {
                    modelData.selectedMapType = .maxspeed
                    modelData.hapticFeedback.impactOccurred()
                } label: {
                    Image(colorScheme == .dark ? "MapTypeSpeedDark" : "MapTypeSpeed")
                        .resizable()
                        .scaledToFit()
                        .cornerRadius(22)
                        .frame(width: 80, height: 80)
                }
                .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 22))
                Spacer()
                // Button for Voltage Layer
                Button {
                    modelData.selectedMapType = .electrification
                    modelData.hapticFeedback.impactOccurred()
                } label: {
                    Image(colorScheme == .dark ? "MapTypeElectrificationDark" : "MapTypeElectrification")
                        .resizable()
                        .scaledToFit()
                        .cornerRadius(22)
                        .frame(width: 80, height: 80)
                }
                .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 22))
                Spacer()
                // Button for Gauge Layer
                Button {
                    modelData.selectedMapType = .gauge
                    modelData.hapticFeedback.impactOccurred()
                } label: {
                    Image(colorScheme == .dark ? "MapTypeGaugeDark" : "MapTypeGauge")
                        .resizable()
                        .scaledToFit()
                        .cornerRadius(22)
                        .frame(width: 80, height: 80)
                }
                .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 22))
            }
            .padding(.horizontal)
            HStack {
                Spacer()
                Text("MapStandard")
                Spacer()
                Text("MapSpeedlimit")
                Spacer()
                Text("MapElectrification")
                Spacer()
                Text("MapGauge")
                Spacer()
            }
            .font(.caption)
            .padding(.bottom, 12)
            VStack {
                HStack {
                    Text("ToggleLiveTrains")
                    Spacer()
                    Toggle("ToggleLiveTrains", isOn: $modelData.enableLiveTrains)
                        .labelsHidden()
                }
                Divider()
                HStack {
                    Text("ToggleConstruction")
                    Spacer()
                    Toggle("ToggleConstruction", isOn: $modelData.enableConstruction)
                        .labelsHidden()
                }
            }
            .padding()
            .background(Color(.systemGray5))
            .cornerRadius(22)
            Spacer()
            Text("OpenRailwayMapCopyright")
                .font(.system(size: 10))
                .fontWeight(.light)
                .ignoresSafeArea(.all)
        }
        .padding()
    }
}

#Preview {
    @Previewable @State var modelData = ModelData()
    LayersView()
        .environment(modelData)
}
