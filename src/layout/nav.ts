import { Briefcase, Home, LayoutGrid, Mail, User } from 'lucide-react';

export type Tab = 'home' | 'about' | 'experience' | 'projects' | 'contact';

/**
 * The one list of tabs. The desktop pill renders the labels, the phone tab bar
 * renders the icons — both walk this array so they can never drift apart.
 */
export const NAV_TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'about', label: 'About', Icon: User },
  { id: 'experience', label: 'Experience', Icon: Briefcase },
  { id: 'projects', label: 'Projects', Icon: LayoutGrid },
  { id: 'contact', label: 'Contact', Icon: Mail },
];
