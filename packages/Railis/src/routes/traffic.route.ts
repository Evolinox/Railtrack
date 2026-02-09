import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/trains', async (req, res) => {
    try {
        const trains = await prisma.train.findMany({
            orderBy: { timestamp: 'desc' },
            include: {
                departureStation: true,
                destinationStation: true,
                stops: { include: { station: true } }
            },
        });

        res.json(trains);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/trains/locations', async (req, res) => {
    try {
        const trains = await prisma.train.findMany({
            orderBy: { timestamp: 'desc' },
            include: {
                departureStation: true,
                destinationStation: true,
            },
        });

        res.json(trains);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/trains/:id', async (req, res) => {
    const trainId = Number(req.params.id)

    if (isNaN(trainId)) {
        return res.status(400).json({ error: 'Invalid train ID' })
    }

    try {
        const train = await prisma.train.findUnique({
            where: { id: trainId },
            include: {
                departureStation: true,
                destinationStation: true,
                stops: { include: { station: true } }
            },
        })

        if (!train) {
            return res.status(404).json({ error: 'Train not found' })
        }

        res.json(train)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
