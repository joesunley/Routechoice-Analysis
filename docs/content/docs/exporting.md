+++
title = "Saving & Exporting"
weight = 50
description = "Save your project data and export your analysis as HTML or PDF."
+++

## Saving and loading project data

Your analysis is stored in the browser only while the tab is open. To persist your work, save it to a JSON file and reload it later.

### Save Data

Click **Save Data** in the **Project Files** section of the sidebar. A file called `course_planning_data.json` is downloaded. This file contains:

- Map scale, DPI, and drawing scale settings.
- All control positions.
- All variant paths, labels, colours, and chosen flags.
- Leg notes.
- Event name.
- All independent legs and their variants (if any).

### Load Data

Click **Load Data** and select a previously saved `.json` file. All controls, variants, and settings are restored. You will still need to **Load Map** separately, as the map image is not embedded in the JSON file.

> **Note:** Load your map image first, then load the data file so that controls and variants render in the correct positions.

## HTML export 

The **Export HTML** button (available in both Course and Independent Legs mode via the export buttons in the sidebar) generates a **self-contained HTML file** that can be opened in any browser without the app being running.

The exported page includes:

- The map image embedded as a data URL.
- Each leg rendered individually with its route variants overlaid.
- Distance measurements for every variant.
- The chosen variant highlighted.
- Leg notes, if any were added.
- The event name as the page title.

Share this file directly with teammates or coaches — no server required.

## PDF export

The **Export PDF** button generates a multi-page printable PDF. Each leg is rendered on its own page (or tile) with the route variants and distances shown. The PDF is suitable for printing on A4 or letter-size paper.

PDF rendering happens client-side using html2canvas and jsPDF, so it may take a few seconds for larger courses.

## Event name

The event name entered in the **Event** field at the top of the sidebar appears as the title in both HTML and PDF exports. Setting a descriptive name (e.g. `WOC 2024 Sprint Q Analysis`) makes shared files easier to identify.
