/* =========================================================
   LeoPDF — COMPLETE WORKING SCRIPT.JS
   Convert. Compress. Simplify.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE_KEYS = {
    recentFiles: "leopdf_recent_files",
    theme: "leopdf_theme",
    notifications: "leopdf_notifications"
};

const PDFJS_VERSION = "3.11.174";

let currentTool = null;
let selectedFiles = [];
let isProcessing = false;

let pdfJsPromise = null;
let jsZipPromise = null;
let jsPdfPromise = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "normal") {

    const toast = $("#toast");

    if (!toast) {
        console.log(message);
        return;
    }

    const icon = $("#toastIcon");
    const text = $("#toastMessage");

    if (text) {
        text.textContent = message;
    } else {
        toast.textContent = message;
    }

    if (icon) {

        if (type === "success") {
            icon.textContent = "✓";
        } else if (type === "error") {
            icon.textContent = "!";
        } else {
            icon.textContent = "i";
        }
    }

    toast.classList.remove("success", "error");
    toast.classList.add("show");

    if (type === "success") {
        toast.classList.add("success");
    }

    if (type === "error") {
        toast.classList.add("error");
    }

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.remove("success", "error");
    }, 3000);
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   FILE SIZE
   ========================================================= */

function formatFileSize(bytes) {

    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];

    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    const value =
        bytes / Math.pow(1024, index);

    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadBlob(blob, filename) {

    if (!blob) {
        showToast("Download failed", "error");
        return;
    }

    try {

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1500);

    } catch (error) {

        console.error(error);

        showToast(
            "Download failed",
            "error"
        );
    }
}


/* =========================================================
   RECENT FILES
   ========================================================= */

function getRecentFiles() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_KEYS.recentFiles
            );

        if (!data) {
            return [];
        }

        const parsed =
            JSON.parse(data);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Recent files read error:",
            error
        );

        return [];
    }
}


function saveRecentFile(
    name,
    type,
    size = 0
) {

    try {

        const files =
            getRecentFiles();

        files.unshift({
            name: String(name),
            type: String(type),
            size: Number(size) || 0,
            date: new Date().toISOString()
        });

        const unique = [];

        for (const file of files) {

            const exists =
                unique.some(
                    item =>
                        item.name === file.name &&
                        item.type === file.type
                );

            if (!exists) {
                unique.push(file);
            }
        }

        localStorage.setItem(
            STORAGE_KEYS.recentFiles,
            JSON.stringify(
                unique.slice(0, 20)
            )
        );

        renderRecentFiles();
        renderFilesPage();

    } catch (error) {

        console.error(
            "Could not save recent file:",
            error
        );
    }
}


function clearRecentFiles() {

    try {

        localStorage.removeItem(
            STORAGE_KEYS.recentFiles
        );

        renderRecentFiles();
        renderFilesPage();

        showToast(
            "Recent files cleared",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Could not clear history",
            "error"
        );
    }
}


/* =========================================================
   RECENT FILES — HOME
   ========================================================= */

function renderRecentFiles() {

    const container =
        $("#recentFiles");

    if (!container) {
        return;
    }

    const files =
        getRecentFiles();

    if (!files.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>No Recent Files</h3>
                <p>Your converted files will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        files.slice(0, 8).map(file => {

            const date =
                new Date(file.date);

            const safeDate =
                isNaN(date.getTime())
                    ? ""
                    : date.toLocaleDateString();

            return `
                <div class="recent-file-item">

                    <div class="recent-file-icon">
                        📄
                    </div>

                    <div class="recent-file-info">

                        <strong>
                            ${escapeHTML(file.name)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                file.type || "PDF"
                            )}

                            ${
                                file.size
                                    ? " • " +
                                      formatFileSize(file.size)
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="recent-file-date">
                        ${escapeHTML(safeDate)}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   FILES PAGE
   ========================================================= */

function renderFilesPage() {

    const container =
        $("#filesList");

    if (!container) {
        return;
    }

    const files =
        getRecentFiles();

    if (!files.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <h3>No Files Yet</h3>
                <p>
                    Your converted PDF files will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        files.map(file => {

            const date =
                new Date(file.date);

            const safeDate =
                isNaN(date.getTime())
                    ? ""
                    : date.toLocaleString();

            return `
                <div class="recent-file-item">

                    <div class="recent-file-icon">
                        📄
                    </div>

                    <div class="recent-file-info">

                        <strong>
                            ${escapeHTML(file.name)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                file.type || "PDF"
                            )}
                            ${
                                file.size
                                    ? " • " +
                                      formatFileSize(file.size)
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="recent-file-date">
                        ${escapeHTML(safeDate)}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   PAGE NAVIGATION
   IMPORTANT:
   HTML USES:
   homePage
   filesPage
   toolsPage
   settingsPage
   ========================================================= */

function showPage(pageId) {

    const pages =
        $$(".page");

    if (!pages.length) {
        return;
    }

    let target =
        document.getElementById(pageId);

    if (!target) {

        console.warn(
            "Page not found:",
            pageId
        );

        return;
    }

    pages.forEach(page => {

        page.classList.remove(
            "active-page"
        );

        page.style.display = "none";
    });

    target.classList.add(
        "active-page"
    );

    target.style.display = "block";

    $$(".bottom-nav-item").forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );
    });

    $$(".nav-item").forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );
    });

    if (pageId === "filesPage") {
        renderFilesPage();
    }

    if (pageId === "homePage") {
        renderRecentFiles();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   NAVIGATION SETUP
   ========================================================= */

function setupNavigation() {

    $$(".bottom-nav-item, .nav-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const pageId =
                        item.dataset.page;

                    if (!pageId) {
                        return;
                    }

                    showPage(pageId);
                }
            );
        });

    /*
       IMPORTANT:
       HTML uses homePage.
       NOT "home".
    */

    showPage("homePage");
}


