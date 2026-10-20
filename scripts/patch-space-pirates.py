from pathlib import Path
root=Path(__file__).resolve().parents[2]/'game-sources/space-pirates'
(root/'test_package/src/index.js').write_text('// Modified for ZYVOQIX: optional external Typekit removed.\nimport { initializeBabylonApp } from "app_package";\ninitializeBabylonApp({ assetsHostUrl: "/games/space-pirates" });\n')
for p in (root/'app_package/src').rglob('*.ts'):
    s=p.read_text()
    if p.name in ('GuiFramework.ts','HUD.ts'):
        s=s.replace('"/assets/', '"/games/space-pirates/assets/')
        s=s.replace('assets.assetsHostUrl+"/games/space-pirates/assets/','assets.assetsHostUrl+"/assets/')
        s='// Modified for ZYVOQIX: prefix absolute UI asset paths.\n'+s
    if p.name=='Assets.ts':
        start=s.index('                            if (useNative) {')
        end=s.index('                            // minimal done',start)
        s=s[:start]+'                            // Modified for ZYVOQIX: no native-only remote font download.\n                            whenReady(_this);\n'+s[end:]
    p.write_text(s)
