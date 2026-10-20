from pathlib import Path
from html.parser import HTMLParser
import json,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];P=R/'public';games=json.loads((P/'library-catalog.json').read_text());origin=json.loads((R/'site.config.json').read_text())['origin'];seen=set()
class Page(HTMLParser):
 def __init__(self):super().__init__();self.lang=None;self.dir=None;self.canonical=[];self.alternates={};self.scripts=[];self.links=[];self.ids=[]
 def handle_starttag(self,t,attrs):
  d=dict(attrs)
  if t=='html':self.lang=d.get('lang');self.dir=d.get('dir')
  if t=='link' and d.get('rel')=='canonical':self.canonical.append(d.get('href'))
  if t=='link' and d.get('rel')=='alternate':self.alternates[d.get('hreflang')]=d.get('href')
  if t=='script' and d.get('src'):self.scripts.append(d['src'])
  if t=='a' and d.get('href'):self.links.append(d['href'])
  if d.get('id'):self.ids.append(d['id'])
for g in games:
 for lang,prefix in [('en',''),('ar','/ar')]:
  route=prefix+'/play/'+g['id']+'/';s=(P/route.lstrip('/')/'index.html').read_text();page=Page();page.feed(s)
  assert page.lang==lang and page.dir==('rtl' if lang=='ar' else 'ltr'),route
  assert page.canonical==[origin+route],route
  assert page.alternates['en']==origin+'/play/'+g['id']+'/' and page.alternates['ar']==origin+'/ar/play/'+g['id']+'/',route
  assert len(page.ids)==len(set(page.ids)),route
  assert 'gamePageData' in page.ids and 'startGame' in page.ids and 'launchStatus' in page.ids,route
  assert '<iframe' not in s, 'Game runtime must wait for explicit Start'
  assert 'application/ld+json' in s and 'aggregateRating' not in s,route
  for href in page.links:
   if href.startswith(('/play/','/ar/play/','/category/','/ar/category/')):assert (P/href.lstrip('/')/'index.html').is_file(),href
  seen.add(origin+route)
for path,lang in [('index.html','en'),('ar/index.html','ar')]:
 s=(P/path).read_text();page=Page();page.feed(s);assert all((('/ar' if lang=='ar' else '')+'/play/'+g['id']+'/') in page.links for g in games),path
 assert s.count('data-play=')==len(games),path
 for script in page.scripts:assert (P/script.lstrip('/')).is_file(),script
xml=ET.parse(P/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};urls=[x.text for x in xml.findall('.//s:loc',ns)]
assert seen<=set(urls) and len(urls)==len(set(urls))
for url in urls:assert (P/url.removeprefix(origin).lstrip('/')/'index.html').is_file(),url
assert 'Sitemap: '+origin+'/sitemap.xml' in (P/'robots.txt').read_text()
assert 'zyvoqix_v6_profiles' in (P/'app.js').read_text()
print(f'Verified {len(games)*2} language pages, {len(urls)} unique sitemap routes, reciprocal language links, crawlable game links and deferred game loading.')
