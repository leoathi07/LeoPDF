/* =========================================================
   LeoPDF — COMPLETE WORKING SCRIPT.JS
   Convert. Compress. Simplify.
   Matches current LeoPDF HTML + CSS
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

const CDN = {
    jsPDF:
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",

    JSZip:
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",

    pdfWorker:
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
};

let currentTool = null;
let selectedFiles = [];
let pdfJsPromise = null;
let jsPDFPromise = null;
let jsZipPromise = null;

/* =========================================================
   DOM
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));

/* =========================================================
   APP START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    try {
        initializeLeoPDF();
    } catch (error) {
        console.error("LeoPDF initialization error:", error);
    }
});

/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeLeoPDF() {
    setupSplash();
    setupTheme();
    setupNavigation();
    setupToolCards();
    setupModal();
    setupFileInput();
    setupButtons();
    setupSettings();
    setupNotification();
    setupDragAndDrop();

    setupPDFJS();

    renderRecentFiles();
    renderFilesPage();

    showPage("homePage");

    revealApp();

    console.log(
        "LeoPDF ready — Convert. Compress. Simplify."
    );
}

/* =========================================================
   REVEAL APP
   ========================================================= */

function revealApp() {
    const app = $("#app");

    if (!app) return;

    app.style.display = "block";
}

/* =========================================================
   SPLASH SCREEN
   ========================================================= */

function setupSplash() {
    const splash = $("#splashScreen");
    const logo = $("#splashLogo");
    const fallback = $("#logoFallback");

    if (logo) {
        logo.addEventListener("load", () => {
            logo.style.display = "block";

            if (fallback) {
                fallback.style.display = "none";
            }
        });

        logo.addEventListener("error", () => {
            logo.style.display = "none";

            if (fallback) {
                fallback.style.display = "flex";
            }
        });

        if (logo.complete && logo.naturalWidth > 0) {
            logo.style.display = "block";

            if (fallback) {
                fallback.style.display = "none";
            }
        }
    }

    if (!splash) return;

    setTimeout(() => {
        splash.classList.add("hide");

        setTimeout(() => {
            splash.style.display = "none";
        }, 550);
    }, 1800);
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
    $$(".bottom-nav-item").forEach((item) => {
        item.addEventListener("click", () => {
            const page = item.dataset.page;

            if (page) {
                showPage(page);
            }
        });
    });

    $$("[data-page]").forEach((item) => {
        if (
            item.classList.contains("bottom-nav-item")
        ) {
            return;
        }

        item.addEventListener("click", () => {
            const page = item.dataset.page;

            if (page) {
                showPage(page);
            }
        });
    });

    const heroCreate = $("#heroCreateButton");

    if (heroCreate) {
        heroCreate.addEventListener("click", () => {
            openTool("imageToPdf");
        });
    }

    const openFiles = $("#openFilesButton");

    if (openFiles) {
        openFiles.addEventListener("click", () => {
            showPage("filesPage");
        });
    }
}

/* =========================================================
   SHOW PAGE
   ========================================================= */

