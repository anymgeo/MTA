"""Lossless vector extraction from the supplied MTA PDF artwork (PyMuPDF)."""
import sys
from pathlib import Path
import xml.etree.ElementTree as ET
import pymupdf

root = Path(__file__).resolve().parent.parent
ns = "{http://www.w3.org/2000/svg}"
ET.register_namespace("", "http://www.w3.org/2000/svg")

logo = pymupdf.open(sys.argv[1])[0]
svg = ET.fromstring(logo.get_svg_image())
# The first two paths are the presentation board, not part of either logo.
for path in list(svg.findall(ns + "path"))[:2]:
    svg.remove(path)
bounds = pymupdf.Rect()
for shape in logo.get_drawings()[2:]:
    if shape["rect"].y0 > 540:
        bounds |= shape["rect"]
svg.set("viewBox", f"{bounds.x0} {bounds.y0} {bounds.width} {bounds.height}")
svg.set("width", str(bounds.width))
svg.set("height", str(bounds.height))
ET.ElementTree(svg).write(root / "mtaprime/public/brand/mta-official-light.svg", encoding="utf-8", xml_declaration=True)

ticket = pymupdf.open(sys.argv[2])[0]
svg = ET.fromstring(ticket.get_svg_image())
svg.set("viewBox", "72 116 357 268")
svg.set("width", "357")
svg.set("height", "268")
for path in svg.iter(ns + "path"):
    if "stroke" in path.attrib:
        path.set("stroke", "currentColor")
    elif "clip" not in path.attrib:
        path.set("fill", "currentColor")
ET.ElementTree(svg).write(root / "mtaprime/public/brand/ski-pass.svg", encoding="utf-8", xml_declaration=True)
