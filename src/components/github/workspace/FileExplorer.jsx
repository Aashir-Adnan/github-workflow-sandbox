import { useState, useEffect, useCallback } from "react";
import { Folder, FolderOpen, File, Check, ChevronRight } from "lucide-react";
import { ghFetch } from "../api";

function buildTree(flat) {
  const map = {};
  const roots = [];
  for (const item of flat) map[item.path] = { ...item, children: [] };
  for (const item of flat) {
    const parts = item.path.split("/");
    if (parts.length === 1) roots.push(map[item.path]);
    else {
      const parentPath = parts.slice(0, -1).join("/");
      if (map[parentPath]) map[parentPath].children.push(map[item.path]);
    }
  }
  const sort = (arr) => {
    arr.sort((a, b) =>
      a.type === b.type
        ? a.path.localeCompare(b.path)
        : a.type === "tree"
          ? -1
          : 1,
    );
    for (const node of arr) sort(node.children);
    return arr;
  };
  return sort(roots);
}

function TreeNode({ nodes, expanded, onToggle, onSelect, selected, depth }) {
  return (
    <ul style={{ paddingLeft: depth === 0 ? 0 : "1rem" }}>
      {nodes.map((node) => {
        const isDir = node.type === "tree";
        const isOpen = expanded.has(node.path);
        const isSelected = selected.includes(node.path);
        const name = node.path.split("/").pop();
        return (
          <li key={node.path} className="mb-0.5">
            <button
              type="button"
              onClick={() =>
                isDir ? onToggle(node.path) : onSelect(node.path)
              }
              className={`
                w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px]
                transition-all duration-150 text-left group
                ${
                  isSelected
                    ? "bg-[#0969DA]/10 dark:bg-[#1F6FEB]/15 text-[#0969DA] dark:text-[#58A6FF]"
                    : "text-[#1F2328] dark:text-[#E6EDF3] hover:bg-[#F6F8FA] dark:hover:bg-[#161B22]"
                }
              `}
            >
              {isDir ? (
                <>
                  {isOpen ? (
                    <FolderOpen
                      size={14}
                      className="shrink-0 text-[#0969DA] dark:text-[#58A6FF]"
                    />
                  ) : (
                    <Folder
                      size={14}
                      className="shrink-0 text-[#8B949E] group-hover:text-[#0969DA] dark:group-hover:text-[#58A6FF]"
                    />
                  )}
                </>
              ) : (
                <File
                  size={14}
                  className="shrink-0 text-[#8B949E] group-hover:text-[#0969DA] dark:group-hover:text-[#58A6FF]"
                />
              )}
              <span className="truncate flex-1">{name}</span>
              {!isDir && isSelected && (
                <Check
                  size={12}
                  className="shrink-0 text-[#0969DA] dark:text-[#58A6FF]"
                />
              )}
              {isDir && isOpen && (
                <ChevronRight
                  size={12}
                  className="shrink-0 text-[#8B949E] rotate-90 transition-transform"
                />
              )}
              {isDir && !isOpen && (
                <ChevronRight
                  size={12}
                  className="shrink-0 text-[#8B949E] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </button>
            {isDir && isOpen && node.children.length > 0 && (
              <TreeNode
                nodes={node.children}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
                selected={selected}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function FileExplorer({ owner, repo, onSelect, selected }) {
  const [tree, setTree] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    ghFetch(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`)
      .then((data) => setTree(data.tree || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const toggle = useCallback((path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (path) => {
      onSelect((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
      );
    },
    [onSelect],
  );

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-[#0969DA]/30 border-t-[#0969DA] rounded-full animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="text-[12px] text-red-500 px-2 py-4 text-center">
        <p className="font-medium">Error loading files</p>
        <p className="text-[11px] mt-1 opacity-70">{error}</p>
      </div>
    );
  if (!tree) return null;

  return (
    <TreeNode
      nodes={buildTree(tree)}
      expanded={expanded}
      onToggle={toggle}
      onSelect={handleSelect}
      selected={selected}
      depth={0}
    />
  );
}
