const textFieldName = document.querySelector(".input--name");
const textFieldPreset = document.querySelector(".input--preset");
const fab = document.querySelector(".mdc-fab");
const headline = document.getElementById("headline");
const input = document.getElementById("input");
const textarea = document.getElementById("textarea");
const buttonSave = document.getElementById("button-save");
const buttonDelete = document.getElementById("button-delete");
const snackbar = document.getElementById("snackbar");
const toggle = document.getElementById("apply-switch");
const borderSwitch = document.getElementById("border-switch");
const backgroundsSwitch = document.getElementById("backgrounds-switch");
const toggleContainer = document.getElementById("apply-switch-container");
const toggleLabel = document.getElementById("apply-switch-label");

let currentPreset;
let currentPresetIndex;
let activePreset;
let defaultPreset;
let templatePreset;
let allPresets = [];
let displayBorder;
let viewMode = "init";

const mdcSnackbar = new mdc.snackbar.MDCSnackbar(snackbar);

mdc.ripple.MDCRipple.attachTo(fab);
mdc.ripple.MDCRipple.attachTo(buttonSave);
mdc.ripple.MDCRipple.attachTo(buttonDelete);
mdc.textField.MDCTextField.attachTo(textFieldName);
mdc.textField.MDCTextField.attachTo(textFieldPreset);

function reselectPresetList(e) {
  document.querySelectorAll(".mdc-list-item").forEach(item => {
    item.classList.remove("mdc-list-item--selected");
  });
  e.target.classList.add("mdc-list-item--selected");
}

function drawPresetList(allPresets, activePreset) {
  const ul = document.querySelector(".mdc-list");
  ul.innerHTML = "";

  allPresets.forEach((preset, i) => {
    const li = document.createElement("li");

    if (preset.name === activePreset.name) {
      li.classList.add("mdc-list-item--selected");
    }

    li.classList.add("mdc-list-item");
    li.dataset["index"] = i;
    li.textContent = preset.name;
    li.addEventListener("click", loadPreset);
    mdc.ripple.MDCRipple.attachTo(li);

    ul.appendChild(li);
  });
}

function showMessage(message, actionText) {
  mdcSnackbar.show({
    message,
    actionText,
    actionHandler: function() {}
  });
}

function drawHeadline() {
  if (viewMode === "edit") {
    headline.textContent = "Edit Preset";
  } else if (viewMode === "init") {
    headline.textContent = "Current Preset";
  } else if (viewMode === "new") {
    headline.textContent = "New Preset";
  } else if (viewMode === "deleted") {
    headline.textContent = "Current Preset";
  }
}

function drawName() {
  if (viewMode === "edit") {
    input.value = currentPreset.name;
    input.disabled = false;
    textFieldName
      .querySelector("label")
      .classList.add("mdc-floating-label--float-above");
    textFieldName.attributeStyleMap.set(
      "display",
      new CSSKeywordValue("inline-flex")
    );
  } else if (viewMode === "init") {
    input.value = activePreset.name;
    input.disabled = true;
    textFieldName
      .querySelector("label")
      .classList.add("mdc-floating-label--float-above");
  } else if (viewMode === "new") {
    input.value = "";
    input.disabled = false;
    textFieldName.attributeStyleMap.set(
      "display",
      new CSSKeywordValue("inline-flex")
    );
  } else if (viewMode === "deleted") {
    input.value = activePreset.name;
  }
}

function drawPreset() {
  if (viewMode === "edit") {
    textarea.value = JSON.stringify(currentPreset.preset, null, 2);
    textarea.focus();
  } else if (viewMode === "init") {
    textarea.value = JSON.stringify(activePreset.preset, null, 2);
    textarea.focus();
  } else if (viewMode === "new") {
    textarea.value = templatePreset.preset;
    textarea.focus();
  } else if (viewMode === "deleted") {
    textarea.value = JSON.stringify(activePreset.preset, null, 2);
  }
}

function drawButtons() {
  if (viewMode === "edit") {
    buttonSave.attributeStyleMap.set("display", new CSSKeywordValue("block"));
    buttonDelete.attributeStyleMap.set("display", new CSSKeywordValue("block"));
  } else if (viewMode === "new") {
    buttonSave.attributeStyleMap.set("display", new CSSKeywordValue("block"));
    buttonDelete.attributeStyleMap.set("display", new CSSKeywordValue("none"));
  } else if (viewMode === "saved") {
    buttonDelete.attributeStyleMap.set("display", new CSSKeywordValue("block"));
  } else if (viewMode === "deleted") {
    buttonSave.attributeStyleMap.set("display", new CSSKeywordValue("none"));
    buttonDelete.attributeStyleMap.set("display", new CSSKeywordValue("none"));
  }
}

function drawToggles() {
  if (viewMode === "edit") {
    toggleContainer.attributeStyleMap.set(
      "display",
      new CSSKeywordValue("flex")
    );
    toggleLabel.attributeStyleMap.set("display", new CSSKeywordValue("flex"));

    if (activePreset.name === allPresets[currentPresetIndex].name) {
      toggle.checked = true;
    } else {
      toggle.checked = false;
    }
  } else if (viewMode === "new") {
    toggleContainer.attributeStyleMap.set(
      "display",
      new CSSKeywordValue("none")
    );
    toggleLabel.attributeStyleMap.set("display", new CSSKeywordValue("none"));
  } else if (viewMode === "saved") {
    toggleContainer.attributeStyleMap.set(
      "display",
      new CSSKeywordValue("flex")
    );
    toggleLabel.attributeStyleMap.set("display", new CSSKeywordValue("flex"));
    toggle.checked = false;
  }
}