/* =========================================================
   TOOL CONFIG
   ========================================================= */

function getToolConfig(tool) {

    const configs = {

        imageToPdf: {

            title: "Image → PDF",

            description:
                "Convert multiple images into one PDF.",

            icon: "🖼️",

            accept:
                "image/*",

            multiple: true,

            action:
                "Create PDF",

            options: `
                <div class="option-group">

                    <small>
                        Select one or more images.
                        They will be added to the PDF
                        in the selected order.
                    </small>

                </div>
            `
        },


        pdfToImage: {

            title: "PDF → Image",

            description:
                "Convert PDF pages into high-quality images.",

            icon: "🖼️",

            accept:
                ".pdf,application/pdf",

            multiple: false,

            action:
                "Convert to Images",

            options: `
                <div class="option-group">

                    <label for="pdfPageRange">
                        Page Range
                    </label>

                    <input
                        id="pdfPageRange"
                        type="text"
                        placeholder="Example: 1-3 or 1,3,5"
                    >

                    <small>
                        Leave empty to convert all pages.
                    </small>

                </div>

                <div class="option-group">

                    <label for="pdfImageFormat">
                        Image Format
                    </label>

                    <select id="pdfImageFormat">

                        <option value="png">
                            PNG
                        </option>

                        <option value="jpeg">
                            JPG
                        </option>

                    </select>

                </div>

                <div class="option-group">

                    <label for="pdfImageScale">
                        Quality
                    </label>

                    <select id="pdfImageScale">

                        <option value="1.5">
                            Standard
                        </option>

                        <option value="2">
                            High
                        </option>

                        <option value="2.5">
                            Very High
                        </option>

                    </select>

                </div>
            `
        },


        mergePdf: {

            title: "Merge PDF",

            description:
                "Combine multiple PDF files into one PDF.",

            icon: "🔗",

            accept:
                ".pdf,application/pdf",

            multiple: true,

            action:
                "Merge PDFs",

            options: `
                <div class="option-group">

                    <small>
                        Select 2 or more PDF files.
                    </small>

                </div>
            `
        },


        splitPdf: {

            title: "Split PDF",

            description:
                "Extract selected pages into a new PDF.",

            icon: "✂️",

            accept:
                ".pdf,application/pdf",

            multiple: false,

            action:
                "Split PDF",

            options: `
                <div class="option-group">

                    <label for="pageNumbers">
                        Pages
                    </label>

                    <input
                        id="pageNumbers"
                        type="text"
                        placeholder="Example: 1-3 or 1,4,6"
                    >

                    <small>
                        Example:
                        1-3 extracts pages 1, 2 and 3.
                    </small>

                </div>
            `
        },


        compressPdf: {

            title: "Compress PDF",

            description:
                "Optimize and re-save your PDF.",

            icon: "🗜️",

            accept:
                ".pdf,application/pdf",

            multiple: false,

            action:
                "Compress PDF",

            options: `
                <div class="option-group">

                    <label for="compressLevel">
                        Compression Level
                    </label>

                    <select id="compressLevel">

                        <option value="normal">
                            Normal
                        </option>

                        <option value="high">
                            High
                        </option>

                    </select>

                    <small>
                        Actual size reduction depends
                        on the original PDF.
                    </small>

                </div>
            `
        }

    };

    return configs[tool] || null;
}


/* =========================================================
   OPEN TOOL MODAL
   ========================================================= */

