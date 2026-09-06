/* =========================================================
   LEOPDF — COMPLETE WORKING SCRIPT.JS
   Convert. Compress. Simplify.
   Matches current index.html + style.css
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE = {
    recent: "leopdf_recent_files",
    theme: "leopdf_theme",
    notifications: "leopdf_notifications"
};

let currentTool = null;
let selectedFiles = [];
let isProcessing = false;

const $ = (id) => document.getElementById(id);

const TOOL_CONFIG = {
    imageToPdf: {
        title: "Image → PDF",
        description: "Convert multiple images into a single PDF file.",
        icon: "🖼️",
        accept: "image/*",
        multiple: true,
        action: "Create PDF"
    },

    pdfToImage: {
        title: "PDF → Image",
        description: "Convert PDF pages into high-quality images.",
        icon: "📄",
        accept: ".pdf,application/pdf",
        multiple: false,
        action: "Convert to Images"
    },

    mergePdf: {
        title: "Merge PDF",
        description: "Combine multiple PDF files into one PDF.",
        icon: "🔗",
        accept: ".pdf,application/pdf",
        multiple: true,
        action: "Merge PDFs"
    },

    splitPdf: {
        title: "Split PDF",
        description: "Extract selected pages from a PDF.",
        icon: "✂️",
        accept: ".pdf,application/pdf",
        multiple: false,
        action: "Split PDF"
    },

    compressPdf: {
        title: "Compress PDF",
        description: "Optimize and re-save your PDF.",
        icon: "🗜️",
        accept: ".pdf,application/pdf",
        multiple: false,
        action: "Compress PDF"
    }
};

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("LeoPDF starting...");

    try {

        setupSplash();
        setupNavigation();
        setupTools();
        setupModal();
        setupFileInput();
        setupButtons();
        setupSettings();
        setupNotifications();

        loadTheme();
        renderRecentFiles();
        renderFilesPage();

        console.log("LeoPDF ready.");

    } catch (error) {

        console.error("LeoPDF initialization error:", error);

        showToast(
            "App loading error. Please refresh.",
            "error"
        );
    }
});


/* =========================================================
   SPLASH SCREEN
   ========================================================= */

function setupSplash() {

    const splash = $("splashScreen");
    const app = $("app");
    const logo = $("splashLogo");
    const fallback = $("logoFallback");

    if (logo) {

        logo.addEventListener("error", () => {

            logo.style.display = "none";

            if (fallback) {
                fallback.style.display = "flex";
            }
        });

        logo.addEventListener("load", () => {

            logo.style.display = "block";

            if (fallback) {
                fallback.style.display = "none";
            }
        });
    }

    if (app) {
        app.style.display = "none";
    }

    setTimeout(() => {

        if (splash) {
            splash.classList.add("hide");
        }

        setTimeout(() => {

            if (splash) {
                splash.style.display = "none";
            }

            if (app) {
                app.style.display = "block";
            }

            showPage("homePage");

        }, 500);

    }, 2200);
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.remove("active-page");
        page.style.display = "none";
    });

    const target = $(pageId);

    if (target) {

        target.classList.add("active-page");
        target.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } else {

        console.warn("Page not found:", pageId);
    }

    document.querySelectorAll(".bottom-nav-item").forEach(item => {

        item.classList.remove("active");

        if (item.dataset.page === pageId) {
            item.classList.add("active");
        }
    });
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document.querySelectorAll(".bottom-nav-item").forEach(item => {

        item.addEventListener("click", () => {

            const page = item.dataset.page;

            if (page) {
                showPage(page);

                if (page === "filesPage") {
                    renderFilesPage();
                }
            }
        });
    });

    const openFiles = $("openFilesButton");

    if (openFiles) {

        openFiles.addEventListener("click", () => {
            showPage("filesPage");
            renderFilesPage();
        });
    }

    const heroButton = $("heroCreateButton");

    if (heroButton) {

        heroButton.addEventListener("click", () => {
            openTool("imageToPdf");
        });
    }

    /* Home default */
    setTimeout(() => {
        showPage("homePage");
    }, 50);
}


/* =========================================================
   TOOL CARDS
   ========================================================= */

