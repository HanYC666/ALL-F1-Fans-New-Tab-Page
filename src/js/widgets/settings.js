import { CONFIG, safeHex } from "../config.js";
import { clearLocalState } from "../storage.js";
import { clearImages, deleteImage, listImages, prepareImage, putImage } from "../indexeddb.js";
import teams from "../../data/teams.json" with { type: "json" };
import backgrounds from "../../data/built-in-backgrounds.json" with { type: "json" };

let activeSettingsTab = "hyprland";

export function renderSettings(
  state,
  { onChange, onReset, onImport, onExport, onDelete },
) {
  const panel = document.querySelector("#settings-panel");
  const backdrop = document.querySelector("#settings-backdrop");
  panel.replaceChildren();

  const closeSettings = () => {
    panel.hidden = true;
    backdrop.hidden = true;
    document.querySelector("#settings-button").setAttribute("aria-expanded", "false");
  };

  backdrop.onclick = closeSettings;

  // Header
  const header = document.createElement("div");
  header.className = "settings-header";

  const h2 = document.createElement("h2");
  h2.innerHTML = `<span>⚙</span> <span>Hyprland Control Center</span>`;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "icon-btn";
  closeBtn.textContent = "✕";
  closeBtn.title = "Close settings (Esc)";
  closeBtn.addEventListener("click", closeSettings);

  header.append(h2, closeBtn);
  panel.append(header);

  // Tab Navigation
  const nav = document.createElement("nav");
  nav.className = "settings-nav";

  const tabs = [
    { id: "hyprland", label: "🪟 Hyprland & Theme" },
    { id: "wallpapers", label: "🖼️ Wallpapers & Gallery" },
    { id: "general", label: "🏎️ F1 & General" },
    { id: "backup", label: "💾 Backup & Reset" },
  ];

  const contentContainer = document.createElement("div");
  contentContainer.className = "settings-content";

  const renderTabContent = async () => {
    contentContainer.replaceChildren();

    // 1. Hyprland & Theme Tab
    if (activeSettingsTab === "hyprland") {
      const secTitle = document.createElement("div");
      secTitle.className = "settings-section-title";
      secTitle.textContent = "Hyprland Glass & Tiling Aesthetics";
      contentContainer.append(secTitle);

      const grid = document.createElement("div");
      grid.className = "settings-grid";

      // Opacity
      grid.append(createSliderRow(
        "Tile Acrylic Opacity",
        "Control translucency of widgets (20% to 100%)",
        Math.round(state.theme.panelOpacity * 100),
        20,
        100,
        1,
        "%",
        (v) => {
          state.theme.panelOpacity = v / 100;
          onChange();
        }
      ));

      // Blur
      grid.append(createSliderRow(
        "Backdrop Blur",
        "Frosted glass blur intensity",
        state.theme.panelBlurPx ?? 20,
        0,
        40,
        1,
        "px",
        (v) => {
          state.theme.panelBlurPx = v;
          onChange();
        }
      ));

      // Radius
      grid.append(createSliderRow(
        "Corner Rounding",
        "Border radius for all tiles and panels",
        state.theme.panelRadiusPx ?? 16,
        0,
        36,
        1,
        "px",
        (v) => {
          state.theme.panelRadiusPx = v;
          onChange();
        }
      ));

      // Grid Gap
      grid.append(createSliderRow(
        "Tiling Gap",
        "Spacing between dashboard widgets",
        state.theme.gridGapPx ?? 16,
        4,
        36,
        1,
        "px",
        (v) => {
          state.theme.gridGapPx = v;
          onChange();
        }
      ));

      // Team Livery Color
      const teamRow = document.createElement("div");
      teamRow.className = "setting-row";
      teamRow.innerHTML = `
        <div class="setting-info">
          <span class="setting-label">Team Livery Accent</span>
          <span class="setting-desc">Sets glowing active border and highlight color</span>
        </div>
      `;
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = safeHex(state.theme.accentColor);
      colorInput.style.cssText = "width: 44px; height: 32px; border-radius: 6px; cursor: pointer;";
      colorInput.addEventListener("input", () => {
        state.theme.accentColor = colorInput.value;
        onChange();
      });
      teamRow.append(colorInput);
      grid.append(teamRow);

      // Lock Layout Toggle
      const lockRow = document.createElement("div");
      lockRow.className = "setting-row";
      lockRow.innerHTML = `
        <div class="setting-info">
          <span class="setting-label">Lock Widget Layout</span>
          <span class="setting-desc">Prevent dragging and moving tiles</span>
        </div>
      `;
      const lockToggle = createToggle(state.layout.locked, (checked) => {
        state.layout.locked = checked;
        onChange();
      });
      lockRow.append(lockToggle);
      grid.append(lockRow);

      contentContainer.append(grid);
    }

    // 2. Wallpapers & Gallery Tab
    else if (activeSettingsTab === "wallpapers") {
      const secTitle = document.createElement("div");
      secTitle.className = "settings-section-title";
      secTitle.textContent = "Team Wallpapers & Dynamic Rotation";
      contentContainer.append(secTitle);

      const grid = document.createElement("div");
      grid.className = "settings-grid";

      // Team Filter
      const teamFilterRow = document.createElement("div");
      teamFilterRow.className = "setting-row";
      teamFilterRow.innerHTML = `
        <div class="setting-info">
          <span class="setting-label">Active Team Filter</span>
          <span class="setting-desc">Choose which team wallpapers to rotate</span>
        </div>
      `;
      const teamSel = document.createElement("select");
      teamSel.className = "setting-select";
      teams.forEach((t) => {
        const o = document.createElement("option");
        o.value = t.id;
        o.textContent = t.label;
        if (state.theme.teamFilter === t.id) o.selected = true;
        teamSel.append(o);
      });
      teamSel.addEventListener("change", () => {
        state.theme.teamFilter = teamSel.value;
        const matched = teams.find((x) => x.id === teamSel.value);
        if (matched) state.theme.accentColor = matched.accent;
        onChange();
        renderTabContent();
      });
      teamFilterRow.append(teamSel);
      grid.append(teamFilterRow);

      // Rotation Mode
      const rotRow = document.createElement("div");
      rotRow.className = "setting-row";
      rotRow.innerHTML = `
        <div class="setting-info">
          <span class="setting-label">Wallpaper Mode</span>
          <span class="setting-desc">How images transition on new tab or over time</span>
        </div>
      `;
      const rotSel = document.createElement("select");
      rotSel.className = "setting-select";
      [
        { id: "random-new-tab", label: "Random on every new tab" },
        { id: "sequential-new-tab", label: "Sequential on every new tab" },
        { id: "slideshow", label: "Live auto-slideshow timer" },
        { id: "static", label: "Static single wallpaper" },
      ].forEach((m) => {
        const o = document.createElement("option");
        o.value = m.id;
        o.textContent = m.label;
        if (state.theme.backgroundMode === m.id) o.selected = true;
        rotSel.append(o);
      });
      rotSel.addEventListener("change", () => {
        state.theme.backgroundMode = rotSel.value;
        onChange();
      });
      rotRow.append(rotSel);
      grid.append(rotRow);

      // Slideshow Timer Interval
      grid.append(createSliderRow(
        "Slideshow Timer Interval",
        "Seconds between automatic wallpaper changes",
        state.theme.backgroundIntervalSeconds ?? 30,
        5,
        180,
        5,
        "s",
        (v) => {
          state.theme.backgroundIntervalSeconds = v;
          onChange();
        }
      ));

      contentContainer.append(grid);

      // Built-in Wallpaper Gallery
      const galTitle = document.createElement("div");
      galTitle.className = "settings-section-title";
      galTitle.textContent = "Built-in Team Wallpapers";
      contentContainer.append(galTitle);

      const galleryGrid = document.createElement("div");
      galleryGrid.className = "gallery-grid";

      backgrounds.forEach((bg) => {
        const card = document.createElement("div");
        card.className = `gallery-card ${state.cache.lastBackground === bg.id ? "active" : ""}`;
        card.title = `${bg.alt} (${bg.team})`;
        card.innerHTML = `
          <img src="${bg.src}" alt="${bg.alt}" loading="lazy" />
          <span class="card-team-tag">${bg.team}</span>
        `;
        card.addEventListener("click", () => {
          state.theme.teamFilter = bg.team;
          state.cache.lastBackground = bg.id;
          const matched = teams.find((x) => x.id === bg.team);
          if (matched) state.theme.accentColor = matched.accent;
          onChange();
          renderTabContent();
        });
        galleryGrid.append(card);
      });
      contentContainer.append(galleryGrid);

      // User Uploads & Dropzone
      const uploadTitle = document.createElement("div");
      uploadTitle.className = "settings-section-title";
      uploadTitle.textContent = "Custom Image Uploads (Stored Locally in IndexedDB)";
      contentContainer.append(uploadTitle);

      const dropzone = document.createElement("div");
      dropzone.className = "upload-dropzone";
      dropzone.innerHTML = `
        <span style="font-size: 1.5rem;">📁</span>
        <strong style="color: #fff;">Click or Drag & Drop Images Here</strong>
        <span class="muted">Supports PNG, JPG, WebP up to 12MB. Stored entirely in browser.</span>
        <input type="file" accept="image/*" style="display:none;" />
      `;

      const fileInput = dropzone.querySelector("input");
      dropzone.addEventListener("click", () => fileInput.click());

      fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
          const prep = await prepareImage(file, {
            maxBytes: CONFIG.maxUploadBytes,
            maxPixels: CONFIG.maxImagePixels,
          });
          await putImage({
            id: `upload-${crypto.randomUUID()}`,
            team: state.theme.teamFilter,
            blob: prep.blob,
            thumbnailBlob: prep.thumbnailBlob,
            filename: file.name,
            enabled: true,
            createdAt: Date.now(),
          });
          onChange();
          renderTabContent();
        } catch (err) {
          alert(`Upload failed: ${err.message}`);
        }
      });

      contentContainer.append(dropzone);

      // Uploaded Images List
      const userImages = (await listImages()) || [];
      if (userImages.length) {
        const userGrid = document.createElement("div");
        userGrid.className = "gallery-grid";
        userImages.forEach((img) => {
          const uCard = document.createElement("div");
          uCard.className = "gallery-card";
          const thumbUrl = URL.createObjectURL(img.thumbnailBlob || img.blob);
          uCard.innerHTML = `
            <img src="${thumbUrl}" alt="${img.filename}" />
            <button class="shortcut-delete-btn" style="opacity:1;" title="Delete image">✕</button>
          `;
          uCard.querySelector("button").onclick = async (e) => {
            e.stopPropagation();
            await deleteImage(img.id);
            onChange();
            renderTabContent();
          };
          userGrid.append(uCard);
        });
        contentContainer.append(userGrid);
      }
    }

    // 3. F1 & General Tab
    else if (activeSettingsTab === "general") {
      const secTitle = document.createElement("div");
      secTitle.className = "settings-section-title";
      secTitle.textContent = "General & Preferences";
      contentContainer.append(secTitle);

      const grid = document.createElement("div");
      grid.className = "settings-grid";

      // Timezone
      const tzRow = document.createElement("div");
      tzRow.className = "setting-row";
      tzRow.innerHTML = `
        <div class="setting-info">
          <span class="setting-label">Schedule Timezone</span>
          <span class="setting-desc">Display F1 sessions in local time or track/UTC</span>
        </div>
      `;
      const tzSel = document.createElement("select");
      tzSel.className = "setting-select";
      [
        { id: "local", label: "Browser Local Time" },
        { id: "utc", label: "UTC (Track Time)" },
      ].forEach((tz) => {
        const o = document.createElement("option");
        o.value = tz.id;
        o.textContent = tz.label;
        if (state.preferences.timezone === tz.id) o.selected = true;
        tzSel.append(o);
      });
      tzSel.addEventListener("change", () => {
        state.preferences.timezone = tzSel.value;
        onChange();
      });
      tzRow.append(tzSel);
      grid.append(tzRow);

      // Open links in new tab
      const linkRow = document.createElement("div");
      linkRow.className = "setting-row";
      linkRow.innerHTML = `
        <div class="setting-info">
          <span class="setting-label">Open Shortcuts in New Tab</span>
          <span class="setting-desc">Launch pinned links and streams in a new tab</span>
        </div>
      `;
      linkRow.append(createToggle(state.preferences.openLinksInNewTab, (c) => {
        state.preferences.openLinksInNewTab = c;
        onChange();
      }));
      grid.append(linkRow);

      contentContainer.append(grid);
    }

    // 4. Backup & Reset Tab
    else if (activeSettingsTab === "backup") {
      const secTitle = document.createElement("div");
      secTitle.className = "settings-section-title";
      secTitle.textContent = "Configuration Backup & Maintenance";
      contentContainer.append(secTitle);

      const grid = document.createElement("div");
      grid.className = "settings-grid";

      const actRow = document.createElement("div");
      actRow.className = "settings-footer";
      actRow.style.padding = "0";

      const expBtn = document.createElement("button");
      expBtn.className = "btn-secondary";
      expBtn.textContent = "Export Settings JSON";
      expBtn.onclick = onExport;

      const impLabel = document.createElement("label");
      impLabel.className = "btn-secondary";
      impLabel.style.cursor = "pointer";
      impLabel.textContent = "Import JSON File";
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "application/json";
      fileInput.style.display = "none";
      fileInput.onchange = () => fileInput.files?.[0] && onImport(fileInput.files[0]);
      impLabel.append(fileInput);

      actRow.append(expBtn, impLabel);
      grid.append(actRow);

      const dangerTitle = document.createElement("div");
      dangerTitle.className = "settings-section-title";
      dangerTitle.style.color = "#ef4444";
      dangerTitle.textContent = "Danger Zone";
      grid.append(dangerTitle);

      const dangerRow = document.createElement("div");
      dangerRow.className = "settings-footer";
      dangerRow.style.padding = "0";

      const rstLayoutBtn = document.createElement("button");
      rstLayoutBtn.className = "btn-secondary";
      rstLayoutBtn.textContent = "Reset Layout Grid";
      rstLayoutBtn.onclick = () => onReset("layout");

      const rstAllBtn = document.createElement("button");
      rstAllBtn.className = "btn-danger";
      rstAllBtn.textContent = "Reset All to Defaults";
      rstAllBtn.onclick = () => onReset("all");

      const delDataBtn = document.createElement("button");
      delDataBtn.className = "btn-danger";
      delDataBtn.textContent = "Clear All Local Data";
      delDataBtn.onclick = async () => {
        if (confirm("Permanently wipe local storage, cached telemetry, and uploaded wallpapers?")) {
          await clearLocalState();
          await clearImages();
          onDelete();
        }
      };

      dangerRow.append(rstLayoutBtn, rstAllBtn, delDataBtn);
      grid.append(dangerRow);

      contentContainer.append(grid);
    }
  };

  tabs.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `settings-tab-btn ${activeSettingsTab === t.id ? "active" : ""}`;
    btn.textContent = t.label;
    btn.addEventListener("click", () => {
      activeSettingsTab = t.id;
      nav.querySelectorAll(".settings-tab-btn").forEach((b) => b.className = "settings-tab-btn");
      btn.className = "settings-tab-btn active";
      renderTabContent();
    });
    nav.append(btn);
  });

  panel.append(nav, contentContainer);
  renderTabContent();
}

function createSliderRow(label, desc, value, min, max, step, unit, onChange) {
  const row = document.createElement("div");
  row.className = "setting-row";

  const info = document.createElement("div");
  info.className = "setting-info";
  info.innerHTML = `
    <span class="setting-label">${label}</span>
    <span class="setting-desc">${desc}</span>
  `;

  const group = document.createElement("div");
  group.className = "slider-group";

  const input = document.createElement("input");
  input.type = "range";
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;

  const valDisplay = document.createElement("span");
  valDisplay.className = "slider-val";
  valDisplay.textContent = `${value}${unit}`;

  input.addEventListener("input", () => {
    valDisplay.textContent = `${input.value}${unit}`;
    onChange(Number(input.value));
  });

  group.append(input, valDisplay);
  row.append(info, group);
  return row;
}

function createToggle(checked, onChange) {
  const label = document.createElement("label");
  label.className = "toggle-switch";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.addEventListener("change", () => onChange(input.checked));

  const slider = document.createElement("span");
  slider.className = "toggle-slider";

  label.append(input, slider);
  return label;
}
