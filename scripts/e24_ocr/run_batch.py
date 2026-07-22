import sys,os,json,time,glob
sys.path.insert(0,'/sessions/loving-bold-meitner/mnt/outputs')
import e24parse as E, fitz
from multiprocessing import Pool
E24='/sessions/loving-bold-meitner/mnt/puestosVotacion/e24'
CKPT='/sessions/loving-bold-meitner/mnt/outputs/e24_ckpt.json'
BUDGET=33.0
def order():
    files=[f for f in sorted(glob.glob(E24+'/*.pdf'), key=lambda x:(len(os.path.basename(x)),x))]
    tasks=[]
    for f in files:
        n=fitz.open(f).page_count
        for p in range(n): tasks.append((os.path.basename(f),p))
    return tasks
def work(args):
    fn,p=args
    try:
        r=E.parse_page(fitz.open(E24+'/'+fn)[p])
        return (f'{fn}|{p}',{'zona_found':r.get('zona_found'),'records':r.get('records',[])})
    except Exception as e:
        return (f'{fn}|{p}',{'err':str(e)[:60],'records':[]})
if __name__=='__main__':
    ck=json.load(open(CKPT)) if os.path.exists(CKPT) else {}
    tasks=order(); total=len(tasks)
    todo=[t for t in tasks if f'{t[0]}|{t[1]}' not in ck]
    t0=time.time(); done=0
    with Pool(2) as pool:
        BATCH=14
        i=0
        while i<len(todo) and time.time()-t0<BUDGET:
            chunk=todo[i:i+BATCH]; i+=BATCH
            for k,v in pool.map(work,chunk):
                ck[k]=v; done+=1
            json.dump(ck,open(CKPT,'w'))
    print(f'processed {done} this run; total done {len(ck)}/{total}; elapsed {time.time()-t0:.1f}s')
