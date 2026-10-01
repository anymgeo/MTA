// New-record regression fixtures must use the dropdown contract, not grandfathered legacy copy.
export function canonicalTestTimes(value){
 if(Array.isArray(value))return value.map(canonicalTestTimes);
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='hours'?'09:00–17:00':key==='winterSeason'?'Dec–Mar':key==='duration'?'5 min':key==='time'?'30 min':canonicalTestTimes(item)]));
}
