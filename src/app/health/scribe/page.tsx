// @ts-nocheck
import { Metadata } from 'next';
import ScribePanel from '../components/ScribePanel';

export const metadata: Metadata = {
  title: 'Ambient Scribe Companion | Vet1Stop Health',
  description: 'Speak or type your health notes — AI organizes them into a structured summary you can download as a PDF. For personal journaling only.',
  keywords: 'veteran health journaling, ambient scribe, voice health notes, veteran appointment prep, VA appointment notes',
};

export default function ScribePage() {
  return <ScribePanel />;
}
