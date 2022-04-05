const templatePreset = `[
  {
    "columns": 4,
    "margins": 16, // px before and after the first and last column
    // these gutters work like margins: 
    // if distance between columns is 32px, gutters are 16
    "gutters": 16, 
    "from": 0, // start of breakpoint in px
    // Optional values
    // "to": 599, end of breakpoint in px
    // grid will be centered after this maxWidth in px
    // otherwise it'll be full width
    // "maxWidth": 1440, 
    // if you want to move the grid 
    // (e.g. in a style guide with a left sidebar
    // you'd use offsetLeft to push the grid to the right
    // "offsetTop": 0,
    // "offsetRight": 0,
    // "offsetBottom": 0,
    // "offsetLeft": 0,
    // "backgroundColors": {
    //   "columns": "rgba(234, 23, 140, .3)",
    //   "gutters": "rgba(0, 231, 255, .3)",
    //   "margins": "rgba(0, 191, 165, .3)"
    // }
  }
]`;
const defaultPreset = [
  {
    columns: 4,
    margins: 16,
    gutters: 16,
    from: 0,
    to: 599,
  },
  {
    columns: 8,
    margins: 16,
    gutters: 16,
    from: 600,
    to: 719,
  },
  {
    columns: 8,
    margins: 24,
    gutters: 24,
    from: 720,
    to: 839,
  },
  {
    columns: 12,
    margins: 24,
    gutters: 24,
    from: 840,
    to: 7680, // 8k
    maxWidth: 1440,
  },
];

function displayGrid(tab) {
  chrome.action.setIcon({
    path: {
      16: "on-16.png",
      24: "on-24.png",
      32: "on-32.png",
    },
  });

  chrome.storage.sync.get(
    {
      activePreset: { name: "Default (Material)", preset: defaultPreset },
      displayBorder: true,
      displayBackgrounds: true,
    },
    function (items) {
      chrome.tabs.sendMessage(tab.id, {
        type: "start",
        preset: items.activePreset.preset,
        displayBorder: items.displayBorder || false,
        displayBackgrounds: items.displayBackgrounds || false,
      });
    }
  );
}

function start(tab) {
  chrome.storage.local.get(
    ["activeTabs", "readyTabs"],
    ({ activeTabs = {}, readyTabs = {} }) => {
      if (activeTabs[tab.id]) {
        activeTabs[tab.id] = false;

        chrome.storage.local.set({ activeTabs });

        chrome.action.setIcon({
          path: {
            16: "off-16.png",
            24: "off-24.png",
            32: "off-32.png",
          },
        });

        chrome.tabs.sendMessage(tab.id, { type: "stop" });
      } else {
        if (!readyTabs[tab.id]) {
          chrome.scripting.executeScript({
            target: {
              tabId: tab.id,
            },
            files: ["content.js"],
          });

          readyTabs[tab.id] = true;
        }

        activeTabs[tab.id] = true;

        chrome.storage.local.set({ readyTabs, activeTabs });

        displayGrid(tab);
      }
    }
  );
}

function restart(tab) {
  chrome.storage.local.get(["activeTabs"], ({ activeTabs = {} }) => {
    if (activeTabs[tab.id]) {
      displayGrid(tab);
    } else {
      chrome.action.setIcon({
        path: {
          16: "off-16.png",
          24: "off-24.png",
          32: "off-32.png",
        },
      });
    }
  });
}

chrome.action.onClicked.addListener(function (tab) {
  chrome.storage.local.get(["readyTabs"], ({ readyTabs = {} }) => {
    if (!readyTabs[tab.id]) {
      chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
        },
        files: ["content.js"],
      });

      readyTabs[tab.id] = true;

      chrome.storage.local.set({ readyTabs });
    }

    start(tab);
  });
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  chrome.storage.local.get(
    ["activeTabs", "readyTabs"],
    ({ activeTabs = {}, readyTabs = {} }) => {
      delete activeTabs[tabId];
      delete readyTabs[tabId];

      chrome.storage.local.set({ readyTabs, activeTabs });
    }
  );
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  restart({ id: activeInfo.tabId });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  chrome.storage.local.get(
    ["activeTabs", "readyTabs"],
    ({ activeTabs = {}, readyTabs = {} }) => {
      if (changeInfo.status === "complete") {
        readyTabs[tabId] = false;
        activeTabs[tabId] = false;

        chrome.storage.local.set({ readyTabs, activeTabs });

        chrome.action.setIcon({
          path: {
            16: "off-16.png",
            24: "off-24.png",
            32: "off-32.png",
          },
        });
      }
    }
  );
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "getDefaultPreset") {
    sendResponse({ name: "Default (Material)", preset: defaultPreset });
  } else if (request.type === "getTemplatePreset") {
    sendResponse({ preset: templatePreset });
  }
});
