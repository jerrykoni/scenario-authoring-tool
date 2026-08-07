type ToolbarProps = {
  onAddAction: () => void;
  onAddYesNoDecision: () => void;
  onAddDialogueDecision: () => void;
  onAddNotification: () => void;
  onAddEnd: () => void;

  onSaveDiagram: () => void;
  onLoadDiagramClick: () => void;
  onClearDiagram: () => void;

  onExportScenarioJson: () => void;
  onExportPracticeSlicesJson: () => void;
  onExportLearningSlicesJson: () => void;

  onLoadSlicesClick: () => void;
  isSlicePreviewMode: boolean;
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
  onExportScenarioJson,
  onExportPracticeSlicesJson,
  onExportLearningSlicesJson,
  onLoadSlicesClick,
  isSlicePreviewMode,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      {!isSlicePreviewMode && (
        <>
          <button onClick={onAddAction}>+ Action</button>
          <button onClick={onAddYesNoDecision}>+ Yes/No Decision</button>
          <button onClick={onAddDialogueDecision}>+ Dialogue Decision</button>
          <button onClick={onAddNotification}>+ Notification</button>
          <button onClick={onAddEnd}>+ End</button>

          <span className="toolbar-divider" />

          <button onClick={onSaveDiagram}>Save Diagram</button>
          <button onClick={onLoadDiagramClick}>Load Diagram</button>
          <button onClick={onClearDiagram}>Clear</button>

          <span className="toolbar-divider" />

          <button onClick={onExportScenarioJson}>
            Export Scenario JSON
          </button>
          <button onClick={onExportPracticeSlicesJson}>
            Export Practice Slices
          </button>
          <button onClick={onExportLearningSlicesJson}>
            Export Learning Slices
          </button>
        </>
      )}

      <span className="toolbar-divider" />

      <button onClick={onLoadSlicesClick}>Load Slices JSON</button>
    </div>
  );
}