function openTool(tool) {

    const config =
        getToolConfig(tool);

    if (!config) {

        showToast(
            "This tool is unavailable",
            "error"
        );

        return;
    }

    const modal =
        $("#toolModal");

    if (!modal) {

        showToast(
            "Tool window not found",
            "error"
        );

        return;
    }

    currentTool = tool;
    selectedFiles = [];

    const modalIcon =
        $("#modalIcon");

    const modalTitle =
        $("#modalTitle");

    const modalDescription =
        $("#modalDescription");

    const fileInput =
        $("#fileInput");

    const fileOptions =
        $("#fileOptions");

    const modalAction =
        $("#modalActionButton");

    if (modalIcon) {
        modalIcon.textContent =
            config.icon;
    }

    if (modalTitle) {
        modalTitle.textContent =
            config.title;
    }

    if (modalDescription) {
        modalDescription.textContent =
            config.description;
    }

    if (fileInput) {

        fileInput.value = "";

        fileInput.accept =
            config.accept;

        fileInput.multiple =
            config.multiple;
    }

    if (fileOptions) {

        fileOptions.innerHTML =
            config.options || "";
    }

    if (modalAction) {

        modalAction.textContent =
            config.action;

        modalAction.disabled =
            false;
    }

    renderSelectedFiles();

    modal.classList.add("show");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   CLOSE TOOL MODAL
   ========================================================= */

function closeToolModal() {

    const modal =
        $("#toolModal");

    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    const input =
        $("#fileInput");

    if (input) {
        input.value = "";
    }

    selectedFiles = [];

    currentTool = null;

    isProcessing = false;
}


/* =========================================================
   TOOL CARD SETUP
   ========================================================= */

function setupToolCards() {

    $$("[data-tool]").forEach(card => {

        card.addEventListener(
            "click",
            event => {

                /*
                   Prevent clicking buttons inside
                   a card from triggering twice.
                */

                if (
                    event.target.closest(
                        "button"
                    )
                ) {
                    return;
                }

                const tool =
                    card.dataset.tool;

                if (!tool) {
                    return;
                }

                openTool(tool);
            }
        );
    });
}


/* =========================================================
   HERO BUTTON
   ========================================================= */

function setupHeroButton() {

    const button =
        $("#heroCreateButton");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {
            openTool("imageToPdf");
        }
    );
}


/* =========================================================
   FILE PICKER
   ========================================================= */

function setupFileInput() {

    const input =
        $("#fileInput");

    if (!input) {
        return;
    }

    input.addEventListener(
        "change",
        event => {

            const files =
                Array.from(
                    event.target.files || []
                );

            if (!files.length) {
                return;
            }

            if (
                currentTool ===
                "imageToPdf"
            ) {

                const images =
                    files.filter(
                        file =>
                            file.type.startsWith(
                                "image/"
                            )
                    );

                selectedFiles.push(
                    ...images
                );

            } else {

                selectedFiles =
                    files;
            }

            renderSelectedFiles();

            /*
               Reset input so the same file
               can be selected again.
            */

            input.value = "";

            if (
                currentTool ===
                "splitPdf" &&
                selectedFiles.length
            ) {

                updateSplitPageCount(
                    selectedFiles[0]
                );
            }
        }
    );
}


/* =========================================================
   SELECTED FILES RENDER
   ========================================================= */

function renderSelectedFiles() {

    const container =
        $("#selectedFiles");

    if (!container) {
        return;
    }

    if (!selectedFiles.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📄
                </div>

                <p>
                    No file selected.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = "";

    selectedFiles.forEach(
        (file, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "selected-file";

            const icon =
                document.createElement(
                    "span"
                );

            icon.textContent =
                file.type.startsWith(
                    "image/"
                )
                    ? "🖼️"
                    : "📄";

            const info =
                document.createElement(
                    "div"
                );

            info.innerHTML = `
                <strong>
                    ${escapeHTML(file.name)}
                </strong>

                <small>
                    ${formatFileSize(file.size)}
                </small>
            `;

            const remove =
                document.createElement(
                    "button"
                );

            remove.type =
                "button";

            remove.className =
                "remove-file";

            remove.textContent =
                "×";

            remove.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    selectedFiles.splice(
                        index,
                        1
                    );

                    renderSelectedFiles();
                }
            );

            wrapper.appendChild(icon);
            wrapper.appendChild(info);
            wrapper.appendChild(remove);

            container.appendChild(
                wrapper
            );
        }
    );
}


/* =========================================================
   MODAL PICKER AREA
   ========================================================= */

function setupPickerArea() {

    const modal =
        $("#toolModal");

    if (!modal) {
        return;
    }

    modal.addEventListener(
        "click",
        event => {

            const picker =
                event.target.closest(
                    ".file-picker"
                );

            if (
                picker &&
                currentTool
            ) {

                $("#fileInput")?.click();
            }
        }
    );

    /*
       Also support common custom picker
       buttons if present in HTML.
    */

    $$(
        "[data-open-file-picker]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                $("#fileInput")?.click();
            }
        );
    });
}


/* =========================================================
   DRAG & DROP
   ========================================================= */

