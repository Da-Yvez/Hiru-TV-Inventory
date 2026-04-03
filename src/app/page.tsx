import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root URL to dashboard
  redirect('/dashboard');
}
