
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import axios from "axios";
import { URL } from "url";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // History API
  app.get(api.history.list.path, async (req, res) => {
    const history = await storage.getHistory();
    res.json(history);
  });

  app.post(api.history.create.path, async (req, res) => {
    try {
      const input = api.history.create.input.parse(req.body);
      const item = await storage.createHistory(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.history.clear.path, async (req, res) => {
    await storage.clearHistory();
    res.status(204).end();
  });

  // Proxy API
  app.get('/api/proxy/manifest', async (req, res) => {
    const { url, referrer } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).send("Missing url parameter");
    }

    try {
      const response = await axios.get(url, {
        headers: {
          'Referer': referrer as string || '',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        responseType: 'text'
      });

      let manifest = response.data;
      const baseUrl = new URL(url);
      const basePath = baseUrl.href.substring(0, baseUrl.href.lastIndexOf('/') + 1);

      // Rewrite URLs in the manifest
      // HLS manifests have lines that are URIs (TS segments or other m3u8s)
      // We need to find lines that are not comments (#) and rewrite them
      
      const lines = manifest.split('\n');
      const rewrittenLines = lines.map((line: string) => {
        if (line.trim() === '' || line.startsWith('#')) {
          return line;
        }

        // It's a URL (segment or playlist)
        let absoluteUrl: string;
        if (line.startsWith('http')) {
          absoluteUrl = line.trim();
        } else {
          absoluteUrl = new URL(line.trim(), basePath).href;
        }

        // Check if it's a playlist or a segment
        // If it ends in m3u8, we proxy via /manifest
        // If it's a segment (ts, m4s, etc) or key, we proxy via /segment
        const isPlaylist = absoluteUrl.includes('.m3u8');
        const proxyPath = isPlaylist ? '/api/proxy/manifest' : '/api/proxy/segment';
        
        const encodedUrl = encodeURIComponent(absoluteUrl);
        const encodedReferrer = encodeURIComponent((referrer as string) || '');
        
        return `${proxyPath}?url=${encodedUrl}&referrer=${encodedReferrer}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(rewrittenLines.join('\n'));

    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).send('Failed to fetch manifest');
    }
  });

  app.get('/api/proxy/segment', async (req, res) => {
    const { url, referrer } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).send("Missing url parameter");
    }

    try {
      const response = await axios.get(url, {
        headers: {
          'Referer': referrer as string || '',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        responseType: 'stream'
      });

      // Forward headers
      const contentType = response.headers['content-type'];
      if (contentType) res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');

      response.data.pipe(res);
    } catch (error) {
      console.error('Segment proxy error:', error);
      res.status(500).send('Failed to fetch segment');
    }
  });

  return httpServer;
}
