// @ts-nocheck
let createRepo = async (id) => {
    id = id.replaceAll(':', '-')
    let ghUrl = `https://raw.githubusercontent.com/${process.env.GH_ACCOUNT}/${id}/refs/heads/main/index.m3u8`
    let cdnRes = await fetch(ghUrl)
    if (cdnRes.status == 200) {
        console.log('Git exists, skipping', id)
        return
    }
    let body = {
        "owner": "gconsole00",
        "name": `${id}`,
        "description": "This is your first repository",
        "include_all_branches": false,
        "private": false
    }
    let response = await fetch('https://api.github.com/repos/gconsole001/base/generate', {
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
    let json = await response.text()
    console.log("Create GIT Copy", id, response.status, json)
}

export default createRepo;