function showPage(pageId) {
    const pages = $$(".page");

    pages.forEach((page) => {
        page.classList.remove("active-page");
        page.style.display = "none";
    });

    const target = document.getElementById(pageId);

    if (target) {
        target.classList.add("active-page");
        target.style.display = "block";
    }

    $$(".bottom-nav-item").forEach((item) => {
        item.classList.remove("active");

        if (item.dataset.page === pageId) {
            item.classList.add("active");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageId === "filesPage") {
        renderFilesPage();
    }

    if (pageId === "homePage") {
        renderRecentFiles();
    }
}

/* =========================================================
   TOOL CARDS
   ========================================================= */

function setupToolCards() {
    $$("[data-tool]").forEach((card) => {
        card.addEventListener("click", () => {
            const tool = card.dataset.tool;

            if (!tool) return;

            openTool(tool);
        });
    });
}

/* =========================================================
   TOOL CONFIG
   ========================================================= */

function getToolConfig(tool) {
    const configs = {

        imageToPdf: {
            icon: "🖼️",
            title: "Image → PDF",
            description:
                "Convert multiple images into one clean PDF file.",
            accept: "image/*",
            multiple: true,
            action: "Create PDF"
        },

        pdfToImage: {
            icon: "📄",
            title: "PDF → Image",
            description:
                "Convert PDF pages into high-quality PNG or JPG images.",
            accept: ".pdf,application/pdf",
            multiple: false,
            action: "Convert to Images"
        },

        mergePdf: {
            icon: "🔗",
            title: "Merge PDF",
            description:
                "Combine multiple PDF files into one PDF.",
            accept: ".pdf,application/pdf",
            multiple: true,
            action: "Merge PDFs"
        },

        splitPdf: {
            icon: "✂️",
            title: "Split PDF",
            description:
                "Extract selected pages from a PDF.",
            accept: ".pdf,application/pdf",
            multiple: false,
            action: "Split PDF"
        },

        compressPdf: {
            icon: "🗜️",
            title: "Compress PDF",
            description:
                "Optimize and re-save your PDF.",
            accept: ".pdf,application/pdf",
            multiple: false,
            action: "Compress PDF"
        }

    };

    return configs[tool] || null;
}

/* =========================================================
   OPEN TOOL
   ========================================================= */

function openTool(tool) {
    const config = getToolConfig(tool);

    if (!config) {
        showToast("Tool not available", "error");
        return;
    }

    currentTool = tool;
    selectedFiles = [];

    const modal = $("#toolModal");

    if (!modal) {
        showToast("Tool window not found", "error");
        return;
    }

    const icon = $("#modalIcon");
    const title = $("#modalTitle");
    const description = $("#modalDescription");
    const input = $("#fileInput");
    const options = $("#fileOptions");
    const selected = $("#selectedFiles");
    const splitOptions = $("#splitOptions");
    const action = $("#modalActionButton");

    if (icon) {
        icon.textContent = config.icon;
    }

    if (title) {
        title.textContent = config.title;
    }

    if (description) {
        description.textContent = config.description;
    }

    if (input) {
        input.value = "";
        input.accept = config.accept;
        input.multiple = config.multiple;
    }

    if (selected) {
        selected.innerHTML = "";
    }

    if (splitOptions) {
        splitOptions.classList.remove("show");
        splitOptions.style.display = "none";
    }

    if (action) {
        action.textContent = config.action;
        action.disabled = false;
    }

    buildToolOptions(tool);

    renderSelectedFiles();

    modal.classList.add("show");

    document.body.style.overflow = "hidden";
}

/* =========================================================
   TOOL OPTIONS
   ========================================================= */

function buildToolOptions(tool) {
    const options = $("#fileOptions");

    if (!options) return;

    options.innerHTML = "";

    if (tool === "imageToPdf") {
        options.innerHTML = `
            <div class="option-group">
                <label>PDF Page Size</label>

                <select id="imagePdfPageSize">
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                </select>
            </div>

            <div class="option-group">
                <label>Image Quality</label>

                <select id="imagePdfQuality">
                    <option value="1">Standard</option>
                    <option value="0.85">High</option>
                    <option value="0.65">Balanced</option>
                </select>
            </div>
        `;

        return;
    }

    if (tool === "pdfToImage") {
        options.innerHTML = `
            <div class="option-group">
                <label for="pageNumbers">
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
                <label>Image Format</label>

                <select id="pdfImageFormat">
                    <option value="png">PNG</option>
                    <option value="jpeg">JPG</option>
                </select>
            </div>

            <div class="option-group">
                <label>Quality</label>

                <select id="pdfImageScale">
                    <option value="1.5">Standard</option>
                    <option value="2">High</option>
                    <option value="2.5">Very High</option>
                </select>
            </div>
        `;

        return;
    }

    if (tool === "mergePdf") {
        options.innerHTML = `
            <div class="option-group">
                <small>
                    Select 2 or more PDF files.
                </small>
            </div>
        `;

        return;
    }

    if (tool === "splitPdf") {
        options.innerHTML = `
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
                    Example: 1-3 extracts pages 1, 2 and 3.
                </small>
            </div>
        `;

        return;
    }

    if (tool === "compressPdf") {
        options.innerHTML = `
            <div class="option-group">
                <label>Compression</label>

                <select id="compressLevel">
                    <option value="normal">
                        Normal
                    </option>

                    <option value="high">
                        High
                    </option>
                </select>

                <small>
                    PDF compression depends on the original file.
                </small>
            </div>
        `;
    }
}

/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeToolModal() {
    const modal = $("#toolModal");

    if (modal) {
        modal.classList.remove("show");
    }

    currentTool = null;
    selectedFiles = [];

    const input = $("#fileInput");

    if (input) {
        input.value = "";
    }

    document.body.style.overflow = "";
}

/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModal() {
    const modal = $("#toolModal");
    const overlay = $("#modalOverlay");
    const close = $("#modalClose");

    if (close) {
        close.addEventListener("click", closeToolModal);
    }

    if (overlay) {
        overlay.addEventListener("click", closeToolModal);
    }

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeToolModal();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeToolModal();
        }
    });
}

