/**
 * digitraffic.service.ts
 *
 * Fetches and updates trains from the Finnish rail network (Digitraffic)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const serviceName = "digitraffic.service.ts";
const uicCode = 10;

const trainDetailsNoData = {
    operatorCode: "default",
    operatorName: "Unknown",
    trainType: "",
    trainCategory: "Unknown",
    commuterLine: "",
};

/**
 * Map operator codes to human-readable names
 */
function operatorName(code: string): string {
    const map: Record<string, string> = {
        default: "Unknown",
        vr: "VR-Yhtymä Oyj",
        "vr-track": "VR-Yhtymä Oyj",
        destia: "Destia Oy",
        ferfi: "Fenniarail Oy",
        kreate: "Kreate Oy",
        maanrakennus_juhanisuorsa: "Suorsa Group Oy",
        operail: "North Rail Oy",
        sundstroms: "Sundström Infra Ab Oy",
        winco: "GRK Rail Oy",
        "sweco-ir": "Sweco Finland Oy",
        ar: "ArcticRail Oy",
        aurora: "Aurora Rail Oy",
        RP: "RP Logistics Oy",
        pmry: "Porvoon Museorautatie ry",
    };
    return map[code.trim().toLowerCase()] ?? code;
}

/**
 * Fetch all stations and store in the database
 */
async function initializeStations() {
    try {
        const response = await fetch("https://rata.digitraffic.fi/api/v1/metadata/stations");
        if (!response.ok) throw new Error(`Failed to fetch stations: ${response.status}`);
        const stations = await response.json();

        if (!Array.isArray(stations)) throw new Error("Invalid stations data");

        for (const s of stations) {
            if (!s.stationShortCode) continue;
            const stationCode = s.stationShortCode.toUpperCase();

            await prisma.station.upsert({
                where: { stationCode },
                update: {
                    stationName: s.stationName,
                    latitude: s.latitude ?? 0,
                    longitude: s.longitude ?? 0,
                },
                create: {
                    stationCode,
                    stationName: s.stationName,
                    latitude: s.latitude ?? 0,
                    longitude: s.longitude ?? 0,
                },
            });
        }

        console.log(`(${serviceName}) - Initialized ${stations.length} stations`);
    } catch (error) {
        console.error(`(${serviceName}) - Error initializing stations:`, error);
    }
}

/**
 * Ensure a station exists, returns {id} for linking
 */
async function upsertStation(shortCode: string) {
    if (!shortCode) return null;
    const stationCode = shortCode.toUpperCase();
    let station = await prisma.station.findUnique({ where: { stationCode } });
    if (!station) {
        station = await prisma.station.create({
            data: { stationCode, stationName: stationCode, latitude: 0, longitude: 0 },
        });
    }
    return { id: station.id };
}

/**
 * Fetch latest train locations
 */
async function fetchTrainLocations() {
    try {
        const response = await fetch("https://rata.digitraffic.fi/api/v1/train-locations/latest/");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`(${serviceName}) - Error fetching train locations:`, error);
        return [];
    }
}

/**
 * Fetch full train data (details + stops)
 */
