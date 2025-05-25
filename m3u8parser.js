const axios = require("axios");
const cheerio = require("cheerio");

class VidSrcExtractor {
  constructor() {
    this.baseUrl = "https://vidsrc.xyz";
    this.embedUrl = "https://vidsrc.xyz/embed";
  }

  async getStreamContent(imdbId, type, season, episode) {
    try {
      // Get the embed page
      const embedResponse = await axios.get(
        `${this.embedUrl}/${type}/${imdbId}/${season}-${episode}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        }
      );

      const $ = cheerio.load(embedResponse.data);

      // Extract the source URL from the iframe or data attributes
      let sourceUrl = null;

      // Look for iframe src
      const iframe = $("iframe").first();
      if (iframe.length) {
        sourceUrl = iframe.attr("src");
      }

      // Look for data-src or other attributes
      if (!sourceUrl) {
        sourceUrl = $("[data-src]").first().attr("data-src");
      }

      if (!sourceUrl) {
        throw new Error("Could not find source URL");
      }

      // If relative URL, make it absolute
      if (sourceUrl.startsWith("/")) {
        sourceUrl = this.baseUrl + sourceUrl;
      }

      // Get the actual stream URL
      const streamResponse = await axios.get(sourceUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: `${this.embedUrl}/movie/${imdbId}`,
        },
      });

      // Parse the response to find m3u8 URL
      const streamHtml = streamResponse.data;
      const $stream = cheerio.load(streamHtml);

      // Look for m3u8 URLs in various places
      let m3u8Url = null;

      // Check script tags for m3u8 URLs
      $stream("script").each((i, elem) => {
        const scriptContent = $stream(elem).html();
        if (scriptContent) {
          const m3u8Match = scriptContent.match(
            /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/
          );
          if (m3u8Match) {
            m3u8Url = m3u8Match[0];
            return false; // break the loop
          }
        }
      });

      // Check for source tags
      if (!m3u8Url) {
        const sourceTag = $stream('source[src*=".m3u8"]').first();
        if (sourceTag.length) {
          m3u8Url = sourceTag.attr("src");
        }
      }

      // Check for video tags
      if (!m3u8Url) {
        const videoTag = $stream('video[src*=".m3u8"]').first();
        if (videoTag.length) {
          m3u8Url = videoTag.attr("src");
        }
      }

      if (!m3u8Url) {
        throw new Error("Could not extract m3u8 URL");
      }

      return {
        success: true,
        m3u8Url: m3u8Url,
        imdbId: imdbId,
      };
    } catch (error) {
      console.error("Error extracting stream content:", error.message);
      return {
        success: false,
        error: error.message,
        imdbId: imdbId,
      };
    }
  }
}

async function getStreamContent(imdbId, type, season, episode) {
  const extractor = new VidSrcExtractor();
  return await extractor.getStreamContent(imdbId, type, season, episode);
}

module.exports = {
  VidSrcExtractor,
  getStreamContent,
};
