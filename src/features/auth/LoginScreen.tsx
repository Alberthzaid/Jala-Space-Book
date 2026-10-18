import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import SupabaseConfigNotice from '@/shared/components/SupabaseConfigNotice';
import { REGISTER_PATH } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';
import AuthCard from './components/AuthCard';
import FormAlert from './components/FormAlert';
import FormField from './components/FormField';
import { focusFirstInvalid } from './components/focusFirstInvalid';
import { getSafeRedirect } from './lib/redirect';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, hasErrors, validateLoginForm, type FieldErrors, type LoginFormValues } from './lib/validation';
import { useAuth } from './useAuth';

type LoginErrors = FieldErrors<keyof LoginFormValues>;

export default function LoginScreen() {
  const { configured, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = getSafeRedirect(searchParams.get('next'));

  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const update = (field: keyof LoginFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) {
      focusFirstInvalid(nextErrors, 'login');
      return;
    }
    setPending(true);
    const result = await signIn(values.email, values.password);
    setPending(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    navigate(next, { replace: true });
  };

  const registerLink = searchParams.get('next')
    ? `${REGISTER_PATH}?${new URLSearchParams({ next }).toString()}`
    : REGISTER_PATH;

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Accede a tu cuenta para pedir libros prestados y reservarlos."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to={registerLink} className="font-semibold text-secondary hover:underline">
            Crear una cuenta
          </Link>
        </>
      }
    >
      {!configured ? (
        <SupabaseConfigNotice />
      ) : (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={pending}>
          {formError && <FormAlert message={formError} />}
          <FormField
            id="login-email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={EMAIL_MAX_LENGTH}
            required
            value={values.email}
            onChange={(event) => update('email')(event.target.value)}
            error={errors.email}
          />
          <FormField
            id="login-password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
            required
            value={values.password}
            onChange={(event) => update('password')(event.target.value)}
            error={errors.password}
          />
          <Button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container"
          >
            {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