/* =========================================================
   FILE INPUT
   ========================================================= */

function setupFileInput() {
    const input = $("#fileInput");

    if (!input) return;

    input.addEventListener("change", (event) => {
        const files = Array.from(
            event.target.files || []
        );

        if (!files.length) return;

        addSelectedFiles(files);

        input.value = "";
    });
}

/* =========================================================
   ADD FILES
   ========================================================= */

function addSelectedFiles(files) {
    if (!currentTool) return;

    const config = getToolConfig(currentTool);

    if (!config) return;

    let validFiles = files;

    if (currentTool === "imageToPdf") {
        validFiles = files.filter((file) =>
            file.type.startsWith("image/")
        );
    } else {
        validFiles = files.filter((file) =>
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")
        );
    }

    if (!validFiles.length) {
        showToast("Invalid file selected", "error");
        return;
    }

    if (config.multiple) {
        selectedFiles.push(...validFiles);
    } else {
        selectedFiles = [validFiles[0]];
    }

    renderSelectedFiles();

    if (
        currentTool === "splitPdf" &&
        selectedFiles.length
    ) {
        updateSplitPlaceholder(
            selectedFiles[0]
        );
    }
}

/* =========================================================
   RENDER SELECTED FILES
   ========================================================= */

function renderSelectedFiles() {
    const container = $("#selectedFiles");

    if (!container) return;

    if (!selectedFiles.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <p>Select file${currentTool === "imageToPdf" || currentTool === "mergePdf" ? "s" : ""} to continue.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = selectedFiles
        .map((file, index) => {

            const icon =
                file.type.startsWith("image/")
                    ? "🖼️"
                    : "📄";

            return `
                <div class="selected-file">
                    <div class="selected-file-icon">
                        ${icon}
                    </div>

                    <div class="selected-file-info">
                        <strong>
                            ${escapeHTML(file.name)}
                        </strong>

                        <span>
                            ${formatFileSize(file.size)}
                        </span>
                    </div>

                    <button
                        type="button"
                        class="remove-selected-file"
                        data-index="${index}"
                        aria-label="Remove file">
                        ×
                    </button>
                </div>
            `;
        })
        .join("");

    $$(".remove-selected-file").forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    const index =
                        Number(button.dataset.index);

                    selectedFiles.splice(index, 1);

                    renderSelectedFiles();
                }
            );
        }
    );
}

/* =========================================================
   DRAG & DROP
   ========================================================= */

function setupDragAndDrop() {
    const modal = $("#toolModal");

    if (!modal) return;

    modal.addEventListener(
        "dragover",
        (event) => {
            event.preventDefault();
            modal.classList.add("dragging");
        }
    );

    modal.addEventListener(
        "dragleave",
        (event) => {
            if (
                event.target === modal ||
                !modal.contains(event.relatedTarget)
            ) {
                modal.classList.remove("dragging");
            }
        }
    );

    modal.addEventListener(
        "drop",
        (event) => {
            event.preventDefault();

            modal.classList.remove("dragging");

            const files =
                Array.from(
                    event.dataTransfer.files || []
                );

            if (files.length) {
                addSelectedFiles(files);
            }
        }
    );
}

/* =========================================================
   ACTION BUTTON
   ========================================================= */

function setupButtons() {
    const action = $("#modalActionButton");

    if (action) {
        action.addEventListener(
            "click",
            runCurrentTool
        );
    }
}

/* =========================================================
   RUN CURRENT TOOL
   ========================================================= */

async function runCurrentTool() {
    if (!currentTool) return;

    if (!selectedFiles.length) {
        showToast(
            "Please select a file first",
            "error"
        );
        return;
    }

    const button = $("#modalActionButton");

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

    } catch (error) {
        console.error(
            "LeoPDF operation error:",
            error
        );

        showToast(
            error.message ||
            "Operation failed",
            "error"
        );

    } finally {
        setButtonLoading(
            button,
            false
        );
    }
}

