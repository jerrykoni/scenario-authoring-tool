import { useEffect, useState } from 'react';
import type {
  SlicePackage,
  SlicePreviewNodeInfo,
} from '../scenario/slicePreview';

type SliceManagerPanelProps = {
  slicePackage: SlicePackage | null;
  selectedPreviewInfo: SlicePreviewNodeInfo | null;
  onUpdateSliceTitle: (sliceId: string, title: string) => void;
  onExportUpdatedSlices: () => void;
  onClosePreview: () => void;
};

function formatValue(value: unknown) {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function SliceManagerPanel({
  slicePackage,
  selectedPreviewInfo,
  onUpdateSliceTitle,
  onExportUpdatedSlices,
  onClosePreview,
}: SliceManagerPanelProps) {
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slicePackage) {
      setTitleDrafts({});
      return;
    }

    const nextDrafts: Record<string, string> = {};

    slicePackage.slices.forEach((slice) => {
      nextDrafts[slice.sliceId] = slice.title;
    });

    setTitleDrafts(nextDrafts);
  }, [slicePackage]);

  if (!slicePackage) {
    return (
      <aside className="slice-panel">
        <h2>Slice Preview</h2>
        <p className="inspector-empty">Load a slice JSON file to preview it.</p>
      </aside>
    );
  }

  function updateDraft(sliceId: string, value: string) {
    setTitleDrafts((currentDrafts) => ({
      ...currentDrafts,
      [sliceId]: value,
    }));
  }

  function commitDraft(sliceId: string) {
    const draftTitle = titleDrafts[sliceId];

    if (draftTitle === undefined) {
      return;
    }

    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    onUpdateSliceTitle(sliceId, trimmedTitle);
  }

  return (
    <aside className="slice-panel">
      <div className="slice-panel__header">
        <div>
          <h2>Slice Preview</h2>
          <p>
            {slicePackage.mode} · {slicePackage.slices.length} slices
          </p>
        </div>

        <button onClick={onClosePreview}>Back to Graph</button>
      </div>

      <button
        className="slice-panel__export-button"
        onClick={onExportUpdatedSlices}
      >
        Export Updated Slices
      </button>

      {selectedPreviewInfo && (
        <div className="slice-panel__details">
          <h3>Selected Node</h3>

          <div className="slice-panel__detail-row">
            <strong>Slice:</strong> {selectedPreviewInfo.sliceId}
          </div>

          <div className="slice-panel__detail-row">
            <strong>Node ID:</strong> {selectedPreviewInfo.nodeId}
          </div>

          <div className="slice-panel__detail-row">
            <strong>Title:</strong> {selectedPreviewInfo.title}
          </div>

          <div className="slice-panel__detail-row">
            <strong>Kind:</strong> {selectedPreviewInfo.kind}
          </div>

          {selectedPreviewInfo.correctChoiceId && (
            <div className="slice-panel__detail-row">
              <strong>Correct choice:</strong>{' '}
              {selectedPreviewInfo.correctChoiceId}
            </div>
          )}

          {selectedPreviewInfo.stateRevealNodeIds.length > 0 && (
            <div className="slice-panel__detail-row">
              <strong>State reveal node IDs:</strong>{' '}
              {selectedPreviewInfo.stateRevealNodeIds.join(', ')}
            </div>
          )}

          {selectedPreviewInfo.loop?.startsLoop && (
            <div
              className="slice-panel__detail-row"
              title={`This step starts a loop back to ${selectedPreviewInfo.loop.targetNodeId ?? 'an earlier node'}.`}
            >
              <strong>Loop:</strong> starts loop to{' '}
              {selectedPreviewInfo.loop.targetNodeId ?? 'unknown target'}
            </div>
          )}

          {selectedPreviewInfo.revealedStateEntries.length > 0 && (
            <div className="slice-panel__state-list">
              <strong>State entries:</strong>

              {selectedPreviewInfo.revealedStateEntries.map((entry) => (
                <div key={`${entry.key}-${entry.sourceNodeId}`}>
                  <code>{entry.key}</code> = {formatValue(entry.value)}
                  <br />
                  <small>
                    timing: {entry.applyTiming}, source:{' '}
                    {entry.sourceNodeId}
                  </small>
                </div>
              ))}
            </div>
          )}

          {selectedPreviewInfo.notificationContextPatch && (
            <div className="slice-panel__state-list">
              <strong>Notification context patch:</strong>

              {selectedPreviewInfo.notificationContextPatch.branchSelections && (
                <div>
                  <small>Branch selections</small>
                  {Object.entries(
                    selectedPreviewInfo.notificationContextPatch
                      .branchSelections,
                  ).map(([nodeId, choiceId]) => (
                    <div key={nodeId}>
                      <code>{nodeId}</code> = {choiceId}
                    </div>
                  ))}
                </div>
              )}

              {selectedPreviewInfo.notificationContextPatch.sceneState && (
                <div>
                  <small>Scene state</small>
                  {Object.entries(
                    selectedPreviewInfo.notificationContextPatch.sceneState,
                  ).map(([key, value]) => (
                    <div key={key}>
                      <code>{key}</code> = {formatValue(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="slice-panel__list">
        {slicePackage.slices.map((slice, index) => {
          const draftTitle = titleDrafts[slice.sliceId] ?? slice.title;

          return (
            <div key={index} className="slice-panel__item">
              <div className="slice-panel__index">#{index + 1}</div>

              <label>
                Slice ID
                <input value={draftTitle} disabled />
              </label>

              <label>
                Title
                <textarea
                  value={draftTitle}
                  onChange={(event) =>
                    updateDraft(slice.sliceId, event.target.value)
                  }
                  onBlur={() => commitDraft(slice.sliceId)}
                  rows={2}
                />
              </label>
            </div>
          );
        })}
      </div>
    </aside>
  );
}