function setupTools() {

    document.querySelectorAll("[data-tool]").forEach(card => {

        card.addEventListener("click", () => {

            const tool = card.dataset.tool;

            if (!TOOL_CONFIG[tool]) {
                console.warn("Unknown tool:", tool);
                return;
            }

            openTool(tool);
        });
    });
}


/* =========================================================
   OPEN TOOL
   ========================================================= */

function openTool(tool) {

    const config = TOOL_CONFIG[tool];

    if (!config) {
        showToast("Tool not available.", "error");
        return;
    }

    const modal = $("toolModal");

    if (!modal) {
        showToast("Tool window not found.", "error");
        return;
    }

    currentTool = tool;
    selectedFiles = [];

    const title = $("modalTitle");
    const description = $("modalDescription");
    const icon = $("modalIcon");
    const input = $("fileInput");
    const options = $("fileOptions");
    const splitOptions = $("splitOptions");
    const selectedContainer = $("selectedFiles");
    const actionButton = $("modalActionButton");

    if (title) {
        title.textContent = config.title;
    }

    if (description) {
        description.textContent = config.description;
    }

    if (icon) {
        icon.textContent = config.icon;
    }

    if (input) {

        input.value = "";
        input.accept = config.accept;
        input.multiple = config.multiple;

        if (tool === "imageToPdf") {
            input.setAttribute("accept", "image/*");
        }
    }

    if (options) {
        options.innerHTML = "";
    }

    if (splitOptions) {
        splitOptions.classList.remove("show");
        splitOptions.innerHTML = "";
    }

    createToolOptions(tool);

    if (actionButton) {
        actionButton.textContent = config.action;
        actionButton.disabled = false;
    }

    renderSelectedFiles();

    modal.classList.add("show");
}


/* =========================================================
   TOOL OPTIONS
   ========================================================= */

function createToolOptions(tool) {

    const options = $("fileOptions");

    if (!options) {
        return;
    }

    if (tool === "pdfToImage") {

        options.innerHTML = `
            <div class="option-group">
                <label for="pageNumbers">Page Range</label>

                <input
                    id="pageNumbers"
                    type="text"
                    placeholder="Example: 1-3 or 1,3,5"
                />

                <small>
                    Leave empty to convert all pages.
                </small>
            </div>

            <div class="option-group">
                <label for="imageFormat">Image Format</label>

                <select id="imageFormat">
                    <option value="png">PNG</option>
                    <option value="jpeg">JPG</option>
                </select>
            </div>

            <div class="option-group">
                <label for="imageQuality">Quality</label>

                <select id="imageQuality">
                    <option value="1.5">Standard</option>
                    <option value="2">High</option>
                    <option value="2.5">Very High</option>
                </select>
            </div>
        `;
    }

    if (tool === "mergePdf") {

        options.innerHTML = `
            <div class="option-group">
                <small>
                    Select two or more PDF files.
                </small>
            </div>
        `;
    }

    if (tool === "splitPdf") {

        const split = $("splitOptions");

        if (split) {

            split.classList.add("show");

            split.innerHTML = `
                <div class="option-group">
                    <label for="pageNumbers">Pages</label>

                    <input
                        id="pageNumbers"
                        type="text"
                        placeholder="Example: 1-3 or 1,4,6"
                    />

                    <small>
                        Example: 1-3 extracts pages 1, 2 and 3.
                    </small>
                </div>
            `;
        }
    }

    if (tool === "compressPdf") {

        options.innerHTML = `
            <div class="option-group">
                <label for="compressLevel">
                    Compression
                </label>

                <select id="compressLevel">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                </select>

                <small>
                    Results depend on the original PDF.
                </small>
            </div>
        `;
    }

    if (tool === "imageToPdf") {

        options.innerHTML = `
            <div class="option-group">
                <small>
                    Select multiple images. Each image will become a PDF page.
                </small>
            </div>
        `;
    }
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeTool() {

    const modal = $("toolModal");

    if (modal) {
        modal.classList.remove("show");
    }

    currentTool = null;
    selectedFiles = [];

    const input = $("fileInput");

    if (input) {
        input.value = "";
    }
}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModal() {

    const modal = $("toolModal");
    const overlay = $("modalOverlay");
    const closeButton = $("modalClose");

    if (closeButton) {
        closeButton.addEventListener("click", closeTool);
    }

    if (overlay) {
        overlay.addEventListener("click", closeTool);
    }

    if (modal) {

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                closeTool();
            }
        });
    }

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeTool();
        }
    });
}


