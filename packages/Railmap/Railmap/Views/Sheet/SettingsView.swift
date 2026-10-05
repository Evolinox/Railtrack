//
//  SettingsView.swift
//  Rata
//
//  Created by Pascal Jedicke on 04.10.25.
//

import SwiftUI

struct SettingsView: View {
    @Environment(ModelData.self) var modelData
    
    var body: some View {
        VStack {
            ZStack {
                Text("Settings")
                    .font(.system(size: 18))
                    .bold()
                    .frame(maxWidth: .infinity, alignment: .center)
                HStack {
                    Spacer()
                    Button {
                        modelData.showSettingsSheet.toggle()
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
            Spacer()
        }
        .padding()
    }
}

#Preview {
    @Previewable @State var modelData = ModelData()
    SettingsView()
        .environment(modelData)
}
