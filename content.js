function addStyles(style) {
  const gutters =
    style.gutters.indexOf && style.gutters.indexOf("%") !== -1
      ? style.gutters
      : `${style.gutters}px`;

  return `
    #chrome-extension-css-grid-overlay-${style.index} {
      display: none;
    }

    @media (min-width: ${style.from}px) and (max-width: ${style.to}px) {
      #chrome-extension-css-grid-overlay-container {
        background-color: ${
          style.displayBackgrounds
            ? style.marginsBackgroundColor
            : "transparent"
        };
        top: ${style.offsetTop}px;
        right: ${style.offsetRight}px;
        bottom: ${style.offsetBottom}px;
        left: ${style.offsetLeft}px;
        padding-left: ${style.margins}px;
        padding-right: ${style.margins}px;
        pointer-events: none;
        position: fixed;
        z-index: 13371337;
      }

      #chrome-extension-css-grid-overlay-${style.index} {
        background-color: ${
          style.displayBackgrounds
            ? style.guttersBackgroundColor
            : "transparent"
        };
        display: flex;
        height: 100%;
        margin: 0 auto;
        max-width: ${style.maxWidth};
      }

      .chrome-extension-css-grid-overlay__column {
        background-color: ${
          style.displayBackgrounds
            ? style.columnsBackgroundColor
            : "transparent"
        };
        border-left: ${style.borderStyle};
        border-right: ${style.borderStyle};
        box-sizing: border-box;
        height: 100%;
        margin: 0 ${gutters};
        width: calc(100% / ${style.columns});
      }

      .chrome-extension-css-grid-overlay__column:first-child {
        margin-left: 0;
      }

      .chrome-extension-css-grid-overlay__column:last-child {
        margin-right: 0;
      }
    }
  `;
}

function removeStyle(id) {
  const style = document.getElementById(id);

  if (style) {
    style.remove();
  }
}

function init(preset, displayBorder, displayBackgrounds) {
  if (!document.querySelector("#chrome-extension-css-grid-overlay-container")) {
    const container = document.createElement("div");

    preset.forEach((breakpoint, index) => {
      container.id = "chrome-extension-css-grid-overlay-container";

      const grid = document.createElement("div");
      grid.id = `chrome-extension-css-grid-overlay-${index}`;

      for (let i = 0; i < breakpoint.columns; i++) {
        const column = document.createElement("div");
        column.classList.add("chrome-extension-css-grid-overlay__column");

        grid.appendChild(column);
      }

      const id = `chrome-extension-css-grid-overlay-style-${index}`;
      removeStyle(id);

      const style = document.createElement("style");
      let maxWidth;

      if (typeof breakpoint.maxWidth === "number") {
        maxWidth = `${breakpoint.maxWidth}px`;
      } else if (typeof breakpoint.maxWidth === "string") {
        maxWidth = breakpoint.maxWidth;
      } else {
        maxWidth = "none";
      }

      const defaultBackgroundColors = {
        columns: "rgba(234, 23, 140, .3)",
        gutters: "rgba(0, 231, 255, .3)",
        margins: "rgba(0, 191, 165, .3)",
      };

      breakpoint.backgroundColors = {
        ...defaultBackgroundColors,
        ...breakpoint.backgroundColors,
      };

      style.id = id;
      style.innerHTML = addStyles({
        index,
        from: breakpoint.from,
        to: breakpoint.to ? breakpoint.to : 7680,
        margins: breakpoint.margins,
        gutters: breakpoint.gutters,
        columns: breakpoint.columns,
        maxWidth: maxWidth,
        borderStyle: displayBorder ? (breakpoint.borderStyle) ? breakpoint.borderStyle : "1px solid #EA178C" : "0",
        offsetTop: breakpoint.offsetTop ? breakpoint.offsetTop : 0,
        offsetRight: breakpoint.offsetRight ? breakpoint.offsetRight : 0,
        offsetBottom: breakpoint.offsetBottom ? breakpoint.offsetBottom : 0,
        offsetLeft: breakpoint.offsetLeft ? breakpoint.offsetLeft : 0,
        displayBackgrounds,
        columnsBackgroundColor: breakpoint.backgroundColors.columns,
        guttersBackgroundColor: breakpoint.backgroundColors.gutters,
        marginsBackgroundColor: breakpoint.backgroundColors.margins,
      });

      document.body.appendChild(style);

      container.appendChild(grid);
    });

    document.body.appendChild(container);
  }

  window.grids = document.querySelector(
    "#chrome-extension-css-grid-overlay-container"
  );
}

function destroy() {
  grids.remove();
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "stop") {
    destroy();
  } else if (request.type === "start") {
    init(request.preset, request.displayBorder, request.displayBackgrounds);
  }
  sendResponse({});
});