function setupDragDrop() {

    const modal =
        $("#toolModal");

    if (!modal) {
        return;
    }

    modal.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            modal.classList.add(
                "dragging"
            );
        }
    );

    modal.addEventListener(
        "dragleave",
        event => {

            if (
                event.target === modal
            ) {

                modal.classList.remove(
                    "dragging"
                );
            }
        }
    );

    modal.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            modal.classList.remove(
                "dragging"
            );

            const files =
                Array.from(
                    event.dataTransfer.files || []
                );

            if (!files.length) {
                return;
            }

            if (
                currentTool ===
                "imageToPdf"
            ) {

                selectedFiles.push(
                    ...files.filter(
                        file =>
                            file.type.startsWith(
                                "image/"
                            )
                    )
                );

            } else {

                selectedFiles =
                    files;
            }

            renderSelectedFiles();
        }
    );
}


/* =========================================================
   IMAGE → PDF LIBRARY
   ========================================================= */

function loadScript(
    src,
    globalName
) {

    return new Promise(
        (resolve, reject) => {

            if (
                globalName &&
                window[globalName]
            ) {
                resolve(
                    window[globalName]
                );
                return;
            }

            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );

            if (existing) {

                existing.addEventListener(
                    "load",
                    () => {

                        if (
                            globalName &&
                            !window[globalName]
                        ) {

                            reject(
                                new Error(
                                    "Library failed to load"
                                )
                            );

                            return;
                        }

                        resolve(
                            globalName
                                ? window[
                                    globalName
                                ]
                                : true
                        );
                    }
                );

                existing.addEventListener(
                    "error",
                    () => {
                        reject(
                            new Error(
                                "Library failed to load"
                            )
                        );
                    }
                );

                return;
            }

            const script =
                document.createElement(
                    "script"
                );

            script.src = src;
            script.async = true;

            script.onload = () => {

                if (
                    globalName &&
                    !window[globalName]
                ) {

                    reject(
                        new Error(
                            "Library failed to load"
                        )
                    );

                    return;
                }

                resolve(
                    globalName
                        ? window[
                            globalName
                        ]
                        : true
                );
            };

            script.onerror = () => {

                reject(
                    new Error(
                        "Could not load required library"
                    )
                );
            };

            document.head.appendChild(
                script
            );
        }
    );
}


function getJsPDF() {

    if (
        window.jspdf &&
        window.jspdf.jsPDF
    ) {

        return Promise.resolve(
            window.jspdf.jsPDF
        );
    }

    if (jsPdfPromise) {
        return jsPdfPromise;
    }

    jsPdfPromise =
        loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
            "jspdf"
        ).then(
            library =>
                library.jsPDF
        );

    return jsPdfPromise;
}


/* =========================================================
   READ FILE
   ========================================================= */

function readFileAsDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(
                    reader.result
                );

            reader.onerror =
                () => reject(
                    new Error(
                        "Could not read file"
                    )
                );

            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================================
   IMAGE INFORMATION
   ========================================================= */

function getImageInfo(
    dataURL
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            image.onload =
                () => {

                    resolve({
                        width:
                            image.naturalWidth,

                        height:
                            image.naturalHeight
                    });
                };

            image.onerror =
                () => reject(
                    new Error(
                        "Invalid image"
                    )
                );

            image.src =
                dataURL;
        }
    );
}


/* =========================================================
   IMAGE → PDF
   ========================================================= */

