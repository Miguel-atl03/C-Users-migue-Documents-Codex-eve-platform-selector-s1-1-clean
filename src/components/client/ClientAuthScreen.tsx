import { EveLogo } from "../EveLogo";

type AuthMode = "sign-in" | "sign-up";

const SIGN_IN_IDLE_COPY =
  "Inicia sesion para continuar. El modo demo se mantiene separado.";
const SIGN_IN_PANEL_RETURN_COPY = "Inicia sesion para continuar.";
const SIGN_UP_COPY =
  "Usa tu nombre, email y una contraseña para crear tu acceso.";

/** Internal identity for Panel return login (never shown in the UI). */
const PANEL_ACCESS_IDENTITY_EMAIL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_EVE_PANEL_ACCESS_EMAIL?.trim()) ||
  "unit2b-consultant@example.invalid";

export type ClientAuthCredentials = {
  email: string;
  password: string;
  displayName?: string;
};

type ClientAuthScreenProps = {
  authMode: AuthMode;
  authMessage: string;
  authDisplayName: string;
  authEmail: string;
  authPassword: string;
  authLoading: boolean;
  supabaseAvailable: boolean;
  sessionCreating: boolean;
  /**
   * Panel returnTo: password-only sign-in, no Demo, no account creation.
   * Does not grant Consultant by itself — capability stays server-side.
   */
  hideDemo?: boolean;
  onAuthDisplayNameChange: (value: string) => void;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onSignIn: (credentials: ClientAuthCredentials) => void;
  onSignUp: (credentials: ClientAuthCredentials) => void;
  onSelectSignUpMode: () => void;
  onSelectSignInMode: () => void;
  onDemo: () => void;
};

export function ClientAuthScreen({
  authMode,
  authMessage,
  authDisplayName,
  authEmail,
  authPassword,
  authLoading,
  supabaseAvailable,
  sessionCreating,
  hideDemo = false,
  onAuthDisplayNameChange,
  onAuthEmailChange,
  onAuthPasswordChange,
  onSignIn,
  onSignUp,
  onSelectSignUpMode,
  onSelectSignInMode,
  onDemo,
}: ClientAuthScreenProps) {
  const isSignInMode = authMode === "sign-in";
  const passwordOnlyAccess = hideDemo && isSignInMode;
  const idleCopy = hideDemo ? SIGN_IN_PANEL_RETURN_COPY : SIGN_IN_IDLE_COPY;
  const subtitleCopy = isSignInMode ? idleCopy : SIGN_UP_COPY;
  const showStatusMessage =
    Boolean(authMessage) &&
    authMessage !== SIGN_IN_IDLE_COPY &&
    authMessage !== SIGN_IN_PANEL_RETURN_COPY &&
    authMessage !== SIGN_UP_COPY;

  const submitFromForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const displayName = String(data.get("displayName") ?? "").trim();
    const email = passwordOnlyAccess
      ? PANEL_ACCESS_IDENTITY_EMAIL
      : String(data.get("email") ?? "").trim();
    onAuthEmailChange(email);
    onAuthPasswordChange(password);
    if (displayName) onAuthDisplayNameChange(displayName);
    const credentials: ClientAuthCredentials = {
      email,
      password,
      displayName: displayName || undefined,
    };
    if (isSignInMode) onSignIn(credentials);
    else onSignUp(credentials);
  };

  return (
    <div className="mx-auto flex h-screen w-full max-w-[1180px] items-center justify-center overflow-hidden px-4 py-4 sm:px-8">
      <div className="w-full overflow-hidden rounded border border-[rgba(61,61,71,0.14)] bg-white lg:grid lg:max-h-[min(560px,calc(100vh-2rem))] lg:grid-cols-[140px_1fr]">
        <aside className="relative hidden bg-[#2f333a] lg:flex lg:flex-col">
          <div className="px-6 pt-8">
            <EveLogo size="md" variant="on-dark" />
          </div>
          <div className="mt-auto px-6 pb-8">
            <p className="text-[9px] font-medium leading-[1.45] tracking-[0.22em] text-white/55">
              ENTERPRISE
              <br />
              VIABILITY
              <br />
              ENGINE<span className="text-[8px]">™</span>
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-center bg-[#f5f5f5] p-6 sm:p-8">
          <form
            action="#"
            className="w-full max-w-[360px]"
            method="post"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              submitFromForm(event.currentTarget);
            }}
          >
            <div className="lg:hidden">
              <EveLogo size="sm" variant="muted" />
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-[#272a32]">
              {passwordOnlyAccess
                ? "Acceso al Panel"
                : isSignInMode
                  ? "Acceso a la plataforma"
                  : "Crear cuenta"}
            </h1>
            <p className="mt-2 text-sm leading-5 text-[#6f7280]">{subtitleCopy}</p>
            {showStatusMessage && (
              <p className="mt-1.5 text-sm leading-5 text-[#6f7280]">{authMessage}</p>
            )}

            <div className="mt-5 grid gap-2.5">
              {!isSignInMode && (
                <input
                  autoComplete="name"
                  className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-3 text-sm text-[#272a32] outline-none focus:border-[#3d3d47]"
                  name="displayName"
                  onChange={(event) =>
                    onAuthDisplayNameChange(event.target.value)
                  }
                  placeholder="Nombre"
                  required
                  type="text"
                  value={authDisplayName}
                />
              )}
              {!passwordOnlyAccess ? (
                <input
                  autoComplete="email"
                  className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-3 text-sm text-[#272a32] outline-none focus:border-[#3d3d47]"
                  name="email"
                  onChange={(event) => onAuthEmailChange(event.target.value)}
                  placeholder="Email"
                  type="email"
                  value={authEmail}
                />
              ) : null}
              <input
                autoComplete="current-password"
                className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-3 text-sm text-[#272a32] outline-none focus:border-[#3d3d47]"
                name="password"
                onChange={(event) => onAuthPasswordChange(event.target.value)}
                placeholder="Contraseña"
                type="password"
                value={authPassword}
              />
            </div>

            <div className="mt-4 grid gap-2.5">
              <button
                className="h-11 rounded bg-[#3d3d47] px-4 text-sm font-medium text-white transition hover:bg-[#272a32] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={authLoading || !supabaseAvailable}
                type="submit"
              >
                {isSignInMode ? "Iniciar sesión" : "Crear cuenta"}
              </button>
              {!passwordOnlyAccess ? (
                <>
                  <p className="text-center text-[11px] text-[#6f7280]">o</p>
                  <button
                    className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-4 text-sm font-medium text-[#272a32] transition hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={authLoading || !supabaseAvailable}
                    onClick={
                      isSignInMode ? onSelectSignUpMode : onSelectSignInMode
                    }
                    type="button"
                  >
                    {isSignInMode ? "Crear cuenta" : "Ya tengo cuenta"}
                  </button>
                </>
              ) : null}
              {!hideDemo ? (
                <>
                  <button
                    className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-4 text-sm font-medium text-[#272a32] transition hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={sessionCreating}
                    onClick={onDemo}
                    type="button"
                  >
                    Demo controlada
                  </button>
                  <p className="text-xs text-[#6f7280]">
                    La demo no guarda datos comerciales reales.
                  </p>
                </>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
