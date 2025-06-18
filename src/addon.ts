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
        let newSt = st.stream.replace(
          'https://tmstr3.shadowlandschronicles.com',
          'https://solitary-grass-77bc.hostproxy.workers.dev'
        )
        if (st.stream == null) continue;
        streams.push({
          title: st.name ?? "Unknown",
          url: newSt,
          behaviorHints: { notWebReady: true },
        });
      }
      return { streams: streams };
    } catch (error) {
      console.error('Stream extraction failed:', error);
      return { streams: [] };
    }
  }
);

export default builder.getInterface();
