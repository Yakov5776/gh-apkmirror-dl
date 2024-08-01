import cheerio from "cheerio";
import { fetchHeaders } from "./fetch.js";
import {createWriteStream} from 'fs'
import { Readable } from "stream";
import { finished } from "stream/promises";
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
    console.log(html)
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
  
    const contentType = response.headers.get("Content-Type");
    const isAPK = contentType == "application/vnd.android.package-archive";
  
    // content type for apkm is application/octet-stream, so at least we can check for extension then
    var isAPKM = false;
    const apkmRegex = /.*\/(.*apkmirror.com.apkm)/;
    if (response.url.match(apkmRegex) != null) {
      isAPKM = true;
    }
  
    var ext;
    if (isAPKM) {
      ext = "apkm";
    } else if (isAPK) {
      ext = "apk";
    }
    var path = `${name}.${ext}`;
  
    const body = response.body;
  
    if (body != null && (isAPK || isAPKM)) {
      const fileStream = createWriteStream(path, { flags: "w" });
      await finished(Readable.fromWeb(body).pipe(fileStream));
    } else {
      throw new Error("An error occured while trying to download the file");
    }
  }
  
  const org = process.env.ORG;
  const repo = process.env.REPO;
  const bundle = process.env.BUNDLE === 'true' || process.env.BUNDLE === undefined;

const variants = await getVariants(org, repo, process.env.VERSION || await getStableLatestVersion(org, repo), bundle);
const dlurl = await getDownloadUrl(variants[0].url)
await downloadAPK(dlurl, repo)