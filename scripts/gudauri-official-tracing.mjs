// Hand-traced anchors from the uploaded GudauriWinter.jpg, displayed at 1504×1690.
// ONLY its main perspective is transferable: the Kobi inset has a different camera.
// Never substitute geographic coordinates, route guesses or operational statuses.
export const registration = [
  [.7896850540129603, .0024997171847973634, -.6866150550703721],
  [.0004355144217499676, .7919360399345259, -1.1176803442955823],
  [.0000012747320187647038, .000002569535268175179, 1],
];
export function transfer([x, y]) {
  const h = registration, w = h[2][0] * x + h[2][1] * y + 1;
  return [Number(((h[0][0] * x + h[0][1] * y + h[0][2]) / w).toFixed(2)), Number(((h[1][0] * x + h[1][1] * y + h[1][2]) / w).toFixed(2))];
}
const features = [];
const line = (name, kind, difficulty, points, liftType = '') => features.push({name, kind, difficulty, points, liftType});
const pin = (name, kind, x, y) => line(name, kind, '', [[x,y]]);
// Cable lines: terminal-to-terminal exactly as shown, not inferred real-world routes.
line('PIRVELI','lift','',[[871,980],[847,784]],'chairlift');
line('SOLIKO','lift','',[[847,784],[992,440]],'chairlift');
line('SHINO','lift','',[[688,763],[854,424]],'chairlift');
line('GOODAURA','lift','',[[986,773],[861,425]],'gondola');
line('NEW GOODAURA','lift','',[[998,770],[1054,546]],'gondola');
line('KUD BI','lift','',[[916,440],[1146,302]],'chairlift');
line('KHADA','lift','',[[1025,437],[1096,377]],'chairlift');
line('KIKILO','lift','',[[1131,565],[1096,377]],'chairlift');
line('SADZELE','lift','',[[940,347],[943,171]],'chairlift');
line('FIRN','lift','',[[850,415],[693,229]],'gondola');
line('KOBI','lift','',[[693,229],[665,196]],'gondola');
line('ALPINA','lift','',[[519,715],[569,681]],'drag-lift');
line('ZUMA','lift','',[[920,800],[948,748]],'drag-lift');
line('BARDI','lift','',[[863,405],[880,362]],'drag-lift');
line('BOMBORA','lift','',[[1011,436],[1050,376]],'drag-lift');
// Coloured piste anchors sampled directly along the reference strokes.
line('Pirveli','trail','easy',[[846,784],[847,816],[848,845],[843,881],[831,911],[827,932],[830,956],[837,971],[861,980]]);
line('SADZELE 1','expert-trail','',[[938,154],[917,158],[896,166],[878,177],[865,197],[852,221],[848,236],[834,249],[827,260],[830,278],[841,295],[863,316],[888,331],[913,341],[940,347]]);
line('SADZELE 2','expert-trail','',[[943,171],[956,174],[965,179],[958,187],[948,199],[947,217],[939,238],[939,247],[951,253],[975,258],[1005,256],[1029,260],[1052,269],[1069,280],[1074,293],[1064,302]]);
line('SADZELE 3','trail','difficult',[[941,158],[970,166],[1001,178],[1024,199],[1052,222],[1074,239],[1090,248],[1096,258],[1093,274],[1084,295],[1064,303],[1031,316],[1016,323]]);
line('SADZELE 4','trail','difficult',[[1017,323],[988,341],[959,353],[935,368],[912,384],[886,405]]);
line('KUDEBI 1','trail','difficult',[[1147,297],[1149,310],[1140,316],[1126,315],[1110,308],[1093,301],[1077,299],[1061,310]]);
line('KUDEBI 2','trail','difficult',[[1146,297],[1125,293],[1108,295],[1088,308],[1062,330],[1043,348],[1013,362]]);
line('KUDEBI 3','trail','difficult',[[1062,330],[1070,351],[1086,362],[1090,375],[1080,388],[1056,407],[1025,426]]);
line('KUDEBI 4','trail','difficult',[[1013,362],[985,383],[955,404],[927,424],[904,438]]);
line('Tramplin','trail','difficult',[[1039,319],[1043,345],[1047,368]]);
line('FIRN 1','trail','medium',[[693,231],[729,247],[766,262],[789,277],[804,297],[810,319],[811,342],[815,365],[828,391],[850,414]]);
line('FIRN 2','trail','medium',[[718,267],[718,290],[728,306],[739,322],[754,331],[765,342],[769,352],[789,364],[813,374]]);
line('TATRA 1','trail','medium',[[838,435],[801,442],[761,452],[725,458],[697,459],[665,465],[637,479],[608,492],[580,505],[562,519],[547,533],[536,551],[531,570],[533,588],[543,602],[565,617],[602,639],[640,663],[671,686]]);
line('TATRA 2','trail','medium',[[800,442],[772,453],[744,475],[726,495],[712,516],[709,529],[716,551],[716,574],[709,597],[692,626],[678,655],[671,686]]);
line('SOLIKO 1','trail','medium',[[924,449],[892,468],[868,487],[840,501],[814,511],[792,526],[764,546],[743,566],[727,587],[725,606],[731,625],[741,643],[751,659],[771,672],[790,682],[803,699],[810,725],[826,751],[847,784]]);
line('SOLIKO 2','trail','medium',[[785,533],[775,555],[766,576],[765,598],[774,617],[771,633],[757,651],[748,671]]);
line('SOLIKO 3','trail','medium',[[747,649],[737,674],[726,697],[717,719],[714,736],[707,752],[694,762],[688,763]]);
line('SOLIKO 4','trail','medium',[[839,501],[824,512],[816,531],[813,552],[810,572]]);
line('SOLIKO 5','trail','medium',[[716,574],[721,593],[729,609]]);
line('SOLIKO 6','trail','medium',[[759,696],[778,698],[795,699],[808,700]]);
line('SOLIKO 7','trail','medium',[[711,712],[723,728],[742,742],[766,756],[789,767],[816,778],[847,784]]);
line('SPORTULI 1','trail','medium',[[814,574],[832,590],[844,609],[850,632],[844,652],[834,666]]);
line('SPORTULI 2','trail','medium',[[867,488],[880,514],[885,540],[885,565],[879,588],[863,607],[850,629],[845,647],[854,664],[876,674],[889,688]]);
line('SPORTULI 3','trail','medium',[[847,648],[856,669],[873,687],[895,708],[918,728],[936,739],[948,748]]);
line('SPORTULI 4','trail','medium',[[837,672],[828,701],[815,720],[809,725]]);
line('SPORTULI 5','trail','medium',[[948,748],[926,751],[902,755],[879,766],[860,779],[847,784]]);
line('GOODAURA 1','trail','medium',[[881,428],[897,448],[914,469],[926,494],[931,520],[943,553],[951,584],[948,610],[936,644],[919,676],[902,708],[880,741],[862,771],[847,784]]);
line('GOODAURA 2','trail','medium',[[916,459],[932,479],[955,493],[972,509],[987,527],[1000,556],[1010,577],[1007,595],[990,610],[968,617],[948,627]]);
line('GOODAURA 3','trail','medium',[[944,626],[946,644],[964,654],[985,673],[997,689],[1004,712],[1004,740],[998,770]]);
line('NEW GOODAURA 1','trail','medium',[[1010,434],[986,463],[994,488],[1002,517],[1018,535],[1033,544],[1042,551],[1039,565],[1024,593],[1010,616],[1005,640],[1008,666],[1009,691],[1000,719],[995,747],[998,770]]);
line('NEW GOODAURA 2','trail','medium',[[1131,565],[1108,582],[1077,604],[1044,626],[1018,648],[1008,666]]);
line('New Goodaura — upper red piste','trail','difficult',[[1011,505],[1026,518],[1056,535],[1085,549],[1131,565]]);
line('KHADA','trail','medium',[[1096,377],[1082,404],[1067,419],[1044,430],[1025,437]]);
line('KIKILO 1','trail','medium',[[1096,377],[1094,405],[1106,427],[1135,443],[1157,473],[1165,497],[1167,521],[1160,541],[1146,556],[1131,565]]);
line('KIKILO 2','trail','medium',[[1105,437],[1122,465],[1139,485],[1164,493]]);
// Dashed official connecting routes are distinct editable objects, not solid pistes.
line('Alpina–Soliko ski way','ski-way','',[[569,681],[598,701],[630,710],[661,718],[695,723],[719,729],[744,730],[773,730],[801,731],[826,738],[853,749],[884,753],[914,753],[948,748]]);
line('Shino connecting ski way','ski-way','',[[594,723],[624,718],[649,705],[671,686],[694,690],[716,702]]);
line('New Goodaura connecting ski way','ski-way','',[[949,705],[966,714],[987,722],[1008,724]]);
line('Kikilo connecting ski way','ski-way','',[[1054,546],[1080,555],[1106,564],[1131,565]]);
line('Upper station ski way','ski-way','',[[900,455],[927,449],[960,449],[989,451],[1020,459],[1056,457]]);
// All visible main-panel hazard symbols; old-map hazards are not live alerts.
[[542,217],[623,284],[542,350],[896,213],[1114,179],[1228,360],[420,486],[1296,670]].forEach(([x,y], i) => pin(`Dangerous area ${i+1}`,'warning',x,y));
[['Mt Bidara — 3174 m',616,145],['Kobi Pass — 2900 m',775,216],['Mt Sadzele West — 3276 m',942,137],['Mt Sadzele — 3307 m',1124,119],['Mt Kudebi — 3006 m',1197,281],['Mt Chrdili — 2504 m',1372,575],['Lake',768,397]].forEach(([n,x,y])=>pin(n,'label',x,y));
// Reference amenity groups: preserve grouping where multiple symbols share a station.
[['Kobi Pass rescue',705,218],['Upper station rescue',810,417],['Kudebi rescue',1109,277],['Khada rescue',979,438],['Pirveli rescue',911,978]].forEach(([n,x,y])=>pin(n,'rescue',x,y));
[['Kobi Pass panoramic view',777,247],['Sadzele panoramic view',926,181],['Kudebi panoramic view',1167,300],['Valley panoramic view',20,554]].forEach(([n,x,y])=>pin(n,'panorama',x,y));
[['Upper station ticket office',889,420],['Alpina ticket office',671,758],['Goodaura ticket office',984,760],['Pirveli ticket office',893,996]].forEach(([n,x,y])=>pin(n,'ticket-office',x,y));
[['Alpina parking',652,778],['Lower Soliko parking',765,820],['Goodaura parking',984,805]].forEach(([n,x,y])=>pin(n,'parking',x,y));
[['Alpina lodging',537,754],['Lower Soliko lodging',783,820],['Goodaura lodging',1023,808],['Upper station lodging',859,407],['Pirveli lodging',873,996]].forEach(([n,x,y])=>pin(n,'lodging',x,y));
[['Upper station restaurant / toilets',997,421],['Kudebi restaurant',1128,277],['Khada restaurant',1075,464],['Alpina restaurant',670,778],['Lower Soliko restaurant',890,782],['Goodaura restaurant / toilets',1004,808],['Pirveli restaurant',893,978]].forEach(([n,x,y])=>pin(n,'services',x,y));
line('Snowpark','snowpark','',[[912,399],[963,367],[981,368],[960,389],[931,415]]);
line('Bardi beginners area','beginner-area','',[[851,390],[864,365],[876,361],[872,388],[859,407]]);
line('Bombora beginners area','beginner-area','',[[1010,434],[1036,409],[1050,381],[1058,385],[1042,422],[1024,440]]);
line('Zuma beginners area','beginner-area','',[[909,798],[932,756],[945,746],[952,751],[938,785],[926,804]]);
export default features;