/* =========================================================
   LOAD SCRIPT HELPER
   ========================================================= */

function loadExternalScript(src, globalName) {
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
                            !globalName ||
                            window[globalName]
                        ) {
                            resolve(
                                window[globalName]
                            );
                        } else {
                            reject(
                                new Error(
                                    `${globalName} failed to load`
                                )
                            );
                        }
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
                    !globalName ||
                    window[globalName]
                ) {
                    resolve(
                        window[globalName]
                    );
                } else {
                    reject(
                        new Error(
                            `${globalName} failed to load`
                        )
                    );
                }
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

/* =========================================================
   PDF.JS
   ========================================================= */

function setupPDFJS() {
    if (!window.pdfjsLib) return;

    window.pdfjsLib
        .GlobalWorkerOptions
        .workerSrc = CDN.pdfWorker;
}

async function getPDFJS() {
    if (window.pdfjsLib) {
        setupPDFJS();
        return window.pdfjsLib;
    }

    if (!pdfJsPromise) {
        pdfJsPromise =
            loadExternalScript(
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
                "pdfjsLib"
            ).then((pdfjs) => {
                pdfjs
                    .GlobalWorkerOptions
                    .workerSrc =
                    CDN.pdfWorker;

                return pdfjs;
            });
    }

    return pdfJsPromise;
}

/* =========================================================
   JS PDF
   ========================================================= */

async function getJsPDF() {
    if (
        window.jspdf &&
        window.jspdf.jsPDF
    ) {
        return window.jspdf.jsPDF;
    }

    if (!jsPDFPromise) {
        jsPDFPromise =
            loadExternalScript(
                CDN.jsPDF,
                "jspdf"
            ).then((lib) => {
                if (
                    !lib ||
                    !lib.jsPDF
                ) {
                    throw new Error(
                        "jsPDF failed to load"
                    );
                }

                return lib.jsPDF;
            });
    }

    return jsPDFPromise;
}

/* =========================================================
   JS ZIP
   ========================================================= */

async function getJSZip() {
    if (window.JSZip) {
        return window.JSZip;
    }

    if (!jsZipPromise) {
        jsZipPromise =
            loadExternalScript(
                CDN.JSZip,
                "JSZip"
            );
    }

    return jsZipPromise;
}

/* =========================================================
   IMAGE → PDF
   ========================================================= */

