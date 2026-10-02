export type LocalAuthMode = "sign-in" | "sign-up";

/** Same credential shape previously used by ClientAuthScreen. */
export type LocalAuthCredentials = {
  email: string;
  password: string;
  displayName?: string;
};

/** Internal identity for Panel return login (never shown in the UI). */
export const PANEL_ACCESS_IDENTITY_EMAIL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_EVE_PANEL_ACCESS_EMAIL?.trim()) ||
  "unit2b-consultant@example.invalid";

export const SIGN_IN_IDLE_COPY =
  "Inicia sesion para continuar. El modo demo se mantiene separado.";
export const SIGN_IN_PANEL_RETURN_COPY = "Inicia sesion para continuar.";
export const SIGN_UP_COPY =
  "Usa tu nombre, email y una contraseña para crear tu acceso.";
