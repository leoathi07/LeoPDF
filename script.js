"use strict";

/* =========================================================
   LeoPDF — COMPLETE FRONTEND CONTROLLER
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let selectedFiles = [];
let currentFile = null;
let currentPage = 1;
let totalPages = 1;

/* =========================================================
   SPLASH
   ========================================================= */

window.addEventListener("load", () => {

  setTimeout(() => {
    $("#splash").classList.add("hidden");
    $("#app").classList.remove("hidden");
  }, 2200);

  loadTheme();
  renderFiles();

});

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;

function toast(message) {

  const box = $("#toast");

  box.textContent = message;
  box.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    box.classList.remove("show");
  }, 2500);
}

/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

$$(".nav").forEach(button => {

  button.addEventListener("click", () => {

    const page = button.dataset.page;

    showPage(page);

    $$(".nav").forEach(n => n.classList.remove("active"));
    button.classList.add("active");

  });

});

function showPage(pageName) {

  $$(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  const page = $("#" + pageName);

  if (page) {
    page.classList.add("active-page");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   DARK MODE
   ========================================================= */

$("#themeBtn").addEventListener("click", () => {

  document.body.classList.toggle("dark");

  const enabled =
    document.body.classList.contains("dark");

  localStorage.setItem("leoPDFDark", enabled);

  $("#themeBtn").textContent = enabled ? "☀" : "☾";

});

function loadTheme() {

  const enabled =
    localStorage.getItem("leoPDFDark") === "true";

  if (enabled) {
    document.body.classList.add("dark");
    $("#themeBtn").textContent = "☀";
  }

}

/* =========================================================
   FILE UPLOAD
   ========================================================= */

$("#uploadBtn").addEventListener("click", () => {
  $("#fileInput").click();
});

$("#fileInput").addEventListener("change", event => {

  const files = Array.from(event.target.files);

  if (!files.length) return;

  selectedFiles.push(...files);

  saveFiles();
  renderFiles();

  openViewer(files[0]);

  toast(`${files.length} file(s) added`);

  event.target.value = "";

});

/* =========================================================
   SAVE FILE METADATA
   ========================================================= */

function saveFiles() {

  const data = selectedFiles.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  }));

  localStorage.setItem(
    "leoPDFFiles",
    JSON.stringify(data)
  );

}

/* =========================================================
   RENDER FILES
   ========================================================= */

function renderFiles() {

  const container = $("#fileList");

  container.innerHTML = "";

  if (!selectedFiles.length) {

    container.innerHTML = `
      <div class="file-item">
        <div class="file-icon">📁</div>
        <div class="file-info">
          <b>No files yet</b>
          <small>Add a PDF or image to begin.</small>
        </div>
      </div>
    `;

    return;
  }

  selectedFiles.forEach((file, index) => {

    const item = document.createElement("div");

    item.className = "file-item";

    item.innerHTML = `
      <div class="file-icon">
        ${file.type.includes("pdf") ? "📄" : "🖼️"}
      </div>

      <div class="file-info">
        <b>${escapeHTML(file.name)}</b>
        <small>${formatSize(file.size)}</small>
      </div>

      <button class="file-open">
        Open
      </button>
    `;

    item.querySelector(".file-open")
      .addEventListener("click", () => {

        openViewer(file);

      });

    container.appendChild(item);

  });

}

/* =========================================================
   OPEN VIEWER
   ========================================================= */

function openViewer(file) {

  currentFile = file;

  currentPage = 1;

  $("#viewerTitle").textContent = file.name;

  $("#viewerInfo").textContent =
    `${formatSize(file.size)} • ${file.type || "File"}`;

  $("#previewName").textContent = file.name;

  $("#previewText").textContent =
    "PDF viewer ready. Use the available tools below.";

  $("#pageNumber").textContent =
    "Page 1";

  showPage("viewer");

  $$(".nav").forEach(n => n.classList.remove("active"));

  document
    .querySelector('[data-page="viewer"]')
    .classList.add("active");

}

/* =========================================================
   VIEWER CONTROLS
   ========================================================= */

