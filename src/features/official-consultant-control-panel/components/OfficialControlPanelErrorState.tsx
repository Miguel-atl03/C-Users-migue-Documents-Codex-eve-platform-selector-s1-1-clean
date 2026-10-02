import styles from "../styles/official-control-panel.module.css";



type OfficialControlPanelErrorStateProps = {

  onRetry: () => void;

};



export function OfficialControlPanelErrorState({

  onRetry,

}: OfficialControlPanelErrorStateProps) {

  return (

    <section className={styles.statePanel} role="alert">

      <h2>No fue posible preparar el panel.</h2>

      <p>

        Ocurrió un error al cargar la estructura del panel. No se consultaron

        servicios remotos.

      </p>

      <button className={styles.retryButton} onClick={onRetry} type="button">

        Reintentar

      </button>

    </section>

  );

}


