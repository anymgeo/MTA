"""Extract the five supplied workbooks without editing them or guessing missing data."""
import hashlib, json, re
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / 'ტრასები'
LETTERS = dict(zip('აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ', ['a','b','g','d','e','v','z','t','i','k','l','m','n','o','p','zh','r','s','t','u','f','k','gh','q','sh','ch','ts','dz','ts','ch','kh','j','h']))
def text(value):
    if value is None: return ''
    if isinstance(value, float) and value.is_integer(): return str(int(value))
    return re.sub(r'\s+', ' ', str(value)).strip()
def english(value):
    value = ''.join(LETTERS.get(c,c) for c in value)
    return value[:1].upper()+value[1:]
def unit(value, locale):
    if locale=='ka': return value
    return value.replace('ქვედა','Lower ').replace('ზედა','Upper ').replace('( თუ 2850?)','(or 2850?)').replace('მეტრი','m').replace('კმ','km').replace('წუთი','min').replace('წამი','sec').replace('წთ','min').replace(' მ',' m').replace('მ','m').replace(' წ',' min')
def english_notes(value):
    replacements={'სიგრძე დასაზუსტებელია':'Length requires confirmation','დასაზუსტებელია სიგრძე':'Length requires confirmation','არ ვამუშავებთ':'Not operated (source note)',
        'ახალი':'New','100% 2026-26წლის გათოვლიანებით':'100% with 2026-26 snowmaking (source note; year requires confirmation)',
        '100% ახალი გათოვლიანებით; რუკაზე ლურჯია და მთის პოზიციაა, რომ წითელი იყოს':'100% with new snowmaking; source map is blue, resort proposes red. Classification and coverage require confirmation.',
        '100% ახალი გათოვლიანებით; რუკაზე ლურჯია და მთის პოზიციაა, რომ მწვანე იყოს':'100% with new snowmaking; source map is blue, resort proposes green. Classification and coverage require confirmation.',
        'წითელი მონაკვეთი მოინიშნოს წყვეტილი ხაზით, როგორც გადასასვლელი; დასაზუსტებელია სიგრძე':'Source proposes a dashed connecting section; length requires confirmation.'}
    for a,b in sorted(replacements.items(),key=lambda p:-len(p[0])): value=value.replace(a,b)
    return value
def hours(value):
    pairs = re.findall(r'(\d{1,2})[-:](\d{2})\s*/\s*(\d{1,2})[-:](\d{2})', value)
    return [f'{int(a):02}:{b}–{int(c):02}:{d}' for a,b,c,d in pairs]
