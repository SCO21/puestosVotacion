# Reconciliación de etiquetas de puesto por consistencia del conjunto por-hoja dentro de cada PDF.
import json,glob,os,fitz
from collections import defaultdict,Counter
CKPT='/sessions/loving-bold-meitner/mnt/outputs/e24_ckpt.json'
E24='/sessions/loving-bold-meitner/mnt/puestosVotacion/e24'
META='/sessions/loving-bold-meitner/mnt/puestosVotacion/mapa-de-calor/src/data/resultados_oficiales.json'

def relabel(ck):
    meta=json.load(open(META))
    VALID=set(p['puesto_id'] for p in meta)
    ZONAS=set(p['puesto_id'].split('-')[0] for p in meta)
    PU_BY_Z=defaultdict(set)
    for p in meta: PU_BY_Z[p['puesto_id'].split('-')[0]].add(p['puesto_id'].split('-')[1])
    files=sorted(glob.glob(E24+'/*.pdf'), key=lambda x:(len(os.path.basename(x)),x))
    fixed=0
    for f in files:
        fn=os.path.basename(f); n=fitz.open(f).page_count
        # carry-forward zona; collect per-page segment puestos
        cur_z=None
        pages=[]
        for p in range(n):
            r=ck.get(f'{fn}|{p}')
            if not r or not r.get('records'): pages.append(None); continue
            if r.get('zona_found') and r['zona_found'] in ZONAS: cur_z=r['zona_found']
            # segments (consecutive same puesto label)
            segs=[]; cur=None
            for rec in r['records']:
                z=rec.get('zona') if rec.get('zona') in ZONAS else cur_z
                key=(z,rec.get('puesto'))
                if key!=cur: segs.append([z,rec.get('puesto'),[]]); cur=key
                segs[-1][2].append(rec)
            pages.append(segs)
        # expected puesto set per zona (mode of per-page puesto multisets, for dominant zona of page)
        setcount=defaultdict(Counter)  # zona -> Counter(frozenset of puestos)
        for segs in pages:
            if not segs: continue
            byz=defaultdict(list)
            for z,pu,rr in segs:
                if z and pu: byz[z].append(pu)
            for z,pus in byz.items():
                # only consider valid puestos to define expected set
                setcount[z][frozenset(pu for pu in pus if pu in PU_BY_Z[z])]+=1
        expected={}
        for z,c in setcount.items():
            total=sum(c.values())
            best,cnt=max(c.items(), key=lambda kv:(len(kv[0]),kv[1]))
            # SOLO zonas entrelazadas: conjunto de >=2 puestos presente en la mayoria de hojas
            if len(best)>=2 and cnt>=0.6*total:
                expected[z]=set(best)
        # reconcile each page
        for segs in pages:
            if not segs: continue
            byz=defaultdict(list)
            for s in segs:
                if s[0]: byz[s[0]].append(s)
            for z,slist in byz.items():
                exp=expected.get(z)
                if not exp: continue
                present=set(s[1] for s in slist if s[1] in exp)
                missing=[pu for pu in sorted(exp) if pu not in present]
                mi=0
                for s in slist:
                    if s[1] not in exp and mi<len(missing):
                        s[1]=missing[mi]; mi+=1
                        for rec in s[2]:
                            rec['zona']=z; rec['puesto']=s[1]; fixed+=1
                    else:
                        for rec in s[2]:
                            rec['zona']=z
    return fixed

if __name__=='__main__':
    ck=json.load(open(CKPT))
    fixed=relabel(ck)
    json.dump(ck,open('/sessions/loving-bold-meitner/mnt/outputs/e24_ckpt_relabel.json','w'))
    print('registros reetiquetados:',fixed)
