import { CONFIG, safeHex } from "../config.js";
import { clearLocalState } from "../storage.js";
import { clearImages, deleteImage, listImages, prepareImage, putImage } from "../indexeddb.js";
import teams from "../../data/teams.json" with { type: "json" };
import backgrounds from "../../data/built-in-backgrounds.json" with { type: "json" };

let activeSettingsTab = "hyprland";
let selectedTeamGalleryId = null;

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
    selectedTeamGalleryId = null;
    onChange();
  };

  backdrop.onclick = closeSettings;

  // Header: Only one emoji here on the top title as requested by user
  const header = document.createElement("div");
  header.className = "settings-header";

  const h2 = document.createElement("h2");
  h2.innerHTML = `<span>⚙</span> <span>Hyprland Settings</span>`;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "icon-btn";
  closeBtn.textContent = "✕";
  closeBtn.title = "Close settings (Esc)";
  closeBtn.addEventListener("click", closeSettings);

  header.append(h2, closeBtn);
  panel.append(header);

  // Tab Navigation (No extra emojis)
  const nav = document.createElement("nav");
  nav.className = "settings-nav";

  const tabs = [
    { id: "hyprland", label: "Hyprland & Theme" },
    { id: "wallpapers", label: "Wallpapers & Gallery" },
    { id: "general", label: "F1 & General" },
    { id: "backup", label: "Backup & Reset" },
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

      // Color Scheme (Dark / Light)
      const themeModeRow = document.createElement("div");
      themeModeRow.className = "setting-row";
      themeModeRow.innerHTML = `
        <div class="setting-info">
          <span class="setting-label">Appearance Mode</span>
          <span class="setting-desc">Switch between Obsidian Dark and Racing Light modes</span>
        </div>
      `;
      const themeSelect = document.createElement("select");
      themeSelect.className = "setting-select";
      [
        { id: "dark", label: "Obsidian Dark" },
        { id: "light", label: "Racing Light" },
      ].forEach((m) => {
        const o = document.createElement("option");
        o.value = m.id;
        o.textContent = m.label;
        if ((state.theme.colorScheme || "dark") === m.id) o.selected = true;
        themeSelect.append(o);
      });
      themeSelect.addEventListener("change", () => {
        state.theme.colorScheme = themeSelect.value;
        onChange();
      });
      themeModeRow.append(themeSelect);
      grid.append(themeModeRow);

      // Background Shade / Tint Strength Slider
      grid.append(createSliderRow(
        "Background Shade Strength",
        "Control dark/light overlay tint on wallpaper (0% for raw vivid image)",
        Math.round((state.theme.overlayOpacity ?? 0.45) * 100),
        0,
        100,
        1,
        "%",
        (v) => {
          state.theme.overlayOpacity = v / 100;
          onChange();
        }
      ));

      // Opacity Slider (Live CSS variable update)
      grid.append(createSliderRow(
        "Tile Acrylic Opacity",
        "Control translucency of widgets (20% to 100%)",
        Math.round((state.theme.panelOpacity ?? 0.72) * 100),
        20,
        100,
        1,
        "%",
        (v) => {
          const val = v / 100;
          state.theme.panelOpacity = val;
          onChange();
        }
      ));

      // Blur Slider (Live CSS variable update)
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

      // Radius Slider (Live CSS variable update)
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

      // Grid Gap Slider (Live CSS variable update)
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

      // Team Livery Color Accent
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
      const userImages = (await listImages()) || [];
      const disabledSet = new Set(state.theme.disabledBackgrounds || []);

      // If viewing a specific team's gallery
      if (selectedTeamGalleryId !== null) {
        const currentTeam = teams.find((t) => t.id === selectedTeamGalleryId) || teams[0];
        const teamAccent = currentTeam.accent || "var(--page-accent)";

        // Header with Back button and Team Title
        const headerRow = document.createElement("div");
        headerRow.className = "team-gallery-header";

        const headerLeft = document.createElement("div");
        headerLeft.className = "team-gallery-header-left";

        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "btn-secondary";
        backBtn.innerHTML = `← All Teams`;
        backBtn.title = "Return to constructor galleries";
        backBtn.addEventListener("click", () => {
          selectedTeamGalleryId = null;
          renderTabContent();
        });

        const titleBox = document.createElement("div");
        titleBox.className = "team-gallery-title-box";

        const accentBar = document.createElement("div");
        accentBar.className = "team-gallery-accent-bar";
        accentBar.style.setProperty("--team-gallery-accent", teamAccent);

        const titleText = document.createElement("span");
        titleText.className = "team-gallery-title";
        titleText.textContent = `${currentTeam.label} Gallery`;

        titleBox.append(accentBar, titleText);
        headerLeft.append(backBtn, titleBox);

        const headerRight = document.createElement("div");
        const isActiveTeam = state.theme.teamFilter === currentTeam.id;

        const setTeamBtn = document.createElement("button");
        setTeamBtn.type = "button";
        setTeamBtn.className = isActiveTeam ? "btn-primary" : "btn-secondary";
        setTeamBtn.textContent = isActiveTeam ? "Active Theme" : "Set as Active Team";
        setTeamBtn.addEventListener("click", () => {
          state.theme.teamFilter = currentTeam.id;
          state.theme.accentColor = currentTeam.accent;
          state.cache.lastBackground = null;
          onChange();
          renderTabContent();
        });
        headerRight.append(setTeamBtn);

        headerRow.append(headerLeft, headerRight);
        contentContainer.append(headerRow);

        // Filter wallpapers belonging to this team
        const teamBuiltIns = backgrounds.filter((bg) =>
          currentTeam.id === "all" ? bg.team === "all" : bg.team === currentTeam.id
        );
        const activeBuiltIns = teamBuiltIns.filter((bg) => !disabledSet.has(bg.id));
        const deletedBuiltIns = teamBuiltIns.filter((bg) => disabledSet.has(bg.id));

        const teamUploads = userImages.filter((img) =>
          currentTeam.id === "all" ? (img.team === "all" || !img.team) : img.team === currentTeam.id
        );

        const totalImages = activeBuiltIns.length + teamUploads.length;

        const galSecTitle = document.createElement("div");
        galSecTitle.className = "settings-section-title";
        galSecTitle.textContent = `Wallpapers (${totalImages})`;
        contentContainer.append(galSecTitle);

        if (totalImages > 0) {
          const galleryGrid = document.createElement("div");
          galleryGrid.className = "gallery-grid";

          // 1. Render active built-ins
          activeBuiltIns.forEach((bg) => {
            const card = document.createElement("div");
            const isCurrentBg = state.cache.lastBackground === bg.id;
            card.className = `gallery-card ${isCurrentBg ? "active" : ""}`;
            card.title = `${bg.alt} (Built-in Default)`;
            card.innerHTML = `
              <img src="${bg.src}" alt="${bg.alt}" loading="lazy" />
              <span class="gallery-card-badge ${isCurrentBg ? "badge-active" : ""}">Default</span>
              <button class="gallery-card-delete" title="Delete default wallpaper">✕</button>
            `;

            // Delete default handler
            const delBtn = card.querySelector(".gallery-card-delete");
            delBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              if (!state.theme.disabledBackgrounds) state.theme.disabledBackgrounds = [];
              if (!state.theme.disabledBackgrounds.includes(bg.id)) {
                state.theme.disabledBackgrounds.push(bg.id);
              }
              if (state.cache.lastBackground === bg.id) {
                state.cache.lastBackground = null;
              }
              onChange();
              renderTabContent();
            });

            // Click to select as active background
            card.addEventListener("click", () => {
              state.theme.teamFilter = currentTeam.id;
              state.theme.accentColor = currentTeam.accent;
              state.cache.lastBackground = bg.id;
              state._explicitBackground = true;
              onChange();
              renderTabContent();
            });

            galleryGrid.append(card);
          });

          // 2. Render custom user uploads
          teamUploads.forEach((img) => {
            const card = document.createElement("div");
            const isCurrentBg = state.cache.lastBackground === img.id;
            card.className = `gallery-card ${isCurrentBg ? "active" : ""}`;
            card.title = `${img.filename} (Custom upload)`;
            const thumbUrl = URL.createObjectURL(img.thumbnailBlob || img.blob);
            card.innerHTML = `
              <img src="${thumbUrl}" alt="${img.filename}" loading="lazy" />
              <span class="gallery-card-badge ${isCurrentBg ? "badge-active" : ""}">Custom</span>
              <button class="gallery-card-delete" title="Delete custom wallpaper">✕</button>
            `;

            // Delete custom upload handler
            const delBtn = card.querySelector(".gallery-card-delete");
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              await deleteImage(img.id);
              if (state.cache.lastBackground === img.id) {
                state.cache.lastBackground = null;
              }
              onChange();
              renderTabContent();
            });

            // Click to select as active background
            card.addEventListener("click", () => {
              state.theme.teamFilter = currentTeam.id;
              state.theme.accentColor = currentTeam.accent;
              state.cache.lastBackground = img.id;
              state._explicitBackground = true;
              onChange();
              renderTabContent();
            });

            galleryGrid.append(card);
          });

          contentContainer.append(galleryGrid);
        } else {
          const emptyBox = document.createElement("div");
          emptyBox.className = "gallery-empty-box";
          emptyBox.innerHTML = `
            <span>No wallpapers currently active in this gallery.</span>
            <span>Upload custom wallpapers below, or restore the default livery art.</span>
          `;
          contentContainer.append(emptyBox);
        }

        // Restore default button if default was deleted
        if (deletedBuiltIns.length > 0) {
          const restoreRow = document.createElement("div");
          restoreRow.style.cssText = "margin: 12px 0; display: flex; justify-content: flex-start;";
          const restoreBtn = document.createElement("button");
          restoreBtn.type = "button";
          restoreBtn.className = "btn-secondary";
          restoreBtn.textContent = `↺ Restore ${currentTeam.label} Default Wallpaper`;
          restoreBtn.addEventListener("click", () => {
            const ids = new Set(deletedBuiltIns.map((b) => b.id));
            state.theme.disabledBackgrounds = (state.theme.disabledBackgrounds || []).filter((id) => !ids.has(id));
            onChange();
            renderTabContent();
          });
          restoreRow.append(restoreBtn);
          contentContainer.append(restoreRow);
        }

        // Dropzone for this team
        const uploadTitle = document.createElement("div");
        uploadTitle.className = "settings-section-title";
        uploadTitle.style.marginTop = "20px";
        uploadTitle.textContent = `Upload to ${currentTeam.label} Gallery`;
        contentContainer.append(uploadTitle);

        const dropzone = document.createElement("div");
        dropzone.className = "upload-dropzone";
        dropzone.innerHTML = `
          <strong style="color: var(--text-primary);">Click or Drag & Drop Images Here</strong>
          <span class="muted">PNG, JPG, or WebP up to 12MB. Stored locally in browser for ${currentTeam.label}.</span>
          <input type="file" multiple accept="image/*" style="display:none;" />
        `;

        const fileInput = dropzone.querySelector("input");
        dropzone.addEventListener("click", () => fileInput.click());

        const handleFiles = async (files) => {
          if (!files || !files.length) return;
          try {
            for (const file of files) {
              const prep = await prepareImage(file, {
                maxBytes: CONFIG.maxUploadBytes,
                maxPixels: CONFIG.maxImagePixels,
              });
              await putImage({
                id: `upload-${crypto.randomUUID()}`,
                team: currentTeam.id,
                blob: prep.blob,
                thumbnailBlob: prep.thumbnailBlob,
                filename: file.name,
                enabled: true,
                createdAt: Date.now(),
              });
            }
            onChange();
            renderTabContent();
          } catch (err) {
            alert(`Upload failed: ${err.message}`);
          }
        };

        fileInput.addEventListener("change", () => handleFiles(fileInput.files));

        dropzone.addEventListener("dragover", (e) => {
          e.preventDefault();
          dropzone.classList.add("dragover");
        });
        dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
        dropzone.addEventListener("drop", (e) => {
          e.preventDefault();
          dropzone.classList.remove("dragover");
          handleFiles(e.dataTransfer?.files);
        });

        contentContainer.append(dropzone);
      }

      // If viewing constructor galleries overview (Teams Grid)
      else {
        const secTitle = document.createElement("div");
        secTitle.className = "settings-section-title";
        secTitle.textContent = "Wallpaper Rotation Settings";
        contentContainer.append(secTitle);

        const grid = document.createElement("div");
        grid.className = "settings-grid";

        // Team Filter
        const teamFilterRow = document.createElement("div");
        teamFilterRow.className = "setting-row";
        teamFilterRow.innerHTML = `
          <div class="setting-info">
            <span class="setting-label">Active Team Filter</span>
            <span class="setting-desc">Choose which team wallpapers to rotate on tab</span>
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
          state.cache.lastBackground = null;
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

        // Background Shade / Tint Strength
        grid.append(createSliderRow(
          "Background Shade Strength",
          "Control dark/light overlay tint on wallpaper (0% for raw vivid image)",
          Math.round((state.theme.overlayOpacity ?? 0.45) * 100),
          0,
          100,
          1,
          "%",
          (v) => {
            state.theme.overlayOpacity = v / 100;
            onChange();
          }
        ));

        contentContainer.append(grid);

        // Team Galleries Grid
        const galTitle = document.createElement("div");
        galTitle.className = "settings-section-title";
        galTitle.style.marginTop = "20px";
        galTitle.textContent = "Team Galleries (Click a team to open gallery)";
        contentContainer.append(galTitle);

        const teamGrid = document.createElement("div");
        teamGrid.className = "team-gallery-grid";

        teams.forEach((t) => {
          const teamBuiltIns = backgrounds.filter((bg) =>
            (t.id === "all" ? bg.team === "all" : bg.team === t.id) && !disabledSet.has(bg.id)
          );
          const teamUploads = userImages.filter((img) =>
            t.id === "all" ? (img.team === "all" || !img.team) : img.team === t.id
          );

          const count = teamBuiltIns.length + teamUploads.length;
          const isActive = state.theme.teamFilter === t.id;

          let previewImgSrc = "";
          if (teamUploads.length > 0) {
            previewImgSrc = URL.createObjectURL(teamUploads[0].thumbnailBlob || teamUploads[0].blob);
          } else if (teamBuiltIns.length > 0) {
            previewImgSrc = teamBuiltIns[0].src;
          }

          const card = document.createElement("div");
          card.className = `team-card ${isActive ? "active-team" : ""}`;
          card.style.setProperty("--team-card-accent", t.accent || "var(--page-accent)");
          if (t.accentRgb) {
            card.style.setProperty("--team-card-accent-rgb", t.accentRgb);
          }

          card.innerHTML = `
            <div class="team-card-banner"></div>
            <div class="team-card-preview">
              ${
                previewImgSrc
                  ? `<img src="${previewImgSrc}" alt="${t.label}" loading="lazy" />`
                  : `<span class="team-card-placeholder">${t.short || t.id.toUpperCase()}</span>`
              }
            </div>
            <div class="team-card-body">
              <span class="team-card-name">${t.label}</span>
              <div class="team-card-meta">
                <span class="team-card-count">${count} wallpaper${count === 1 ? "" : "s"}</span>
                ${isActive ? `<span class="team-card-active-tag">Active</span>` : ""}
              </div>
            </div>
          `;

          card.addEventListener("click", () => {
            selectedTeamGalleryId = t.id;
            state.theme.teamFilter = t.id;
            state.theme.accentColor = t.accent;
            state.cache.lastBackground = null;
            onChange();
            renderTabContent();
          });

          teamGrid.append(card);
        });

        contentContainer.append(teamGrid);
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
