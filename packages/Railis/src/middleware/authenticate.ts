export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    // Check if header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Check your static key or verify JWT here
    const BEARER_KEY = process.env.BEARER_KEY; // Set in .env

    if (token !== BEARER_KEY) {
        return res.status(403).json({ error: 'Invalid token' });
    }

    // If valid, continue
    next();
}
