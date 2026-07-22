import json,os,glob,re,fitz
from collections import defaultdict,Counter
CKPT='/sessions/loving-bold-meitner/mnt/outputs/e24_ckpt.json'
E24='/sessions/loving-bold-meitner/mnt/puestosVotacion/e24'
META='/sessions/loving-bold-meitner/mnt/puestosVotacion/mapa-de-calor/src/data/resultados_oficiales.json'
ck=json.load(open(CKPT))
files=[f for f in sorted(glob.glob(E24+'/*.pdf'), key=lambda x:(len(os.path.basename(x)),x))]

def clean_name(n):
    n=re.sub(r'^.*?\d{2,4}\s+','',n); n=re.sub(r'[|_]',' ',n)
    n=re.sub(r'[^A-Za-zÑÁÉÍÓÚÜñáéíóúü ]',' ',n); n=re.sub(r'\s+',' ',n).strip().upper()
    return n

# ordered record sequence per puesto (carry-forward + validación contra códigos reales)
_meta=json.load(open(META))
VALID_PIDS=set(p['puesto_id'] for p in _meta)
VALID_ZONAS=set(p['puesto_id'].split('-')[0] for p in _meta)
PUESTOS_BY_ZONA=defaultdict(set)
for p in _meta: PUESTOS_BY_ZONA[p['puesto_id'].split('-')[0]].add(p['puesto_id'].split('-')[1])
seq=defaultdict(list)
for f in files:
    fn=os.path.basename(f); n=fitz.open(f).page_count
    cur_z=None
    for p in range(n):
        rec=ck.get(f'{fn}|{p}')
        if not rec: continue
        zf=rec.get('zona_found')
        if zf and zf in VALID_ZONAS: cur_z=zf
        for r in rec.get('records',[]):
            z=r.get('zona'); pu=r.get('puesto')
            if not pu: continue
            # zona inválida -> usar carry-forward
            if z not in VALID_ZONAS: z=cur_z
            if not z: continue
            pid=f'{z}-{pu}'
            if pid not in VALID_PIDS:
                # intentar con carry-forward zona
                if cur_z and f'{cur_z}-{pu}' in VALID_PIDS: pid=f'{cur_z}-{pu}'
                else: pid=f'{z}-{pu}'  # queda como fantasma (no entra a DB por no cruzar metadata)
            seq[pid].append(dict(r))

# --- Corrección por restricción usando filas TOTAL de cada bloque ---
pv=defaultdict(lambda: defaultdict(lambda:(-1,0)))   # pid->name->(conf,votos)
special=defaultdict(dict)
blocks_ok=blocks_fixed=blocks_bad=blocks_total=0
cells_total=0; cells_fixed=0
for pid,recs in seq.items():
    # segmentar en bloques que terminan en 'total'
    block=[]
    for r in recs:
        if r['type']=='total':
            # cerrar bloque
            items=block
            if items:
                blocks_total+=1
                s=sum((it['votos'] or 0) for it in items)
                tot=r['votos']
                cells_total+=sum(1 for it in items if it['type']=='cand')
                if tot is not None and s==tot:
                    blocks_ok+=1
                elif tot is not None:
                    delta=tot-s
                    # candidatos ordenados por menor confianza
                    cands=[it for it in items if it['type']=='cand']
                    cands.sort(key=lambda it:(it['conf'] or 0))
                    fixed=False
                    for it in cands:
                        nv=(it['votos'] or 0)+delta
                        if 0<=nv<=tot and (it['conf'] or 0)<85:  # solo corrige celdas dudosas
                            it['votos']=nv; fixed=True; cells_fixed+=1; break
                    if fixed and sum((x['votos'] or 0) for x in items)==tot:
                        blocks_fixed+=1
                    else:
                        blocks_bad+=1
            block=[]
        else:
            block.append(r)
    # acumular candidatos (tras corrección) y especiales
    for r in recs:
        v=r['votos'] or 0; t=r['type']
        if t=='cand':
            k=clean_name(r['name'])
            if len(k)>=5 and (r['conf'] or 0)>pv[pid][k][0]:
                pv[pid][k]=(r['conf'] or 0, v)
        elif t in ('blanco','nulos','nomarcados'):
            cur=special[pid].get(t,(-1,0))
            if (r['conf'] or 0)>cur[0]: special[pid][t]=(r['conf'] or 0,v)

meta={p['puesto_id']:p for p in json.load(open(META))}
pids=sorted(pv.keys()); matched=[p for p in pids if p in meta]
print(f'Puestos: {len(pids)}  (cruzan metadata: {len(matched)})')
print(f'Bloques de partido: {blocks_total}')
print(f'  ya consistentes: {blocks_ok} ({100*blocks_ok/max(1,blocks_total):.1f}%)')
print(f'  corregidos por restricción: {blocks_fixed}')
print(f'  verificados totales: {blocks_ok+blocks_fixed} ({100*(blocks_ok+blocks_fixed)/max(1,blocks_total):.1f}%)')
print(f'  no reconciliados: {blocks_bad}')
print(f'  celdas corregidas: {cells_fixed}')
json.dump({'pv':{p:{k:special_get(pv,p,k) for k in pv[p]} for p in pids} if False else {p:{k:pv[p][k][1] for k in pv[p]} for p in pids},
           'special':{p:{k:special[p][k][1] for k in special[p]} for p in pids}},
          open('/sessions/loving-bold-meitner/mnt/outputs/consolidated_raw.json','w'),ensure_ascii=False)
if '08-05' in pv:
    for kk in pv['08-05']:
        if 'APONTE' in kk or 'BARRIOS' in kk or 'PEREIRA CAB' in kk: print('  08-05',kk,pv['08-05'][kk][1])
print('saved')