/* =========================================================
   FILE INPUT
   ========================================================= */

function setupFileInput() {

    const input = $("fileInput");

    if (!input) {
        return;
    }

    input.addEventListener("change", event => {

        const files = Array.from(
            event.target.files || []
        );

        if (!files.length) {
            return;
        }

        if (currentTool === "imageToPdf") {

            selectedFiles = files.filter(
                file => file.type.startsWith("image/")
            );

        } else if (
            currentTool === "mergePdf"
        ) {

            selectedFiles = files.filter(
                file =>
                    file.type === "application/pdf" ||
                    file.name.toLowerCase().endsWith(".pdf")
            );

        } else {

            selectedFiles = files.slice(0, 1);
        }

        renderSelectedFiles();

        input.value = "";
    });
}


/* =========================================================
   RENDER SELECTED FILES
   ========================================================= */

function renderSelectedFiles() {

    const container = $("selectedFiles");

    if (!container) {
        return;
    }

    if (!selectedFiles.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <p>Select your file</p>
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        const item = document.createElement("div");

        item.className = "selected-file";

        item.innerHTML = `
            <div class="selected-file-icon">
                ${file.type.startsWith("image/") ? "🖼️" : "📄"}
            </div>

            <div class="selected-file-info">
                <strong>${escapeHTML(file.name)}</strong>
                <span>${formatSize(file.size)}</span>
            </div>

            <button
                type="button"
                class="remove-file"
                aria-label="Remove file">
                ×
            </button>
        `;

        const removeButton =
            item.querySelector(".remove-file");

        if (removeButton) {

            removeButton.addEventListener(
                "click",
                () => {

                    selectedFiles.splice(index, 1);

                    renderSelectedFiles();
                }
            );
        }

        container.appendChild(item);
    });
}


/* =========================================================
   BUTTONS
   ========================================================= */

function setupButtons() {

    const actionButton = $("modalActionButton");

    if (actionButton) {

        actionButton.addEventListener(
            "click",
            runTool
        );
    }

    const clearHistory = $("clearHistoryButton");

    if (clearHistory) {

        clearHistory.addEventListener(
            "click",
            clearHistoryData
        );
    }
}


/* =========================================================
   RUN TOOL
   ========================================================= */

