import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }
      const info = await ytdl.getInfo(url);
      res.json({
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        author: info.videoDetails.author.name
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to fetch info" });
    }
  });

  app.get("/api/convert", async (req, res) => {
    const url = req.query.url as string;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).send("Invalid YouTube URL");
    }

    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // sanitize filename

      res.header("Content-Disposition", `attachment; filename="${title || 'audio'}.mp3"`);
      res.header("Content-Type", "audio/mpeg");

      const stream = ytdl(url, { quality: "highestaudio" });

      ffmpeg(stream)
        .audioBitrate(128)
        .format("mp3")
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          if (!res.headersSent) res.status(500).send("Conversion error");
        })
        .pipe(res, { end: true });
    } catch (error) {
      console.error(error);
      if (!res.headersSent) res.status(500).send("Failed to process video");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
