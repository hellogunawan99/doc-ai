import { redirect } from 'next/navigation';
import { api } from '@/lib/api';

export default function Home() {
  if (api.isAuthenticated()) {
    redirect('/chat');
  } else {
    redirect('/login');
  }
}
