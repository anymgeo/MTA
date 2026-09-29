import ResortEditorScreen from '../../../ui/resort-editor-screen';

export const dynamic = 'force-dynamic';

export default async function EditResortPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <ResortEditorScreen resortId={id}/>;
}
