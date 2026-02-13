import { Spinner } from "@blueprintjs/core";
import { SpinnerSize } from "@blueprintjs/core/lib/esm/components/spinner/spinner";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { loadUser, loadAircraft } from "../../store/features/osdk/osdkSlice";
import { RootState } from "../../store/store";
import styles from "./App.module.scss";


export const AppAuthGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

const App: React.FC = () => {
  const { t } = useTranslation();


  const loading = false; 
  const user = useSelector((state: RootState) => state.osdk.user);
  const loadingUser = useSelector((state: RootState) => state.osdk.loadingUser);
  const aircraft = useSelector((state: RootState) => state.osdk.aircraft);
  const loadingAircraft = useSelector((state: RootState) => state.osdk.loadingAircraft);


  const dispatch = useDispatch();


  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      {loading && (
        <div className="spinner-overlay">
          <Spinner intent="primary" size={SpinnerSize.LARGE} />
        </div>
      )}
      <h1 className={styles.titleBar}>{t('title')}</h1>
      <div className="main-container">
        <div className="content-container">
        <div>
          <div className={styles.greeting}>
            {loadingUser ? (
              <Spinner size={SpinnerSize.SMALL} />
            ) : (
              `${t('greeting')} ${(user?.givenName + " " + user?.familyName) || "World"}`
            )}
          </div>

          <button
            className={styles.loadButton}
            onClick={() => dispatch(loadAircraft())}
            disabled={loadingAircraft}
          >
            {loadingAircraft ? t('loading') : t('loadAircraft')}
          </button>

          {loadingAircraft && (
            <div style={{ marginTop: '20px' }}>
              <Spinner size={SpinnerSize.STANDARD} />
            </div>
          )}

          {!loadingAircraft && aircraft.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.aircraftTable}>
                <thead>
                  <tr>
                    <th>Tail Number</th>
                    <th>Manufacturer</th>
                    <th>Model</th>
                    <th>Carrier</th>
                    <th>Seats</th>
                    <th>Acquisition Date</th>
                  </tr>
                </thead>
                <tbody>
                  {aircraft.map((ac, index) => (
                    <tr key={index}>
                      <td>{ac.tailNum}</td>
                      <td>{ac.manufacturer}</td>
                      <td>{ac.model}</td>
                      <td>{ac.carrierName}</td>
                      <td>{ac.numberOfSeats}</td>
                      <td>{ac.acquisitionDate ? new Date(ac.acquisitionDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default App;
