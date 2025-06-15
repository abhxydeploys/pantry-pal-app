
import AuthForm from '@/components/auth/AuthForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login / Sign Up - PantryPal',
  description: 'Access your PantryPal account or create a new one.',
};

export default function AuthPage() {
  return <AuthForm />;
}
