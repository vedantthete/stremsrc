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
// @ts-nocheck
let createRepo = (id) => __awaiter(void 0, void 0, void 0, function* () {
    id = id.replaceAll(':', '-');
    let ghUrl = `https://raw.githubusercontent.com/${process.env.GH_ACCOUNT}/${id}/refs/heads/main/index.m3u8`;
    let cdnRes = yield fetch(ghUrl);
    if (cdnRes.status == 200) {
        console.log('Git exists, skipping', id);
        return;
    }
    let body = {
        "owner": `${process.env.GH_ACCOUNT}`,
        "name": `${id}`,
        "description": "This is your first repository",
        "include_all_branches": false,
        "private": false
    };
    let response = yield fetch(`https://api.github.com/repos/${process.env.GH_ACCOUNT}1/base/generate`, {
        method: 'POST',
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${process.env.PAT}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/x-www-form-urlencoded',
            "User-Agent": "curl/8.5.0"
        },
        body: JSON.stringify(body)
    });
    let json = yield response.text();
    console.log("Create GIT Copy", id, response.status, json);
});
exports.default = createRepo;
