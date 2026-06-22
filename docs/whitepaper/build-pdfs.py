#!/usr/bin/env python3
"""Convert every .md in this dir to a styled PDF via python-markdown + headless Chrome."""
import os, sys, subprocess, glob, html as _html
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5;
       color: #1a1a2e; max-width: 100%; margin: 0; }
h1 { font-size: 22pt; color: #5b2a86; border-bottom: 3px solid #7b3fb3; padding-bottom: 6px; margin-top: 0;
     page-break-before: always; }
h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 15pt; color: #6a2c91; margin-top: 22px; border-bottom: 1px solid #e0d0ef; padding-bottom: 3px; }
h3 { font-size: 12pt; color: #444; margin-top: 16px; }
h4 { font-size: 10.8pt; color: #555; margin-top: 12px; }
p, li { font-size: 10.5pt; }
code { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 9pt; background: #f3eefa; color: #5b2a86;
       padding: 1px 4px; border-radius: 3px; }
pre { background: #1a1a2e; color: #e8e3f0; padding: 12px 14px; border-radius: 6px; overflow-x: auto;
      font-size: 8.6pt; line-height: 1.4; page-break-inside: avoid; }
pre code { background: none; color: inherit; padding: 0; font-size: 8.6pt; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.2pt; page-break-inside: avoid; }
th { background: #5b2a86; color: #fff; text-align: left; padding: 6px 9px; }
td { border: 1px solid #ddd; padding: 5px 9px; vertical-align: top; }
tr:nth-child(even) td { background: #faf7fd; }
blockquote { border-left: 4px solid #7b3fb3; margin: 12px 0; padding: 6px 14px; background: #faf7fd; color: #444; }
hr { border: none; border-top: 1px solid #e0d0ef; margin: 20px 0; }
a { color: #7b3fb3; text-decoration: none; }
strong { color: #2a1a3e; }
.cover { text-align: center; padding-top: 30mm; page-break-after: always; }
.cover h1 { border: none; font-size: 34pt; page-break-before: avoid; }
.cover .sub { font-size: 13pt; color: #6a2c91; margin-top: 8px; }
.cover .meta { font-size: 9.5pt; color: #999; margin-top: 40mm; }
"""

def convert(md_path):
    name = os.path.splitext(os.path.basename(md_path))[0]
    with open(md_path, encoding="utf-8") as f:
        text = f.read()
    body = markdown.markdown(text, extensions=["tables", "fenced_code", "toc", "sane_lists", "attr_list"])
    doc = f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{body}</body></html>"
    html_path = os.path.join(HERE, f".{name}.html")
    pdf_path = os.path.join(HERE, f"{name}.pdf")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(doc)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf_path}", f"file://{html_path}"],
                   check=True, capture_output=True)
    os.remove(html_path)
    print(f"  ✓ {name}.pdf ({os.path.getsize(pdf_path)//1024} KB)")
    return pdf_path

if __name__ == "__main__":
    mds = sorted(m for m in glob.glob(os.path.join(HERE, "*.md")) if not os.path.basename(m).startswith("_"))
    print(f"→ converting {len(mds)} docs…")
    pdfs = []
    for m in mds:
        try: pdfs.append(convert(m))
        except Exception as e: print(f"  ✗ {os.path.basename(m)}: {e}")
    print(f"done: {len(pdfs)} PDFs")
