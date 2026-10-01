import { Camera, Video, Music2, Link2 } from 'lucide-react';
export default function SocialIcon({label}) {
  const name = label.toLowerCase();
  if(name.includes('facebook')) return <i className="pi pi-facebook" aria-hidden="true"/>;
  if(name.includes('linkedin')) return <i className="pi pi-linkedin" aria-hidden="true"/>;
  const Icon = name.includes('instagram') ? Camera : name.includes('youtube') ? Video : name.includes('tiktok') ? Music2 : Link2;
  return <Icon size={16} aria-hidden="true"/>;
}
