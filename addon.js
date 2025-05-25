const { addonBuilder } = require("stremio-addon-sdk");
const { getStreamContent } = require("./m3u8parser");

// Function to parse m3u8 content and extract streams
function parseM3u8Content(m3u8Content, m3u8Url) {
  const streams = [];
  const lines = m3u8Content.split("\n");
  let hasSegments = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for master playlist stream info lines
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && !nextLine.startsWith("#")) {
        // Extract quality info from STREAM-INF line
        const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);

        if (resolutionMatch) {
          const width = resolutionMatch[1];
          const height = resolutionMatch[2];
          const quality = height;
          const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;

          // Resolve relative URLs for the playlist
          const playlistUrl = nextLine.startsWith("http")
            ? nextLine
            : new URL(nextLine, m3u8Url).href;

          streams.push({
            url: playlistUrl,
            name: `${quality}p`,
            title: `VidSRC - ${quality}p (${Math.round(bandwidth / 1000)}kbps)`,
            behaviorHints: {
              notWebReady: true,
            },
          });
        }
      }
    }
    // Check for video segments (including .html files which contain video data)
    else if (
      line.startsWith("http") &&
      (line.includes(".ts") || line.includes(".mp4") || line.includes(".html"))
    ) {
      hasSegments = true;
    }
  }

  // If this is a segment playlist (like index.m3u8), return the m3u8 URL itself
  // as Stremio can handle HLS playlists with segments directly
  if (hasSegments && streams.length === 0) {
    streams.push({
      url: m3u8Url,
      title: "VidSRC Stream",
      behaviorHints: {
        notWebReady: true,
      },
    });
  }

  // If no streams found at all, return the original m3u8 URL as fallback
  if (streams.length === 0) {
    streams.push({
      url: m3u8Url,
      title: "VidSRC Stream",
      behaviorHints: {
        notWebReady: true,
      },
    });
  }

  return streams;
}

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
  id: "community.stremsrc",
  version: "0.0.1",
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series"],
  name: "stremsrc",
  description: "A VidSRC extractor for stremio",
  idPrefixes: ["tt"],
};
const builder = new addonBuilder(manifest);

builder.defineStreamHandler(({ type, id }) => {
  let t = "movie";
  if (type == "series" || type == "tv") t = "tv";
  let i = id.split(":");
  const res = getStreamContent(i[0], t, i[1], i[2]);
  if (!res || !res.success) return Promise.resolve({ streams: [] });

  const m3u8Url = res.m3u8Url;

  // Parse m3u8 to get actual MP4 streams
  return fetch(m3u8Url)
    .then((response) => response.text())
    .then((m3u8Content) => {
      const streams = parseM3u8Content(m3u8Content, m3u8Url);

      return Promise.resolve({
        streams:
          streams.length > 0
            ? streams
            : [
                {
                  url: m3u8Url,
                  title: "VidSRC M3U8",
                  behaviorHints: {
                    notWebReady: true,
                  },
                },
              ],
      });
    })
    .catch((error) => {
      console.error("Error parsing m3u8:", error);
      // Fallback to original m3u8 URL
      return Promise.resolve({
        streams: [
          {
            url: m3u8Url,
            title: "VidSRC Stream",
            behaviorHints: {
              notWebReady: true,
            },
          },
        ],
      });
    });
});

module.exports = builder.getInterface();