async function createImagePDF() {

    if (
        !selectedFiles.length
    ) {

        throw new Error(
            "Please select at least one image"
        );
    }

    const images =
        selectedFiles.filter(
            file =>
                file.type.startsWith(
                    "image/"
                )
        );

    if (!images.length) {

        throw new Error(
            "Please select valid image files"
        );
    }

    const jsPDF =
        await getJsPDF();

    let pdf = null;

    for (
        let i = 0;
        i < images.length;
        i++
    ) {

        const file =
            images[i];

        const dataURL =
            await readFileAsDataURL(
                file
            );

        const info =
            await getImageInfo(
                dataURL
            );

        const orientation =
            info.width > info.height
                ? "landscape"
                : "portrait";

        if (!pdf) {

            pdf =
                new jsPDF({
                    orientation,
                    unit: "mm",
                    format: "a4"
                });

        } else {

            pdf.addPage(
                "a4",
                orientation
            );
        }

        const pageWidth =
            orientation === "landscape"
                ? 297
                : 210;

        const pageHeight =
            orientation === "landscape"
                ? 210
                : 297;

        const margin = 8;

        const maxWidth =
            pageWidth -
            margin * 2;

        const maxHeight =
            pageHeight -
            margin * 2;

        const ratio =
            Math.min(
                maxWidth / info.width,
                maxHeight / info.height
            );

        const width =
            info.width * ratio;

        const height =
            info.height * ratio;

        const x =
            (pageWidth - width) / 2;

        const y =
            (pageHeight - height) / 2;

        const imageFormat =
            file.type === "image/png"
                ? "PNG"
                : "JPEG";

        pdf.addImage(
            dataURL,
            imageFormat,
            x,
            y,
            width,
            height,
            undefined,
            "FAST"
        );
    }

    const blob =
        pdf.output("blob");

    const filename =
        `LeoPDF_${formatDateForFilename(
            new Date()
        )}.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Image → PDF",
        blob.size
    );

    showToast(
        "PDF created successfully!",
        "success"
    );
}


/* =========================================================
   PDF.JS
   ========================================================= */

function getPDFJS() {

    if (
        window.pdfjsLib
    ) {

        if (
            window.pdfjsLib
                .GlobalWorkerOptions
        ) {

            window.pdfjsLib
                .GlobalWorkerOptions
                .workerSrc =
                `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
        }

        return Promise.resolve(
            window.pdfjsLib
        );
    }

    if (pdfJsPromise) {
        return pdfJsPromise;
    }

    pdfJsPromise =
        loadScript(
            `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`,
            "pdfjsLib"
        ).then(
            pdfjs => {

                pdfjs
                    .GlobalWorkerOptions
                    .workerSrc =
                    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

                return pdfjs;
            }
        );

    return pdfJsPromise;
}


/* =========================================================
   PAGE RANGE PARSER
   ========================================================= */

function parsePageRange(
    value,
    maxPages
) {

    if (
        !value ||
        !value.trim()
    ) {

        return Array.from(
            {
                length: maxPages
            },
            (_, index) =>
                index + 1
        );
    }

    const result =
        new Set();

    const parts =
        value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    for (
        const part of parts
    ) {

        if (
            part.includes("-")
        ) {

            const values =
                part
                    .split("-")
                    .map(
                        Number
                    );

            if (
                values.length !== 2 ||
                !Number.isInteger(
                    values[0]
                ) ||
                !Number.isInteger(
                    values[1]
                )
            ) {

                continue;
            }

            let start =
                values[0];

            let end =
                values[1];

            if (
                start > end
            ) {

                [
                    start,
                    end
                ] =
                    [
                        end,
                        start
                    ];
            }

            start =
                Math.max(
                    1,
                    start
                );

            end =
                Math.min(
                    maxPages,
                    end
                );

            for (
                let i = start;
                i <= end;
                i++
            ) {

                result.add(i);
            }

        } else {

            const page =
                Number(part);

            if (
                Number.isInteger(
                    page
                ) &&
                page >= 1 &&
                page <= maxPages
            ) {

                result.add(
                    page
                );
            }
        }
    }

    return Array.from(
        result
    ).sort(
        (a, b) => a - b
    );
}


/* =========================================================
   PDF → IMAGE
   ========================================================= */

async function convertPDFToImages(
    file
) {

    const pdfjsLib =
        await getPDFJS();

    const buffer =
        await file.arrayBuffer();

    const pdf =
        await pdfjsLib
            .getDocument({
                data: buffer
            })
            .promise;

    const rangeInput =
        $("#pdfPageRange");

    const formatInput =
        $("#pdfImageFormat");

    const scaleInput =
        $("#pdfImageScale");

    const range =
        rangeInput
            ? rangeInput.value.trim()
            : "";

    const format =
        formatInput
            ? formatInput.value
            : "png";

    const scale =
        scaleInput
            ? Number(
                scaleInput.value
            )
            : 1.5;

    const pages =
        parsePageRange(
            range,
            pdf.numPages
        );

    if (!pages.length) {

        throw new Error(
            "Invalid page range"
        );
    }

    showToast(
        `Converting ${pages.length} page(s)...`
    );

    let JSZip = null;

    try {

        JSZip =
            await getJSZip();

    } catch (error) {

        console.warn(
            "ZIP library unavailable",
            error
        );
    }

    const outputImages = [];

    for (
        let i = 0;
        i < pages.length;
        i++
    ) {

        const pageNumber =
            pages[i];

        const page =
            await pdf.getPage(
                pageNumber
            );

        const viewport =
            page.getViewport({
                scale
            });

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            Math.ceil(
                viewport.width
            );

        canvas.height =
            Math.ceil(
                viewport.height
            );

        const context =
            canvas.getContext(
                "2d",
                {
                    alpha: false
                }
            );

        if (!context) {

            throw new Error(
                "Canvas is not supported"
            );
        }

        await page.render({
            canvasContext:
                context,

            viewport
        }).promise;

        const mime =
            format === "jpeg"
                ? "image/jpeg"
                : "image/png";

        const quality =
            format === "jpeg"
                ? 0.92
                : undefined;

        const blob =
            await canvasToBlob(
                canvas,
                mime,
                quality
            );

        const extension =
            format === "jpeg"
                ? "jpg"
                : "png";

        const filename =
            `${removeExtension(
                file.name
            )}_page_${pageNumber}.${extension}`;

        outputImages.push({
            blob,
            filename
        });
    }


    /* =====================================================
       ZIP AVAILABLE
       ===================================================== */

    if (JSZip) {

        const zip =
            new JSZip();

        outputImages.forEach(
            item => {

                zip.file(
                    item.filename,
                    item.blob
                );
            }
        );

        const zipBlob =
            await zip.generateAsync({
                type: "blob",
                compression:
                    "DEFLATE",
                compressionOptions: {
                    level: 6
                }
            });

        const zipName =
            `${removeExtension(
                file.name
            )}_images.zip`;

        downloadBlob(
            zipBlob,
            zipName
        );

        saveRecentFile(
            zipName,
            "PDF → Images",
            zipBlob.size
        );

    } else {

        /*
           Fallback:
           Download images individually.
        */

        for (
            let i = 0;
            i < outputImages.length;
            i++
        ) {

            downloadBlob(
                outputImages[i].blob,
                outputImages[i].filename
            );

            await sleep(250);
        }

        if (
            outputImages.length
        ) {

            saveRecentFile(
                outputImages[0].filename,
                "PDF → Image",
                outputImages[0].blob.size
            );
        }
    }

    showToast(
        `${pages.length} image(s) created successfully!`,
        "success"
    );
}