async function createImagePDF() {
    if (!selectedFiles.length) {
        throw new Error(
            "Please select at least one image"
        );
    }

    const jsPDF =
        await getJsPDF();

    const pageSizeInput =
        $("#imagePdfPageSize");

    const qualityInput =
        $("#imagePdfQuality");

    const pageSize =
        pageSizeInput
            ? pageSizeInput.value
            : "a4";

    const quality =
        qualityInput
            ? Number(
                qualityInput.value
            )
            : 1;

    const pdf =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format:
                pageSize === "letter"
                    ? "letter"
                    : "a4",
            compress: true
        });

    for (
        let index = 0;
        index < selectedFiles.length;
        index++
    ) {
        const file =
            selectedFiles[index];

        if (index > 0) {
            pdf.addPage(
                pageSize === "letter"
                    ? "letter"
                    : "a4",
                "portrait"
            );
        }

        const dataUrl =
            await readFileAsDataURL(
                file
            );

        const image =
            await loadImage(
                dataUrl
            );

        const pageWidth =
            pageSize === "letter"
                ? 215.9
                : 210;

        const pageHeight =
            pageSize === "letter"
                ? 279.4
                : 297;

        const margin = 8;

        const maxWidth =
            pageWidth - margin * 2;

        const maxHeight =
            pageHeight - margin * 2;

        const ratio =
            Math.min(
                maxWidth /
                    image.naturalWidth,
                maxHeight /
                    image.naturalHeight
            );

        const width =
            image.naturalWidth *
            ratio;

        const height =
            image.naturalHeight *
            ratio;

        const x =
            (pageWidth - width) / 2;

        const y =
            (pageHeight - height) / 2;

        let format = "JPEG";
        let finalData = dataUrl;

        if (
            file.type ===
            "image/png"
        ) {
            format = "PNG";
        } else if (
            quality < 1
        ) {
            finalData =
                await convertImageQuality(
                    file,
                    quality
                );
            format = "JPEG";
        }

        pdf.addImage(
            finalData,
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

    closeToolModal();
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

    const imageFiles = [];

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

        imageFiles.push({
            blob,
            filename
        });
    }

    if (
        imageFiles.length === 1
    ) {
        downloadBlob(
            imageFiles[0].blob,
            imageFiles[0].filename
        );

        saveRecentFile(
            imageFiles[0].filename,
            "PDF → Image",
            imageFiles[0].blob.size
        );
    } else {
        try {
            const JSZip =
                await getJSZip();

            const zip =
                new JSZip();

            imageFiles.forEach(
                (item) => {
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

        } catch (error) {
            console.warn(
                "ZIP unavailable:",
                error
            );

            for (
                const image of imageFiles
            ) {
                downloadBlob(
                    image.blob,
                    image.filename
                );

                await sleep(200);
            }

            saveRecentFile(
                imageFiles[0].filename,
                "PDF → Images",
                imageFiles[0].blob.size
            );
        }
    }

    showToast(
        `${pages.length} image(s) created successfully!`,
        "success"
    );

    closeToolModal();
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

    if (files.length < 2) {
        throw new Error(
            "Select at least 2 PDF files"
        );
    }

    const {
        PDFDocument
    } = window.PDFLib;

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
            (page) => {
                mergedPdf.addPage(
                    page
                );
            }
        );
    }

    const output =
        await mergedPdf.save({
            useObjectStreams: true
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

    closeToolModal();
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
    } = window.PDFLib;

    const bytes =
        await file.arrayBuffer();

    const sourcePdf =
        await PDFDocument.load(
            bytes
        );

    const totalPages =
        sourcePdf.getPageCount();

    const input =
        $("#pageNumbers");

    const range =
        input
            ? input.value.trim()
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
                (page) => page - 1
            )
        );

    copiedPages.forEach(
        (page) => {
            newPdf.addPage(
                page
            );
        }
    );

    const output =
        await newPdf.save({
            useObjectStreams: true
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

    closeToolModal();
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
    } = window.PDFLib;

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
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50
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
        )}_compressed.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Compress PDF",
        blob.size
    );

    const newSize =
        blob.size;

    if (newSize < originalSize) {
        const percent =
            (
                (
                    (originalSize -
                        newSize) /
                    originalSize
                ) *
                100
            ).toFixed(1);

        showToast(
            `PDF compressed by ${percent}%`,
            "success"
        );
    } else {
        showToast(
            "PDF optimized successfully",
            "success"
        );
    }

    closeToolModal();
}

/* =========================================================
   PAGE RANGE
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
                (part) =>
                    part.trim()
            )
            .filter(Boolean);

    for (
        const part of parts
    ) {
        if (
            part.includes("-")
        ) {
            const range =
                part
                    .split("-")
                    .map(Number);

            if (
                range.length !== 2 ||
                !Number.isInteger(
                    range[0]
                ) ||
                !Number.isInteger(
                    range[1]
                )
            ) {
                continue;
            }

            let start =
                range[0];

            let end =
                range[1];

            if (start > end) {
                [
                    start,
                    end
                ] = [
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
                result.add(page);
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
   SPLIT PLACEHOLDER
   ========================================================= */

async function updateSplitPlaceholder(
    file
) {
    try {
        if (!window.PDFLib) {
            return;
        }

        const bytes =
            await file.arrayBuffer();

        const pdf =
            await window.PDFLib
                .PDFDocument
                .load(bytes);

        const total =
            pdf.getPageCount();

        const input =
            $("#pageNumbers");

        if (input) {
            input.placeholder =
                `1-${total} or 1,3,${total}`;
        }

    } catch (error) {
        console.warn(
            "Could not read page count",
            error
        );
    }
}

/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadBlob(
    blob,
    filename
) {
    if (!blob) {
        throw new Error(
            "Nothing to download"
        );
    }

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(
            url
        );
    }, 1500);
}

/* =========================================================
   READ FILE
   ========================================================= */

