"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
const extractor_1 = require("./extractor");
const manifest = {
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
const builder = new stremio_addon_sdk_1.addonBuilder(manifest);
const pxyDomain = 'https://solitary-grass-77bc.hostproxy.workers.dev';
const parseM3U8 = function (masterText, st, type, id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const lines = masterText.trim().split('\n');
        const streams = [];
        let baseDomain = st.stream.split('/pl/')[0];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                const info = line.replace('#EXT-X-STREAM-INF:', '');
                const url = `${pxyDomain}/${baseDomain}${(_a = lines[i + 1]) === null || _a === void 0 ? void 0 : _a.trim()}?type=${type}&id=${id}`;
                const resolutionMatch = info.match(/RESOLUTION=(\d+x\d+)/);
                streams.push({
                    name: `${(_b = st.name) !== null && _b !== void 0 ? _b : "Unknown"}`,
                    description: `Resolution: ${resolutionMatch ? resolutionMatch[1] : null}`,
                    url,
                    behaviorHints: { notWebReady: true }
                });
            }
        }
        streams.reverse();
        streams.push({
            name: `${(_c = st.name) !== null && _c !== void 0 ? _c : "Unknown"}`,
            description: `Resolution: Auto`,
            url: `${pxyDomain}/${st.stream}`,
            behaviorHints: { notWebReady: true }
        });
        return streams;
    });
};
builder.defineStreamHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id, type, }) {
    try {
        const res = yield (0, extractor_1.getStreamContent)(id, type);
        if (!res) {
            return { streams: [] };
        }
        let streams = [];
        for (const st of res) {
            if (st.stream == null)
                continue;
            let masterRes = yield fetch(st.stream);
            let masterText = yield masterRes.text();
            streams = yield parseM3U8(masterText, st, type, id);
        }
        return { streams: streams };
    }
    catch (error) {
        console.error('Stream extraction failed:', error);
        return { streams: [] };
    }
}));
exports.default = builder.getInterface();