async function runTool() {

    if (isProcessing) {
        return;
    }

    if (!currentTool) {
        return;
    }

    if (!selectedFiles.length) {

        showToast(
            "Please select a file first.",
            "error"
        );

        return;
    }

    isProcessing = true;

    const button = $("modalActionButton");

    const originalText =
        button ? button.textContent : "";

    if (button) {
        button.disabled = true;
        button.textContent = "Processing...";
    }

    try {

        switch (currentTool) {

            case "imageToPdf":
                await imageToPDF();
                break;

            case "pdfToImage":
                await pdfToImages();
                break;

            case "mergePdf":
                await mergePDF();
                break;

            case "splitPdf":
                await splitPDF();
                break;

            case "compressPdf":
                await compressPDF();
                break;

            default:
                throw new Error("Unknown tool.");
        }

    } catch (error) {

        console.error(error);

        showToast(
            error.message || "Operation failed.",
            "error"
        );

    } finally {

        isProcessing = false;

        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}


/* =========================================================
   IMAGE → PDF
   ========================================================= */

async function imageToPDF() {

    const jsPDF = await loadJsPDF();

    if (!jsPDF) {
        throw new Error("PDF library could not be loaded.");
    }

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    for (let i = 0; i < selectedFiles.length; i++) {

        const file = selectedFiles[i];

        const dataURL =
            await fileToDataURL(file);

        const image =
            await loadImage(dataURL);

        if (i > 0) {

            const orientation =
                image.width > image.height
                    ? "landscape"
                    : "portrait";

            pdf.addPage("a4", orientation);
        }

        const orientation =
            image.width > image.height
                ? "landscape"
                : "portrait";

        if (i === 0) {

            if (
                orientation === "landscape"
            ) {
                pdf.deletePage(1);
                pdf.addPage("a4", "landscape");
            }
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
            pageWidth - margin * 2;

        const maxHeight =
            pageHeight - margin * 2;

        const scale =
            Math.min(
                maxWidth / image.width,
                maxHeight / image.height
            );

        const width =
            image.width * scale;

        const height =
            image.height * scale;

        const x =
            (pageWidth - width) / 2;

        const y =
            (pageHeight - height) / 2;

        const format =
            file.type === "image/png"
                ? "PNG"
                : "JPEG";

        pdf.addImage(
            dataURL,
            format,
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
        `LeoPDF_${dateName()}.pdf`;

    downloadBlob(blob, filename);

    addRecentFile(
        filename,
        "Image → PDF",
        blob.size
    );

    showToast(
        "PDF created successfully!",
        "success"
    );

    closeTool();
}


/* =========================================================
   PDF → IMAGE
   ========================================================= */

async function pdfToImages() {

    const pdfjsLib = await getPDFJS();

    if (!pdfjsLib) {
        throw new Error("PDF renderer could not be loaded.");
    }

    const file = selectedFiles[0];

    const data =
        new Uint8Array(
            await file.arrayBuffer()
        );

    const pdf =
        await pdfjsLib
            .getDocument({ data })
            .promise;

    const rangeInput =
        $("pageNumbers");

    const range =
        rangeInput
            ? rangeInput.value.trim()
            : "";

    const pages =
        parsePages(
            range,
            pdf.numPages
        );

    if (!pages.length) {
        throw new Error("Invalid page range.");
    }

    const format =
        $("imageFormat")
            ? $("imageFormat").value
            : "png";

    const scale =
        $("imageQuality")
            ? Number($("imageQuality").value)
            : 1.5;

    const JSZip =
        await loadJSZip();

    const zip =
        JSZip
            ? new JSZip()
            : null;

    const created = [];

    for (const pageNumber of pages) {

        const page =
            await pdf.getPage(pageNumber);

        const viewport =
            page.getViewport({
                scale
            });

        const canvas =
            document.createElement("canvas");

        canvas.width =
            Math.ceil(viewport.width);

        canvas.height =
            Math.ceil(viewport.height);

        const context =
            canvas.getContext("2d");

        await page.render({
            canvasContext: context,
            viewport
        }).promise;

        const mime =
            format === "jpeg"
                ? "image/jpeg"
                : "image/png";

        const blob =
            await canvasToBlob(
                canvas,
                mime,
                format === "jpeg" ? 0.92 : undefined
            );

        const extension =
            format === "jpeg"
                ? "jpg"
                : "png";

        const filename =
            `${removeExtension(file.name)}_page_${pageNumber}.${extension}`;

        created.push({
            blob,
            filename
        });

        if (zip) {
            zip.file(filename, blob);
        }
    }

    if (zip) {

        const zipBlob =
            await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE"
            });

        const zipName =
            `${removeExtension(file.name)}_images.zip`;

        downloadBlob(
            zipBlob,
            zipName
        );

        addRecentFile(
            zipName,
            "PDF → Images",
            zipBlob.size
        );

    } else {

        for (const item of created) {

            downloadBlob(
                item.blob,
                item.filename
            );

            await wait(200);
        }

        addRecentFile(
            created[0].filename,
            "PDF → Image",
            created[0].blob.size
        );
    }

    showToast(
        `${pages.length} image(s) created successfully!`,
        "success"
    );

    closeTool();
}


/* =========================================================
   MERGE PDF
   ========================================================= */

async function mergePDF() {

    if (!window.PDFLib) {
        throw new Error("PDF library is not loaded.");
    }

    if (selectedFiles.length < 2) {
        throw new Error(
            "Select at least 2 PDF files."
        );
    }

    const {
        PDFDocument
    } = window.PDFLib;

    const merged =
        await PDFDocument.create();

    for (const file of selectedFiles) {

        const bytes =
            await file.arrayBuffer();

        const source =
            await PDFDocument.load(bytes);

        const pages =
            await merged.copyPages(
                source,
                source.getPageIndices()
            );

        pages.forEach(page => {
            merged.addPage(page);
        });
    }

    const output =
        await merged.save({
            useObjectStreams: true
        });

    const blob =
        new Blob(
            [output],
            { type: "application/pdf" }
        );

    const filename =
        `LeoPDF_Merged_${dateName()}.pdf`;

    downloadBlob(
        blob,
        filename
    );

    addRecentFile(
        filename,
        "Merge PDF",
        blob.size
    );

    showToast(
        "PDFs merged successfully!",
        "success"
    );

    closeTool();
}


/* =========================================================
   SPLIT PDF
   ========================================================= */

async function splitPDF() {

    if (!window.PDFLib) {
        throw new Error("PDF library is not loaded.");
    }

    const file = selectedFiles[0];

    const {
        PDFDocument
    } = window.PDFLib;

    const bytes =
        await file.arrayBuffer();

    const source =
        await PDFDocument.load(bytes);

    const total =
        source.getPageCount();

    const rangeInput =
        $("pageNumbers");

    const range =
        rangeInput
            ? rangeInput.value.trim()
            : "";

    const pages =
        parsePages(
            range,
            total
        );

    if (!pages.length) {
        throw new Error(
            `Enter pages between 1 and ${total}.`
        );
    }

    const outputPdf =
        await PDFDocument.create();

    const copied =
        await outputPdf.copyPages(
            source,
            pages.map(page => page - 1)
        );

    copied.forEach(page => {
        outputPdf.addPage(page);
    });

    const output =
        await outputPdf.save({
            useObjectStreams: true
        });

    const blob =
        new Blob(
            [output],
            { type: "application/pdf" }
        );

    const filename =
        `${removeExtension(file.name)}_split.pdf`;

    downloadBlob(
        blob,
        filename
    );

    addRecentFile(
        filename,
        "Split PDF",
        blob.size
    );

    showToast(
        `${pages.length} page(s) extracted!`,
        "success"
    );

    closeTool();
}


/* =========================================================
   COMPRESS PDF
   ========================================================= */

async function compressPDF() {

    if (!window.PDFLib) {
        throw new Error("PDF library is not loaded.");
    }

    const file = selectedFiles[0];

    const {
        PDFDocument
    } = window.PDFLib;

    const bytes =
        await file.arrayBuffer();

    const originalSize =
        bytes.byteLength;

    const pdf =
        await PDFDocument.load(bytes);

    const output =
        await pdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50
        });

    const blob =
        new Blob(
            [output],
            { type: "application/pdf" }
        );

    const newSize =
        blob.size;

    const filename =
        `${removeExtension(file.name)}_compressed.pdf`;

    downloadBlob(
        blob,
        filename
    );

    addRecentFile(
        filename,
        "Compress PDF",
        newSize
    );

    if (newSize < originalSize) {

        const percent =
            (
                ((originalSize - newSize) /
                    originalSize) * 100
            ).toFixed(1);

        showToast(
            `PDF reduced by ${percent}%`,
            "success"
        );

    } else {

        showToast(
            "PDF optimized successfully.",
            "success"
        );
    }

    closeTool();
}