TYPE = {'გონდოლა':('გონდოლა','Gondola'),'სავარძელი':('სავარძლიანი საბაგირო','Chairlift'),'ბაბლი':('სავარძლიანი საბაგირო','Chairlift'),'ბიგელი':('ბუგელი','Drag lift'),'მოძრავი ხალიჩა':('კონვეიერი','Magic carpet'),'ლენტა':('კონვეიერი','Magic carpet'),'დახრილი':('ფუნიკულიორი','Funicular')}
DIFF = {'მწვანე':'easy','ლურჯი':'medium','წითელი':'difficult','შავი':'expert'}
output = {'sources':[], 'resorts':{}, 'excluded':[]}
for path in sorted(SOURCE.glob('*.xlsx')):
    slug = 'bakuriani' if 'ბაკურიანი' in path.name else 'gudauri-kobi' if 'გუდაური' in path.name else 'goderdzi' if 'გოდერძი' in path.name else 'mestia'
    wb = openpyxl.load_workbook(path, data_only=True)
    output['sources'].append({'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    destination = output['resorts'].setdefault(slug, {'ka':{'lifts':[],'trails':[]},'en':{'lifts':[],'trails':[]},'notes':[]})
    for sheet in wb:
        mode = None; headers = {}
        for row in sheet:
            values = [text(c.value) for c in row]
            if values[0] == 'საბაგიროს დასახელება':
                mode='lifts'; headers={v:i for i,v in enumerate(values) if v}; continue
            if values[0] == 'ტრასის დასახელება':
                mode='trails'; headers={v:i for i,v in enumerate(values) if v}; continue
            if not mode or not values[0]:
                if any(values) and mode:
                    destination['notes'].append(f'{path.name} / {sheet.title} / {row[0].row}: '+ ' | '.join(v for v in values if v))
                continue
            def col(prefix):
                indices=[i for h,i in headers.items() if h.startswith(prefix)]
                return values[indices[0]] if indices else ''
            source={'file':path.name,'sheet':sheet.title,'row':row[0].row,'cells':{c.coordinate:text(c.value) for c in row if c.value is not None}}
            source_ref=f'{path.name} / {sheet.title} / {row[0].row}'
            if mode=='lifts':
                raw_type=col('საბაგიროს ტიპი')
                kind=next((t for k,t in TYPE.items() if k in raw_type),None)
                if not kind:
                    output['excluded'].append(source)
                    if raw_type: destination['notes'].append(source_ref+': არავალიდური საცდელი რიგი; '+json.dumps(source['cells'],ensure_ascii=False))
                    continue
                area=col('სასრიალო არეალი') or col('რომელ სასრიალო')
                schedule=hours(col('სამუშაო საათები'))
                length=col('სიგრძე'); max_time=col('მგზავრობისხანგრძლივობა') or col('მგზავრობის ხანგრძლივობა (მაქსიმალური')
                min_time=col('მგზავრობის ხანგრძლივობა (მინიმალური')
                for lang,index in [('ka',0),('en',1)]:
                    name=values[0] if lang=='ka' else english(values[0])
                    if 'ხალიჩა (Sunkid)' == values[0]: name+=f' ({unit(length,lang)})'
                    fields={'name':name,'type':kind[index],'duration':'','hours':schedule[0] if schedule else '', 'weekendHours':schedule[1] if len(schedule)>1 else '',
                        'area':area if lang=='ka' else english(area),'length':unit(length,lang),'capacity':col('ტევადობა') if lang=='ka' else col('ტევადობა').replace('ადამიანი','person'),
                        'stationElevations':unit(col('ქვედა და ზედა'),lang),'durationMin':unit(min_time,lang),'durationMax':unit(max_time,lang),
                        'sourceType':raw_type if lang=='ka' else kind[1]+(' (bubble)' if 'ბაბლ' in raw_type else ''),'source':source_ref,'sourceRaw':json.dumps(source,ensure_ascii=False),
                        'notes':('სიმაღლე დასაზუსტებელია' if lang=='ka' else 'Elevation requires confirmation') if '?' in col('ქვედა და ზედა') else ''}
                    if length=='1.483 მ': fields['notes']='სიგრძის ერთეული დასაზუსტებელია' if lang=='ka' else 'Length unit requires confirmation'
                    destination[lang]['lifts'].append(fields)
            elif len([v for v in values[:4] if v])>=2 and col('ტრასის სირთულე'):
                raw_difficulty=col('ტრასის სირთულე'); colors=[value for key,value in DIFF.items() if key in raw_difficulty]
                difficulty=colors[0] if len(colors)==1 else 'mixed' if colors else 'unknown'
                raw_length=col('ტრასის სიგრძე'); notes=' | '.join(values[6:]).strip(' |')
                if slug=='bakuriani' and len(values)>5: notes=' | '.join(values[5:]).strip(' |')
                snow=col('ხელოვნური'); area=col('რომელ სასრიალო')
                length=raw_length
                if raw_length in ('','x') or 'დასაზუსტებელია' in notes or (raw_length.replace('.','',1).isdigit() and float(raw_length)>15000): length=''
                if length=='' and 'დასაზუსტებელია' not in notes: notes+=' | სიგრძე დასაზუსტებელია'
                for lang in ['ka','en']:
                    snow_text=('%g%%'%(float(snow)*100)) if re.fullmatch(r'\d+(\.\d+)?',snow) and float(snow)<=1 else snow
                    if lang=='en' and snow_text=='არ აქვს': snow_text='None'
                    # Raw source and review notes stay intact even on the English record.
                    row_data={'name':values[0] if lang=='ka' else english(values[0]), 'length':unit(length,lang) + (' მ' if lang=='ka' else ' m') if length and re.fullmatch(r'\d+(\.\d+)?',length) else unit(length,lang),
                        'difficulty':difficulty,'difficultySource':raw_difficulty if lang=='ka' else ' / '.join({'easy':'Green','medium':'Blue','difficult':'Red','expert':'Black'}.get(c,c) for c in colors),
                        'accessLifts':col('რომელი საბაგიროთი') if lang=='ka' else english(col('რომელი საბაგიროთი')), 'snowmaking':snow_text,'area':area if lang=='ka' else english(area),
                        'notes':notes.strip(' |') if lang=='ka' else english_notes(notes.strip(' |')),'source':source_ref,'sourceRaw':json.dumps(source,ensure_ascii=False)}
                    existing=next((r for r in destination[lang]['trails'] if r['name']==row_data['name'] and r['area']==row_data['area']),None)
                    if existing:
                        if not existing['length'] and row_data['length']: existing['length']=row_data['length']
                        else: assert existing['length']==row_data['length'] or not row_data['length'], source_ref
                        existing['source']+='; '+source_ref
                        existing['sourceRaw']+='\n'+row_data['sourceRaw']
                        existing['notes']+=' | '+('განმეორებული რიგი შეერთებულია; წყარო შენარჩუნებულია.' if lang=='ka' else 'Duplicate source rows merged; originals retained.')
                    else: destination[lang]['trails'].append(row_data)
for slug,data in output['resorts'].items():
    print(slug, 'lifts',len(data['ka']['lifts']),'trails',len(data['ka']['trails']))
target=ROOT/'.local'/'infrastructure-extracted.json'
target.write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
print('Excluded placeholder rows:',len(output['excluded']))
