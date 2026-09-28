import { notFound } from "next/navigation";
import {
  getPortalRecord,
  getClosures,
  getAvalancheWarnings,
  getEmergencyContacts,
} from "@/services/portal";
import {
  ContentFrame,
  RecordBody,
  EmergencyBlock,
} from "@/components/content/ContentUI";
import RecordList from "@/components/content/RecordList";
import { contentMetadata } from "@/lib/metadata";
export async function generateMetadata({ params }) {
  const { locale, topic } = await params;
  const r = await getPortalRecord("safety", topic, { locale });
  if (!r) notFound();
  return contentMetadata(locale, "/safety/" + topic, r.title, r.description);
}
export default async function Page({ params }) {
  const { locale, topic } = await params;
  const r = await getPortalRecord("safety", topic, { locale });
  if (!r) notFound();
  const contacts = await getEmergencyContacts({ locale });
  const items =
    topic === "closures"
      ? await getClosures({ locale })
      : topic === "avalanche-danger"
        ? await getAvalancheWarnings({ locale })
        : null;
  return (
    <ContentFrame title={r.title} description={r.description}>
      {["incident", "emergency-contacts", "mountain-patrol"].includes(
        topic,
      ) && <EmergencyBlock contacts={contacts} />}
      <RecordBody record={r} />
      {r.levels && (
        <div className="grid gap-5 sm:grid-cols-2">
          {r.levels.map((level) => (
            <article key={level.color} className="rounded-2xl bg-canvas p-6">
              <span
                aria-hidden="true"
                className={"piste-marker piste-marker--" + level.color}
              />
              <h2 className="mt-4 text-2xl font-black">{level.title}</h2>
              <p className="mt-3 leading-7">{level.text}</p>
            </article>
          ))}
        </div>
      )}
      {items && (
        <RecordList
          items={items}
          basePath={"/safety/" + topic}
          filters={["area", "status"]}
          alerts
        />
      )}
    </ContentFrame>
  );
}