function loadPreset(e) {
  const index = e.target.dataset.index;
  viewMode = "edit";
  currentPresetIndex = index;
  currentPreset = allPresets[currentPresetIndex];

  reselectPresetList(e);
  drawHeadline();
  drawName();
  drawPreset();
  drawButtons();
  drawToggles();
}

function findActivePresetIndex() {
  for (let i = 0; i < allPresets.length; i++) {
    if (allPresets[i].name === activePreset.name) {
      return i;
    }
  }
}

function restoreOptions() {
  chrome.runtime.sendMessage({ type: "getDefaultPreset" }, function(response) {
    defaultPreset = response;

    chrome.storage.sync.get(
      {
        activePreset: response,
        allPresets: [response],
        displayBorder: true,
        displayBackgrounds: true
      },
      function(items) {
        viewMode = "init";
        allPresets =
          items.allPresets && items.allPresets.length
            ? items.allPresets
            : [defaultPreset];
        activePreset = items.activePreset || allPresets[0] || defaultPreset;
        currentPresetIndex = findActivePresetIndex();
        displayBorder = items.displayBorder;
        displayBackgrounds = items.displayBackgrounds;

        borderSwitch.checked = displayBorder ? true : false;
        backgroundsSwitch.checked = displayBackgrounds ? true : false;

        drawHeadline();
        drawName();
        drawPresetList(allPresets, activePreset);
        drawPreset();
      }
    );
  });
}

function newPreset() {
  chrome.runtime.sendMessage({ type: "getTemplatePreset" }, function(response) {
    viewMode = "new";
    templatePreset = response;

    drawHeadline();
    drawName();
    drawPreset();
    drawToggles();
    drawButtons();

    currentPresetIndex = null;
  });
}

function savePreset() {
  if (!input.value) {
    showMessage("The name is missing.", "Dismiss");

    return;
  }

  if (!textarea.value) {
    showMessage("The preset configuration is missing.", "Dismiss");

    return;
  }

  const sameNamePresets = allPresets.filter(
    preset => preset.name === input.value && input.value
  );

  if (sameNamePresets.length && viewMode !== "edit") {
    showMessage("There is already a preset with the same name.", "Dismiss");

    return;
  }

  chrome.runtime.sendMessage({ type: "getDefaultPreset" }, function(response) {
    chrome.storage.sync.get(
      {
        allPresets: [response]
      },
      function(items) {
        try {
          const newPreset = {
            name: input.value,
            preset: JSON.parse(textarea.value)
          };
          allPresets =
            items.allPresets && items.allPresets.length
              ? items.allPresets
              : [defaultPreset];
          let newPresets;

          if (sameNamePresets.length) {
            for (let i = 0; i < allPresets.length; i++) {
              if (allPresets[i].name === newPreset.name) {
                allPresets[i] = newPreset;
                newPresets = allPresets;
                break;
              }
            }
          } else {
            newPresets = allPresets.concat(newPreset);
          }

          if (activePreset.name === newPreset.name) {
            activePreset = newPreset;
          }

          chrome.storage.sync.set(
            {
              allPresets: newPresets,
              activePreset
            },
            function() {
              viewMode = "edit";

              allPresets = newPresets;
              currentPresetIndex = allPresets.length
                ? allPresets.length - 1
                : 0;
              currentPreset = allPresets[currentPresetIndex];

              showMessage("Saved.", "Dismiss");

              drawName();
              drawButtons();
              drawToggles();
              drawPresetList(allPresets, activePreset);
            }
          );
        } catch (e) {
          showMessage("The Preset must be valid JSON.", "Dismiss");
        }
      }
    );
  });
}

function deletePreset() {
  allPresets.splice(currentPresetIndex, 1);

  chrome.storage.sync.set(
    {
      allPresets,
      activePreset: allPresets.length ? activePreset : defaultPreset
    },
    function() {
      viewMode = "deleted";

      showMessage("Deleted.", "Dismiss");

      drawPresetList(
        allPresets && allPresets.length ? allPresets : [defaultPreset],
        activePreset
      );

      drawHeadline();
      drawName();
      drawPreset();
      drawButtons();
    }
  );
}

function applyPreset() {
  let newActivePreset = toggle.checked
    ? allPresets[currentPresetIndex]
    : defaultPreset;

  activePreset = newActivePreset;

  chrome.storage.sync.set(
    {
      activePreset
    },
    function() {
      showMessage("Selected.", "Dismiss");
    }
  );
}

function applyBorderStyle() {
  chrome.storage.sync.set(
    {
      displayBorder: borderSwitch.checked
    },
    function() {
      showMessage("Applied.", "Dismiss");
    }
  );
}

function applyBackgroundsStyle() {
  chrome.storage.sync.set(
    {
      displayBackgrounds: backgroundsSwitch.checked
    },
    function() {
      showMessage("Applied.", "Dismiss");
    }
  );
}

document.addEventListener("DOMContentLoaded", restoreOptions);
fab.addEventListener("click", newPreset);
buttonSave.addEventListener("click", savePreset);
buttonDelete.addEventListener("click", deletePreset);
toggle.addEventListener("change", applyPreset);
borderSwitch.addEventListener("change", applyBorderStyle);
backgroundsSwitch.addEventListener("change", applyBackgroundsStyle);
