# raw/*.png → 이음새 제거 + 1024×512 → serve/map, 분류 지도 → serve/cls
import numpy as np, json, sys
from PIL import Image
exec(open('facing.py',encoding='utf-8').read().split('res={}')[0])
PAL=np.array([[0,255,0],[255,0,0],[255,255,0],[255,255,255],[0,0,255],[0,0,0]],dtype=np.uint8)
def prep(k,dst='serve/map/'):
    a=np.asarray(Image.open(f'raw/{k}.png').convert('RGB')).astype(float);B=48
    L=a[:,:B].copy();R=a[:,-B:].copy()
    for i in range(B):
        t=.5*(1-i/B);a[:,i]=L[:,i]*(1-t)+R[:,B-1-i]*t;a[:,-1-i]=R[:,B-1-i]*(1-t)+L[:,i]*t
    im=Image.fromarray(a.clip(0,255).astype('uint8')).resize((1024,512),Image.LANCZOS);im.save(dst+k+'.jpg',quality=84,optimize=True)
    c=classify(np.asarray(im.resize((512,256))).astype(int),'geum' in k.split('~')[0].split('-'));c[c<0]=5;Image.fromarray(PAL[c]).save('serve/cls/'+k+'.png')
if __name__=='__main__':
    for k in sys.argv[1:]: prep(k)
