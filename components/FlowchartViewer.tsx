"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  X, 
  RotateCcw, 
  Lock, 
  MapPin, 
  Sparkles, 
  GitBranch, 
  Anchor, 
  CheckCircle2, 
  Radio, 
  Info,
  Maximize2,
  Minimize2,
  Shield,
  Heart,
  Compass
} from "lucide-react";
import { StoryFlowNode, VisitedStoryNode } from "@/types/story";

// ==========================================
// CUSTOM NODE COMPONENTS FOR REACTFLOW
// ==========================================

const VisitedCustomNode = ({ data }: { data: any }) => {
  const isCurrent = data.isCurrent;
  const isAnchor = data.isAnchor;
  const isStartingPoint = data.isStartingPoint;

  return (
    <div
      className={`w-72 sm:w-80 rounded-2xl p-4 transition-all duration-300 shadow-xl backdrop-blur-xl ${
        isCurrent
          ? "bg-zinc-950/95 border-2 border-cyan-400 ring-4 ring-cyan-500/20 shadow-[0_0_25px_rgba(34,211,238,0.35)]"
          : isStartingPoint
          ? "bg-zinc-950/95 border-2 border-purple-500 ring-2 ring-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          : "bg-zinc-950/90 border border-rose-500/50 hover:border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.18)]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-zinc-950 transition-transform hover:scale-125"
      />

      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10 text-[11px]">
        <div className="flex items-center gap-1.5 font-mono">
          {isCurrent ? (
            <span className="flex items-center gap-1 text-cyan-300 font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-[10px]">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" /> Current Turn
            </span>
          ) : isStartingPoint ? (
            <span className="flex items-center gap-1 text-purple-300 font-bold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-[10px]">
              <Sparkles className="w-3 h-3 text-purple-400" /> Chosen Origin
            </span>
          ) : isAnchor ? (
            <span className="flex items-center gap-1 text-rose-300 font-bold px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-[10px]">
              <Anchor className="w-3 h-3 text-rose-400" /> Anchor Reality
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-300 font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Visited
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-400 font-mono text-[10px] truncate max-w-[120px]">
          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate">{data.location || "Imperial Capital"}</span>
        </div>
      </div>

      {/* Title & Speaker */}
      <div className="mb-2">
        <h4 className="text-sm font-bold text-zinc-100 font-serif leading-snug line-clamp-1">
          {data.title || "Story Node"}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-rose-300/90 font-mono">
          <Sparkles className="w-3 h-3 text-rose-400" />
          <span>{data.speaker || "Narrator"}</span>
        </div>
      </div>

      {/* Choice or Summary */}
      <p className="text-[11px] text-zinc-300/80 line-clamp-2 leading-relaxed mb-3 font-sans">
        {data.choiceTaken ? `Choice: "${data.choiceTaken}"` : data.summary || "Visited narrative point in timeline."}
      </p>

      {/* Affection Snapshot Chips if available */}
      {data.affectionSnapshot && Object.keys(data.affectionSnapshot).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 pt-2 border-t border-white/5">
          {Object.entries(data.affectionSnapshot).slice(0, 3).map(([heroine, val]) => (
            <span
              key={heroine}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-[9px] font-mono text-zinc-300"
            >
              <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500/60" />
              <span>{heroine.split(" ")[0]}: {String(val)}%</span>
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
        {isCurrent ? (
          <div className="w-full text-center py-1.5 text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/40 rounded-xl border border-cyan-500/30">
            Protagonist is here now
          </div>
        ) : (
          <button
            onClick={() => data.onJump && data.onJump(data.visitedSnapshot || data)}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-rose-500/25 cursor-pointer active:scale-95"
            title="Load this timeline anchor and restore past game state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Jump to Anchor</span>
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-zinc-950 transition-transform hover:scale-125"
      />
    </div>
  );
};

const LockedSilhouetteCustomNode = ({ data }: { data: any }) => {
  const isStartingPoint = data.isStartingPoint;

  return (
    <div className={`w-72 sm:w-80 rounded-2xl p-4 bg-zinc-950/85 border border-dashed shadow-lg backdrop-blur-md transition-all duration-300 hover:opacity-100 ${
      isStartingPoint 
        ? "border-purple-600/60 opacity-90 hover:border-purple-400" 
        : "border-zinc-700/80 opacity-85 hover:border-amber-500/60"
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-950"
      />

      {/* Locked Header */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800 text-[11px]">
        {isStartingPoint ? (
          <span className="flex items-center gap-1 text-purple-400/90 font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/50 border border-purple-500/30 text-[10px]">
            <Compass className="w-3 h-3 text-purple-400" /> Alternate Origin
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-400/90 font-mono font-bold px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-500/30 text-[10px]">
            <Lock className="w-3 h-3 text-amber-400" /> Locked Branch
          </span>
        )}

        <span className="text-zinc-500 font-mono text-[10px]">
          {isStartingPoint ? "Unselected Timeline" : "Uncharted Reality"}
        </span>
      </div>

      {/* Obfuscated Title & Speaker */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-zinc-300 font-serif leading-snug line-clamp-1">
          {data.title || "Unexplored Divergence"}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500 font-mono">
          <Sparkles className="w-3 h-3 text-zinc-600" />
          <span>{data.speaker || "Unknown Entity"}</span>
        </div>
      </div>

      {/* Silhouette Requirement Banner */}
      <div className={`my-2.5 p-2 rounded-xl border flex items-start gap-2 ${
        isStartingPoint 
          ? "bg-purple-950/30 border-purple-500/30 text-purple-300"
          : "bg-amber-950/30 border-amber-500/30 text-amber-300"
      }`}>
        <Shield className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isStartingPoint ? "text-purple-400" : "text-amber-400"}`} />
        <span className="text-[11px] font-mono font-medium leading-tight">
          {data.unlockRequirement?.hintSilhouette || (isStartingPoint ? `Select ${data.speaker} in Character Creation to begin this timeline.` : "Locked: Narrative conditions not met.")}
        </span>
      </div>

      {/* Summary */}
      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mb-3 italic">
        {data.summary || "This branching path remains shrouded in causal indeterminacy."}
      </p>

      {/* Disabled Action */}
      <div className="pt-2 border-t border-zinc-900 flex items-center justify-center">
        <div className="w-full text-center py-1 text-[10px] font-mono text-zinc-500 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-center gap-1 select-none">
          <Lock className="w-3 h-3 text-zinc-600" /> {isStartingPoint ? "Select at Creator" : "Prerequisite Required"}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-950"
      />
    </div>
  );
};

// Node types registry
const nodeTypes = {
  visitedNode: VisitedCustomNode,
  lockedNode: LockedSilhouetteCustomNode,
};

// ==========================================
// MAIN FLOWCHART VIEWER MODAL
// ==========================================

export interface FlowchartViewerProps {
  isOpen: boolean;
  onClose: () => void;
  flowchartTree?: StoryFlowNode[];
  visitedNodes?: VisitedStoryNode[];
  currentNodeKey?: string;
  onJumpToAnchor?: (node: VisitedStoryNode) => void;
}

export function FlowchartViewer({
  isOpen,
  onClose,
  flowchartTree = [],
  visitedNodes = [],
  currentNodeKey = "prologue_root",
  onJumpToAnchor,
}: FlowchartViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterSpeaker, setFilterSpeaker] = useState<string>("all");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle jump action with sound/feedback
  const handleJump = useCallback(
    (nodeData: VisitedStoryNode) => {
      if (onJumpToAnchor) {
        onJumpToAnchor(nodeData);
      }
    },
    [onJumpToAnchor]
  );

  // Compute graph nodes and edges with auto-layout
  const { initialNodes, initialEdges, startingOrigins, visitedMap } = useMemo(() => {
    if (!isOpen) {
      return { initialNodes: [], initialEdges: [], startingOrigins: [], visitedMap: new Map<string, VisitedStoryNode>() };
    }

    // Default fallback nodes if tree is empty
    const nodesSource: StoryFlowNode[] =
      flowchartTree && flowchartTree.length > 0
        ? flowchartTree
        : [
            {
              id: "node_prologue_root",
              nodeKey: "prologue_root",
              title: "The Mage Tower Arrival",
              speaker: "Evelyn Abbandonato",
              location: "Imperial Capital Imperium",
              summary: "Encounter with High Arcanist Evelyn amidst planar fluctuations.",
              isStartingPoint: true,
              connectedTo: ["node_evelyn_study", "node_undercroft_covert"],
            },
          ];

    // Build visited map
    const vMap = new Map<string, VisitedStoryNode>();
    (visitedNodes || []).forEach((vn) => {
      vMap.set(vn.id, vn);
      vMap.set(vn.nodeKey, vn);
      if (vn.nodeKey && !vn.nodeKey.startsWith("node_")) {
        vMap.set(`node_${vn.nodeKey}`, vn);
      }
      if (vn.id && vn.id.startsWith("node_")) {
        vMap.set(vn.id.replace("node_", ""), vn);
      }
    });

    // In-degree computation for hierarchy
    const inDegree = new Map<string, number>();
    nodesSource.forEach((n) => inDegree.set(n.id, 0));
    nodesSource.forEach((n) => {
      (n.connectedTo || []).forEach((childId) => {
        inDegree.set(childId, (inDegree.get(childId) || 0) + 1);
      });
    });

    // Determine all starting scenario origins (inDegree === 0 or explicit starting point)
    const roots = nodesSource.filter((n) => {
      return (
        n.isStartingPoint ||
        (inDegree.get(n.id) || 0) === 0 ||
        n.id.startsWith("node_prologue") ||
        n.nodeKey.startsWith("prologue_")
      );
    });

    // If visitedNodes is completely empty, activate the root matching currentNodeKey
    if (visitedNodes.length === 0 && nodesSource.length > 0) {
      const targetStart =
        nodesSource.find((n) => n.id === currentNodeKey || n.nodeKey === currentNodeKey) ||
        roots[0] ||
        nodesSource[0];

      vMap.set(targetStart.id, {
        id: targetStart.id,
        nodeKey: targetStart.nodeKey,
        title: targetStart.title,
        speaker: targetStart.speaker,
        location: targetStart.location,
        visitedAt: new Date().toISOString(),
        isAnchor: true,
        isStartingPoint: true,
      });
      vMap.set(targetStart.nodeKey, {
        id: targetStart.id,
        nodeKey: targetStart.nodeKey,
        title: targetStart.title,
        speaker: targetStart.speaker,
        location: targetStart.location,
        visitedAt: new Date().toISOString(),
        isAnchor: true,
        isStartingPoint: true,
      });
    }

    // Graph hierarchy & depth assignment via BFS from all starting points
    const queue: { id: string; depth: number }[] = (roots.length > 0 ? roots : [nodesSource[0]]).map((r) => ({
      id: r.id,
      depth: 0,
    }));

    const nodeDepths = new Map<string, number>();
    queue.forEach((q) => nodeDepths.set(q.id, 0));

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const node = nodesSource.find((n) => n.id === id);
      if (!node) continue;

      (node.connectedTo || []).forEach((childId) => {
        const nextDepth = depth + 1;
        if (!nodeDepths.has(childId) || (nodeDepths.get(childId) || 0) < nextDepth) {
          nodeDepths.set(childId, nextDepth);
          queue.push({ id: childId, depth: nextDepth });
        }
      });
    }

    // Group nodes by depth level
    const levelGroups = new Map<number, StoryFlowNode[]>();
    nodesSource.forEach((n) => {
      const d = nodeDepths.get(n.id) || 0;
      if (!levelGroups.has(d)) levelGroups.set(d, []);
      levelGroups.get(d)!.push(n);
    });

    // Generate Layout Positions
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const HORIZONTAL_SPACING = 360;
    const VERTICAL_SPACING = 280;

    levelGroups.forEach((groupNodes, depth) => {
      const totalWidth = (groupNodes.length - 1) * HORIZONTAL_SPACING;
      const startX = 600 - totalWidth / 2;

      groupNodes.forEach((node, idx) => {
        const isVisited = vMap.has(node.id) || vMap.has(node.nodeKey);
        const visitedSnapshot = vMap.get(node.id) || vMap.get(node.nodeKey);
        const isCurrent =
          node.nodeKey === currentNodeKey ||
          node.id === currentNodeKey ||
          (visitedSnapshot && visitedSnapshot.nodeKey === currentNodeKey);

        const isStartingPoint = Boolean(
          node.isStartingPoint ||
          node.id.startsWith("node_prologue") ||
          node.nodeKey.startsWith("prologue_") ||
          (inDegree.get(node.id) || 0) === 0
        );

        const matchesFilter =
          filterSpeaker === "all" ||
          node.speaker?.toLowerCase().includes(filterSpeaker.toLowerCase()) ||
          (visitedSnapshot && visitedSnapshot.speaker?.toLowerCase().includes(filterSpeaker.toLowerCase()));

        const xPos = startX + idx * HORIZONTAL_SPACING;
        const yPos = 80 + depth * VERTICAL_SPACING;

        nodes.push({
          id: node.id,
          type: isVisited ? "visitedNode" : "lockedNode",
          position: { x: xPos, y: yPos },
          style: {
            opacity: matchesFilter ? 1 : 0.22,
            transition: "opacity 0.3s ease",
          },
          data: {
            ...node,
            isVisited,
            isCurrent,
            isStartingPoint,
            isAnchor: visitedSnapshot?.isAnchor ?? false,
            choiceTaken: visitedSnapshot?.choiceTaken,
            visitedAt: visitedSnapshot?.visitedAt,
            affectionSnapshot: visitedSnapshot?.affectionSnapshot,
            visitedSnapshot,
            onJump: handleJump,
          },
        });

        // Add directed edges
        (node.connectedTo || []).forEach((targetId) => {
          const isTargetVisited = vMap.has(targetId);
          const isEdgeActive = isVisited && isTargetVisited;

          edges.push({
            id: `edge_${node.id}_to_${targetId}`,
            source: node.id,
            target: targetId,
            animated: isEdgeActive,
            style: {
              stroke: isEdgeActive ? "#f43f5e" : "#52525b",
              strokeWidth: isEdgeActive ? 2.5 : 1.5,
              strokeDasharray: isEdgeActive ? undefined : "6,6",
              opacity: matchesFilter ? 1 : 0.2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isEdgeActive ? "#f43f5e" : "#52525b",
              width: 16,
              height: 16,
            },
          });
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges, startingOrigins: roots, visitedMap: vMap };
  }, [isOpen, flowchartTree, visitedNodes, currentNodeKey, filterSpeaker, handleJump]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  if (!isOpen) return null;

  const totalVisited = visitedNodes.length > 0 ? visitedNodes.length : 1;
  const totalNodes = flowchartTree.length > 0 ? flowchartTree.length : initialNodes.length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[90vh] max-w-7xl"
        }`}
      >
        {/* TOP GLOW LINE */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent" />

        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">
                  Interactive Narrative Flowchart
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Multiverse Tree
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Inspect opening vectors, timeline branches, or Jump to Anchor states instantly.
              </p>
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2">
            {/* Quick Stats Pill */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  Discovered: <strong className="text-white">{totalVisited}</strong> / {totalNodes}
                </span>
              </span>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
              title="Close Flowchart (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ORIGIN SCENARIOS FILTER BAR */}
        {startingOrigins.length > 1 && (
          <div className="px-6 py-2.5 bg-black/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-zinc-500 shrink-0 font-bold flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Scenario Origin:
            </span>
            <button
              onClick={() => setFilterSpeaker("all")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer text-[10px] shrink-0 ${
                filterSpeaker === "all"
                  ? "bg-cyan-950/80 border border-cyan-500 text-cyan-300 font-bold"
                  : "bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              All Origins ({startingOrigins.length})
            </button>
            {startingOrigins.map((orig) => {
              const isSelected = filterSpeaker === orig.speaker;
              const isThisVisited = visitedMap.has(orig.id) || visitedMap.has(orig.nodeKey);
              return (
                <button
                  key={orig.id}
                  onClick={() => setFilterSpeaker(orig.speaker)}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer text-[10px] shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-rose-950/80 border border-rose-500 text-rose-200 font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                      : "bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isThisVisited ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <span>{orig.speaker.split(" ")[0]} Origin</span>
                  {isThisVisited && (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">(Active)</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* FLOWCHART CANVAS */}
        <div className="relative flex-1 w-full h-full bg-zinc-950 select-none">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={1.5}
            attributionPosition="bottom-left"
          >
            <Background color="#27272a" gap={24} size={1.2} />
            <Controls className="!bg-zinc-900 !border !border-white/10 !rounded-2xl !overflow-hidden !shadow-xl [&>button]:!bg-zinc-900 [&>button]:!border-b [&>button]:!border-white/10 [&>button]:!text-zinc-200 hover:[&>button]:!bg-zinc-800" />
            <MiniMap
              className="!bg-zinc-950/90 !border !border-white/10 !rounded-2xl !overflow-hidden !shadow-2xl hidden sm:block"
              nodeColor={(n) => {
                if (n.data?.isCurrent) return "#22d3ee";
                if (n.data?.isStartingPoint) return "#a855f7";
                if (n.data?.isVisited) return "#f43f5e";
                return "#3f3f46";
              }}
              maskColor="rgba(0, 0, 0, 0.75)"
            />
          </ReactFlow>

          {/* BOTTOM FLOATING LEGEND */}
          <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 shadow-xl font-mono text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <span>Current Turn</span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
              <span>Chosen Origin</span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <span>Visited Reality</span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 border border-zinc-500" />
              <span>Locked Silhouette</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