/* =========================================================
   PDF.JS
   Current HTML uses PDF.js 3.11.174
   ========================================================= */

async function getPDFJS() {

    if (window.pdfjsLib) {

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        return window.pdfjsLib;
    }

    throw new Error(
        "PDF.js is not loaded. Check your internet connection."
    );
}


/* =========================================================
   JS PDF LOADER
   ========================================================= */

let jsPDFPromise = null;

function loadJsPDF() {

    if (
        window.jspdf &&
        window.jspdf.jsPDF
    ) {
        return Promise.resolve(
            window.jspdf.jsPDF
        );
    }

    if (jsPDFPromise) {
        return jsPDFPromise;
    }

    jsPDFPromise =
        new Promise((resolve, reject) => {

            const script =
                document.createElement("script");

            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

            script.onload = () => {

                if (
                    window.jspdf &&
                    window.jspdf.jsPDF
                ) {
                    resolve(
                        window.jspdf.jsPDF
                    );
                } else {
                    reject(
                        new Error(
                            "jsPDF failed to load."
                        )
                    );
                }
            };

            script.onerror = () => {

                reject(
                    new Error(
                        "Could not load jsPDF."
                    )
                );
            };

            document.head.appendChild(script);
        });

    return jsPDFPromise;
}


/* =========================================================
   JSZIP LOADER
   ========================================================= */

