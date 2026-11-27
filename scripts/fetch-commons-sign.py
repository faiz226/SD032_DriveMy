"""Fetch an official Malaysia road sign from Wikimedia Commons into public/signs, the way the other signs were added:
the file is downloaded as published, its licence is checked on the Commons API (it must be public domain), metadata is
stripped, it is named by the first 16 hex characters of the SHA-256 of what is shipped, and a row goes into
docs/sign-sources.md. Nothing is drawn here.
Usage: python scripts/fetch-commons-sign.py Malaysia_road_sign_T17b.svg [...]   (run from the repository root)"""
import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

SVG = "http://www.w3.org/2000/svg"
UA = {"User-Agent": "DriveMy-sign-import/1.0 (educational project)"}


def get(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()


def sanitize(raw: bytes) -> str:
    ET.register_namespace("", SVG)
    root = ET.fromstring(raw)

    def clean(el):
        for child in list(el):
            ns = child.tag.split("}")[0][1:] if "}" in child.tag else ""
            tag = child.tag.split("}")[-1]
            if tag in ("metadata", "title", "desc", "script", "foreignObject", "namedview") or (ns and ns != SVG):
                el.remove(child)
                continue
            clean(child)
        for key in list(el.attrib):
            if key == "id" or key.startswith("{") or key.lower().startswith("on"):
                del el.attrib[key]

    clean(root)
    out = ET.tostring(root, encoding="unicode")
    if "url(#" in out or "xlink" in out or "<!--" in out:
        raise SystemExit("this file refers to ids or xlink; it needs a manual look")
    return out


def main(names):
    rows = []
    for name in names:
        api = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&titles=" + urllib.parse.quote("File:" + name)
        page = next(iter(json.loads(get(api))["query"]["pages"].values()))
        if "imageinfo" not in page:
            print("NO FILE ON COMMONS:", name)
            continue
        info = page["imageinfo"][0]
        meta = info["extmetadata"]
        licence = meta.get("LicenseShortName", {}).get("value", "")
        if licence.lower() != "public domain":
            print("NOT PUBLIC DOMAIN, skipped:", name, licence)
            continue
        data = sanitize(get(info["url"].split("?")[0])).encode("utf-8")
        digest = hashlib.sha256(data).hexdigest()[:16]
        file = f"{digest}.svg"
        open(f"public/signs/{file}", "wb").write(data)
        credit = re.sub("<[^>]+>", "", meta.get("Artist", {}).get("value", "Public Works Department Malaysia"))
        page_url = "https://commons.wikimedia.org/wiki/File:" + name
        rows.append(f"| `{file}` | [Source]({page_url}) | [Public domain]({page_url}#Licensing) | {credit} | Commons download; SVG drawing retained and metadata stripped |")
        print(name, "->", file)
    if rows:
        doc = open("docs/sign-sources.md", encoding="utf-8", newline="").read()
        eol = "\r\n" if "\r\n" in doc else "\n"
        kept = [line for line in doc.rstrip().split(eol) if not any(f"`{r.split('`')[1]}`" in line for r in rows)]
        open("docs/sign-sources.md", "w", encoding="utf-8", newline="").write(eol.join(kept + rows) + eol)


if __name__ == "__main__":
    main(sys.argv[1:])
