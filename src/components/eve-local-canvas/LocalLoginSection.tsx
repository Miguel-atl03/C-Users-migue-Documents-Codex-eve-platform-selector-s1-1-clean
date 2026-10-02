"use client";

import { EveLogo } from "@/components/EveLogo";
import {
  PANEL_ACCESS_IDENTITY_EMAIL,
  SIGN_IN_IDLE_COPY,
  SIGN_IN_PANEL_RETURN_COPY,
  SIGN_UP_COPY,
  type LocalAuthCredentials,
  type LocalAuthMode,
} from "./auth-types";
import styles from "./local-canvas.module.css";

type Props = {
  authMode: LocalAuthMode;
  authMessage: string;
  authDisplayName: string;
  authEmail: string;
  authPassword: string;
  authLoading: boolean;
  supabaseAvailable: boolean;
  sessionCreating: boolean;
  hideDemo?: boolean;
  onAuthDisplayNameChange: (value: string) => void;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onSignIn: (credentials: LocalAuthCredentials) => void;
  onSignUp: (credentials: LocalAuthCredentials) => void;
  onSelectSignUpMode: () => void;
  onSelectSignInMode: () => void;
  onDemo: () => void;
};

/**
 * Official LOGIN section — freeze LoginCanvas composition + real auth callbacks.
 * No default credentials. No simulated onLogin.
 */
export function LocalLoginSection({
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
}: Props) {
  const isSignInMode = authMode === "sign-in";
  const passwordOnlyAccess = hideDemo && isSignInMode;
  const idleCopy = hideDemo ? SIGN_IN_PANEL_RETURN_COPY : SIGN_IN_IDLE_COPY;
  const subtitleCopy = isSignInMode ? idleCopy : SIGN_UP_COPY;
  const showStatusMessage =
    Boolean(authMessage) &&
    authMessage !== SIGN_IN_IDLE_COPY &&
    authMessage !== SIGN_IN_PANEL_RETURN_COPY &&
    authMessage !== SIGN_UP_COPY;
  const accountCreated = authMessage.startsWith("Cuenta creada.");

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
    const credentials: LocalAuthCredentials = {
      email,
      password,
      displayName: displayName || undefined,
    };
    if (isSignInMode) onSignIn(credentials);
    else onSignUp(credentials);
  };

  return (
    <section className={styles.darkIntro} aria-labelledby="official-canvas-login-title">
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <EveLogo className={styles.loginLogo} size="md" variant="on-dark" />
        </div>
        <div className={styles.strapline}>
          Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine
        </div>
      </div>
      <div className={styles.heroGhost}>EVE PLATFORM</div>
      <h1 className={styles.heroTitle} id="official-canvas-login-title">
        <span className={styles.heroLine}>START YOUR DIAGNOSTIC</span>
        <span className={styles.heroLine}>WORKSPACE</span>
      </h1>
      <div className={styles.loginLower}>
        <p className={styles.loginCopy}>
          {passwordOnlyAccess
            ? "Acceso al Panel."
            : isSignInMode
              ? "Entra a tu hoja de trabajo."
              : "Crea tu acceso a la plataforma."}
        </p>
        <div className={styles.loginPanel}>
          <form
            action="#"
            className={
              !isSignInMode ? `${styles.loginForm} ${styles.loginFormWide}` : styles.loginForm
            }
            method="post"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              submitFromForm(event.currentTarget);
            }}
          >
            {!isSignInMode ? (
              <label>
                <span className={styles.fieldLabel}>NOMBRE</span>
                <input
                  autoComplete="name"
                  className={styles.darkInput}
                  name="displayName"
                  onChange={(event) => onAuthDisplayNameChange(event.target.value)}
                  placeholder="Tu nombre"
                  required
                  type="text"
                  value={authDisplayName}
                />
              </label>
            ) : null}
            {!passwordOnlyAccess ? (
              <label>
                <span className={styles.fieldLabel}>EMAIL</span>
                <input
                  autoComplete="email"
                  className={styles.darkInput}
                  name="email"
                  onChange={(event) => onAuthEmailChange(event.target.value)}
                  placeholder="Email"
                  type="email"
                  value={authEmail}
                />
              </label>
            ) : null}
            <label>
              <span className={styles.fieldLabel}>PASSWORD</span>
              <input
                autoComplete="current-password"
                className={styles.darkInput}
                name="password"
                onChange={(event) => onAuthPasswordChange(event.target.value)}
                placeholder="Contraseña"
                type="password"
                value={authPassword}
              />
            </label>
            <button
              className={styles.lightButton}
              disabled={authLoading || !supabaseAvailable}
              type="submit"
            >
              {isSignInMode ? "Ingresar →" : "Crear cuenta →"}
            </button>
          </form>
          {showStatusMessage ? (
            <p
              className={
                accountCreated
                  ? `${styles.authMessage} ${styles.authMessageAction}`
                  : styles.authMessage
              }
              role={accountCreated ? "status" : undefined}
            >
              {authMessage}
            </p>
          ) : null}
          <p className={styles.authMessage}>{subtitleCopy}</p>
          <div className={styles.createAccount}>
            {!passwordOnlyAccess ? (
              <button
                className={styles.ghostButton}
                disabled={authLoading || !supabaseAvailable}
                onClick={isSignInMode ? onSelectSignUpMode : onSelectSignInMode}
                type="button"
              >
                {isSignInMode ? "¿Primera vez? Crear cuenta" : "Ya tengo cuenta"}
              </button>
            ) : null}
            {!hideDemo ? (
              <button
                className={styles.ghostButton}
                disabled={sessionCreating}
                onClick={onDemo}
                type="button"
              >
                Demo controlada
              </button>
            ) : null}
          </div>
        </div>
        <div className={styles.accessNote}>
          [ Acceso seguro para participantes y consultores ]
        </div>
      </div>
    </section>
  );
}