let zipPromise = null;

function loadJSZip() {

    if (window.JSZip) {
        return Promise.resolve(
            window.JSZip
        );
    }

    if (zipPromise) {
        return zipPromise;
    }

    zipPromise =
        new Promise((resolve, reject) => {

            const script =
                document.createElement("script");

            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";

            script.onload = () => {

                if (window.JSZip) {
                    resolve(
                        window.JSZip
                    );
                } else {
                    resolve(null);
                }
            };

            script.onerror = () => {
                resolve(null);
            };

            document.head.appendChild(script);
        });

    return zipPromise;
}


/* =========================================================
   PAGE RANGE PARSER
   ========================================================= */

function parsePages(value, maxPages) {

    if (
        !value ||
        !value.trim()
    ) {

        return Array.from(
            { length: maxPages },
            (_, i) => i + 1
        );
    }

    const pages = new Set();

    const parts =
        value
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);

    for (const part of parts) {

        if (part.includes("-")) {

            const numbers =
                part
                    .split("-")
                    .map(Number);

            if (
                numbers.length !== 2 ||
                !Number.isInteger(numbers[0]) ||
                !Number.isInteger(numbers[1])
            ) {
                continue;
            }

            let start =
                Math.min(
                    numbers[0],
                    numbers[1]
                );

            let end =
                Math.max(
                    numbers[0],
                    numbers[1]
                );

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
                pages.add(i);
            }

        } else {

            const page =
                Number(part);

            if (
                Number.isInteger(page) &&
                page >= 1 &&
                page <= maxPages
            ) {
                pages.add(page);
            }
        }
    }

    return Array.from(pages)
        .sort((a, b) => a - b);
}


/* =========================================================
   FILE HELPERS
   ========================================================= */

function fileToDataURL(file) {

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
                        "Could not read file."
                    )
                );

            reader.readAsDataURL(file);
        }
    );
}


function loadImage(dataURL) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            image.onload =
                () => resolve(image);

            image.onerror =
                () => reject(
                    new Error(
                        "Invalid image."
                    )
                );

            image.src = dataURL;
        }
    );
}


