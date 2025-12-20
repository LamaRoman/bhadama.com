// middleware/cacheMiddleware.js
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export function cacheMiddleware(duration = 300) {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Cache miss - pass to controller
      const originalJson = res.json;
      res.json = function(data) {
        redis.setex(key, duration, JSON.stringify(data));
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache error:", error);
      next(); // Continue without cache on error
    }
  };
}

// Usage in routes:
router.get('/listings/:id', cacheMiddleware(60), listingController.getById);