//
//  SheetView.swift
//  Rata
//
//  Created by Pascal Jedicke on 23.09.25.
//

import SwiftUI

struct SheetView: View {
    @Environment(ModelData.self) var modelData
    @Namespace private var sheetView
    
    var body: some View {
        @Bindable var modelData = modelData
        GeometryReader { geometry in
            let height = geometry.size.height
            GlassEffectContainer(spacing: 10.0) {
                VStack {
                    HStack {
                        HStack {
                            Image(systemName: "magnifyingglass")
                            TextField("SearchString", text: $modelData.searchString)
                        }
                        .padding(.horizontal, 10)
                        .frame(height: 40)
                        .glassEffect(.regular.interactive(), in: Capsule())
                        .glassEffectID("searchbar", in: sheetView)
                        Button {
                            modelData.hapticFeedback.impactOccurred()
                            modelData.showSettingsSheet.toggle()
                        } label: {
                            Image(systemName: "gear")
                                .scaledToFit()
                                .font(.system(size: 20))
                                .frame(width: 40, height: 40)
                        }
                        .buttonStyle(.plain)
                        .glassEffect(.regular.interactive(), in: Capsule())
                        .glassEffectID("settings", in: sheetView)
                    }
                    if height > 100 {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Favorites")
                                .font(.headline)
                                .padding(.top, 12)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                }
                            }
                            .frame(height: 80)
                        }
                        VStack(alignment: .leading, spacing: 8) {
                            Text("LastViewed")
                                .font(.headline)
                                .padding(.top, 12)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                }
                            }
                            .frame(height: 80)
                        }
                    }
                }
                .padding()
            }
        }
    }
}

#Preview {
    @Previewable @State var modelData = ModelData()
    SheetView()
        .environment(modelData)
}

