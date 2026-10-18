import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import SupabaseConfigNotice from '@/shared/components/SupabaseConfigNotice';
import { LOGIN_PATH } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';
import AuthCard from './components/AuthCard';
import FormAlert from './components/FormAlert';
import FormField from './components/FormField';
import { focusFirstInvalid } from './components/focusFirstInvalid';
import { getSafeRedirect } from './lib/redirect';
import {
  DISPLAY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  hasErrors,
  validateRegisterForm,
  type FieldErrors,
  type RegisterFormValues,
} from './lib/validation';
import { useAuth } from './useAuth';

type RegisterErrors = FieldErrors<keyof RegisterFormValues>;

const EMPTY_FORM: RegisterFormValues = { displayName: '', email: '', password: '', confirmPassword: '' };

export default function RegisterScreen() {
  const { configured, user, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = getSafeRedirect(searchParams.get('next'));

  const [values, setValues] = useState<RegisterFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const update = (field: keyof RegisterFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const nextErrors = validateRegisterForm(values);
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) {
      focusFirstInvalid(nextErrors, 'register');
      return;
    }
    setPending(true);
    const result = await signUp(values);
    setPending(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setConfirmationSent(true);
      setValues(EMPTY_FORM);
      return;
    }
    navigate(next, { replace: true });
  };

  const loginLink = searchParams.get('next') ? `${LOGIN_PATH}?${new URLSearchParams({ next }).toString()}` : LOGIN_PATH;

  return (
    <AuthCard
      title="Crear cuenta"
      description="Regístrate para pedir libros prestados, reservarlos y ver tu historial."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to={loginLink} className="font-semibold text-secondary hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      {!configured ? (
        <SupabaseConfigNotice />
      ) : confirmationSent ? (
        <FormAlert tone="info" message="Te enviamos un correo para confirmar tu cuenta. Confírmala y luego inicia sesión." />
      ) : (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={pending}>
          {formError && <FormAlert message={formError} />}
          <FormField
            id="register-displayName"
            label="Nombre"
            autoComplete="name"
            maxLength={DISPLAY_NAME_MAX_LENGTH + 10}
            required
            value={values.displayName}
            onChange={(event) => update('displayName')(event.target.value)}
            error={errors.displayName}
          />
          <FormField
            id="register-email"
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
            id="register-password"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH + 1}
            required
            hint="Mínimo 8 caracteres, con al menos una letra y un número."
            value={values.password}
            onChange={(event) => update('password')(event.target.value)}
            error={errors.password}
          />
          <FormField
            id="register-confirmPassword"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH + 1}
            required
            value={values.confirmPassword}
            onChange={(event) => update('confirmPassword')(event.target.value)}
            error={errors.confirmPassword}
          />
          <Button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container"
          >
            {pending ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
