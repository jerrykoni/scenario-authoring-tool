type ToolbarProps = {
  onAddObserve: () => void;
  onAddAction: () => void;
  onAddYesNoDecision: () => void;
  onAddEnd: () => void;

  onSaveDiagram: () => void;
  onLoadDiagramClick: () => void;
  onClearDiagram: () => void;
};

export function Toolbar({
  onAddObserve,
  onAddAction,
  onAddYesNoDecision,
  onAddEnd,
  onSaveDiagram,
  onLoadDiagramClick,
  onClearDiagram,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button onClick={onAddObserve}>+ Observe</button>
      <button onClick={onAddAction}>+ Action</button>
      <button onClick={onAddYesNoDecision}>+ Yes/No Decision</button>
      <button onClick={onAddEnd}>+ End</button>

      <span className="toolbar-divider" />

      <button onClick={onSaveDiagram}>Save Diagram</button>
      <button onClick={onLoadDiagramClick}>Load Diagram</button>
      <button onClick={onClearDiagram}>Clear</button>
    </div>
  );
}