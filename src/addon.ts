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

const parseM3U8 = async function (masterText: any, st: any) {
  const lines = masterText.trim().split('\n');
  const streams: Stream[] = [];
  streams.push({
    title: `${st.name ?? "Unknown"}`,
    description: `Resolution: Auto`,
    url: `https://solitary-grass-77bc.hostproxy.workers.dev/${st.stream}`,
    behaviorHints: { notWebReady: true }
  })
  let baseDomain = st.stream.split('/pl/')[0]
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const info = line.replace('#EXT-X-STREAM-INF:', '');
      const url = `https://solitary-grass-77bc.hostproxy.workers.dev/${baseDomain}${lines[i + 1]?.trim()}`;

      const resolutionMatch = info.match(/RESOLUTION=(\d+x\d+)/);

      streams.push({
        title: `${st.name ?? "Unknown"}`,
        description: `Resolution: ${resolutionMatch ? resolutionMatch[1] : null}`,
        url,
        behaviorHints: { notWebReady: true }
      });

    }
  }

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
        // let newSt = `https://solitary-grass-77bc.hostproxy.workers.dev/${st.stream}`
        streams = await parseM3U8(masterText, st)
        
        // streams.push({
        //   title: st.name ?? "Unknown",
        //   url: newSt,
        //   behaviorHints: { notWebReady: true },
        // });
      }
      return { streams: streams };
    } catch (error) {
      console.error('Stream extraction failed:', error);
      return { streams: [] };
    }
  }
);

export default builder.getInterface();