function readFileAsDataURL(
    file
) {
    return new Promise(
        (resolve, reject) => {
            const reader =
                new FileReader();

            reader.onload = () =>
                resolve(
                    reader.result
                );

            reader.onerror = () =>
                reject(
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
   LOAD IMAGE
   ========================================================= */

function loadImage(
    dataUrl
) {
    return new Promise(
        (resolve, reject) => {
            const image =
                new Image();

            image.onload = () =>
                resolve(image);

            image.onerror = () =>
                reject(
                    new Error(
                        "Invalid image"
                    )
                );

            image.src = dataUrl;
        }
    );
}

/* =========================================================
   IMAGE QUALITY
   ========================================================= */

async function convertImageQuality(
    file,
    quality
) {
    const dataUrl =
        await readFileAsDataURL(
            file
        );

    const image =
        await loadImage(
            dataUrl
        );

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        image.naturalWidth;

    canvas.height =
        image.naturalHeight;

    const ctx =
        canvas.getContext(
            "2d"
        );

    ctx.drawImage(
        image,
        0,
        0
    );

    return canvas.toDataURL(
        "image/jpeg",
        quality
    );
}

/* =========================================================
   CANVAS BLOB
   ========================================================= */

function canvasToBlob(
    canvas,
    type,
    quality
) {
    return new Promise(
        (resolve, reject) => {
            canvas.toBlob(
                (blob) => {
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
   RECENT FILES
   ========================================================= */

function getRecentFiles() {
    try {
        return JSON.parse(
            localStorage.getItem(
                STORAGE_KEYS.recentFiles
            ) || "[]"
        );
    } catch {
        return [];
    }
}

function saveRecentFile(
    name,
    type,
    size
) {
    try {
        const files =
            getRecentFiles();

        files.unshift({
            name,
            type,
            size:
                Number(size) || 0,
            date:
                new Date()
                    .toISOString()
        });

        const unique = [];

        for (
            const file of files
        ) {
            const exists =
                unique.some(
                    (item) =>
                        item.name ===
                            file.name &&
                        item.type ===
                            file.type
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
            "Recent file error:",
            error
        );
    }
}

/* =========================================================
   RECENT FILES HOME
   ========================================================= */

function renderRecentFiles() {
    const container =
        $("#recentFiles");

    if (!container) return;

    const files =
        getRecentFiles();

    if (!files.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    📄
                </div>

                <h3>
                    No Recent Files
                </h3>

                <p>
                    Your converted files will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        files
            .slice(0, 8)
            .map(
                (file) => `
                <div class="recent-file-item">
                    <div class="recent-file-icon">
                        📄
                    </div>

                    <div class="recent-file-info">
                        <strong>
                            ${escapeHTML(
                                file.name
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                file.type ||
                                    "PDF"
                            )}

                            ${
                                file.size
                                    ? " • " +
                                      formatFileSize(
                                          file.size
                                      )
                                    : ""
                            }
                        </span>
                    </div>

                    <div class="recent-file-date">
                        ${formatDate(
                            file.date
                        )}
                    </div>
                </div>
            `
            )
            .join("");
}

/* =========================================================
   FILES PAGE
   ========================================================= */

function renderFilesPage() {
    const container =
        $("#filesList");

    if (!container) return;

    const files =
        getRecentFiles();

    if (!files.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    📁
                </div>

                <h3>
                    No Files Yet
                </h3>

                <p>
                    Converted files will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        files
            .map(
                (file) => `
                <div class="recent-file-item">
                    <div class="recent-file-icon">
                        📄
                    </div>

                    <div class="recent-file-info">
                        <strong>
                            ${escapeHTML(
                                file.name
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                file.type ||
                                    "PDF"
                            )}

                            ${
                                file.size
                                    ? " • " +
                                      formatFileSize(
                                          file.size
                                      )
                                    : ""
                            }
                        </span>
                    </div>

                    <div class="recent-file-date">
                        ${formatDate(
                            file.date
                        )}
                    </div>
                </div>
            `
            )
            .join("");
}

/* =========================================================
   CLEAR HISTORY
   ========================================================= */

function clearRecentFiles() {
    localStorage.removeItem(
        STORAGE_KEYS.recentFiles
    );

    renderRecentFiles();
    renderFilesPage();

    showToast(
        "History cleared successfully",
        "success"
    );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {
    const darkToggle =
        $("#darkModeToggle");

    if (!darkToggle) return;

    const saved =
        localStorage.getItem(
            STORAGE_KEYS.theme
        );

    if (saved === "light") {
        document.body.classList.add(
            "light-mode"
        );

        darkToggle.checked = false;
    } else {
        document.body.classList.remove(
            "light-mode"
        );

        darkToggle.checked = true;
    }

    darkToggle.addEventListener(
        "change",
        () => {
            if (darkToggle.checked) {
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

    const notificationToggle =
        $("#notificationToggle");

    if (notificationToggle) {
        const savedNotifications =
            localStorage.getItem(
                STORAGE_KEYS.notifications
            );

        notificationToggle.checked =
            savedNotifications !==
            "off";

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

    const clearButton =
        $("#clearHistoryButton");

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearRecentFiles
        );
    }
}

/* =========================================================
   NOTIFICATION
   ========================================================= */

function setupNotification() {
    const button =
        $("#notificationButton");

    if (!button) return;

    button.addEventListener(
        "click",
        () => {
            showToast(
                "LeoPDF is ready to use 🚀",
                "success"
            );
        }
    );
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "normal"
) {
    const toast =
        $("#toast");

    if (!toast) {
        console.log(message);
        return;
    }

    const icon =
        $("#toastIcon");

    const text =
        $("#toastMessage");

    if (text) {
        text.textContent =
            message;
    } else {
        toast.textContent =
            message;
    }

    if (icon) {
        icon.textContent =
            type === "error"
                ? "⚠️"
                : type === "success"
                ? "✓"
                : "ℹ️";
    }

    toast.className =
        "toast show";

    if (type === "success") {
        toast.classList.add(
            "success"
        );
    }

    if (type === "error") {
        toast.classList.add(
            "error"
        );
    }

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
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(
    button,
    loading,
    text
) {
    if (!button) return;

    if (loading) {
        if (
            !button.dataset
                .originalText
        ) {
            button.dataset
                .originalText =
                button.textContent;
        }

        button.disabled =
            true;

        button.innerHTML = `
            <span
                style="
                    display:inline-block;
                    width:16px;
                    height:16px;
                    border:2px solid currentColor;
                    border-top-color:transparent;
                    border-radius:50%;
                    animation:leoPdfSpin .7s linear infinite;
                    vertical-align:-3px;
                    margin-right:7px;
                ">
            </span>
            ${escapeHTML(
                text || "Processing..."
            )}
        `;

        addSpinnerAnimation();
    } else {
        button.disabled =
            false;

        button.textContent =
            button.dataset
                .originalText ||
            "Continue";

        delete button.dataset
            .originalText;
    }
}

/* =========================================================
   SPINNER CSS
   ========================================================= */

function addSpinnerAnimation() {
    if (
        document.getElementById(
            "leoPdfSpinnerStyle"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "leoPdfSpinnerStyle";

    style.textContent = `
        @keyframes leoPdfSpin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
    `;

    document.head.appendChild(
        style
    );
}

/* =========================================================
   FILE SIZE
   ========================================================= */

function formatFileSize(
    bytes
) {
    if (
        !Number.isFinite(
            bytes
        ) ||
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
                Math.log(
                    bytes
                ) /
                Math.log(
                    1024
                )
            ),
            units.length - 1
        );

    return (
        (
            bytes /
            Math.pow(
                1024,
                index
            )
        ).toFixed(
            index === 0
                ? 0
                : 2
        ) +
        " " +
        units[index]
    );
}

/* =========================================================
   DATE
   ========================================================= */

function formatDate(
    value
) {
    try {
        return new Date(
            value
        ).toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    } catch {
        return "";
    }
}

/* =========================================================
   FILENAME
   ========================================================= */

function removeExtension(
    filename
) {
    return String(
        filename
    ).replace(
        /\.[^/.]+$/,
        ""
    );
}

/* =========================================================
   DATE FOR FILE
   ========================================================= */

function formatDateForFilename(
    date
) {
    const pad = (number) =>
        String(number)
            .padStart(
                2,
                "0"
            );

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

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(
    value
) {
    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

/* =========================================================
   SLEEP
   ========================================================= */

function sleep(ms) {
    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                ms
            )
    );
}

/* =========================================================
   GLOBAL ERROR HANDLING
   ========================================================= */

window.addEventListener(
    "error",
    (event) => {
        console.error(
            "LeoPDF error:",
            event.error ||
                event.message
        );
    }
);

window.addEventListener(
    "unhandledrejection",
    (event) => {
        console.error(
            "LeoPDF promise error:",
            event.reason
        );

        showToast(
            "Something went wrong. Please try again.",
            "error"
        );
    }
);

/* =========================================================
   END
   ========================================================= */