$("#prevPage").addEventListener("click", () => {

  if (currentPage > 1) {

    currentPage--;

    updatePage();

  } else {

    toast("Already on the first page.");

  }

});

$("#nextPage").addEventListener("click", () => {

  if (currentPage < totalPages) {

    currentPage++;

    updatePage();

  } else {

    toast("End of available preview.");

  }

});

function updatePage() {

  $("#pageNumber").textContent =
    `Page ${currentPage}`;

}

/* =========================================================
   SEARCH
   ========================================================= */

$("#searchBtn").addEventListener("click", searchPDF);

$("#pdfSearch").addEventListener("keydown", event => {

  if (event.key === "Enter") {
    searchPDF();
  }

});

function searchPDF() {

  const query =
    $("#pdfSearch").value.trim();

  if (!query) {

    toast("Enter text to search.");

    return;
  }

  toast(
    `Searching PDF for "${query}"...`
  );

}

/* =========================================================
   BOOKMARK / FAVORITE
   ========================================================= */

$("#bookmarkBtn").addEventListener("click", () => {

  if (!currentFile) {

    toast("Open a PDF first.");

    return;
  }

  localStorage.setItem(
    "leoPDFBookmark_" + currentFile.name,
    currentPage
  );

  toast(`Page ${currentPage} bookmarked.`);

});

$("#favoriteBtn").addEventListener("click", () => {

  if (!currentFile) {

    toast("Open a PDF first.");

    return;
  }

  const key = "leoPDFFavorites";

  let favorites =
    JSON.parse(localStorage.getItem(key) || "[]");

  if (!favorites.includes(currentFile.name)) {

    favorites.push(currentFile.name);

    localStorage.setItem(
      key,
      JSON.stringify(favorites)
    );

    toast("Added to Favorites ⭐");

  } else {

    favorites =
      favorites.filter(
        name => name !== currentFile.name
      );

    localStorage.setItem(
      key,
      JSON.stringify(favorites)
    );

    toast("Removed from Favorites");

  }

});

/* =========================================================
   SHARING
   ========================================================= */

$("#viewerShare").addEventListener("click", shareCurrentFile);

async function shareCurrentFile() {

  if (!currentFile) {

    toast("Open a file first.");

    return;
  }

  if (navigator.share) {

    try {

      await navigator.share({
        title: "LeoPDF",
        text: `Sharing ${currentFile.name}`
      });

    } catch (error) {

      if (error.name !== "AbortError") {
        toast("Sharing cancelled.");
      }

    }

  } else {

    toast(
      "Your browser does not support direct sharing."
    );

  }

}

/* =========================================================
   TOOL SYSTEM
   ========================================================= */

$$("[data-tool]").forEach(button => {

  button.addEventListener("click", () => {

    openTool(button.dataset.tool);

  });

});

/* =========================================================
   TOOL DEFINITIONS
   ========================================================= */

