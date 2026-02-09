import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import {authenticateToken} from "./middleware/authenticate";
import { digitrafficUpdateScheduler } from "./services/digitraffic.service";
import { digitransitMqttScheduler } from "./services/digitransit.service";
import trafficRoutes from './routes/traffic.route';
import infrastructureRoutes from './routes/infrastructure.route';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use(cors({
  origin: "http://localhost:1420", // Vue.js/Tauri App
}));

app.use('/v1/traffic/', authenticateToken, trafficRoutes);
app.use('/v1/infrastructure/', authenticateToken, infrastructureRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    digitrafficUpdateScheduler();
})