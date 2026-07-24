type ToolbarProps = {
  onAddAction: () => void;
  onAddYesNoDecision: () => void;
  onAddDialogueDecision: () => void;
  onAddNotification: () => void;
  onAddEnd: () => void;

  onSaveDiagram: () => void;
  onLoadDiagramClick: () => void;
  onClearDiagram: () => void;
};

export function Toolbar({
  onAddAction,
  onAddYesNoDecision,
  onAddDialogueDecision,
  onAddNotification,
  onAddEnd,
  onSaveDiagram,
  onLoadDiagramClick,
  onClearDiagram,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button onClick={onAddAction}>+ Action</button>
      <button onClick={onAddYesNoDecision}>+ Yes/No Decision</button>
      <button onClick={onAddDialogueDecision}>+ Dialogue Decision</button>
      <button onClick={onAddNotification}>+ Notification</button>
      <button onClick={onAddEnd}>+ End</button>

      <span className="toolbar-divider" />

      <button onClick={onSaveDiagram}>Save Diagram</button>
      <button onClick={onLoadDiagramClick}>Load Diagram</button>
      <button onClick={onClearDiagram}>Clear</button>
    </div>
  );
}