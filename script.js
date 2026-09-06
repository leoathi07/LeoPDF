/* =========================================================
   LEO PDF — SCRIPT.JS
   DAY 1 / STEP 3
   ========================================================= */

"use strict";


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   ELEMENTS
   ========================================================= */

const splashScreen = $("splashScreen");
const mainApp = $("mainApp");

const imageToPdfButton = $("imageToPdfButton");
const pdfToImageButton = $("pdfToImageButton");
const mergePdfButton = $("mergePdfButton");
const splitPdfButton = $("splitPdfButton");
const compressPdfButton = $("compressPdfButton");
const moreToolsButton = $("moreToolsButton");

const settingsButton = $("settingsButton");

const imagePdfModal = $("imagePdfModal");
const closeImagePdfModal = $("closeImagePdfModal");

const modalOverlay = imagePdfModal
    ? imagePdfModal.querySelector(".modal-overlay")
    : null;

const imageInput = $("imageInput");
const selectImagesButton = $("selectImagesButton");
const createPdfButton = $("createPdfButton");
const selectedImagesContainer = $("selectedImages");

const toast = $("toast");
const toastMessage = $("toastMessage");

const clearRecentButton = $("clearRecentButton");

const homeNav = $("homeNav");
const filesNav = $("filesNav");
const toolsNav = $("toolsNav");
const settingsNav = $("settingsNav");


/* =========================================================
   APP STATE
   ========================================================= */

let selectedImages = [];
let toastTimer = null;


/* =========================================================
   SPLASH SCREEN
   ========================================================= */

window.addEventListener("load", () => {

    setTimeout(() => {

        if (splashScreen) {
            splashScreen.classList.add("hidden");
        }

        if (mainApp) {
            mainApp.classList.remove("hidden");
        }

    }, 2200);

});


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }

    toastMessage.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =========================================================
   OPEN IMAGE → PDF MODAL
   ========================================================= */

function openImagePdfModal() {

    if (!imagePdfModal) {
        return;
    }

    imagePdfModal.classList.remove("hidden");

    imagePdfModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";

}


/* =========================================================
   CLOSE IMAGE → PDF MODAL
   ========================================================= */

function closeImagePdfModalFunction() {

    if (!imagePdfModal) {
        return;
    }

    imagePdfModal.classList.add("hidden");

    imagePdfModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";

}


/* =========================================================
   IMAGE → PDF BUTTON
   ========================================================= */

if (imageToPdfButton) {

    imageToPdfButton.addEventListener(
        "click",
        openImagePdfModal
    );

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

if (closeImagePdfModal) {

    closeImagePdfModal.addEventListener(
        "click",
        closeImagePdfModalFunction
    );

}


if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        closeImagePdfModalFunction
    );

}


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            if (
                imagePdfModal &&
                !imagePdfModal.classList.contains("hidden")
            ) {

                closeImagePdfModalFunction();

            }

        }

    }
);


/* =========================================================
   SELECT IMAGE BUTTON
   ========================================================= */

if (selectImagesButton && imageInput) {

    selectImagesButton.addEventListener(
        "click",
        () => {

            imageInput.click();

        }
    );

}


/* =========================================================
   IMAGE INPUT CHANGE
   ========================================================= */

if (imageInput) {

    imageInput.addEventListener(
        "change",
        (event) => {

            const files = Array.from(
                event.target.files || []
            );

            if (!files.length) {
                return;
            }

            const imageFiles = files.filter(
                (file) =>
                    file.type.startsWith("image/")
            );

            if (!imageFiles.length) {

                showToast(
                    "Please select image files."
                );

                return;

            }

            selectedImages = imageFiles;

            renderSelectedImages();

            showToast(
                `${selectedImages.length} image${
                    selectedImages.length > 1
                        ? "s"
                        : ""
                } selected`
            );

        }
    );

}


/* =========================================================
   RENDER SELECTED IMAGES
   ========================================================= */