async function fetchTrainData(trainNumber: number) {
    try {
        const response = await fetch(`https://rata.digitraffic.fi/api/v1/trains/latest/${trainNumber}`);
        if (!response.ok) throw new Error(`HTTP error fetching train ${trainNumber}: ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return { details: trainDetailsNoData, stops: [], departure: null, destination: null };

        const train = data[0];

        const details = {
            operatorCode: train.operatorShortCode,
            operatorName: operatorName(train.operatorShortCode),
            trainType: train.trainType + " ",
            trainCategory: train.trainCategory,
            commuterLine: train.commuterLineID ?? "",
        };

        const rows = train.timeTableRows ?? [];
        const stops = rows.map((row: any, index: number) => ({
            stationShortCode: row.stationShortCode,
            countryCode: row.countryCode,
            type: row.type,
            commercialStop: row.commercialStop ?? false,
            trainStopping: row.trainStopping ?? false,
            cancelled: row.cancelled ?? false,
            scheduledTime: row.scheduledTime ? new Date(row.scheduledTime) : null,
            actualTime: row.actualTime ? new Date(row.actualTime) : null,
            differenceInMinutes: row.differenceInMinutes ?? null,
            commercialTrack: row.commercialTrack ?? null,
            stopOrder: index + 1,
        }));

        const commercialStops = stops.filter(s => s.commercialStop && s.trainStopping);
        const departure = commercialStops.find(s => s.type === "DEPARTURE") ?? null;
        const destination = [...commercialStops].reverse().find(s => s.type === "ARRIVAL") ?? null;

        return { details, stops, departure, destination };
    } catch (error) {
        console.error(`(${serviceName}) - Error fetching train data for ${trainNumber}:`, error);
        return { details: trainDetailsNoData, stops: [], departure: null, destination: null };
    }
}

/**
 * Update or insert trains and stops into the database
 */
async function updateDataBase() {
    const trainData = await fetchTrainLocations();
    const currentTrainIds: number[] = trainData.map(train => Number(`${uicCode}${train.trainNumber}`));

    for (const train of trainData) {
        const [longitude, latitude] = train.location.coordinates;
        const trainId = Number(`${uicCode}${train.trainNumber}`);

        try {
            const existingTrain = await prisma.train.findUnique({ where: { id: trainId } });

            if (!existingTrain) {
                const { details, stops, departure, destination } = await fetchTrainData(train.trainNumber);

                const departureStation = departure ? await upsertStation(departure.stationShortCode) : null;
                const destinationStation = destination ? await upsertStation(destination.stationShortCode) : null;

                // Cache station IDs for stops
                const stationCache: Record<string, number> = {};
                for (const stop of stops) {
                    const code = stop.stationShortCode.toUpperCase();
                    if (!stationCache[code]) {
                        const st = await upsertStation(code);
                        if (st) stationCache[code] = st.id;
                    }
                }

                // Create train with stops
                await prisma.train.create({
                    data: {
                        id: trainId,
                        countryCode: "FI",
                        trainName: `${details.trainType}${train.trainNumber}`,
                        trainOperator: details.operatorName,
                        trainOperatorCode: details.operatorCode,
                        trainCategory: details.trainCategory,
                        commuterLine: details.commuterLine,
                        latitude,
                        longitude,
                        speed: train.speed,
                        timestamp: new Date(train.timestamp),
                        dataSource: "rata.digitraffic.fi",
                        departureStationId: departureStation?.id ?? null,
                        destinationStationId: destinationStation?.id ?? null,
                        departureScheduledTime: departure?.scheduledTime ?? null,
                        departureActualTime: departure?.actualTime ?? null,
                        destinationScheduledTime: destination?.scheduledTime ?? null,
                        destinationActualTime: destination?.actualTime ?? null,
                        stops: {
                            create: stops.map(stop => ({
                                station: { connect: { id: stationCache[stop.stationShortCode.toUpperCase()] } },
                                type: stop.type,
                                commercialStop: stop.commercialStop,
                                trainStopping: stop.trainStopping,
                                cancelled: stop.cancelled,
                                scheduledTime: stop.scheduledTime,
                                actualTime: stop.actualTime,
                                differenceInMinutes: stop.differenceInMinutes,
                                commercialTrack: stop.commercialTrack,
                                stopOrder: stop.stopOrder,
                            })),
                        },
                    },
                });
            } else {
                // Update live position only
                await prisma.train.update({
                    where: { id: trainId },
                    data: {
                        latitude,
                        longitude,
                        speed: train.speed,
                        timestamp: new Date(train.timestamp),
                    },
                });
            }
        } catch (error) {
            console.error(`(${serviceName}) - Failed to upsert train ${train.trainNumber}:`, error);
        }
    }

    // Delete outdated trains
    try {
        await prisma.train.deleteMany({ where: { id: { notIn: currentTrainIds } } });
    } catch (error) {
        console.error(`(${serviceName}) - Error deleting outdated trains:`, error);
    }

    console.log(`(${serviceName}) - Updated ${trainData.length} trains`);
}

async function fetchTrafficRestrictions() {
    try {
        const response = await fetch("https://rata.digitraffic.fi/api/v1/trackwork-notifications.json?state=ACTIVE");
        if (!response.ok) throw new Error(`Failed to fetch track works: ${response.status}`);
        const trackWorks = await response.json();

        if (!Array.isArray(trackWorks)) throw new Error("Invalid response data");

        for (const tw of trackWorks) {
            const existing = await prisma.trafficRestriction.findFirst({
                where: {
                    name: tw.id,
                    description: tw.organization,
                    latitude: tw.location[1],
                    longitude: tw.location[0],
                }
            });

            if (!existing) {
                await prisma.trafficRestriction.create({
                    data: {
                        name: tw.id,
                        description: tw.organization,
                        latitude: tw.location[1],
                        longitude: tw.location[0],
                    }
                });
            }
        }
        console.log(`(${serviceName}) - Initialized ${trackWorks.length} track works`);
    } catch (error) {
        console.error(`(${serviceName}) - Error initializing track works:`, error);
    }
}

/**
 * Scheduler: runs every 15 seconds
 */
export function digitrafficUpdateScheduler() {
    (async () => {
        await initializeStations();
        await fetchTrafficRestrictions();
        const run = async () => {
            await updateDataBase();
            setTimeout(run, 15_000);
        };
        run();
        console.log(`${serviceName} registered!`);
    })();
}