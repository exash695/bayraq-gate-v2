import express from 'express';
export const statusRouter = express.Router();

statusRouter.get('/api/storage/status', (req, res) => {
    const isR2Configured = Boolean(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
    const hasDummyKey = (process.env.R2_ACCESS_KEY_ID || "").includes("dummy") || (process.env.R2_PUBLIC_URL || "").includes("dummy");
    
    res.json({
        provider: isR2Configured && !hasDummyKey ? "r2" : "local",
        configured: isR2Configured,
        reachable: false, // We don't do a live check here to keep it fast
        source: hasDummyKey ? "fallback (AI Studio dummy injection)" : "server-env",
        bucketConfigured: Boolean(process.env.R2_BUCKET_NAME),
        endpointConfigured: Boolean(process.env.R2_ENDPOINT),
        accessKeyIdLength: process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.length : 0,
        hasDummyKey: hasDummyKey,
        lastError: isR2Configured && hasDummyKey ? "Server environment contains dummy/fallback keys injected by the platform. The real secrets from AI Studio have not synced to this runtime." : null
    });
});
