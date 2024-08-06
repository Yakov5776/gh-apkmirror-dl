import cheerio from "cheerio";
import { fetchHeaders } from "./fetch.js";
import {createWriteStream} from 'fs'
import { Readable } from "stream";
import { finished } from "stream/promises";
import * as core from "@actions/core";

const BASE_URL = "https://www.apkmirror.com";


async function getHtmlForApkMirror(url) {
    return fetchHeaders(BASE_URL + url).then((r) => r.text());
}

async function getDownloadPageUrl(downloadPageUrl) {
    const html = await getHtmlForApkMirror(downloadPageUrl);
    const $ = cheerio.load(html);
    
    const downloadUrl = $(`a.downloadButton`).attr("href");
    
    if (!downloadUrl) {
        throw new Error("Could not find download page url");
    }
    
    return downloadUrl;
}

async function getDirectDownloadUrl(downloadPageUrl) {
    const html = await getHtmlForApkMirror(downloadPageUrl);
    const $ = cheerio.load(html);
    
    const downloadUrl = $(`.card-with-tabs a[href]`).attr("href");
    
    if (!downloadUrl) {
        throw new Error("Could not find direct download url");
    }
    
    return downloadUrl;
}

function extractVersion(input) {
    const versionRegex = /\b\d+(\.\d+)+(-\S+)?\b/;
    const match = input.match(versionRegex);
    
    return match ? match[0] : undefined;
}

async function getStableLatestVersion(org, repo) {
    const apkmUrl = `${BASE_URL}/apk/${org}/${repo}`;
    
    const response = await fetchHeaders(apkmUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const versions = $(
        `#primary > div.listWidget.p-relative > div > div.appRow > div > div:nth-child(2) > div > h5 > a`
    )
    .toArray()
    .map((v) => $(v).text());
    
    const stableVersion = versions.filter(
        (v) => !v.includes("alpha") && !v.includes("beta")
    )[0];
    
    if (!stableVersion) {
        throw new Error("Could not find stable version");
    }
    
    return extractVersion(stableVersion);
}

async function getDownloadUrl(downloadPageUrl) {
    return getDownloadPageUrl(downloadPageUrl)
    .then((d) => getDirectDownloadUrl(d))
    .then((d) => BASE_URL + d);
}

export async function getVariants(org, repo, version, bundle) {
    const apkmUrl = `${BASE_URL}/apk/${org}/${repo}/${repo}-${version.replaceAll(
        ".",
        "-"
    )}-release`;
    
    const response = await fetchHeaders(apkmUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    var rows;
    if (bundle) {
        rows = $('.variants-table .table-row:has(span.apkm-badge:contains("BUNDLE"))');
    } else {
        rows = $('.variants-table .table-row:has(span.apkm-badge:contains("APK"))');
    }
    
    const parsedData = [];
    
    rows.each((_index, row) => {
        const columns = $(row).find(".table-cell");
        
        const variant = $(columns[0]).text().trim();
        const arch = $(columns[1]).text().trim();
        const version = $(columns[2]).text().trim();
        const dpi = $(columns[3]).text().trim();
        const url = $(columns[4]).find("a").attr("href");
        
        if (!variant || !arch || !version || !dpi || !url) {
            return;
        }
        
        const rowData = {
            variant,
            arch,
            version,
            dpi,
            url,
        };
        
        parsedData.push(rowData);
    });
    
    return parsedData;
}

async function downloadAPK(url, name) {
    const response = await fetchHeaders(url);
    let filename = name;

    const finalUrl = response.url;
    const urlObj = new URL(finalUrl);
    const pathname = urlObj.pathname;
    const lastSegment = pathname.split('/').pop();
    const defaultFilename = decodeURIComponent(lastSegment.split('?')[0]);

    if (!filename) filename = defaultFilename

    const body = response.body;
    let isAPK = filename.endsWith('.apk') || filename.endsWith('.apkm');
    
    if (body != null && isAPK) {
        const fileStream = createWriteStream(filename, { flags: "w" });
        await finished(Readable.fromWeb(body).pipe(fileStream));
        return filename;
    } else {
        throw new Error("An error occurred while trying to download the file");
    }
}

const org = core.getInput('org', { required: true });
const repo = core.getInput('repo', { required: true });
const version = core.getInput('version');
const bundle = core.getBooleanInput('bundle');
const name = core.getInput('filename');

const variants = await getVariants(org, repo, version || await getStableLatestVersion(org, repo), bundle);
const dlurl = await getDownloadUrl(variants[0].url)
const out = await downloadAPK(dlurl, name)

core.setOutput('filename', out);
core.info(`${repo} Successfully downloaded to '${out}'!`);