// @ts-nocheck
import { addonBuilder, Manifest, Stream } from "stremio-addon-sdk";
import { getStreamContent } from "./extractor";

const manifest: Manifest = {
  id: "xyz.theditor.stremsrc",
  version: "0.1.0",
  catalogs: [],
  resources: [
    {
      name: "stream",
      types: ["movie", "series"],
      idPrefixes: ["tt"],
    },
  ],
  types: ["movie", "series"],
  name: "stremsrc",
  description: "A VidSRC extractor for stremio",
};

const builder = new addonBuilder(manifest);
const pxyDomain = 'https://solitary-grass-77bc.hostproxy.workers.dev'
const parseM3U8 = async function (masterText: any, st: any, type: any, id: any) {
  const lines = masterText.trim().split('\n');
  const streams: Stream[] = [];

  let baseDomain = st.stream.split('/pl/')[0]
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const info = line.replace('#EXT-X-STREAM-INF:', '');
      const url = `${baseDomain}${lines[i + 1]?.trim()}`;
      const resolutionMatch = info.match(/RESOLUTION=(\d+x\d+)/);
      streams.push({
        description: `${st.name ?? "Unknown"}`,
        name: `Stremsrc | ${resolutionMatch ? resolutionMatch[1] : null}`,
        url,
        behaviorHints: {
          notWebReady: true,
          bingeGroup: `Stremsrc | ${resolutionMatch ? resolutionMatch[1] : null}`,
          filename: `${st.name ?? "Unknown"}`
        }
      });

    }
  }
  let autoRes = {
    description: `${st.name ?? "Unknown"}`,
    name: `Stremsrc | Auto`,
    url: `${st.stream}`,
    behaviorHints: {
      notWebReady: true,
      bingeGroup: `Stremsrc | Auto`,
      filename: `${st.name ?? "Unknown"}`
    }
  }
  streams.reverse()
  streams.push(autoRes)
  return streams;
}

builder.defineStreamHandler(
  async ({
    id,
    type,
  }): Promise<{
    streams: Stream[];
  }> => {
    try {
      const res = await getStreamContent(id, type);
      if (!res) {
        return { streams: [] };
      }

      let streams: Stream[] = [];
      for (const st of res) {
        if (st.stream == null) continue;
        let masterRes = await fetch(st.stream)
        let masterText = await masterRes.text()
        streams = await parseM3U8(masterText, st, type, id)
      }
      return { streams: streams };
    } catch (error) {
      console.error('Stream extraction failed:', error);
      return { streams: [] };
    }
  }
);

export default builder.getInterface();