function renderSelectedImages() {

    if (!selectedImagesContainer) {
        return;
    }

    selectedImagesContainer.innerHTML = "";

    selectedImages.forEach(
        (file, index) => {

            const reader = new FileReader();

            reader.onload = (event) => {

                const item =
                    document.createElement("div");

                item.className =
                    "selected-image";

                item.innerHTML = `
                    <img
                        src="${event.target.result}"
                        alt="Selected image ${index + 1}"
                    >

                    <span
                        class="selected-image-number"
                    >
                        ${index + 1}
                    </span>
                `;

                selectedImagesContainer.appendChild(
                    item
                );

            };

            reader.readAsDataURL(file);

        }
    );


    if (createPdfButton) {

        createPdfButton.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   CREATE PDF BUTTON
   ========================================================= */

if (createPdfButton) {

    createPdfButton.addEventListener(
        "click",
        () => {

            if (!selectedImages.length) {

                showToast(
                    "Select at least one image."
                );

                return;

            }

            /*
             * Actual PDF generation will be added
             * in the next step.
             */

            showToast(
                "PDF converter is ready for the next step."
            );

        }
    );

}


/* =========================================================
   OTHER TOOL BUTTONS
   ========================================================= */

if (pdfToImageButton) {

    pdfToImageButton.addEventListener(
        "click",
        () => {

            showToast(
                "PDF → Image will be available soon."
            );

        }
    );

}


if (mergePdfButton) {

    mergePdfButton.addEventListener(
        "click",
        () => {

            showToast(
                "Merge PDF will be available soon."
            );

        }
    );

}


if (splitPdfButton) {

    splitPdfButton.addEventListener(
        "click",
        () => {

            showToast(
                "Split PDF will be available soon."
            );

        }
    );

}


if (compressPdfButton) {

    compressPdfButton.addEventListener(
        "click",
        () => {

            showToast(
                "Compress PDF will be available soon."
            );

        }
    );

}


if (moreToolsButton) {

    moreToolsButton.addEventListener(
        "click",
        () => {

            showToast(
                "More tools will be added soon."
            );

        }
    );

}


/* =========================================================
   SETTINGS
   ========================================================= */

if (settingsButton) {

    settingsButton.addEventListener(
        "click",
        () => {

            showToast(
                "Settings panel is coming next."
            );

        }
    );

}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function setActiveNav(activeButton) {

    const buttons = [
        homeNav,
        filesNav,
        toolsNav,
        settingsNav
    ];

    buttons.forEach(
        (button) => {

            if (button) {
                button.classList.remove(
                    "active"
                );
            }

        }
    );

    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }

}


if (homeNav) {

    homeNav.addEventListener(
        "click",
        () => {

            setActiveNav(homeNav);

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


if (filesNav) {

    filesNav.addEventListener(
        "click",
        () => {

            setActiveNav(filesNav);

            const recentSection =
                document.querySelector(
                    ".recent-section"
                );

            if (recentSection) {

                recentSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


if (toolsNav) {

    toolsNav.addEventListener(
        "click",
        () => {

            setActiveNav(toolsNav);

            const section =
                document.querySelector(
                    ".section"
                );

            if (section) {

                section.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


if (settingsNav) {

    settingsNav.addEventListener(
        "click",
        () => {

            setActiveNav(settingsNav);

            showToast(
                "Settings will be added soon."
            );

        }
    );

}


/* =========================================================
   RECENT FILES
   ========================================================= */

function getRecentFiles() {

    try {

        const stored =
            localStorage.getItem(
                "leoPdfRecentFiles"
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Unable to read recent files:",
            error
        );

        return [];

    }

}


function saveRecentFile(fileData) {

    try {

        let files =
            getRecentFiles();

        files.unshift(fileData);

        files = files.slice(0, 10);

        localStorage.setItem(
            "leoPdfRecentFiles",
            JSON.stringify(files)
        );

    } catch (error) {

        console.error(
            "Unable to save recent file:",
            error
        );

    }

}


/* =========================================================
   CLEAR RECENT FILES
   ========================================================= */

if (clearRecentButton) {

    clearRecentButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "leoPdfRecentFiles"
            );

            renderRecentFiles();

            showToast(
                "Recent files cleared."
            );

        }
    );

}


/* =========================================================
   RENDER RECENT FILES
   ========================================================= */

function renderRecentFiles() {

    const container =
        $("recentFiles");

    if (!container) {
        return;
    }

    const files =
        getRecentFiles();


    if (!files.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📁
                </div>

                <h3>
                    No recent files
                </h3>

                <p>
                    Your converted files will
                    appear here.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML = "";


    files.forEach(
        (file) => {

            const item =
                document.createElement("div");

            item.style.width = "100%";

            item.innerHTML = `
                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:12px;
                        padding:12px;
                        border-radius:14px;
                        background:var(--surface-soft);
                        margin-bottom:8px;
                    "
                >

                    <div
                        style="
                            width:42px;
                            height:42px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            border-radius:12px;
                            background:rgba(108,92,231,.12);
                            font-size:20px;
                        "
                    >
                        📄
                    </div>

                    <div
                        style="
                            flex:1;
                            min-width:0;
                        "
                    >

                        <strong
                            style="
                                display:block;
                                font-size:12px;
                                overflow:hidden;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                            "
                        >
                            ${escapeHTML(
                                file.name ||
                                "Untitled PDF"
                            )}
                        </strong>

                        <span
                            style="
                                display:block;
                                margin-top:4px;
                                color:var(--text-soft);
                                font-size:9px;
                            "
                        >
                            ${escapeHTML(
                                file.date ||
                                "Recently"
                            )}
                        </span>

                    </div>

                </div>
            `;

            container.appendChild(item);

        }
    );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   INITIALIZE
   ========================================================= */

renderRecentFiles();


/* =========================================================
   PREVENT ACCIDENTAL DRAGGING
   ========================================================= */

document.addEventListener(
    "dragstart",
    (event) => {

        if (
            event.target &&
            event.target.tagName === "IMG"
        ) {

            event.preventDefault();

        }

    }
);


/* =========================================================
   CONSOLE MESSAGE
   ========================================================= */

console.log(
    "LeoPDF initialized successfully."
);
