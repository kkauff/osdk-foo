import React, { useState, useRef, useEffect } from "react";
import { animated, useSpring, to } from "@react-spring/web";
import { useQuery } from "@tanstack/react-query";
import { $ontologyRid, $Objects } from "@osdk-foo/sdk";
import { Ontologies } from "@osdk/foundry";
import { client } from "../../client";
import RadialMenu, { LinkTypeOption } from "./RadialMenu";
import * as d3 from "d3-force";
import { zoom as d3Zoom } from "d3-zoom";
import { select as d3Select } from "d3-selection";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  objectType: string; // API name of the object type
  primaryKey: string; // Primary key of the object
}

interface Edge extends d3.SimulationLinkDatum<Node> {
  id: string;
  source: string | Node; // node id or node object
  target: string | Node; // node id or node object
  label: string;
}

interface ObjectTypeOption {
  value: string; // API name
  label: string; // Display name
}

interface ObjectInstanceOption {
  value: string; // Primary key
  label: string; // Title
}

interface NetworkGraphProps {
  width: number;
  height: number;
  selectedObject: ObjectInstanceOption | null;
  selectedObjectType: ObjectTypeOption | null;
}

const NODE_RADIUS = 45;

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  width,
  height,
  selectedObject,
  selectedObjectType,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [radialMenuNode, setRadialMenuNode] = useState<Node | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  // Track if we're in placement mode (new object selected but not placed)
  const [placementMode, setPlacementMode] = useState(false);
  const [pendingNode, setPendingNode] = useState<Node | null>(null);

  // Animation for pending node following cursor
  const [{ x, y }, api] = useSpring(() => ({
    x: width / 2,
    y: height / 2,
    config: { tension: 300, friction: 30 },
  }));

  // Fetch link types for the radial menu node
  const { data: linkTypes = [] } = useQuery({
    queryKey: ['linkTypes', radialMenuNode?.objectType],
    queryFn: async () => {
      if (!radialMenuNode) return [];

      const response = await Ontologies.ObjectTypesV2.listOutgoingLinkTypes(
        client,
        $ontologyRid,
        radialMenuNode.objectType
      );

      return response.data.map(link => ({
        apiName: link.apiName,
        displayName: link.displayName || link.apiName,
        multiplicity: link.cardinality === 'MANY',
      }));
    },
    enabled: !!radialMenuNode,
  });

  // When a new object is selected, enter placement mode
  useEffect(() => {
    if (selectedObject && selectedObjectType && !nodes.find(n => n.primaryKey === selectedObject.value)) {
      setPlacementMode(true);
      setPendingNode({
        id: `node-${Date.now()}`,
        label: selectedObject.label,
        x: width / 2,
        y: height / 2,
        objectType: selectedObjectType.value, // API name
        primaryKey: selectedObject.value, // Primary key
      });
      api.start({ x: width / 2, y: height / 2 });
    }
  }, [selectedObject, selectedObjectType, nodes, width, height, api]);

  // Initialize and update force simulation
  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<Node, Edge>(nodes)
        .force("link", d3.forceLink<Node, Edge>().id((d: Node) => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("collide", d3.forceCollide(NODE_RADIUS + 10))
        .alphaDecay(0.05) // Slower decay for smoother settling
        .on("tick", () => {
          setNodes([...simulationRef.current!.nodes()]);
        });
    }

    // Update simulation with new nodes and edges
    simulationRef.current.nodes(nodes);
    simulationRef.current.force<d3.ForceLink<Node, Edge>>("link")?.links(edges);

    // Only restart simulation if we have new nodes/edges
    if (nodes.length > 0 || edges.length > 0) {
      simulationRef.current.alpha(0.3).restart();
    }

    return () => {
      simulationRef.current?.stop();
    };
  }, [nodes.length, edges.length]);

  // Setup zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3Select(svgRef.current);
    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((event: any) => {
        // Only allow zoom on wheel events or when not clicking on nodes
        if (event.type === 'wheel') return true;
        if (event.type === 'dblclick') return false;
        // For mouse events, check if target is a node (g element with onMouseDown)
        const target = event.target as Element;
        return !target.closest('g[data-node]');
      })
      .on("zoom", (event: any) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
      });

    svg.call(zoomBehavior as any);

    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  // Handle mouse move during placement mode or dragging
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
    const mouseY = (event.clientY - rect.top - transform.y) / transform.k;

    if (placementMode) {
      api.start({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    } else if (draggingNode) {
      // Mark as dragging (not just a click)
      setIsDragging(true);

      // Update dragging node position in simulation
      const node = nodes.find(n => n.id === draggingNode);
      if (node && simulationRef.current) {
        node.fx = mouseX;
        node.fy = mouseY;
        simulationRef.current.alpha(0.3).restart();
      }
    }
  };

  // Handle click to place node
  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (placementMode && pendingNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = (event.clientX - rect.left - transform.x) / transform.k;
      const clickY = (event.clientY - rect.top - transform.y) / transform.k;

      // Place the node with fixed position - it stays where placed
      const newNode: Node = { ...pendingNode, x: clickX, y: clickY, fx: clickX, fy: clickY };
      setNodes([...nodes, newNode]);
      setPlacementMode(false);
      setPendingNode(null);
    }
  };

  // Handle mouse down on node to start dragging
  const handleNodeMouseDown = (event: React.MouseEvent<SVGGElement>, node: Node) => {
    event.stopPropagation();
    event.preventDefault();

    setDraggingNode(node.id);
    setIsDragging(false);
    setRadialMenuNode(null); // Close radial menu when starting drag

    // Fix node position during drag
    if (simulationRef.current) {
      node.fx = node.x;
      node.fy = node.y;
    }
  };

  // Handle mouse up to stop dragging or show radial menu
  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode);

      if (!isDragging && node) {
        // It was a click, not a drag - show radial menu
        event.stopPropagation();
        setRadialMenuNode(node);
      }

      // Release fixed position
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }

    setDraggingNode(null);
    setIsDragging(false);
  };

  // Handle link type selection
  const handleLinkSelect = async (linkType: LinkTypeOption) => {
    if (!radialMenuNode) return;

    // Get the current position of the source node from the nodes array
    const sourceNode = nodes.find(n => n.id === radialMenuNode.id);
    if (!sourceNode || sourceNode.x === undefined || sourceNode.y === undefined) {
      console.error('Source node not found or has no position');
      setRadialMenuNode(null);
      return;
    }

    console.log('Link selected:', linkType);
    console.log('Source node:', sourceNode);

    try {
      // Get the object type definition from $Objects
      const objectTypeDef = ($Objects as any)[sourceNode.objectType];

      if (!objectTypeDef) {
        console.error(`Object type ${sourceNode.objectType} not found in $Objects`);
        setRadialMenuNode(null);
        return;
      }

      console.log('Fetching object type metadata to get primary key field...');

      // Fetch object type metadata to get the primary key property name
      const objectTypeMetadata = await Ontologies.ObjectTypesV2.get(
        client,
        $ontologyRid,
        sourceNode.objectType
      );

      const primaryKeyField = objectTypeMetadata.primaryKey;
      console.log('Primary key field:', primaryKeyField);

      // Create object set with filter on the actual primary key field
      const objectSet = client(objectTypeDef).where({
        [primaryKeyField]: sourceNode.primaryKey
      } as any);

      console.log('Fetching linked objects via pivotTo...');

      // Pivot to linked objects
      const linkedObjectsSet = objectSet.pivotTo(linkType.apiName as any);
      const response = await linkedObjectsSet.fetchPage({ $pageSize: 100 });

      console.log('Linked objects response:', response);

      const linkedObjects = response.data;

      if (!linkedObjects || linkedObjects.length === 0) {
        console.log('No linked objects found');
        setRadialMenuNode(null);
        return;
      }

      // Add linked objects as nodes
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      linkedObjects.forEach((linkedObj: any, index: number) => {
        const nodeId = `node-${Date.now()}-${index}`;

        console.log('Adding node:', linkedObj);

        // Extract the primary key and object type
        const linkedPrimaryKey = linkedObj.$primaryKey || 'unknown';
        const linkedObjectType = linkedObj.$objectType || sourceNode.objectType;

        // Use $title if available, otherwise fall back to $primaryKey
        const nodeLabel = linkedObj.$title || linkedPrimaryKey;

        // Add node near the source node, force simulation will position it properly
        const angle = (index / linkedObjects.length) * 2 * Math.PI;
        const distance = 200;
        const initialX = sourceNode.x! + Math.cos(angle) * distance;
        const initialY = sourceNode.y! + Math.sin(angle) * distance;

        newNodes.push({
          id: nodeId,
          label: nodeLabel,
          x: initialX,
          y: initialY,
          objectType: linkedObjectType,
          primaryKey: linkedPrimaryKey,
        });

        newEdges.push({
          id: `edge-${Date.now()}-${index}`,
          source: sourceNode.id,
          target: nodeId,
          label: linkType.displayName,
        });
      });

      console.log('Adding nodes:', newNodes);
      console.log('Adding edges:', newEdges);

      // Add new nodes and edges to state
      const updatedNodes = [...nodes, ...newNodes];
      const updatedEdges = [...edges, ...newEdges];

      setNodes(updatedNodes);
      setEdges(updatedEdges);

      // Immediately update the simulation with new data
      if (simulationRef.current) {
        simulationRef.current.nodes(updatedNodes);
        simulationRef.current.force<d3.ForceLink<Node, Edge>>("link")?.links(updatedEdges);
        simulationRef.current.alpha(0.5).restart();
      }

      setRadialMenuNode(null); // Close radial menu
    } catch (error) {
      console.error('Error fetching linked objects:', error);
      console.error('Error details:', {
        objectType: sourceNode.objectType,
        primaryKey: sourceNode.primaryKey,
        linkType: linkType.apiName,
      });
      setRadialMenuNode(null);
    }
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      style={{ cursor: placementMode ? 'crosshair' : draggingNode ? 'grabbing' : 'default' }}
    >
      <rect width={width} height={height} fill="transparent" />

      <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
        {/* Render edges */}
        {edges.map((edge) => {
          const sourceNode = typeof edge.source === 'string'
            ? nodes.find(n => n.id === edge.source)
            : edge.source;
          const targetNode = typeof edge.target === 'string'
            ? nodes.find(n => n.id === edge.target)
            : edge.target;

          if (!sourceNode || !targetNode || sourceNode.x === undefined || targetNode.x === undefined) return null;

          return (
            <line
              key={edge.id}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="var(--border-color)"
              strokeWidth={2}
              opacity={0.6}
            />
          );
        })}

        {/* Render placed nodes */}
        {nodes.map((node) => {
          if (node.x === undefined || node.y === undefined) return null;

          const isDraggingThis = draggingNode === node.id;

          return (
            <g
              key={node.id}
              data-node="true"
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              style={{ cursor: isDraggingThis ? 'grabbing' : 'grab' }}
            >
              <circle
                r={NODE_RADIUS}
                fill="var(--node-color)"
                opacity={isDraggingThis ? 0.7 : 1}
              />
              <text
                textAnchor="middle"
                dy=".33em"
                fontSize={14}
                fill="var(--text-color)"
                fontWeight="bold"
                pointerEvents="none"
              >
                {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
              </text>
            </g>
          );
        })}

        {/* Render radial menu */}
        {radialMenuNode && linkTypes.length > 0 && radialMenuNode.x !== undefined && radialMenuNode.y !== undefined && (
          <RadialMenu
            x={radialMenuNode.x}
            y={radialMenuNode.y}
            linkTypes={linkTypes}
            onSelect={handleLinkSelect}
          />
        )}
      </g>

      {/* Render pending node (follows cursor) - outside zoom transform */}
      {placementMode && pendingNode && (
        <animated.g
          transform={to([x, y], (xVal, yVal) => `translate(${xVal}, ${yVal})`)}
          style={{ pointerEvents: 'none' }}
        >
          <circle
            r={NODE_RADIUS}
            fill="var(--node-color)"
            stroke="var(--text-color)"
            strokeWidth={2}
            strokeDasharray="5,5"
            opacity={0.5}
          />
          <text
            textAnchor="middle"
            dy=".33em"
            fontSize={14}
            fill="var(--text-color)"
            fontWeight="bold"
          >
            {pendingNode.label.length > 15 ? pendingNode.label.substring(0, 15) + '...' : pendingNode.label}
          </text>
        </animated.g>
      )}
    </svg>
  );
};

export default NetworkGraph;
