+++
title = "Keyboard Shortcuts"
weight = 60
description = "Quick reference for all mouse and keyboard interactions."
+++

## Map interactions

| Action | Effect |
|---|---|
| <kbd>Click</kbd> on map | **Controls mode:** place a control. **Routechoices mode:** add a point to the current drawing. **Calibrate mode:** place a calibration point. |
| <kbd>Shift</kbd> + <kbd>Click</kbd> | **Controls mode:** remove the last placed control (Course) or cancel a pending leg start (Independent Legs). **Routechoices mode:** undo the last drawn waypoint. |
| <kbd>Right-click</kbd> | **Routechoices mode:** finish and save the current routechocie. If the cursor is more than 10 px from the last point, that position is added as a final point before saving. |
| <kbd>Mouse drag</kbd> | Pan the map in any direction. Works regardless of the current mode. |
| <kbd>Scroll wheel</kbd> | Zoom in / out, centred on the cursor position. Each scroll step multiplies or divides the zoom by ~1.41 (√2). |

## Dragging with Alt

Hold <kbd>Alt</kbd> before pressing the mouse button to enter drag mode instead of placing a point.

| Alt + drag target | Effect |
|---|---|
| A **control circle** | Reposition the control. In Course mode also updates all attached leg lengths. |
| A **routechoice waypoint** | Move that individual point while keeping the rest of the route unchanged. |
| A **routechoice label** | Offset the letter label to avoid overlapping with the route line or other labels. |
| An independent leg **start** or **end** endpoint | Move the endpoint; all routechoices for that leg have their first/last point updated to match. |

Release the mouse button to confirm the new position.

## Viewport controls

| Button | Effect |
|---|---|
| **+** | Zoom in, centred on the viewport centre. |
| **−** | Zoom out, centred on the viewport centre. |
| **Fit** (expand icon) | Reset zoom and pan to fit the entire map in the available viewport. |

## Sidebar controls

| Control | Effect |
|---|---|
| **← / →** arrows (Routechoices mode) | Step to the previous / next leg. |
| **Undo** button | Remove the last-drawn waypoint from the current in-progress variant. |
| **Save** button | Finish and save the current variant (same as right-click on the map). |
| **Auto-Rotate** toggle | When enabled, the map automatically rotates and zooms to centre on the selected leg each time the leg is changed. |
| **Checkmark** on a variant | Mark that variant as the chosen/preferred route. Click again to deselect. |
| **Edit** (pencil) on a variant | Enter edit mode for that variant; its waypoints become individually draggable with Alt. |
| **Delete** (trash) on a variant | Permanently delete the variant. |
| **Notes** (speech bubble) on a leg | Open the leg notes editor. |