function canvasToBlob(
    canvas,
    type,
    quality
) {

    return new Promise(
        (resolve, reject) => {

            canvas.toBlob(
                blob => {

                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(
                            new Error(
                                "Image conversion failed."
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
   DOWNLOAD
   ========================================================= */

function downloadBlob(blob, filename) {

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1500);
}


/* =========================================================
   RECENT FILES
   ========================================================= */

function getRecentFiles() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE.recent
            ) || "[]"
        );

    } catch {

        return [];
    }
}


function addRecentFile(
    name,
    type,
    size
) {

    const files =
        getRecentFiles();

    files.unshift({
        name,
        type,
        size,
        date: new Date().toISOString()
    });

    const unique = [];

    files.forEach(file => {

        const exists =
            unique.some(
                item =>
                    item.name === file.name &&
                    item.type === file.type
            );

        if (!exists) {
            unique.push(file);
        }
    });

    localStorage.setItem(
        STORAGE.recent,
        JSON.stringify(
            unique.slice(0, 20)
        )
    );

    renderRecentFiles();
    renderFilesPage();
}


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
                <div class="empty-icon">📄</div>
                <h3>No Recent Files</h3>
                <p>Your converted files will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        files.slice(0, 5).map(
            file => {

                const date =
                    new Date(file.date);

                return `
                    <div class="recent-file-item">

                        <div class="file-icon">
                            📄
                        </div>

                        <div class="file-info">
                            <strong>
                                ${escapeHTML(file.name)}
                            </strong>

                            <span>
                                ${escapeHTML(file.type || "PDF")}
                                ${file.size
                                    ? " • " + formatSize(file.size)
                                    : ""}
                            </span>
                        </div>

                        <div class="file-date">
                            ${date.toLocaleDateString()}
                        </div>

                    </div>
                `;
            }
        ).join("");
}


/* =========================================================
   FILES PAGE
   ========================================================= */

function renderFilesPage() {

    const container =
        $("filesList");

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
                <p>Your converted files will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        files.map(file => {

            const date =
                new Date(file.date);

            return `
                <div class="recent-file-item">

                    <div class="file-icon">
                        📄
                    </div>

                    <div class="file-info">

                        <strong>
                            ${escapeHTML(file.name)}
                        </strong>

                        <span>
                            ${escapeHTML(file.type || "PDF")}
                            ${file.size
                                ? " • " + formatSize(file.size)
                                : ""}
                        </span>

                    </div>

                    <div class="file-date">
                        ${date.toLocaleDateString()}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   CLEAR HISTORY
   ========================================================= */

function clearHistoryData() {

    localStorage.removeItem(
        STORAGE.recent
    );

    renderRecentFiles();
    renderFilesPage();

    showToast(
        "History cleared successfully.",
        "success"
    );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    const toggle =
        $("darkModeToggle");

    if (!toggle) {
        return;
    }

    toggle.addEventListener(
        "change",
        () => {

            if (toggle.checked) {

                document.body.classList.remove(
                    "light-mode"
                );

                localStorage.setItem(
                    STORAGE.theme,
                    "dark"
                );

            } else {

                document.body.classList.add(
                    "light-mode"
                );

                localStorage.setItem(
                    STORAGE.theme,
                    "light"
                );
            }
        }
    );
}


function loadTheme() {

    const toggle =
        $("darkModeToggle");

    const theme =
        localStorage.getItem(
            STORAGE.theme
        );

    if (theme === "light") {

        document.body.classList.add(
            "light-mode"
        );

        if (toggle) {
            toggle.checked = false;
        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );

        if (toggle) {
            toggle.checked = true;
        }
    }
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function setupNotifications() {

    const toggle =
        $("notificationToggle");

    const button =
        $("notificationButton");

    const saved =
        localStorage.getItem(
            STORAGE.notifications
        );

    if (toggle) {

        toggle.checked =
            saved !== "off";

        toggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    STORAGE.notifications,
                    toggle.checked
                        ? "on"
                        : "off"
                );

                showToast(
                    toggle.checked
                        ? "Notifications enabled."
                        : "Notifications disabled.",
                    "success"
                );
            }
        );
    }

    if (button) {

        button.addEventListener(
            "click",
            () => {

                showToast(
                    "You're all caught up! 🔔"
                );
            }
        );
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "normal"
) {

    const toast =
        $("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    const messageElement =
        $("toastMessage");

    const iconElement =
        $("toastIcon");

    if (messageElement) {
        messageElement.textContent =
            message;
    } else {
        toast.textContent =
            message;
    }

    if (iconElement) {

        iconElement.textContent =
            type === "error"
                ? "⚠️"
                : type === "success"
                    ? "✓"
                    : "ℹ️";
    }

    toast.classList.remove(
        "success",
        "error"
    );

    if (type === "success") {
        toast.classList.add("success");
    }

    if (type === "error") {
        toast.classList.add("error");
    }

    toast.classList.add("show");

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);
}


/* =========================================================
   UTILITIES
   ========================================================= */

function formatSize(bytes) {

    if (
        !Number.isFinite(bytes) ||
        bytes <= 0
    ) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.min(
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            ),
            units.length - 1
        );

    return (
        bytes /
        Math.pow(1024, index)
    ).toFixed(
        index === 0 ? 0 : 2
    ) + " " + units[index];
}


function removeExtension(filename) {

    return filename.replace(
        /\.[^/.]+$/,
        ""
    );
}


function dateName() {

    const date =
        new Date();

    const pad =
        number =>
            String(number)
                .padStart(2, "0");

    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate())
    );
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(resolve, ms)
    );
}


/* =========================================================
   GLOBAL ERROR HANDLING
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "LeoPDF error:",
            event.error || event.message
        );
    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "LeoPDF promise error:",
            event.reason
        );
    }
);
