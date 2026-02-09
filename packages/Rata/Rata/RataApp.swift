//
//  RataApp.swift
//  Rata
//
//  Created by Pascal Jedicke on 22.09.25.
//

import SwiftUI

@main
struct RataApp: App {
    @State private var modelData = ModelData()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(modelData)
        }
    }
}