const tools = {

  merge: {
    icon: "🔗",
    title: "Merge PDF",
    description:
      "Select multiple PDF files and combine them into one document."
  },

  split: {
    icon: "✂️",
    title: "Split PDF",
    description:
      "Select a PDF and choose the pages you want to separate."
  },

  compress: {
    icon: "📦",
    title: "Compress PDF",
    description:
      "Reduce PDF size while keeping the document usable."
  },

  convert: {
    icon: "🔄",
    title: "PDF Converter",
    description:
      "Convert between PDF, Word, Excel and PowerPoint formats."
  },

  imagepdf: {
    icon: "🖼️",
    title: "Image → PDF",
    description:
      "Convert JPG or PNG images into a PDF document."
  },

  pdfimage: {
    icon: "📸",
    title: "PDF → Image",
    description:
      "Convert PDF pages into JPG or PNG images."
  },

  rotate: {
    icon: "🔃",
    title: "Rotate & Reorder",
    description:
      "Rotate pages and change their order."
  },

  pages: {
    icon: "📑",
    title: "Page Manager",
    description:
      "Delete or extract selected PDF pages."
  },

  edit: {
    icon: "✏️",
    title: "Edit PDF",
    description:
      "Add text and make changes to your document."
  },

  signature: {
    icon: "✍️",
    title: "Signature",
    description:
      "Draw or upload a signature and place it on a PDF."
  },

  highlight: {
    icon: "🖍️",
    title: "Highlight",
    description:
      "Highlight important text in your PDF."
  },

  watermark: {
    icon: "💧",
    title: "Watermark",
    description:
      "Add a custom watermark to PDF pages."
  },

  pagenumber: {
    icon: "🔢",
    title: "Page Numbering",
    description:
      "Add page numbers to your document."
  },

  insertimage: {
    icon: "🖼️",
    title: "Insert Image",
    description:
      "Insert an image into your PDF."
  },

  scan: {
    icon: "📷",
    title: "Document Scanner",
    description:
      "Scan documents using your device camera."
  },

  protect: {
    icon: "🔐",
    title: "Password Protect",
    description:
      "Protect your PDF with a password."
  },

  lock: {
    icon: "🔒",
    title: "PIN / Fingerprint Lock",
    description:
      "Lock access to LeoPDF using device authentication where supported."
  },

  encrypt: {
    icon: "🛡️",
    title: "Encrypt PDF",
    description:
      "Encrypt your PDF for additional security."
  },

  decrypt: {
    icon: "🔓",
    title: "Decrypt PDF",
    description:
      "Remove encryption from an authorized PDF."
  },

  esign: {
    icon: "✍️",
    title: "eSign Requests",
    description:
      "Prepare a PDF signature request for multiple people."
  },

  cloud: {
    icon: "☁️",
    title: "Cloud Backup",
    description:
      "Connect supported cloud storage services."
  },

  share: {
    icon: "📤",
    title: "Share PDF",
    description:
      "Share PDFs through supported apps."
  },

  bookmark: {
    icon: "🔖",
    title: "Bookmarks",
    description:
      "View and manage saved PDF bookmarks."
  },

  favorites: {
    icon: "⭐",
    title: "Favorites",
    description:
      "View your favorite PDF files."
  },

  offline: {
    icon: "📴",
    title: "Offline Mode",
    description:
      "Basic local PDF operations can work without internet."
  },

  settings: {
    icon: "⚙️",
    title: "Settings",
    description:
      "Manage LeoPDF preferences."
  }

};

/* =========================================================
   OPEN TOOL MODAL
   ========================================================= */

function openTool(toolName) {

  const tool = tools[toolName];

  if (!tool) return;

  $("#modalIcon").textContent = tool.icon;

  $("#modalTitle").textContent = tool.title;

  $("#modalDescription").textContent =
    tool.description;

  const content = $("#modalContent");

  content.innerHTML = "";

  const action = $("#modalAction");

  action.textContent =
    getActionText(toolName);

  action.onclick = () => {

    performTool(toolName);

  };

  $("#modal").classList.remove("hidden");

}

function getActionText(tool) {

  const multi = [
    "merge"
  ];

  const camera = [
    "scan"
  ];

  const special = [
    "protect",
    "encrypt",
    "decrypt",
    "lock"
  ];

  if (multi.includes(tool))
    return "Select PDF Files";

  if (camera.includes(tool))
    return "Open Camera";

  if (special.includes(tool))
    return "Continue";

  return "Select File";

}

/* =========================================================
   TOOL ACTION
   ========================================================= */

function performTool(tool) {

  closeModal();

  if (tool === "settings") {

    openSettings();

    return;

  }

  if (tool === "cloud") {

    toast(
      "Cloud connection setup will be added with the cloud provider."
    );

    return;

  }

  if (tool === "esign") {

    toast(
      "eSign request setup opened."
    );

    return;

  }

  if (tool === "lock") {

    biometricCheck();

    return;

  }

  if (tool === "share") {

    shareCurrentFile();

    return;

  }

  if (tool === "scan") {

    openScanner();

    return;

  }

  if (
    tool === "protect" ||
    tool === "encrypt" ||
    tool === "decrypt"
  ) {

    openSecurityTool(tool);

    return;

  }

  $("#fileInput").click();

  toast(
    `${tools[tool].title}: select your file.`
  );

}