/* =========================================================
   JSZIP
   ========================================================= */

function getJSZip() {

    if (window.JSZip) {

        return Promise.resolve(
            window.JSZip
        );
    }

    if (jsZipPromise) {
        return jsZipPromise;
    }

    jsZipPromise =
        loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
            "JSZip"
        );

    return jsZipPromise;
}


/* =========================================================
   MERGE PDF
   ========================================================= */

async function mergePDFs(
    files
) {

    if (!window.PDFLib) {

        throw new Error(
            "PDF library is not loaded"
        );
    }

    if (
        files.length < 2
    ) {

        throw new Error(
            "Select at least 2 PDF files"
        );
    }

    const {
        PDFDocument
    } =
        window.PDFLib;

    const mergedPdf =
        await PDFDocument.create();

    for (
        const file of files
    ) {

        const bytes =
            await file.arrayBuffer();

        const sourcePdf =
            await PDFDocument.load(
                bytes
            );

        const pages =
            await mergedPdf.copyPages(
                sourcePdf,
                sourcePdf.getPageIndices()
            );

        pages.forEach(
            page => {
                mergedPdf.addPage(
                    page
                );
            }
        );
    }

    const output =
        await mergedPdf.save({
            useObjectStreams:
                true
        });

    const blob =
        new Blob(
            [output],
            {
                type:
                    "application/pdf"
            }
        );

    const filename =
        `LeoPDF_Merged_${formatDateForFilename(
            new Date()
        )}.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Merge PDF",
        blob.size
    );

    showToast(
        `${files.length} PDFs merged successfully!`,
        "success"
    );
}


/* =========================================================
   SPLIT PDF
   ========================================================= */

async function splitPDF(
    file
) {

    if (!window.PDFLib) {

        throw new Error(
            "PDF library is not loaded"
        );
    }

    const {
        PDFDocument
    } =
        window.PDFLib;

    const bytes =
        await file.arrayBuffer();

    const sourcePdf =
        await PDFDocument.load(
            bytes
        );

    const totalPages =
        sourcePdf.getPageCount();

    const pageInput =
        $("#pageNumbers");

    const range =
        pageInput
            ? pageInput.value.trim()
            : "";

    const pages =
        parsePageRange(
            range,
            totalPages
        );

    if (!pages.length) {

        throw new Error(
            `Enter valid pages from 1 to ${totalPages}`
        );
    }

    const newPdf =
        await PDFDocument.create();

    const copiedPages =
        await newPdf.copyPages(
            sourcePdf,
            pages.map(
                page =>
                    page - 1
            )
        );

    copiedPages.forEach(
        page => {
            newPdf.addPage(
                page
            );
        }
    );

    const output =
        await newPdf.save({
            useObjectStreams:
                true
        });

    const blob =
        new Blob(
            [output],
            {
                type:
                    "application/pdf"
            }
        );

    const filename =
        `${removeExtension(
            file.name
        )}_split.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Split PDF",
        blob.size
    );

    showToast(
        `${pages.length} page(s) extracted successfully!`,
        "success"
    );
}


/* =========================================================
   COMPRESS PDF
   ========================================================= */

