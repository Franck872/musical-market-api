import { Pool } from "pg";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// -------------------------
// PostgreSQL
// -------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

// -------------------------
// Redis
// -------------------------
const redis = new Redis(process.env.REDIS_URL);

// -------------------------
// Config
// -------------------------
const UPDATE_INTERVAL = 60 * 1000; // 1 min

// -------------------------
// Build JSON des marchés
// -------------------------
async function buildMarketsJSON() {
  const client = await pool.connect();

  try {
    const res = await client.query(`
      SELECT 
        e.id,
        e.title,
        e.source,
        e.type,
        e.current_views,
        e.target_views,
        e.interval_upper,
        e.deadline,
        o.type AS offer_type,
        o.probability,
        o.odds,
        o.blocked
      FROM events e
      JOIN offers o ON o.event_id = e.id
      WHERE e.status='active'
      ORDER BY e.deadline ASC
    `);

    const marketsMap: Record<number, any> = {};

    for (const row of res.rows) {
      if (!marketsMap[row.id]) {
        marketsMap[row.id] = {
          id: row.id,
          title: row.title,
          source: row.source,
          type: row.type,
          views: Number(row.current_views),
          target: Number(row.target_views),
          interval_upper: Number(row.interval_upper),
          deadline: row.deadline,
          offers: [],
        };
      }

      marketsMap[row.id].offers.push({
        type: row.offer_type,
        probability: Number(row.probability),
        odds: Number(row.odds),
        blocked: row.blocked,
      });
    }

    const markets = Object.values(marketsMap);

    return {
      timestamp: Date.now(),
      active_count: markets.length,
      markets,
    };
  } finally {
    client.release();
  }
}

// -------------------------
// Mise à jour Redis
// -------------------------
async function updateRedisCache() {
  try {
    const data = await buildMarketsJSON();
    const pipeline = redis.pipeline();

    // JSON global
    pipeline.set("markets:active", JSON.stringify(data));

    // Index des marchés
    pipeline.set(
      "markets:index",
      JSON.stringify(data.markets.map((m: any) => m.id))
    );

    // JSON par marché
    for (const market of data.markets) {
      pipeline.set(`market:${market.id}`, JSON.stringify(market));
    }

    // Notification Pub/Sub pour WebSocket
    pipeline.publish(
      "markets:update",
      JSON.stringify({
        timestamp: data.timestamp,
        markets: data.markets.length,
      })
    );

    await pipeline.exec();

    console.log(`✅ Redis cache updated (${data.active_count} markets)`);
  } catch (err: any) {
    console.error("❌ Redis worker error:", err.message);
  }
}

// -------------------------
// Lancement du worker
// -------------------------
async function startWorker() {
  console.log("🟢 Redis cache worker started");

  // première mise à jour immédiate
  await updateRedisCache();

  // mise à jour toutes les minutes
  setInterval(updateRedisCache, UPDATE_INTERVAL);
}

startWorker();
