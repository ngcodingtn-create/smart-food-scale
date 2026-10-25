'use client';

import { useActionState } from 'react';
import { Icon } from '@/components/icons';
import { signIn, type SignInState } from '../actions';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null });

  return (
    <form action={action} className="admin-login-form">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="admin-password">Password</label>
      <input
        id="admin-password"
        name="password"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        autoFocus
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? 'admin-password-error' : undefined}
      />
      {state.error ? (
        <p id="admin-password-error" className="admin-login-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        <Icon name="lock" size={16} />
        {pending ? 'Checking…' : 'Open the builder’s area'}
      </button>
    </form>
  );
}
