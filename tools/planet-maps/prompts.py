import itertools,json
ORDER=['mok','hwa','to','geum','su']
D={'mok':'lush land densely covered with fluffy rounded green forest canopy',
   'su':'deep blue ocean with turquoise shallows along the coasts',
   'hwa':'dark volcanic crust with glowing orange lava pools and thin glowing fissures',
   'to':'warm orange desert with broad terraced sand mesas and round craters',
   'geum':'polished silver chrome metal mountains made of sharp angular facets (metal, not snow)'}
DOM={'mok':'The entire planet is covered with dense fluffy rounded green forest canopy, with a few small winding rivers and clearings',
   'su':'The entire planet is deep blue ocean with turquoise shallows, a few tiny scattered islets and small white polar ice caps',
   'hwa':'The entire planet is a burning molten surface like a small sun: bright glowing lava seas, flame-like swirls and dark cooling crust plates',
   'to':'The entire planet is warm orange desert with large terraced sand mesas, dunes and round craters',
   'geum':'The entire planet is polished chrome steel shaped into countless sharp low-poly geometric facets, like a giant cut metal gemstone, with bright reflective edges and dark reflections; clearly metal, not snow or ice'}
BASE=('Equirectangular 2:1 texture map for wrapping a sphere (full planet surface, longitude across, latitude down, '
 'left and right edges continuous). Stylized miniature diorama planet. {c} Natural organic region shapes with soft believable '
 'transitions between terrains. Top-down albedo only, even soft lighting, no stars, no text, no border, no grid.')
NEG={'mok':'no trees or vegetation','su':'no water or ocean','hwa':'no lava or fire','to':'no desert sand','geum':'no metal or silver mountains'}
neg=lambda have:' Strictly only these terrains: '+'; '.join(NEG[k] for k in ORDER if k not in have)+'.'
jobs=[]
for a in ORDER:
    rest=[k for k in ORDER if k!=a]
    for b,c in itertools.combinations(rest,2):
        jobs.append((f'{a}-{b}-{c}',BASE.format(c=f'About 65 percent of the surface is {D[a]}. Two secondary regions of similar size, each about 15 to 20 percent: one is {D[b]}, the other is {D[c]}.'+neg((a,b,c)))))
    for b in rest:
        jobs.append((f'{a}-{b}',BASE.format(c=f'About 75 percent of the surface is {D[a]}. One large region, about 25 percent, is {D[b]}.'+neg((a,b)))))
    jobs.append((f'{a}',BASE.format(c=DOM[a]+'.'+neg((a,)))))
json.dump(jobs,open('jobs.json','w'),indent=0)
print(len(jobs))
