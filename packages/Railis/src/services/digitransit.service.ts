import mqtt from "mqtt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const serviceName = "digitransit.service.ts";

const MQTT_BROKER_URL = "mqtts://mqtt.hsl.fi:8883";
const MQTT_TOPICS = [
    "/hfp/v2/journey/ongoing/vp/tram/#",
    "/hfp/v2/journey/ongoing/vp/metro/#",
];

const DEFAULT_TRAIN_DETAILS = {
    countryCode: "FI",
    trainOperator: "hsl",
    trainOperatorCode: "hsl",
    commuterLine: "",
};

const operatorMap: Record<string, string> = {
    "40": "HKL-Raitioliikenne",
    "50": "HKL-Metroliikenne",
};

const options: mqtt.IClientOptions = {
    protocol: "mqtts",
    port: 8883,
    clientId: `digitransit-service-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 2000,
};

// In-memory map to track last update time of each train
const trainLastSeen = new Map<number, number>();
const TRAIN_EXPIRY_MS = 30_000; // 30 seconds

async function handleVehicleMessage(message: string, category: "Tram" | "Metro") {
    try {
        const data = JSON.parse(message);
        if (!data?.VP) return;
        const vp = data.VP;

        const trainId = Number(vp.veh || vp.trainNumber || vp.oper || Date.now());
        const latitude = vp.lat ?? 0;
        const longitude = vp.long ?? 0;
        const speed = vp.spd ? Math.round(vp.spd) : 0;
        const timestamp = vp.tst ? new Date(vp.tst) : new Date();

        const trainName = vp.desi || `${category} ${vp.line || ""}`;
        const commuterLine = vp.line ? String(vp.line) : "";

        const operatorName = vp.oper ? operatorMap[String(vp.oper)] ?? DEFAULT_TRAIN_DETAILS.trainOperator : DEFAULT_TRAIN_DETAILS.trainOperator;
        const operatorCode = category === "Metro" ? `hsl_${trainName}` : "hsl";

        // Update last seen timestamp
        trainLastSeen.set(trainId, Date.now());

        await prisma.train.upsert({
            where: { id: trainId },
            update: {
                latitude,
                longitude,
                speed,
                timestamp,
            },
            create: {
                id: trainId,
                countryCode: DEFAULT_TRAIN_DETAILS.countryCode,
                trainName: `${category} ${trainName}`,
                trainOperator: operatorName,
                trainOperatorCode: operatorCode,
                trainCategory: category,
                commuterLine,
                latitude,
                longitude,
                speed,
                timestamp,
            },
        });

        console.log(`(${serviceName}) Updated ${category} ${trainName} (${trainId})`);
    } catch (error) {
        console.error(`(${serviceName}) - Error processing ${category} message:`, error);
    }
}

/**
 * Periodically removes trains that haven't been updated for 30 seconds
 */
async function cleanupStaleTrains() {
    const now = Date.now();
    for (const [trainId, lastSeen] of trainLastSeen.entries()) {
        if (now - lastSeen > TRAIN_EXPIRY_MS) {
            try {
                await prisma.train.delete({ where: { id: trainId } });
                trainLastSeen.delete(trainId);
                console.log(`(${serviceName}) Removed stale train ${trainId}`);
            } catch (error) {
                console.error(`(${serviceName}) - Error removing train ${trainId}:`, error);
            }
        }
    }
}

export function digitransitMqttScheduler() {
    console.log(`(${serviceName}) Connecting to HSL MQTT broker...`);
    const client = mqtt.connect(MQTT_BROKER_URL, options);

    client.on("connect", () => {
        console.log(`(${serviceName}) Connected. Subscribing to topics: ${MQTT_TOPICS.join(", ")}`);
        MQTT_TOPICS.forEach((topic) => {
            client.subscribe(topic, (err) => {
                if (err) console.error(`(${serviceName}) - Subscription error for ${topic}:`, err);
            });
        });
    });

    client.on("message", async (topic, payload) => {
        const category = topic.includes("/metro/") ? "Metro" : "Tram";
        await handleVehicleMessage(payload.toString(), category);
    });

    client.on("error", (err) => console.error(`(${serviceName}) - MQTT error:`, err));
    client.on("close", () => console.log(`(${serviceName}) - MQTT connection closed. Reconnecting...`));

    // Start cleanup interval
    setInterval(cleanupStaleTrains, 5000); // check every 5 seconds
}
