'use client';

import { useId, useState } from 'react';
import { cmsModules } from './content-cms';

const groups = [
  { id: 'content', label: 'Content', icon: 'pi-pencil', items: ['leadership', 'events', 'about', 'history', 'infrastructure', 'documents', 'projects', 'structure'] },
  { id: 'safety', label: 'Safety', icon: 'pi-shield', items: ['safety', 'contacts'] },
  { id: 'settings', label: 'Site settings', icon: 'pi-cog', items: ['contact', 'navigation', 'home-navigation', 'footer', 'page-text'] },
];
const icons: Record<string, string> = {
  leadership: 'pi-id-card', events: 'pi-calendar', about: 'pi-info-circle', history: 'pi-history',
  infrastructure: 'pi-building', documents: 'pi-file-pdf', projects: 'pi-briefcase', structure: 'pi-sitemap',
  safety: 'pi-shield', contacts: 'pi-phone', contact: 'pi-envelope', navigation: 'pi-compass',
  'home-navigation': 'pi-home', footer: 'pi-align-justify', 'page-text': 'pi-language', webcams: 'pi-video', messages: 'pi-inbox',
};
const labels = Object.fromEntries(cmsModules);
type Props = { section: string; newsCount: number; onNavigate: (section: string) => void };

function NavigationGroup({ group, section, onNavigate }: { group: typeof groups[number] } & Pick<Props, 'section' | 'onNavigate'>) {
  const active = group.items.includes(section);
  const [expanded, setExpanded] = useState(active);
  const panelId = useId();
  return <div className="nav-group">
    <button type="button" className={`nav-group-toggle ${active ? 'has-active' : ''}`} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(value => !value)}>
      <i className={`pi ${group.icon}`} aria-hidden="true" /><span>{group.label}</span>
      <i className={`pi pi-chevron-down nav-group-chevron ${expanded ? 'expanded' : ''}`} aria-hidden="true" />
    </button>
    <div id={panelId} className="nav-group-children" hidden={!expanded}>
      {group.items.map(key => <button type="button" key={key} className={`nav-item nav-subitem ${section === key ? 'active' : ''}`} aria-current={section === key ? 'page' : undefined} onClick={() => onNavigate(key)}>
        <i className={`pi ${icons[key]}`} aria-hidden="true" /><span className="nav-item-label">{labels[key]}</span>
      </button>)}
    </div>
  </div>;
}

export default function SidebarNavigation({ section, newsCount, onNavigate }: Props) {
  return <nav className="admin-navigation" aria-label="Admin navigation">
    <span className="nav-label nav-workspace-label"><i className="pi pi-th-large" aria-hidden="true" />სამუშაო სივრცე</span>
    {[
      ['news', 'სიახლეები', 'pi-file-edit'], ['users', 'მომხმარებლები', 'pi-users'],
      ['resorts', 'კურორტები', 'pi-map'], ['faqs', 'FAQ', 'pi-question-circle'],
    ].map(([key, label, icon]) => <button type="button" key={key} className={`nav-item ${section === key ? 'active' : ''}`} aria-current={section === key ? 'page' : undefined} onClick={() => onNavigate(key)}>
      <i className={`pi ${icon}`} aria-hidden="true" /><span className="nav-item-label">{label}</span>{key === 'news' && <span className="nav-count">{newsCount}</span>}
    </button>)}
    <div className="nav-section-space" />
    {groups.map(group => <NavigationGroup key={`${group.id}:${group.items.includes(section)}`} group={group} section={section} onNavigate={onNavigate} />)}
    <div className="nav-section-space" />
    {['webcams', 'messages'].map(key => <button type="button" key={key} className={`nav-item ${section === key ? 'active' : ''}`} aria-current={section === key ? 'page' : undefined} onClick={() => onNavigate(key)}>
      <i className={`pi ${icons[key]}`} aria-hidden="true" /><span className="nav-item-label">{labels[key]}</span>
    </button>)}
  </nav>;
}
