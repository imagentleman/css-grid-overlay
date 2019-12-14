const activeTabs = {};
const readyTabs = {};
const templatePreset = `[
  {
    "columns": 4,
    "margins": 16, // px before and after the first and last column
    // this gutters work like margins: 
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
    //   "column": "rgba(234, 23, 140, .3)",
    //   "innerContainer": "rgba(0, 231, 255, .3)",
    //   "outerContainer": "rgba(0, 191, 165, .3)"
    // },
  }
]`;
const defaultPreset = [
  {
    columns: 4,
    margins: 16,
    gutters: 16,
    from: 0,
    to: 599
  },
  {
    columns: 8,
    margins: 16,
    gutters: 16,
    from: 600,
    to: 719
  },
  {
    columns: 8,
    margins: 24,
    gutters: 24,
    from: 720,
    to: 839
  },
  {
    columns: 12,
    margins: 24,
    gutters: 24,
    from: 840,
    to: 7680, // 8k
    maxWidth: 1440
  }
];

function displayGrid(tab) {
  chrome.browserAction.setIcon({
    path: {
      "16": "on-16.png",
      "24": "on-24.png",
      "32": "on-32.png"
    }
  });

  chrome.storage.sync.get(
    {
      activePreset: { name: "Default (Material)", preset: defaultPreset },
      displayBorder: true,
      displayBackgrounds: true
    },
    function(items) {
      chrome.tabs.sendMessage(tab.id, {
        type: "start",
        preset: items.activePreset.preset,
        displayBorder: items.displayBorder || false,
        displayBackgrounds: items.displayBackgrounds || false
      });
    }
  );
}

function start(tab) {
  if (activeTabs[tab.id]) {
    activeTabs[tab.id] = false;

    chrome.browserAction.setIcon({
      path: {
        "16": "off-16.png",
        "24": "off-24.png",
        "32": "off-32.png"
      }
    });

    chrome.tabs.sendMessage(tab.id, { type: "stop" });
  } else {
    if (!readyTabs[tab.id]) {
      chrome.tabs.executeScript(tab.id, {
        file: "content.js"
      });

      readyTabs[tab.id] = true;
    }

    activeTabs[tab.id] = true;

    displayGrid(tab);
  }
}

function restart(tab) {
  if (activeTabs[tab.id]) {
    displayGrid(tab);
  } else {
    chrome.browserAction.setIcon({
      path: {
        "16": "off-16.png",
        "24": "off-24.png",
        "32": "off-32.png"
      }
    });
  }
}

chrome.browserAction.onClicked.addListener(function(tab) {
  if (!readyTabs[tab.id]) {
    chrome.tabs.executeScript(tab.id, {
      file: "content.js"
    });

    readyTabs[tab.id] = true;
  }

  start(tab);
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  delete activeTabs[tabId];
  delete readyTabs[tabId];
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  restart({ id: activeInfo.tabId });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    readyTabs[tabId] = false;
    activeTabs[tabId] = false;

    chrome.browserAction.setIcon({
      path: {
        "16": "off-16.png",
        "24": "off-24.png",
        "32": "off-32.png"
      }
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === "getDefaultPreset") {
    sendResponse({ name: "Default (Material)", preset: defaultPreset });
  } else if (request.type === "getTemplatePreset") {
    sendResponse({ preset: templatePreset });
  }
});
