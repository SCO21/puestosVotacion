import json
from collections import Counter,defaultdict
from rapidfuzz import process,fuzz
RAW='/sessions/loving-bold-meitner/mnt/outputs/consolidated_raw.json'
META='/sessions/loving-bold-meitner/mnt/puestosVotacion/mapa-de-calor/src/data/resultados_oficiales.json'
raw=json.load(open(RAW))
metalist=json.load(open(META))
meta={p['puesto_id']:p for p in metalist}
pv=raw['pv']; special=raw['special']
mpids=[p for p in pv if p in meta]
# frequency of each cleaned name across matched puestos
freq=Counter()
for p in mpids:
    for k in pv[p]: freq[k]+=1
anchors=[n for n,c in freq.items() if c>=5]
anchset=set(anchors)
# canonical map
canon={}
for n in freq:
    if n in anchset: canon[n]=n; continue
    m=process.extractOne(n,anchors,scorer=fuzz.token_sort_ratio)
    canon[n]= m[0] if (m and m[1]>=92) else n
merged=sum(1 for n in canon if canon[n]!=n)
print('names:',len(freq),'anchors(>=5):',len(anchors),'merged variants:',merged,
      'final distinct:',len(set(canon.values())))
# build DB
out=[]
mpset=set(mpids)
for pid in sorted(meta.keys()):
    if pid not in mpset:
        m=meta[pid]
        out.append({'puesto_id':pid,'nombre_puesto':m.get('nombre_puesto'),'direccion':m.get('direccion'),
            'lat':m.get('lat'),'lng':m.get('lng'),'cargo':'Concejo Municipal','votos_totales_puesto':0,
            'votos_en_blanco':None,'votos_nulos':None,'votos_no_marcados':None,'resultados':[],'sin_datos_e24':True})
        continue
    agg=defaultdict(int)
    for k,v in pv[pid].items():
        if v is None or v<0 or v>3000: continue
        agg[canon[k]]+=v
    resultados=[{'candidato_o_lista':name,'votos':votos} for name,votos in
                sorted(agg.items(),key=lambda x:-x[1])]
    sp=special.get(pid,{})
    extra=sum((sp.get(t) or 0) if (sp.get(t) or 0)<=5000 else 0 for t in ('blanco','nulos','nomarcados'))
    total=sum(agg.values())+extra
    m=meta[pid]
    out.append({
        'puesto_id':pid,'nombre_puesto':m.get('nombre_puesto'),'direccion':m.get('direccion'),
        'lat':m.get('lat'),'lng':m.get('lng'),'cargo':'Concejo Municipal',
        'votos_totales_puesto':total,
        'votos_en_blanco':(sp.get('blanco') if (sp.get('blanco') or 0)<=5000 else None),'votos_nulos':(sp.get('nulos') if (sp.get('nulos') or 0)<=5000 else None),'votos_no_marcados':(sp.get('nomarcados') if (sp.get('nomarcados') or 0)<=5000 else None),
        'resultados':resultados})
json.dump(out,open('/sessions/loving-bold-meitner/mnt/outputs/resultados_e24.json','w'),ensure_ascii=False,indent=1)
print('puestos in DB:',len(out))
print('sample:')
for r in out[:3]:
    print(' ',r['puesto_id'],r['nombre_puesto'][:26],'ncand',len(r['resultados']),'total',r['votos_totales_puesto'],'top',r['resultados'][0] if r['resultados'] else None)
# global candidate list size
allc=set()
for r in out:
    for x in r['resultados']: allc.add(x['candidato_o_lista'])
print('distinct candidates in DB:',len(allc))
