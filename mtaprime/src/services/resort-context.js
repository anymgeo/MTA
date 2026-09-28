import "server-only";
import {
  getPortalRecords,
  getClosures,
  getEvents,
  getEmergencyContacts,
  getWebcams,
} from "./portal";
/** Resort relations use stable area IDs; Gudauri and Kobi can be separate or combined. */
export async function getResortContext({ locale, area }) {
  const [operations, closures, events, contacts, webcams] = await Promise.all([
    getPortalRecords("resortOperations", { locale, area }),
    getClosures({ locale, area, activeOnly: true }),
    getEvents({ locale, area }),
    getEmergencyContacts({ locale, area }),
    getWebcams({ locale, area }),
  ]);
  return {
    operations: operations[0] || null,
    closures,
    events: events.filter(event => event.areaId !== "all"),
    contacts,
    webcams,
  };
}
