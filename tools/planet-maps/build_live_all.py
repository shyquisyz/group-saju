import base64, json, os
def du(p, mime): return 'data:' + mime + ';base64,' + base64.b64encode(open(p, 'rb').read()).decode()
def cut(f, a, b):
    s = open(f, encoding='utf-8').read(); i = s.index(a); j = s.index(b, i); return s[i:j]
fn_clouds = cut('live_clouds_tpl.html', 'function cloudHeight', 'async function planet(')
fn_clouds = fn_clouds.replace("const shCut=shadow?'gl_FragColor=vec4(0.,0.,0.,a*.5);return;':'';","const shCut=shadow?'gl_FragColor=vec4(0.,0.,0.,a*'+(T.top<0x800000?'.72':'.5')+');return;':'';")  # shadowfix
assert '.72' in fn_clouds
fn_aurora = cut('live_aurora_tpl.html', 'function limbAurora', 'async function planet(')
fn_iconic = cut('live_iconic_tpl.html', '// ── 무지개 고리', 'const SPECS=')
keys = ['su-mok', 'mok-hwa', 'geum-to', 'hwa-to', 'su-hwa-geum', 'to-mok-hwa', 'su', 'mok-to', 'geum-su', 'hwa-mok-su', 'hwa-geum', 'mok-hwa-to']
maps = {k: du(f'map/{k}.jpg', 'image/jpeg') for k in keys}
h = open('live_all_tpl.html', encoding='utf-8').read()
h = (h.replace('__FN_CLOUDS__', fn_clouds).replace('__FN_AURORA__', fn_aurora).replace('__FN_ICONIC__', fn_iconic)
      .replace('__MAPS__', json.dumps(maps)).replace('__CLOUD__', du('fx/cloudmap_a.png', 'image/png'))
      .replace('__HURR__', du('fx/hurr_a.png', 'image/png')).replace('__AURA__', du('fx/aurora_a_band.png', 'image/png')))
open('live_all.html', 'w', encoding='utf-8').write(h)
open('../장신구-한눈에보기.html', 'w', encoding='utf-8').write(h)
print(os.path.getsize('live_all.html') // 1024, 'KB')