/* =========================================================
   SECURITY UI
   ========================================================= */

function openSecurityTool(tool) {

  const labels = {

    protect: "Create PDF Password",

    encrypt: "Encryption Password",

    decrypt: "PDF Password"

  };

  const input = document.createElement("input");

  input.className = "modal-input";

  input.type = "password";

  input.placeholder =
    labels[tool];

  const content = $("#modalContent");

  content.innerHTML = "";

  content.appendChild(input);

  $("#modalIcon").textContent =
    tools[tool].icon;

  $("#modalTitle").textContent =
    tools[tool].title;

  $("#modalDescription").textContent =
    "Enter the required password to continue.";

  $("#modalAction").textContent =
    "Continue";

  $("#modalAction").onclick = () => {

    if (!input.value.trim()) {

      toast("Enter a password.");

      return;

    }

    closeModal();

    toast(
      `${tools[tool].title} request accepted.`
    );

  };

  $("#modal").classList.remove("hidden");

}

/* =========================================================
   BIOMETRIC
   ========================================================= */

async function biometricCheck() {

  if (
    window.PublicKeyCredential &&
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
  ) {

    try {

      const available =
        await PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable();

      if (available) {

        toast(
          "Device biometric authentication is available."
        );

      } else {

        toast(
          "Biometric authentication is not available."
        );

      }

    } catch {

      toast(
        "Biometric check unavailable."
      );

    }

  } else {

    toast(
      "Device biometric authentication is not supported by this browser."
    );

  }

}

/* =========================================================
   SCANNER
   ========================================================= */

async function openScanner() {

  try {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          }
        }
      });

    stream.getTracks().forEach(
      track => track.stop()
    );

    toast(
      "Camera permission granted. Scanner ready."
    );

  } catch {

    toast(
      "Camera permission was not granted."
    );

  }

}

/* =========================================================
   SETTINGS
   ========================================================= */

function openSettings() {

  $("#modalIcon").textContent = "⚙️";

  $("#modalTitle").textContent =
    "LeoPDF Settings";

  $("#modalDescription").textContent =
    "Manage your LeoPDF preferences.";

  $("#modalContent").innerHTML = `

    <label style="display:flex;align-items:center;gap:10px;margin-top:18px;">
      <input
        type="checkbox"
        id="nightToggle"
        ${document.body.classList.contains("dark") ? "checked" : ""}
      >
      Dark / Night Mode
    </label>

    <button
      id="clearFiles"
      class="modal-input"
      style="cursor:pointer;"
    >
      Clear Recent Files
    </button>

  `;

  $("#modalAction").textContent =
    "Done";

  $("#modalAction").onclick =
    closeModal;

  $("#modal").classList.remove("hidden");

  $("#nightToggle").addEventListener(
    "change",
    event => {

      document.body.classList.toggle(
        "dark",
        event.target.checked
      );

      localStorage.setItem(
        "leoPDFDark",
        event.target.checked
      );

      $("#themeBtn").textContent =
        event.target.checked ? "☀" : "☾";

    }
  );

  $("#clearFiles").addEventListener(
    "click",
    () => {

      selectedFiles = [];

      localStorage.removeItem(
        "leoPDFFiles"
      );

      renderFiles();

      toast("Recent files cleared.");

    }
  );

}

/* =========================================================
   MODAL
   ========================================================= */

$("#closeModal").addEventListener(
  "click",
  closeModal
);

$("#modal").addEventListener(
  "click",
  event => {

    if (event.target === $("#modal")) {
      closeModal();
    }

  }
);

function closeModal() {

  $("#modal").classList.add("hidden");

}

/* =========================================================
   HELPERS
   ========================================================= */

function formatSize(bytes) {

  if (!bytes) return "0 B";

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  return (
    (bytes /
      Math.pow(1024, index)
    ).toFixed(index ? 1 : 0)
    + " "
    + units[index]
  );

}

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

                                }
