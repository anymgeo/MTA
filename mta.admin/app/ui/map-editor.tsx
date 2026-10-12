'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { api, ApiError, type Session } from './api';
import { optionLabels, type MapFeature, type ResortMap, type MapOptions, type FeatureType, type Point } from './map-model';
import { splitSegment, moveHandle, featureMode, } from './vector-editor-geometry';

const MapCanvas = dynamic(() => import('./map-canvas'), { ssr: false, loading: () => <div className="map-canvas-loading"><i className="pi pi-spin pi-spinner" /> რუკა იტვირთება / Loading canvas…</div> });

type Revision = { id: number; actorName: string; at: string; action: string; beforeJson: string; afterJson: string };
type EditorState = { draft: MapFeature | null; drawing: boolean; tool: string; vertex: number | null };
type HistoryEntry = { before:EditorState; after:EditorState; remote?:{ before:MapFeature|null; after:MapFeature|null; featureId:string } };

const EMPTY_EDITOR: EditorState = { draft: null, drawing: false, tool: 'select', vertex: null };
const cloneEditor = (state: EditorState): EditorState => ({ ...state, draft: state.draft ? structuredClone(state.draft) : null });
const sameEditor = (left: EditorState, right: EditorState) => JSON.stringify([left.draft,left.drawing]) === JSON.stringify([right.draft,right.drawing]);

function Select({ label, value, values, onChange, empty = false, required = false }: { label: string; value: string; values: (string | number)[]; onChange: (value: string) => void; empty?: boolean; required?: boolean }) {
  return <label><span>{label}{required ? <b className="map-required-mark" aria-hidden="true">*</b> : null}</span><select className="map-native-select" value={value} required={required} onChange={event=>onChange(event.target.value)}>{empty?<option value="">—</option>:null}{values.map(item=><option key={item} value={String(item)}>{optionLabels[item]||String(item)}</option>)}</select></label>;
}

function MetaAccordion({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  return <section className={`map-meta-accordion ${open ? 'is-open' : ''}`}>
    <button type="button" className="map-meta-accordion__trigger" aria-expanded={open} aria-controls={regionId} onClick={() => setOpen((value) => !value)}>
      <span><i className={icon} />{title}</span><i className="pi pi-chevron-down map-meta-accordion__chevron" />
    </button>
    <div id={regionId} className="map-meta-accordion__body" aria-hidden={!open}><div>{children}</div></div>
  </section>;
}

function ToolButton({ icon, label, shortcut, active = false, disabled = false, tone, onClick }: { icon: string; label: string; shortcut?: string; active?: boolean; disabled?: boolean; tone?: string; onClick: () => void }) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  const paths:Record<string,string>={select:'M5 3 19 13l-7 1-4 7Z',trail:'m4 20 4-13 5 10 4-11 3 14 M3 3h4',lift:'M3 5h18 M7 8h10v10H7Z M10 8V5m4 3V5 M10 21h4',warning:'M12 3 22 21H2Z M12 9v6m0 3v1',pan:'M8 12V5a1 1 0 0 1 2 0v6-8a1 1 0 0 1 2 0v8-7a1 1 0 0 1 2 0v7-5a1 1 0 0 1 2 0v9c0 6-7 8-10 3l-3-4a1 1 0 0 1 2-2l3 2'};
  return <button type="button" className="map-tool-button" title={title} data-tooltip={title} aria-label={title} aria-pressed={active} disabled={disabled} onClick={onClick} style={tone ? { '--tool-tone': tone } as CSSProperties : undefined}>{paths[icon]?<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[icon]}/></svg>:<i className={icon} />}<span className="sr-only">{label}</span>{shortcut ? <kbd>{shortcut}</kbd> : null}</button>;
}

