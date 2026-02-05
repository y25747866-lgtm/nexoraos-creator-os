import type { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const topic = body.topic || body.title || "Test Topic";

    return res.status(200).json({
      ok: true,
      message: "🔥 API WORKING — THIS IS THE NEW CODE",
      received: body,
      topic,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server crashed" });
  }
      }
