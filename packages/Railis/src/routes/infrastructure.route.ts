import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/stations', async (req, res) => {
    try {
        const stations = await prisma.station.findMany({
            orderBy: { id: 'asc' },
        });

        res.json(stations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/track-works', async (req, res) => {
    try {
        const disruptions = await prisma.trafficRestriction.findMany({
            orderBy: { id: 'asc' },
        });

        res.json(disruptions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router
