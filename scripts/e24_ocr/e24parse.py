import fitz, cv2, numpy as np, io, re
from PIL import Image
from tesserocr import PyTessBaseAPI, PSM

DPI=300
_API={}
def _api(psm):
    if psm not in _API: _API[psm]=PyTessBaseAPI(path='/usr/share/tesseract-ocr/4.00/tessdata/',psm=psm)
    return _API[psm]

def page_gray(pg,dpi=DPI):
    pix=pg.get_pixmap(dpi=dpi)
    return np.array(Image.open(io.BytesIO(pix.tobytes('png'))).convert('L'))

def line_positions(gray):
    H,W=gray.shape
    bw=cv2.adaptiveThreshold(gray,255,cv2.ADAPTIVE_THRESH_MEAN_C,cv2.THRESH_BINARY_INV,15,10)
    vk=cv2.getStructuringElement(cv2.MORPH_RECT,(1,max(20,H//40)))
    vert=cv2.dilate(cv2.erode(bw,vk),vk)
    hk=cv2.getStructuringElement(cv2.MORPH_RECT,(max(20,W//40),1))
    hor=cv2.dilate(cv2.erode(bw,hk),hk)
    def peaks(a,thr,g):
        idx=np.where(a>thr)[0]; out=[]
        if len(idx)==0: return out
        s=p=idx[0]
        for i in idx[1:]:
            if i-p>g: out.append(int((s+p)//2)); s=i
            p=i
        out.append(int((s+p)//2)); return out
    cols=peaks(vert.sum(0),vert.sum(0).max()*0.25,8)
    rows=peaks(hor.sum(1),hor.sum(1).max()*0.25,6)
    return sorted(cols),sorted(rows)

def _tsv(crop, psm, whitelist=None):
    api=_api(psm)
    api.SetVariable('tessedit_char_whitelist', whitelist or '')
    api.SetImage(Image.fromarray(crop))
    txt=api.GetTSVText(0)
    out=[]
    for ln in txt.splitlines():
        p=ln.split('\t')
        if len(p)<12 or p[0]!='5': continue
        t=p[11].strip()
        if t=='': continue
        out.append({'t':t,'l':int(p[6]),'tp':int(p[7]),'w':int(p[8]),'h':int(p[9]),'cf':float(p[10]),
                    'ln':(int(p[2]),int(p[3]),int(p[4]))})
    return out

def words(gray,x0,x1,y0,y1,psm=PSM.SINGLE_BLOCK,wl=None):
    x0,x1,y0,y1=int(max(0,x0)),int(x1),int(max(0,y0)),int(y1)
    crop=gray[y0:y1,x0:x1]
    if crop.size==0: return []
    res=[]
    for d in _tsv(crop,psm,wl):
        res.append({'t':d['t'],'x':d['l']+x0,'y':d['tp']+y0,'w':d['w'],'h':d['h'],
                    'cx':d['l']+d['w']/2+x0,'cy':d['tp']+d['h']/2+y0,'conf':d['cf'],'ln':d['ln']})
    return res

def group_lines(ws):
    grp={}
    for w in ws: grp.setdefault(w['ln'],[]).append(w)
    out=[]
    for k,g in grp.items():
        g.sort(key=lambda w:w['x'])
        top=min(w['y'] for w in g); bot=max(w['y']+w['h'] for w in g)
        out.append({'text':' '.join(w['t'] for w in g),'top':top,'bot':bot,'yc':(top+bot)/2})
    out.sort(key=lambda r:r['yc']); return out

CAND_RE=re.compile(r'\d{2,4}\s+[A-ZÑÁÉÍÓÚ][A-ZÑÁÉÍÓÚ]')
PARTY_RE=re.compile(r'PARTIDO|MOVIMIENTO|COALICI|ALIANZA VERDE|PACTO HIST|CENTRO DEMOCRAT|CAMBIO RADICAL|NUEVO LIBERAL|COLOMBIA (JUSTA|RENAC|HUMANA)|CONSERVADOR|\bLIBERAL\b|\bMIRA\b|\bASI\b|FUERZA CIUDAD|FUERZA DE LA PAZ|GENTE EN MOVIM|DIGNIDAD|COMUNES|SALVACION NACIONAL|OXIGENO|ESPERANZA DEMOCR|ECOLOGISTA|LIGA (DE )?GOBERNANTES|GESTION|CREEMOS|UNITARIA|EN MARCHA|POR LA GENTE|VERDE OXIGENO|DEL LA U|DE LA U')
def classify(name):
    u=name.upper().strip()
    starts_num=bool(re.match(r'^\W{0,3}\d', u))
    if not starts_num:
        if 'BLANCO' in u: return 'blanco'
        if 'NULO' in u: return 'nulos'
        if 'MARCAD' in u: return 'nomarcados'
        if re.match(r'^\W*TOTAL', u): return 'total'
    if PARTY_RE.search(u): return 'party'
    if CAND_RE.search(u): return 'cand'
    if not starts_num and 'TOTAL' in u: return 'total'
    return 'other'

def digit_tokens(gray,x0,x1,y0,y1):
    x0,x1,y0,y1=int(max(0,x0)),int(x1),int(max(0,y0)),int(y1)
    crop=gray[y0:y1,x0:x1]
    if crop.size==0: return []
    up=cv2.resize(crop,None,fx=2,fy=2,interpolation=cv2.INTER_CUBIC)
    _,th=cv2.threshold(up,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    toks=[]
    for d in _tsv(th,PSM.SINGLE_BLOCK,'0123456789'):
        v=re.sub('[^0-9]','',d['t'])
        if v=='': continue
        cy=y0+(d['tp']+d['h']/2)/2.0
        toks.append({'cy':cy,'v':int(v),'conf':d['cf']})
    return toks

def read_cell(gray, x0, x1, y0, y1):
    """OCR de una celda numérica con ensamble (2 escalas). Padding fijo pequeño
    para no cortar dígitos en columnas anchas."""
    x0,x1,y0,y1=int(x0),int(x1),int(y0),int(y1)
    padx=4; pady=3
    crop=gray[max(0,y0+pady):max(0,y1-pady), max(0,x0+padx):max(0,x1-padx)]
    if crop.size==0 or crop.shape[0]<5 or crop.shape[1]<5: return None,0.0
    dark=float((crop<110).mean())
    votes={}
    for scale in (3,4):
        up=cv2.resize(crop,None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC)
        up=cv2.GaussianBlur(up,(3,3),0)
        _,th=cv2.threshold(up,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
        th=cv2.copyMakeBorder(th,16,16,16,16,cv2.BORDER_CONSTANT,value=255)
        for d in _tsv(th, PSM.SINGLE_LINE, '0123456789'):
            v=re.sub('[^0-9]','',d['t'])
            if v=='': continue
            votes.setdefault(v,[]).append(d['cf'])
    if not votes:
        return (0,95.0) if dark<0.03 else (None,0.0)
    val,confs=max(votes.items(), key=lambda kv:(len(kv[1]), sum(kv[1])/len(kv[1])))
    return int(val), round(sum(confs)/len(confs),1)

def _num_near(w,ws,idx):
    m=re.search(r'(\d+)',w['t'])
    if m: return m.group(1)
    if idx+1<len(ws):
        m=re.search(r'(\d+)',ws[idx+1]['t'])
        if m: return m.group(1)
    return None

def parse_page(pg):
    gray=page_gray(pg); H,W=gray.shape
    cols,rows=line_positions(gray)
    if len(cols)<4 or len(rows)<4: return {'zona_found':None,'records':[],'ok':False}
    # Detectar la columna CANDIDATOS por su ENCABEZADO (robusto ante márgenes/PP sin línea)
    ci=None
    htok=words(gray, 0, int(W*0.5), rows[0], int(H*0.45), psm=PSM.SPARSE_TEXT)
    candx=next((w['cx'] for w in htok if 'CANDIDAT' in w['t'].upper()), None)
    if candx is not None:
        ci=next((i for i in range(len(cols)-1) if cols[i]<=candx<=cols[i+1]), None)
    if ci is None:
        widths=[(cols[i+1]-cols[i],i) for i in range(len(cols)-1) if cols[i]<W*0.4]
        if not widths: return {'zona_found':None,'records':[],'ok':False}
        _,ci=max(widths)
    cand_x0,cand_x1=cols[ci],cols[ci+1]
    # Enumerar filas por LÍNEAS DE GRILLA; nombres con UNA pasada SPARSE de la columna
    col_tokens=words(gray,cand_x0,cand_x1,rows[0],H-1,psm=PSM.SPARSE_TEXT)
    data=[]
    for i in range(len(rows)-1):
        y0,y1=rows[i],rows[i+1]
        if not (20<=y1-y0<=95): continue
        toks=[w for w in col_tokens if y0-3<=w['cy']<=y1+3]
        toks.sort(key=lambda w:w['x'])
        nm=' '.join(w['t'] for w in toks).strip()
        typ=classify(nm)
        if typ=='other': continue
        data.append({'top':y0,'bot':y1,'text':nm,'type':typ})
    if not data: return {'zona_found':None,'records':[],'ok':True}
    first_top=min(b['top'] for b in data)
    # sparse OCR of header block -> isolated tokens (labels + column headers)
    ah=words(gray,cand_x1,W-1,max(0,first_top-260),max(0,first_top-6),psm=PSM.SPARSE_TEXT)
    def num_right(w):
        # token con el número a la derecha de la etiqueta (Zona/Puesto)
        cs=[x for x in ah if re.fullmatch(r'0?\d{1,2}',x['t']) and 0<x['cx']-w['cx']<95 and abs(x['cy']-w['cy'])<26]
        return min(cs,key=lambda x:x['cx']-w['cx']) if cs else None
    def reread_label_num(tok):
        # re-OCR del número de etiqueta con ensamble (más robusto que la pasada dispersa)
        v,c=read_cell(gray, tok['x']-5, tok['x']+tok['w']+6, tok['y']-5, tok['y']+tok['h']+6)
        if v is None:
            m=re.sub('[^0-9]','',tok['t']); v=int(m) if m else None
        return v
    zlabels=[]; plabels=[]; tp_cols=[]
    for w in ah:
        u=w['t'].upper()
        if u.startswith('ZONA'):
            tok=num_right(w)   # "Zona NN" (número 1-2 díg). "Total Zona" no tiene -> se ignora
            if tok:
                n=reread_label_num(tok)
                if n and 1<=n<=99: zlabels.append({'x':w['cx'],'z':str(n).zfill(2)})
        elif u.startswith('PUESTO'):
            tok=num_right(w)   # "Puesto NN" = etiqueta ; sin número = encabezado "Total Puesto"
            if tok:
                n=reread_label_num(tok)
                if n and 1<=n<=99: plabels.append({'x':w['cx'],'p':str(n).zfill(2)})
            else:
                for c in range(len(cols)-1):
                    if cols[c]<=w['cx']<=cols[c+1]: tp_cols.append((cols[c],cols[c+1],w['cx'])); break
    zona_found=min(zlabels,key=lambda z:z['x'])['z'] if zlabels else None
    def near_left(labels,xc,key):
        left=[l for l in labels if l['x']<=xc+50]
        if left: return max(left,key=lambda l:l['x'])[key]
        if labels: return min(labels,key=lambda l:abs(l['x']-xc))[key]
        return None
    records=[]
    for (tx0,tx1,txc) in tp_cols:
        pu=near_left(plabels,txc,'p')
        zo=near_left(zlabels,txc,'z')
        for l in data:
            typ=l['type']
            val,conf=read_cell(gray, tx0, tx1, l['top']-2, l['bot']+2)
            records.append({'zona':zo,'puesto':pu,'name':l['text'],'type':typ,'votos':val,'conf':conf})
    return {'zona_found':zona_found,'records':records,'ok':True,'n_tp':len(tp_cols),'n_plabels':len(plabels)}

if __name__=='__main__':
    import sys,json,time
    f=sys.argv[1];idx=int(sys.argv[2]);t=time.time()
    r=parse_page(fitz.open(f)[idx]); r['time']=round(time.time()-t,2)
    print(json.dumps(r,ensure_ascii=False,indent=1))
