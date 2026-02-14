import { Spinner } from "@blueprintjs/core";
import { SpinnerSize } from "@blueprintjs/core/lib/esm/components/spinner/spinner";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { loadUser } from "../../store/features/osdk/osdkSlice";
import { RootState } from "../../store/store";
import GraphContainer from "../graph/GraphContainer";
import CommandPalette from "../commandPalette/CommandPalette";
import styles from "./App.module.scss";


export const AppAuthGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

interface ObjectTypeOption {
  value: string;
  label: string;
  description?: string;
}

interface ObjectInstanceOption {
  value: string;
  label: string;
}

const App: React.FC = () => {
  const { t } = useTranslation();
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectTypeOption | null>(null);
  const [selectedObject, setSelectedObject] = useState<ObjectInstanceOption | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const loading = false;
  const user = useSelector((state: RootState) => state.osdk.user);
  const loadingUser = useSelector((state: RootState) => state.osdk.loadingUser);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Handle Cmd+O / Ctrl+O keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectObject = (objectType: ObjectTypeOption, object: ObjectInstanceOption) => {
    setSelectedObjectType(objectType);
    setSelectedObject(object);
  };

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
          <div className={styles.appContent}>
            <div className={styles.greeting}>
              {loadingUser ? (
                <Spinner size={SpinnerSize.SMALL} />
              ) : (
                `${t('greeting')} ${(user?.givenName + " " + user?.familyName) || "World"}`
              )}
            </div>

            <GraphContainer
              selectedObjectType={selectedObjectType}
              selectedObject={selectedObject}
            />
          </div>
        </div>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectObject={handleSelectObject}
      />
    </>
  );
};

export default App;
