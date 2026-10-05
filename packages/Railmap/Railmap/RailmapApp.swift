//
//  RailmapApp.swift
//  Railmap
//
//  Created by Pascal Jedicke on 22.09.25.
//

import SwiftUI

@main
struct RailmapApp: App {
    @State private var modelData = ModelData()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(modelData)
        }
    }
}