export default function MapEditor({ resortId, onDirtyChange }: { resortId: string; onDirtyChange?: (dirty: boolean) => void }) {
  const [map, setMap] = useState<ResortMap | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [options, setOptions] = useState<MapOptions | null>(null);
  const [editor, setEditorState] = useState<EditorState>(EMPTY_EDITOR);
  const [past, setPastState] = useState<HistoryEntry[]>([]);
  const [future, setFutureState] = useState<HistoryEntry[]>([]);
  const [spacePan, setSpacePan] = useState(false);
  const [expanded,setExpanded]=useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [history, setHistory] = useState<Revision[]>([]);
  const [activity, setActivity] = useState<Revision[]>([]);
  const [hovered, setHovered] = useState<MapFeature | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const editorRef = useRef(editor);
  const pastRef = useRef(past);
  const futureRef = useRef(future);
  const mapRef = useRef(map);
  const editorActiveRef = useRef(false);
  const gestureBaseline = useRef<EditorState | null>(null);
  const textBaseline = useRef<EditorState | null>(null);
  const actionRef = useRef<{ undo: () => void; redo: () => void; finish: () => void; cancel: () => void; selectTool: (tool: string) => void }>({ undo: () => {}, redo: () => {}, finish: () => {}, cancel: () => {}, selectTool: () => {} });

  const { draft, drawing, tool, vertex } = editor;
  const isAdmin = session?.role === 'WebPortalAdmin';
  const effectivePan = tool === 'pan' || spacePan;

  function setEditor(next: EditorState) {
    editorRef.current = next;
    setEditorState(next);
  }
  function setPast(next: HistoryEntry[]) { pastRef.current = next; setPastState(next); }
  function setFuture(next: HistoryEntry[]) { futureRef.current = next; setFutureState(next); }
  function pushBaseline(before: EditorState) {
    const current = editorRef.current;
    if (sameEditor(before, current)) return;
    setPast([...pastRef.current, {before:cloneEditor(before),after:cloneEditor(current)}]);
    setFuture([]);
  }
  function commit(change: (current: EditorState) => EditorState) {
    const before = cloneEditor(editorRef.current);
    const next = change(cloneEditor(before));
    if (sameEditor(before, next)) return;
    setEditor(next);
    pushBaseline(before);
  }
  function update(change: (current: EditorState) => EditorState) {
    setEditor(change(cloneEditor(editorRef.current)));
  }
  function clearLocalHistory() { setPast([]); setFuture([]); gestureBaseline.current = null; textBaseline.current = null; }
  function closeEditor() { commit(()=>cloneEditor(EMPTY_EDITOR)); setDeleteConfirm(false); setError(''); }

  useEffect(() => {
    let active = true;
    Promise.all([
      api<ResortMap>(`/admin/resorts/${resortId}/map`),
      api<Session>('/admin/session'),
      api<MapOptions>('/admin/map-options'),
    ]).then(async ([nextMap, nextSession, nextOptions]) => {
      if (!active) return;
      mapRef.current = nextMap;
      setMap(nextMap);
      setSession(nextSession);
      setOptions(nextOptions);
      setActivity(await api<Revision[]>(`/admin/maps/${nextMap.id}/history`));
    }).catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [resortId]);

  useEffect(() => { mapRef.current = map; }, [map]);
  useEffect(() => {
    if (!draft) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [draft]);
  useEffect(() => { onDirtyChange?.(Boolean(draft)); return () => onDirtyChange?.(false); }, [draft, onDirtyChange]);

  function fail(reason: unknown) {
    setError(reason instanceof Error ? reason.message : 'შენახვა ვერ მოხერხდა / Save failed');
    if (reason instanceof ApiError && reason.status === 409) setConflict(true);
  }

  function start(type: FeatureType) {
    if (editorRef.current.draft) return;
    setError(''); setNotice('');
    commit(() => ({
      tool: type.key,
      drawing: true,
      vertex: null,
      draft: { typeKey: type.key, geometryKind: type.geometryKind, points: [], anchorModes:[], label:null, nameKa: '', nameEn: '', descriptionKa: '', descriptionEn: '', status: type.statuses[0], difficulty: type.key === 'trail' ? 'easy' : '', liftType: type.key === 'lift' ? 'gondola' : '', opens: '', closes: '', durationMinutes: null },
    }));
  }

  function finish() {
    const current = editorRef.current;
    const minimum = current.draft?.geometryKind === 'polygon' ? 3 : 2;
    if (!current.draft || current.draft.points.length < minimum) {
      setError(`დაამატეთ მინიმუმ ${minimum} წერტილი / Add at least ${minimum} points before finishing.`);
      return;
    }
    commit((value) => ({ ...value, drawing: false, tool: 'select' }));
    setError('');
  }

  async function select(feature: MapFeature) {
    if (editorRef.current.draft) return;
    setEditor({ draft: structuredClone(feature), drawing: false, tool: 'select', vertex: null });
    setError('');
    if (feature.id && mapRef.current) {
      try { setHistory(await api<Revision[]>(`/admin/maps/${mapRef.current.id}/history?featureId=${feature.id}`)); }
      catch (reason) { fail(reason); }
    }
  }

  async function save() {
    const currentMap = mapRef.current;
    const current = editorRef.current;
    if (!currentMap || !current.draft || !options) return;
    const minimum = current.draft.geometryKind === 'point' ? 1 : current.draft.geometryKind === 'polygon' ? 3 : 2;
    if (current.draft.points.length < minimum) { setError(`საჭიროა მინიმუმ ${minimum} წერტილი / At least ${minimum} points required.`); return; }
    if (!current.draft.nameKa.trim() || !current.draft.nameEn.trim()) { setError('შეავსეთ სახელი ორივე ენაზე / Enter the name in both languages.'); return; }
    setBusy(true); setError('');
    try {
      const next = await api<ResortMap>(`/admin/maps/${currentMap.id}/features${current.draft.id ? '/' + current.draft.id : ''}`, { method: current.draft.id ? 'PUT' : 'POST', body: JSON.stringify({ ...current.draft, mapVersion: currentMap.version }) });
      mapRef.current = next; setMap(next);
      setActivity(await api<Revision[]>(`/admin/maps/${currentMap.id}/history`));
      const saved=next.features.find(f=>f.id===current.draft?.id)||next.features.at(-1)!;
      setPast([...pastRef.current,{before:cloneEditor(current),after:cloneEditor(EMPTY_EDITOR),remote:{featureId:saved.id!,before:current.draft.id?currentMap.features.find(f=>f.id===current.draft!.id)||null:null,after:structuredClone(saved)}}]);setFuture([]);setEditor(cloneEditor(EMPTY_EDITOR));
      setNotice('შენახულია / Saved. საჯარო API განახლებულია / Public API updated.');
    } catch (reason) { fail(reason); }
    finally { setBusy(false); }
  }

  async function reload() {
    const currentMap = mapRef.current;
    if (!currentMap) return;
    setBusy(true);
    try {
      const next = await api<ResortMap>(`/admin/resorts/${resortId}/map`);
      mapRef.current = next; setMap(next);
      setActivity(await api<Revision[]>(`/admin/maps/${next.id}/history`));
      setEditor(cloneEditor(EMPTY_EDITOR)); clearLocalHistory(); setConflict(false);
      setNotice('რუკა განახლებულია / Latest map loaded.');
    } catch (reason) { fail(reason); }
    finally { setBusy(false); }
  }

  async function remove() {
    const currentMap = mapRef.current;
    const current = editorRef.current.draft;
    if (!currentMap || !current?.id) return;
    setBusy(true);
    try {
      const next = await api<ResortMap>(`/admin/maps/${currentMap.id}/features/${current.id}?mapVersion=${currentMap.version}&version=${current.version}`, { method: 'DELETE' });
      mapRef.current = next; setMap(next);
      setActivity(await api<Revision[]>(`/admin/maps/${currentMap.id}/history`));
      setPast([...pastRef.current,{before:cloneEditor(editorRef.current),after:cloneEditor(EMPTY_EDITOR),remote:{featureId:current.id,before:structuredClone(currentMap.features.find(f=>f.id===current.id)||current),after:null}}]);setFuture([]);setEditor(cloneEditor(EMPTY_EDITOR));setDeleteConfirm(false);setNotice('წაშლილია — Undo-თი შეგიძლიათ აღდგენა / Deleted — use Undo to restore.');
    } catch (reason) { fail(reason); }
    finally { setBusy(false); }
  }

  async function undo() {
    finishTextEdit();
    const entry=pastRef.current.at(-1);if(!entry||busy)return;
    if(entry.remote&&!await replay(entry.remote,false))return;
    setPast(pastRef.current.slice(0,-1));setFuture([entry,...futureRef.current]);setEditor(withCurrentVersion(entry.before));if(document.activeElement?.matches('input,textarea'))textBaseline.current=cloneEditor(editorRef.current);
  }

  async function redo() {
    const entry=futureRef.current[0];if(!entry||busy)return;
    if(entry.remote&&!await replay(entry.remote,true))return;
    setFuture(futureRef.current.slice(1));setPast([...pastRef.current,entry]);setEditor(withCurrentVersion(entry.after));if(document.activeElement?.matches('input,textarea'))textBaseline.current=cloneEditor(editorRef.current);
  }

  function withCurrentVersion(state:EditorState){const next=cloneEditor(state),saved=mapRef.current?.features.find(f=>f.id===next.draft?.id);if(next.draft&&saved)next.draft.version=saved.version;return next;}
  async function replay(remote:NonNullable<HistoryEntry['remote']>,forward:boolean){
    let m=mapRef.current;if(!m)return false;setBusy(true);setError('');
    try{const wanted=forward?remote.after:remote.before;let live=m.features.find(f=>f.id===remote.featureId);
      if(!wanted&&live){m=await api<ResortMap>(`/admin/maps/${m.id}/features/${remote.featureId}?mapVersion=${m.version}&version=${live.version}`,{method:'DELETE'});}
      else if(wanted){if(!live){m=await api<ResortMap>(`/admin/maps/${m.id}/features/${remote.featureId}/restore?mapVersion=${m.version}`,{method:'POST'});live=m.features.find(f=>f.id===remote.featureId);}
        m=await api<ResortMap>(`/admin/maps/${m.id}/features/${remote.featureId}`,{method:'PUT',body:JSON.stringify({...wanted,mapVersion:m.version,version:live?.version})});}
      mapRef.current=m;setMap(m);setActivity(await api<Revision[]>(`/admin/maps/${m.id}/history`));return true;
    }catch(reason){fail(reason);return false;}finally{setBusy(false);}
  }

  async function upload(file: File | undefined) {
    const currentMap = mapRef.current;
    if (!file || !currentMap) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('აირჩიეთ PNG, JPG ან WebP სურათი / Choose a PNG, JPG or WebP image.'); return; }
    setUploading(true); setBusy(true); setError(''); setNotice('');
    try {
      const next = await api<ResortMap>(`/map-upload/${currentMap.id}`, { method: 'POST', body:file, headers:{'Content-Type':file.type,'X-Map-Version':currentMap.version}, signal:new AbortController().signal });
      mapRef.current = next; setMap(next);
      setActivity(await api<Revision[]>(`/admin/maps/${next.id}/history`));
      setNotice(`რუკა აიტვირთა და შენახულია · ${next.width.toLocaleString()} × ${next.height.toLocaleString()} px / Map uploaded and saved.`);
    } catch (reason) { fail(reason); }
    finally { setUploading(false); setBusy(false); }
  }

  function setDraftField<K extends keyof MapFeature>(key: K, value: MapFeature[K], record = true) {
    const change = (current: EditorState): EditorState => current.draft ? { ...current, draft: { ...current.draft, [key]: value } } : current;
    if (record) commit(change); else update(change);
  }
  function startTextEdit() { textBaseline.current = cloneEditor(editorRef.current); }
  function finishTextEdit() { if (textBaseline.current) pushBaseline(textBaseline.current); textBaseline.current = null; }
  function startGeometryEdit() { gestureBaseline.current = cloneEditor(editorRef.current); }
  function finishGeometryEdit() { if (gestureBaseline.current) pushBaseline(gestureBaseline.current); gestureBaseline.current = null; }

  useEffect(() => {
    actionRef.current = {
      undo: () => { void undo(); },
      redo: () => { void redo(); },
      finish,
      cancel: closeEditor,
      selectTool: (nextTool: string) => {
        if (nextTool === 'select' || nextTool === 'pan') {
          if (!editorRef.current.drawing) update((current) => ({ ...current, tool: nextTool }));
          return;
        }
        const type = mapRef.current?.types.find((candidate) => candidate.key === nextTool && candidate.active);
        if (type) start(type);
      },
    };
  });

  useEffect(() => {
    const editable = (target: EventTarget | null) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
    const down = (event: KeyboardEvent) => {
      if (!editorActiveRef.current && !(event.target instanceof Element && event.target.closest('.map-editor'))) return;
      if ((event.ctrlKey || event.metaKey) && ['z','y'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        if (event.shiftKey || event.key.toLowerCase()==='y') actionRef.current.redo(); else actionRef.current.undo();
        return;
      }
      if(editable(event.target))return;
      if (event.code === 'Space') { event.preventDefault(); setSpacePan(true); return; }
      if (event.key === 'Enter' && editorRef.current.drawing) { event.preventDefault(); actionRef.current.finish(); return; }
      if (event.key === 'Escape' && editorRef.current.draft) { event.preventDefault(); actionRef.current.cancel(); return; }
      const shortcut: Record<string, string> = { v: 'select', t: 'trail', l: 'lift', w: 'warning' };
      const next = shortcut[event.key.toLowerCase()];
      if (next) { event.preventDefault(); actionRef.current.selectTool(next); }
    };
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') setSpacePan(false); };
    const blur = () => setSpacePan(false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  if (!map || !options) return <section className="map-editor"><div className="map-canvas-loading"><i className="pi pi-spin pi-spinner" /><strong>რუკის რედაქტორი / Map editor</strong><span role={error ? 'alert' : 'status'}>{error || 'იტვირთება / Loading…'}</span></div></section>;

  const draftType = map.types.find((type) => type.key === draft?.typeKey);
  const activeTypes = ['trail','lift','warning'].map(key=>map.types.find(type=>type.key===key&&type.active)).filter((type):type is FeatureType=>Boolean(type));
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return <section className={`map-editor${expanded?' is-expanded':''}`} aria-label="Visual map editor" onPointerEnter={() => { editorActiveRef.current = true; }} onPointerLeave={() => { editorActiveRef.current = false; setSpacePan(false); }}>
    <header className="map-editor-heading"><div><span className="eyebrow">MAP STUDIO</span><h3>რუკის რედაქტორი / Visual map editor</h3><p>დახატეთ რუკაზე, შეავსეთ ინფორმაცია და შეინახეთ. / Draw, refine and publish from one workspace.</p></div><button type="button" onClick={()=>setExpanded(!expanded)}>{expanded?'სამუშაო სივრცის დახურვა / Exit workspace':'გაშლა / Expand workspace'}</button></header>
    {error ? <div className="editor-banner error" role="alert"><i className="pi pi-exclamation-circle" /><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={() => setError('')}><i className="pi pi-times" /></button></div> : null}
    {notice ? <div className="editor-banner success" role="status"><i className="pi pi-check-circle" /><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={() => setNotice('')}><i className="pi pi-times" /></button></div> : null}
    {conflict ? <div className="map-conflict"><i className="pi pi-users" /><div><strong>Concurrent change detected</strong><p>თქვენი ნახაზი შენარჩუნებულია. / Your drawing is still visible; reload to use the latest map.</p></div><button type="button" disabled={busy} onClick={() => { void reload(); }}>Reload latest</button></div> : null}

    <fieldset disabled={busy || conflict} className="map-studio-fieldset">
      <legend className="sr-only">სახატავი ხელსაწყოები / Drawing tools</legend>
      <div className="map-studio">
        <nav className="map-toolrail" aria-label="Drawing tools">
          <div className="map-tool-group">
            <ToolButton icon="select" label="არჩევა / Select" shortcut="V" active={tool === 'select' && !spacePan} onClick={() => actionRef.current.selectTool('select')} />
            {activeTypes.map((type) => <ToolButton key={type.key} icon={type.key} label={`${type.nameKa} / ${type.nameEn}`} shortcut={type.key === 'trail' ? 'T' : type.key === 'lift' ? 'L' : 'W'} tone={type.color} active={tool === type.key && !spacePan} disabled={Boolean(draft)} onClick={() => start(type)} />)}
            <ToolButton icon="pan" label="გადაადგილება / Pan" shortcut="Space" active={effectivePan} onClick={() => actionRef.current.selectTool(tool === 'pan' ? 'select' : 'pan')} />
          </div>
          <div className="map-tool-divider" />
          <div className="map-tool-group">
            <ToolButton icon="pi pi-undo" label="Undo" shortcut="Ctrl+Z" disabled={!canUndo} onClick={() => { void undo(); }} />
            <ToolButton icon="pi pi-refresh" label="Redo" shortcut="⇧Ctrl+Z" disabled={!canRedo} onClick={() => { void redo(); }} />
          </div>
          {drawing ? <div className="map-tool-actions"><ToolButton icon="pi pi-check" label="დასრულება / Finish" shortcut="Enter" onClick={finish} /><ToolButton icon="pi pi-times" label="გაუქმება / Cancel" shortcut="Esc" onClick={closeEditor} /></div> : null}
        </nav>

        <main className="map-stage-panel" style={{ pointerEvents: busy || conflict ? 'none' : undefined }}>
          <MapCanvas key={map.imageUrl} map={map} draft={draft} drawing={drawing} pan={effectivePan} selectedVertex={vertex}
            onPoint={(point) => update((current) => current.draft ? { ...current, draft: { ...current.draft, points: [...current.draft.points, point],anchorModes:[...(current.draft.anchorModes||current.draft.points.map((_,i)=>featureMode(current.draft!,i))),'corner'] }, vertex: current.draft.points.length, drawing: current.draft.geometryKind === 'point' ? false : current.drawing, tool: current.draft.geometryKind === 'point' ? 'select' : current.tool } : current)}
            onSelect={(feature) => { void select(feature); }}
            onVertex={(index, point,smooth) => update((current) => current.draft ? { ...current, draft: { ...current.draft, points: current.draft.points.map((value, pointIndex) => index === pointIndex ? point : value),anchorModes:current.draft.points.map((_,i)=>smooth&&i===index?'smooth':featureMode(current.draft!,i)) } } : current)}
            onVertexSelect={(index) => update((current) => ({ ...current, vertex: index }))}
            onHandle={(index,side,point,broken)=>update(current=>{if(!current.draft)return current;const modes=current.draft.points.map((_,i)=>featureMode(current.draft!,i));if(broken)modes[index]='corner';return {...current,draft:{...current.draft,anchorModes:modes,points:current.draft.points.map((p,i)=>i===index?moveHandle(p,side,point,modes[index]==='smooth'):p)}};})}
            onInsert={(index,t)=>commit(current=>{if(!current.draft)return current;const modes=current.draft.points.map((_,i)=>featureMode(current.draft!,i));modes.splice(index+1,0,'smooth');return {...current,draft:{...current.draft,points:splitSegment(current.draft.points,index,t),anchorModes:modes},vertex:index+1};})}
            onLabel={point=>update(current=>current.draft?.label?{...current,draft:{...current.draft,label:{...current.draft.label,x:point[0],y:point[1]}}}:current)}
            onHover={setHovered} onFinish={finish} onGeometryStart={startGeometryEdit} onGeometryEnd={finishGeometryEdit} onActiveChange={(active) => { editorActiveRef.current = active; }} />
          {hovered && !draft ? <div className="map-hover-card"><span className="eyebrow">Feature</span><strong>{hovered.nameKa} / {hovered.nameEn}</strong><small>Created: {hovered.createdByName || '—'} · {hovered.createdAt ? new Date(hovered.createdAt).toLocaleString() : '—'}</small></div> : null}
        </main>

        <aside className="map-properties" aria-label="Map properties">
          <div className="map-properties-head"><div><span className="eyebrow">PROPERTIES</span><h4>{draftType ? `${draftType.nameKa} / ${draftType.nameEn}` : drawing ? 'დახატეთ / Draw' : 'რუკის პარამეტრები / Map settings'}</h4></div>{draft ? <span className="map-object-pill">{draft.points.length} pts</span> : null}</div>
          {draft && !drawing ? <form className="map-metadata" onSubmit={(event) => { event.preventDefault(); void save(); }}><fieldset disabled={busy || conflict}>
            <div className="map-required-fields">
              <div className="map-form-section-title"><span>აუცილებელი / Required</span><small>* required</small></div>
              <label><span>სახელი — ქართული <b className="map-required-mark" aria-hidden="true">*</b></span><input required maxLength={200} value={draft.nameKa} onFocus={startTextEdit} onBlur={finishTextEdit} onChange={(event) => setDraftField('nameKa', event.target.value, false)} /></label>
              <label><span>Name — English <b className="map-required-mark" aria-hidden="true">*</b></span><input required maxLength={200} value={draft.nameEn} onFocus={startTextEdit} onBlur={finishTextEdit} onChange={(event) => setDraftField('nameEn', event.target.value, false)} /></label>
              {draft.typeKey === 'trail' ? <Select required label="სირთულე / Difficulty" value={draft.difficulty} values={options.difficulties} onChange={(value) => setDraftField('difficulty', value)} /> : null}
              {draft.typeKey === 'lift' ? <Select required label="საბაგიროს ტიპი / Lift type" value={draft.liftType} values={options.liftTypes} onChange={(value) => setDraftField('liftType', value)} /> : null}
            </div>
            {draft.geometryKind!=='point'?<section className="map-label-controls"><button type="button" onClick={()=>{if(draft.label){setDraftField('label',null);return;}const p=draft.points[Math.floor(draft.points.length/2)];setDraftField('label',{x:p[0],y:Math.max(0,p[1]-30),textKa:draft.nameKa,textEn:draft.nameEn});}}>{draft.label?'Remove map label':'დაამატეთ წარწერა / Add map label'}</button>{draft.label?<><label><span>წარწერა — ქართული / Label KA</span><input value={draft.label.textKa} maxLength={200} onFocus={startTextEdit} onBlur={finishTextEdit} onChange={event=>setDraftField('label',{...draft.label!,textKa:event.target.value},false)}/></label><label><span>Label — English</span><input value={draft.label.textEn} maxLength={200} onFocus={startTextEdit} onBlur={finishTextEdit} onChange={event=>setDraftField('label',{...draft.label!,textEn:event.target.value},false)}/></label><small>Drag the label directly on the map.</small></>:null}</section>:null}
            {draft.geometryKind!=='point'?<div className="map-anchor-controls"><span>{vertex===null?'Select an anchor':`Anchor ${vertex+1} · ${featureMode(draft,vertex)}`}</span><button type="button" disabled={vertex===null} onClick={()=>commit(current=>{if(!current.draft||current.vertex===null)return current;const i=current.vertex,modes=current.draft.points.map((_,j)=>featureMode(current.draft!,j));modes[i]='corner';return {...current,draft:{...current.draft,anchorModes:modes}};})}>Corner</button><button type="button" disabled={vertex===null} onClick={()=>commit(current=>{if(!current.draft||current.vertex===null)return current;const i=current.vertex,points=current.draft.points.map(p=>[...p] as Point),p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=(next[0]-prev[0])/6,dy=(next[1]-prev[1])/6;points[i]=[p[0],p[1],p[0]-dx,p[1]-dy,p[0]+dx,p[1]+dy];const modes=current.draft.points.map((_,j)=>featureMode(current.draft!,j));modes[i]='smooth';return {...current,draft:{...current.draft,points,anchorModes:modes}};})}>Smooth</button><button type="button" disabled={vertex===null||draft.points.length<=(draft.geometryKind==='polygon'?3:2)} onClick={()=>commit(current=>current.draft?{...current,draft:{...current.draft,points:current.draft.points.filter((_,i)=>i!==current.vertex),anchorModes:current.draft.points.map((_,i)=>featureMode(current.draft!,i)).filter((_,i)=>i!==current.vertex)},vertex:null}:current)}>Delete anchor</button></div>:null}
            <div className="map-property-actions"><button className="map-primary-action" type="submit"><i className="pi pi-check" /> შენახვა / Save</button><button type="button" onClick={closeEditor}>Cancel</button>{isAdmin && draft.id ? <button className="map-danger-action" type="button" onClick={() => setDeleteConfirm(true)}><i className="pi pi-trash" /> Delete</button> : null}</div>
            {deleteConfirm ? <div className="map-delete-confirm" role="alert"><strong>Remove this feature?</strong><p>History is retained and Undo can restore it.</p><button type="button" onClick={() => { void remove(); }}>Confirm delete</button><button type="button" onClick={() => setDeleteConfirm(false)}>Cancel</button></div> : null}
            <div className="map-meta-accordions">
              <MetaAccordion icon="pi pi-align-left" title="დამატებითი დეტალები / Additional details">
                <div className="map-accordion-fields"><label><span>აღწერა — ქართული</span><textarea rows={3} maxLength={5000} value={draft.descriptionKa} onFocus={startTextEdit} onBlur={finishTextEdit} onChange={(event) => setDraftField('descriptionKa', event.target.value, false)} /></label><label><span>Description — English</span><textarea rows={3} maxLength={5000} value={draft.descriptionEn} onFocus={startTextEdit} onBlur={finishTextEdit} onChange={(event) => setDraftField('descriptionEn', event.target.value, false)} /></label></div>
              </MetaAccordion>
              <MetaAccordion icon="pi pi-calendar-clock" title="სტატუსი და გრაფიკი / Status & scheduling">
                <div className="map-accordion-fields"><Select label="სტატუსი / Status" value={draft.status} values={draftType?.statuses || []} onChange={(value) => setDraftField('status', value)} />{draft.typeKey === 'lift' ? <><Select empty label="გახსნა / Opens" value={draft.opens} values={options.times} onChange={(value) => setDraftField('opens', value)} /><Select empty label="დახურვა / Closes" value={draft.closes} values={options.times} onChange={(value) => setDraftField('closes', value)} /><Select empty label="მგზავრობა (წთ) / Ride duration" value={draft.durationMinutes === null ? '' : String(draft.durationMinutes)} values={options.durations} onChange={(value) => setDraftField('durationMinutes', value ? Number(value) : null)} /></> : null}</div>
              </MetaAccordion>
              <MetaAccordion icon="pi pi-sliders-h" title="გაფართოებული / Advanced">
                {draft.createdAt ? <div className="map-audit"><p>შექმნა / Created: {draft.createdByName} — {new Date(draft.createdAt).toLocaleString()}</p><p>განახლება / Edited: {draft.updatedByName} — {new Date(draft.updatedAt!).toLocaleString()}</p></div> : null}
              </MetaAccordion>
            </div>
          </fieldset><History rows={history} /></form> : drawing ? <div className="map-tool-help"><div className="map-help-icon"><i className={draft?.typeKey === 'warning' ? 'pi pi-exclamation-triangle' : 'pi pi-pencil'} /></div><h5>{draftType?.nameKa} / {draftType?.nameEn}</h5><p>{draft?.geometryKind === 'point' ? 'Click once to place the marker.' : 'Click to add anchors. Click-drag makes a smooth Bézier curve. Double-click or press Finish when ready.'}</p><div className="map-draw-progress"><span>{draft?.points.length || 0}</span><small>ANCHORS</small></div><button className="map-primary-action" type="button" onClick={finish} disabled={draft?.geometryKind !== 'point' && (draft?.points.length || 0) < 2}>დასრულება / Finish</button></div> : <div className="map-tool-help"><div className="map-help-icon"><i className="pi pi-arrow-up-left" /></div><h5>აირჩიეთ ხელსაწყო / Select a tool</h5><p>Choose a tool from the left rail, or select an existing feature directly on the map.</p><ul><li><kbd>V</kbd> Select</li><li><kbd>T</kbd> Trail</li><li><kbd>L</kbd> Lift</li><li><kbd>W</kbd> Warning</li><li><kbd>Space</kbd> Pan</li></ul></div>}

          <section className="map-properties-card"><div className="map-card-title"><i className="pi pi-image" /><div><strong>რუკის ფონი / Base map</strong><span>{map.width.toLocaleString()} × {map.height.toLocaleString()} px</span></div></div>{map.placeholder ? <p className="map-note">Placeholder background — upload the official resort map.</p> : null}<p>Original image pixels define the coordinates. Existing paths require the same reference dimensions.</p>{isAdmin ? <label className={`map-upload-button ${uploading ? 'is-loading' : ''}`}><input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || Boolean(draft)} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ''; }} /><i className={uploading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'} /><span>{uploading ? 'Uploading and preparing tiles…' : 'Upload & save map image'}</span><small>PNG, JPG or WebP · Original resolution</small></label> : <p className="muted">Only WebPortalAdmin can replace the base map.</p>}</section>
          <details className="map-feature-drawer"><summary><span><i className="pi pi-list" /> ობიექტები / Features</span><b>{map.features.length}</b></summary><div className="map-feature-list">{map.features.length ? map.features.map((feature) => <button type="button" key={feature.id} disabled={Boolean(draft)} onClick={() => { void select(feature); }}><span style={{ background: map.types.find((type) => type.key === feature.typeKey)?.color }} /><div><strong>{feature.nameKa || feature.nameEn}</strong><small>{feature.nameEn}</small></div><i className="pi pi-angle-right" /></button>) : <p className="muted">No map features yet.</p>}</div></details>
        </aside>
      </div>
    </fieldset>

    <section className="map-activity"><div><span className="eyebrow">AUDIT TRAIL</span><h4>ბოლო აქტივობა / Recent map activity</h4></div><History rows={activity} /></section>
  </section>;
}

function History({ rows }: { rows: Revision[] }) {
  return <details className="map-history"><summary>ისტორია / History ({rows.length})</summary>{rows.length === 0 ? <p className="muted">აქტივობა ჯერ არ არის / No activity yet.</p> : rows.slice(0, 20).map((revision) => {
    let name = '';
    try { const after = JSON.parse(revision.afterJson || 'null'); const before = JSON.parse(revision.beforeJson || 'null'); name = after?.nameKa || after?.NameKa || before?.nameKa || before?.NameKa || ''; } catch {}
    return <article className="map-audit" key={revision.id}><div><strong>{name || 'Map feature'}</strong><span>{revision.actorName} · {revision.action} · {new Date(revision.at).toLocaleString()}</span></div><details><summary>ცვლილებები / Changes</summary><pre>{JSON.stringify({ before: JSON.parse(revision.beforeJson || 'null'), after: JSON.parse(revision.afterJson || 'null') }, null, 2)}</pre></details></article>;
  })}</details>;
}
