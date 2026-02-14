import React from "react";
import { ParentSize } from "@visx/responsive";
import NetworkGraph from "./NetworkGraph";
import styles from "./GraphContainer.module.scss";

interface ObjectTypeOption {
  value: string;
  label: string;
}

interface ObjectInstanceOption {
  value: string;
  label: string;
}

interface GraphContainerProps {
  selectedObjectType: ObjectTypeOption | null;
  selectedObject: ObjectInstanceOption | null;
}

const GraphContainer: React.FC<GraphContainerProps> = ({ selectedObjectType, selectedObject }) => {
  return (
    <div className={styles.containerWrapper}>
      <div className={styles.hint}>
        <span className={styles.shortcut}>⌘O</span> to add an object
      </div>
      <div className={styles.graphContainer}>
        <ParentSize>
          {({ width, height }) => (
            <NetworkGraph
              width={width}
              height={height}
              selectedObject={selectedObject}
              selectedObjectType={selectedObjectType}
            />
          )}
        </ParentSize>
      </div>
    </div>
  );
};

export default GraphContainer;