async function compressPDF(
    file
) {

    if (!window.PDFLib) {

        throw new Error(
            "PDF library is not loaded"
        );
    }

    const {
        PDFDocument
    } =
        window.PDFLib;

    const bytes =
        await file.arrayBuffer();

    const originalSize =
        bytes.byteLength;

    const pdf =
        await PDFDocument.load(
            bytes
        );

    const output =
        await pdf.save({
            useObjectStreams:
                true,

            addDefaultPage:
                false,

            objectsPerTick:
                50
        });

    const blob =
        new Blob(
            [output],
            {
                type:
                    "application/pdf"
            }
        );

    const newSize =
        blob.size;

    const filename =
        `${removeExtension(
            file.name
        )}_compressed.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Compress PDF",
        newSize
    );

    if (
        originalSize > newSize
    ) {

        const percentage =
            (
                (
                    (originalSize - newSize) /
                    originalSize
                ) * 100
            ).toFixed(1);

        showToast(
            `Compressed by ${percentage}%`,
            "success"
        );

    } else {

        showToast(
            "PDF optimized successfully",
            "success"
        );
    }
}


/* =========================================================
   SPLIT PAGE COUNT
   ========================================================= */

async function updateSplitPageCount(
    file
) {

    if (!window.PDFLib) {
        return;
    }

    try {

        const bytes =
            await file.arrayBuffer();

        const pdf =
            await window.PDFLib
                .PDFDocument
                .load(bytes);

        const count =
            pdf.getPageCount();

        const input =
            $("#pageNumbers");

        if (input) {

            input.placeholder =
                `1-${count} or 1,3,${count}`;
        }

    } catch (error) {

        console.error(
            "Page count error:",
            error
        );
    }
}


/* =========================================================
   RUN CURRENT TOOL
   ========================================================= */

async function runCurrentTool() {

    if (isProcessing) {
        return;
    }

    if (!currentTool) {
        return;
    }

    if (
        !selectedFiles.length
    ) {

        showToast(
            "Please select a file",
            "error"
        );

        return;
    }

    const button =
        $("#modalActionButton");

    isProcessing = true;

    setButtonLoading(
        button,
        true,
        "Processing..."
    );

    try {

        switch (currentTool) {

            case "imageToPdf":

                await createImagePDF();

                break;


            case "pdfToImage":

                await convertPDFToImages(
                    selectedFiles[0]
                );

                break;


            case "mergePdf":

                await mergePDFs(
                    selectedFiles
                );

                break;


            case "splitPdf":

                await splitPDF(
                    selectedFiles[0]
                );

                break;


            case "compressPdf":

                await compressPDF(
                    selectedFiles[0]
                );

                break;


            default:

                throw new Error(
                    "Unknown tool"
                );
        }

        closeToolModal();

    } catch (error) {

        console.error(
            "LeoPDF tool error:",
            error
        );

        showToast(
            error.message ||
            "Operation failed",
            "error"
        );

    } finally {

        isProcessing = false;

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(
    button,
    loading,
    text = "Processing..."
) {

    if (!button) {
        return;
    }

    if (loading) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.innerHTML = `
            <span class="button-spinner"></span>
            ${escapeHTML(text)}
        `;

    } else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            button.textContent;
    }
}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModalEvents() {

    const modal =
        $("#toolModal");

    const overlay =
        $("#modalOverlay");

    const closeButton =
        $("#modalClose");

    const actionButton =
        $("#modalActionButton");

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeToolModal
        );
    }

    if (overlay) {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeToolModal();
                }
            }
        );
    }

    /*
       Some HTML versions use the
       whole modal as the overlay.
    */

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeToolModal();
                }
            }
        );
    }

    if (actionButton) {

        actionButton.addEventListener(
            "click",
            runCurrentTool
        );
    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeToolModal();
            }
        }
    );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    const darkToggle =
        $("#darkModeToggle");

    const notificationToggle =
        $("#notificationToggle");

    /*
       DARK MODE
    */

    const savedTheme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        );

    /*
       Default = dark.
    */

    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

        if (darkToggle) {
            darkToggle.checked =
                false;
        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );

        if (darkToggle) {
            darkToggle.checked =
                true;
        }
    }


    if (darkToggle) {

        darkToggle.addEventListener(
            "change",
            () => {

                if (
                    darkToggle.checked
                ) {

                    document.body.classList.remove(
                        "light-mode"
                    );

                    localStorage.setItem(
                        STORAGE_KEYS.theme,
                        "dark"
                    );

                } else {

                    document.body.classList.add(
                        "light-mode"
                    );

                    localStorage.setItem(
                        STORAGE_KEYS.theme,
                        "light"
                    );
                }
            }
        );
    }


    /*
       NOTIFICATIONS
    */

    const notifications =
        localStorage.getItem(
            STORAGE_KEYS.notifications
        );

    if (notificationToggle) {

        notificationToggle.checked =
            notifications !== "off";

        notificationToggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    STORAGE_KEYS.notifications,
                    notificationToggle.checked
                        ? "on"
                        : "off"
                );
            }
        );
    }


    /*
       CLEAR HISTORY
    */

    const clearButton =
        $("#clearHistoryButton");

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "Clear all recent files?"
                    );

                if (!confirmed) {
                    return;
                }

                clearRecentFiles();
            }
        );
    }
}


/* =========================================================
   FILES BUTTON
   ========================================================= */

function setupFilesButton() {

    const button =
        $("#openFilesButton");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            showPage(
                "filesPage"
            );
        }
    );
}


/* =========================================================
   NOTIFICATION BUTTON
   ========================================================= */

function setupNotificationButton() {

    const button =
        $("#notificationButton");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const state =
                localStorage.getItem(
                    STORAGE_KEYS.notifications
                );

            if (state === "off") {

                showToast(
                    "Notifications are turned off"
                );

            } else {

                showToast(
                    "You're all caught up ✓",
                    "success"
                );
            }
        }
    );
}


/* =========================================================
   FILE PICKER FALLBACK
   ========================================================= */

function setupFilePickerFallback() {

    const selected =
        $("#selectedFiles");

    if (!selected) {
        return;
    }

    selected.addEventListener(
        "click",
        event => {

            /*
               If user clicks the empty
               selected-file area, open picker.
            */

            if (
                event.target.closest(
                    "button"
                )
            ) {
                return;
            }

            if (
                !selectedFiles.length
            ) {

                $("#fileInput")?.click();
            }
        }
    );
}


/* =========================================================
   LOGO / SPLASH
   ========================================================= */

function setupSplash() {

    const splash =
        $("#splashScreen");

    const app =
        $("#app");

    const logo =
        $("#splashLogo");

    const fallback =
        $("#logoFallback");

    if (logo) {

        logo.addEventListener(
            "load",
            () => {

                logo.style.display =
                    "block";

                if (fallback) {

                    fallback.style.display =
                        "none";
                }
            }
        );

        logo.addEventListener(
            "error",
            () => {

                logo.style.display =
                    "none";

                if (fallback) {

                    fallback.style.display =
                        "flex";
                }
            }
        );
    }


    /*
       VERY IMPORTANT:
       .app in CSS is display:none.
       We explicitly show it after splash.
    */

    if (app) {

        app.style.display =
            "none";
    }


    setTimeout(
        () => {

            if (splash) {

                splash.classList.add(
                    "hide"
                );
            }

            if (app) {

                app.style.display =
                    "block";
            }

            /*
               Force Home page visible.
            */

            showPage(
                "homePage"
            );

        },
        2200
    );
}


/* =========================================================
   IMAGE HELPERS
   ========================================================= */

function canvasToBlob(
    canvas,
    type = "image/png",
    quality
) {

    return new Promise(
        (resolve, reject) => {

            canvas.toBlob(
                blob => {

                    if (blob) {

                        resolve(
                            blob
                        );

                    } else {

                        reject(
                            new Error(
                                "Image conversion failed"
                            )
                        );
                    }
                },
                type,
                quality
            );
        }
    );
}


/* =========================================================
   UTILITY
   ========================================================= */

function removeExtension(
    filename
) {

    return String(filename)
        .replace(
            /\.[^/.]+$/,
            ""
        );
}


function formatDateForFilename(
    date
) {

    const pad =
        number =>
            String(number)
                .padStart(2, "0");

    return [
        date.getFullYear(),
        pad(
            date.getMonth() + 1
        ),
        pad(
            date.getDate()
        )
    ].join("-");
}


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* =========================================================
   PDF LIBRARY CHECK
   ========================================================= */

function checkLibraries() {

    if (!window.PDFLib) {

        console.warn(
            "pdf-lib is not available yet."
        );
    }

    if (!window.pdfjsLib) {

        console.log(
            "PDF.js will be loaded when required."
        );
    }
}


/* =========================================================
   GLOBAL ERROR HANDLING
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "LeoPDF Error:",
            event.error ||
            event.message
        );
    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "LeoPDF Promise Error:",
            event.reason
        );

        if (!isProcessing) {

            showToast(
                "Something went wrong. Please try again.",
                "error"
            );
        }
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "LeoPDF initializing..."
        );

        console.log(
            "Convert. Compress. Simplify."
        );

        console.log(
            "================================="
        );


        setupSplash();

        setupNavigation();

        setupToolCards();

        setupHeroButton();

        setupFileInput();

        setupModalEvents();

        setupPickerArea();

        setupDragDrop();

        setupSettings();

        setupFilesButton();

        setupNotificationButton();

        setupFilePickerFallback();

        renderRecentFiles();

        renderFilesPage();

        checkLibraries();


        console.log(
            "LeoPDF READY ✓"
        );
    }
);
