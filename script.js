/* =========================================================
   LeoPDF — COMPLETE SCRIPT.JS
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

let currentTool = null;
let selectedFiles = [];
let busy = false;


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);

const all = selector =>
    Array.from(document.querySelectorAll(selector));


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "normal") {

    const toast = $("toast");
    const messageBox = $("toastMessage");
    const icon = $("toastIcon");

    if (!toast) {
        console.log(message);
        return;
    }

    if (messageBox) {
        messageBox.textContent = message;
    }

    if (icon) {
        icon.textContent =
            type === "error"
                ? "!"
                : type === "success"
                    ? "✓"
                    : "i";
    }

    toast.className = "toast show";

    if (type === "success") {
        toast.classList.add("success");
    }

    if (type === "error") {
        toast.classList.add("error");
    }

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   ESCAPE HTML
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
   FILE SIZE
========================================================= */

function formatFileSize(bytes) {

    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const index = Math.min(
        Math.floor(
            Math.log(bytes) / Math.log(1024)
        ),
        units.length - 1
    );

    return (
        bytes / Math.pow(1024, index)
    ).toFixed(index === 0 ? 0 : 2)
        + " "
        + units[index];
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
    size = 0
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
            unique.slice(0, 30)
        )
    );

    renderRecentFiles();
    renderFilesPage();
}


function clearHistory() {

    localStorage.removeItem(
        STORAGE_KEYS.recentFiles
    );

    renderRecentFiles();
    renderFilesPage();

    showToast(
        "Recent history cleared",
        "success"
    );
}


/* =========================================================
   RECENT RENDER
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
                <div class="empty-icon">📄</div>
                <h3>No Recent Files</h3>
                <p>Your converted files will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        files.slice(0, 6).map(file => {

            const date =
                new Date(file.date);

            return `
                <div class="recent-file-item">

                    <div class="recent-file-icon">
                        ${file.type.includes("Image") ? "🖼️" : "📄"}
                    </div>

                    <div class="recent-file-info">

                        <strong>
                            ${escapeHTML(file.name)}
                        </strong>

                        <span>
                            ${escapeHTML(file.type || "PDF")}
                            ${
                                file.size
                                    ? " • " +
                                      formatFileSize(file.size)
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="recent-file-date">
                        ${date.toLocaleDateString()}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   FILE PAGE
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

                <div class="empty-icon">
                    📁
                </div>

                <h3>No Files Yet</h3>

                <p>
                    Files created with LeoPDF
                    will appear here.
                </p>

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

                    <div class="recent-file-icon">
                        📄
                    </div>

                    <div class="recent-file-info">

                        <strong>
                            ${escapeHTML(file.name)}
                        </strong>

                        <span>
                            ${escapeHTML(file.type)}
                            ${
                                file.size
                                    ? " • " +
                                      formatFileSize(file.size)
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="recent-file-date">
                        ${date.toLocaleDateString()}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageId) {

    const pages =
        all(".page");

    pages.forEach(page => {
        page.classList.remove(
            "active-page"
        );
    });

    const page =
        $(pageId);

    if (page) {
        page.classList.add(
            "active-page"
        );
    }

    all(".bottom-nav-item").forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );

    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function setupNavigation() {

    all(".bottom-nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;

                    if (page) {
                        showPage(page);
                    }

                }
            );

        });
}


/* =========================================================
   TOOL CONFIG
========================================================= */

const TOOL_CONFIG = {

    imageToPdf: {

        title: "Image → PDF",

        description:
            "Convert multiple images into one PDF.",

        icon: "🖼️",

        accept:
            "image/png,image/jpeg,image/jpg,image/webp",

        multiple: true,

        action:
            "Create PDF"

    },

    pdfToImage: {

        title: "PDF → Image",

        description:
            "Convert PDF pages into high-quality images.",

        icon: "📄",

        accept:
            ".pdf,application/pdf",

        multiple: false,

        action:
            "Convert to Images"

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
            "Merge PDFs"

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
            "Split PDF"

    },

    compressPdf: {

        title: "Compress PDF",

        description:
            "Optimize and re-save your PDF.",

        icon: "📦",

        accept:
            ".pdf,application/pdf",

        multiple: false,

        action:
            "Compress PDF"

    }

};


/* =========================================================
   OPEN TOOL
========================================================= */

function openTool(tool) {

    const config =
        TOOL_CONFIG[tool];

    if (!config) {
        return;
    }

    currentTool = tool;
    selectedFiles = [];

    const modal =
        $("toolModal");

    if (!modal) {
        return;
    }

    $("modalIcon").textContent =
        config.icon;

    $("modalTitle").textContent =
        config.title;

    $("modalDescription").textContent =
        config.description;

    const input =
        $("fileInput");

    input.value = "";
    input.accept = config.accept;
    input.multiple = config.multiple;

    $("fileOptions").innerHTML = "";

    $("splitOptions")
        .classList.remove("show");

    $("selectedFiles").innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📂</div>
            <p>No file selected.</p>
        </div>
    `;

    if (tool === "pdfToImage") {

        $("fileOptions").innerHTML = `

            <div class="option-group">

                <label for="pdfPageRange">
                    Page Range
                </label>

                <input
                    id="pdfPageRange"
                    type="text"
                    placeholder="Example: 1-3,5"
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
        `;
    }


    if (tool === "mergePdf") {

        $("fileOptions").innerHTML = `

            <div class="option-group">

                <small>
                    Select 2 or more PDF files.
                </small>

            </div>
        `;
    }


    if (tool === "splitPdf") {

        $("splitOptions")
            .classList.add("show");

    }


    if (tool === "compressPdf") {

        $("fileOptions").innerHTML = `

            <div class="option-group">

                <label for="compressionLevel">
                    Compression
                </label>

                <select id="compressionLevel">

                    <option value="normal">
                        Normal
                    </option>

                    <option value="high">
                        High
                    </option>

                </select>

                <small>
                    Actual reduction depends on
                    the original PDF.
                </small>

            </div>
        `;
    }


    $("modalActionButton").textContent =
        config.action;

    modal.classList.add("show");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   CLOSE TOOL
========================================================= */

function closeTool() {

    const modal =
        $("toolModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    currentTool = null;
    selectedFiles = [];

    $("fileInput").value = "";
}


/* =========================================================
   FILE INPUT
========================================================= */

function setupFileInput() {

    const input =
        $("fileInput");

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

            if (currentTool === "imageToPdf") {

                const images =
                    files.filter(
                        file =>
                            file.type.startsWith("image/")
                    );

                selectedFiles = [
                    ...selectedFiles,
                    ...images
                ];

            } else {

                selectedFiles =
                    files;
            }

            renderSelectedFiles();

            input.value = "";

        }
    );
}


/* =========================================================
   RENDER SELECTED FILES
========================================================= */

function renderSelectedFiles() {

    const container =
        $("selectedFiles");

    if (!container) {
        return;
    }

    if (!selectedFiles.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>No file selected.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        selectedFiles.map(
            (file, index) => {

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
                            class="remove-file"
                            data-index="${index}"
                        >
                            ×
                        </button>

                    </div>

                `;
            }
        ).join("");

    all(".remove-file")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    selectedFiles.splice(
                        index,
                        1
                    );

                    renderSelectedFiles();

                }
            );

        });
}


/* =========================================================
   TOOL CARDS
========================================================= */

function setupToolCards() {

    all("[data-tool]")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const tool =
                        card.dataset.tool;

                    openTool(tool);

                }
            );

        });
}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    $("heroCreateButton")
        ?.addEventListener(
            "click",
            () => openTool("imageToPdf")
        );


    $("openToolsButton")
        ?.addEventListener(
            "click",
            () => showPage("toolsPage")
        );


    $("openFilesButton")
        ?.addEventListener(
            "click",
            () => showPage("filesPage")
        );


    $("notificationButton")
        ?.addEventListener(
            "click",
            () => {

                const enabled =
                    localStorage.getItem(
                        STORAGE_KEYS.notifications
                    ) !== "false";

                showToast(
                    enabled
                        ? "Notifications are enabled"
                        : "Notifications are disabled"
                );

            }
        );


    $("modalActionButton")
        ?.addEventListener(
            "click",
            runCurrentTool
        );


    $("modalClose")
        ?.addEventListener(
            "click",
            closeTool
        );


    $("modalOverlay")
        ?.addEventListener(
            "click",
            closeTool
        );


    $("clearHistoryButton")
        ?.addEventListener(
            "click",
            clearHistory
        );
}


/* =========================================================
   RUN TOOL
========================================================= */

async function runCurrentTool() {

    if (busy) {
        return;
    }

    if (!currentTool) {
        return;
    }

    if (!selectedFiles.length) {

        showToast(
            "Please select a file first",
            "error"
        );

        return;
    }

    if (
        currentTool === "mergePdf" &&
        selectedFiles.length < 2
    ) {

        showToast(
            "Select at least 2 PDF files",
            "error"
        );

        return;
    }

    busy = true;

    const button =
        $("modalActionButton");

    const original =
        button.textContent;

    button.disabled = true;

    button.innerHTML = `
        <span class="button-spinner"></span>
        Processing...
    `;

    try {

        switch (currentTool) {

            case "imageToPdf":

                await imageToPDF(
                    selectedFiles
                );

                break;


            case "pdfToImage":

                await pdfToImages(
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

        }

    } catch (error) {

        console.error(
            "LeoPDF:",
            error
        );

        showToast(
            error.message ||
            "Operation failed",
            "error"
        );

    } finally {

        busy = false;

        button.disabled = false;

        button.textContent =
            original;

    }
}


/* =========================================================
   IMAGE → PDF
========================================================= */

async function imageToPDF(files) {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {
        throw new Error(
            "PDF library is still loading. Try again."
        );
    }

    const {
        jsPDF
    } = window.jspdf;

    let pdf = null;

    for (
        let index = 0;
        index < files.length;
        index++
    ) {

        const file =
            files[index];

        const dataURL =
            await readAsDataURL(file);

        const info =
            await getImageDimensions(
                dataURL
            );

        const orientation =
            info.width > info.height
                ? "landscape"
                : "portrait";

        if (!pdf) {

            pdf = new jsPDF({
                orientation: orientation,
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
            pageWidth - margin * 2;

        const maxHeight =
            pageHeight - margin * 2;

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

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Image → PDF",
        blob.size
    );

    closeTool();

    showToast(
        "PDF created successfully!",
        "success"
    );
}


/* =========================================================
   PDF JS
========================================================= */

function getPDFJS() {

    if (!window.pdfjsLib) {

        throw new Error(
            "PDF viewer library is not loaded."
        );
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    return window.pdfjsLib;
}


/* =========================================================
   PDF → IMAGE
========================================================= */

async function pdfToImages(file) {

    const pdfjs =
        getPDFJS();

    const buffer =
        await file.arrayBuffer();

    const pdf =
        await pdfjs
            .getDocument({
                data: buffer
            })
            .promise;

    const range =
        $("pdfPageRange")?.value.trim() || "";

    const format =
        $("pdfImageFormat")?.value ||
        "png";

    const scale =
        Number(
            $("pdfImageScale")?.value ||
            1.5
        );

    const pages =
        parsePageRange(
            range,
            pdf.numPages
        );

    if (!pages.length) {

        throw new Error(
            "Invalid page range."
        );
    }

    showToast(
        `Converting ${pages.length} page(s)...`
    );

    const images = [];

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
                { alpha: false }
            );

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        const mime =
            format === "jpeg"
                ? "image/jpeg"
                : "image/png";

        const blob =
            await canvasToBlob(
                canvas,
                mime,
                format === "jpeg"
                    ? 0.92
                    : undefined
            );

        const extension =
            format === "jpeg"
                ? "jpg"
                : "png";

        const filename =
            `${removeExtension(file.name)}_page_${pageNumber}.${extension}`;

        images.push({
            blob,
            filename
        });
    }

    if (images.length === 1) {

        downloadBlob(
            images[0].blob,
            images[0].filename
        );

        saveRecentFile(
            images[0].filename,
            "PDF → Image",
            images[0].blob.size
        );

    } else {

        const JSZip =
            await loadJSZip();

        const zip =
            new JSZip();

        images.forEach(item => {

            zip.file(
                item.filename,
                item.blob
            );

        });

        const zipBlob =
            await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 6
                }
            });

        const zipName =
            `${removeExtension(file.name)}_images.zip`;

        downloadBlob(
            zipBlob,
            zipName
        );

        saveRecentFile(
            zipName,
            "PDF → Images",
            zipBlob.size
        );
    }

    closeTool();

    showToast(
        `${images.length} image(s) created successfully!`,
        "success"
    );
}


/* =========================================================
   MERGE PDF
========================================================= */

async function mergePDFs(files) {

    if (!window.PDFLib) {

        throw new Error(
            "PDF library is not loaded."
        );
    }

    if (files.length < 2) {

        throw new Error(
            "Select at least 2 PDF files."
        );
    }

    const {
        PDFDocument
    } = window.PDFLib;

    const merged =
        await PDFDocument.create();

    for (const file of files) {

        const bytes =
            await file.arrayBuffer();

        const source =
            await PDFDocument.load(
                bytes
            );

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
            {
                type:
                    "application/pdf"
            }
        );

    const filename =
        `LeoPDF_Merged_${dateName()}.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Merge PDF",
        blob.size
    );

    closeTool();

    showToast(
        "PDFs merged successfully!",
        "success"
    );
}


/* =========================================================
   SPLIT PDF
========================================================= */

async function splitPDF(file) {

    if (!window.PDFLib) {

        throw new Error(
            "PDF library is not loaded."
        );
    }

    const {
        PDFDocument
    } = window.PDFLib;

    const bytes =
        await file.arrayBuffer();

    const source =
        await PDFDocument.load(
            bytes
        );

    const totalPages =
        source.getPageCount();

    const range =
        $("pageNumbers")?.value.trim() ||
        "";

    const pages =
        parsePageRange(
            range,
            totalPages
        );

    if (!pages.length) {

        throw new Error(
            `Enter valid pages from 1 to ${totalPages}.`
        );
    }

    const outputPdf =
        await PDFDocument.create();

    const copied =
        await outputPdf.copyPages(
            source,
            pages.map(
                page => page - 1
            )
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
            {
                type:
                    "application/pdf"
            }
        );

    const filename =
        `${removeExtension(file.name)}_split.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Split PDF",
        blob.size
    );

    closeTool();

    showToast(
        `${pages.length} page(s) extracted successfully!`,
        "success"
    );
}


/* =========================================================
   COMPRESS PDF
========================================================= */

async function compressPDF(file) {

    if (!window.PDFLib) {

        throw new Error(
            "PDF library is not loaded."
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

    const newSize =
        blob.size;

    const filename =
        `${removeExtension(file.name)}_compressed.pdf`;

    downloadBlob(
        blob,
        filename
    );

    saveRecentFile(
        filename,
        "Compress PDF",
        newSize
    );

    closeTool();

    if (newSize < originalSize) {

        const percent =
            (
                (originalSize - newSize) /
                originalSize *
                100
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
                length:
                    maxPages
            },
            (_, i) => i + 1
        );
    }

    const result =
        new Set();

    const parts =
        value
            .split(",")
            .map(
                part =>
                    part.trim()
            )
            .filter(Boolean);

    for (const part of parts) {

        if (part.includes("-")) {

            const values =
                part
                    .split("-")
                    .map(
                        Number
                    );

            if (
                values.length !== 2 ||
                !Number.isInteger(values[0]) ||
                !Number.isInteger(values[1])
            ) {
                continue;
            }

            let start =
                Math.min(
                    values[0],
                    values[1]
                );

            let end =
                Math.max(
                    values[0],
                    values[1]
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
                let page = start;
                page <= end;
                page++
            ) {

                result.add(page);
            }

        } else {

            const page =
                Number(part);

            if (
                Number.isInteger(page) &&
                page >= 1 &&
                page <= maxPages
            ) {

                result.add(page);
            }
        }
    }

    return Array.from(result)
        .sort(
            (a,b) => a-b
        );
}


/* =========================================================
   READ DATA URL
========================================================= */

function readAsDataURL(file) {

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
                        "Could not read image."
                    )
                );

            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================================
   IMAGE DIMENSIONS
========================================================= */

function getImageDimensions(
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
                        "Invalid image."
                    )
                );

            image.src =
                dataURL;
        }
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
   JSZIP
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
        new Promise(
            (resolve, reject) => {

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";

                script.onload =
                    () => {

                        if (
                            window.JSZip
                        ) {

                            resolve(
                                window.JSZip
                            );

                        } else {

                            reject(
                                new Error(
                                    "ZIP library failed."
                                )
                            );
                        }
                    };

                script.onerror =
                    () => reject(
                        new Error(
                            "Could not load ZIP library."
                        )
                    );

                document.head.appendChild(
                    script
                );
            }
        );

    return zipPromise;
}


/* =========================================================
   UTILS
========================================================= */

function removeExtension(
    filename
) {

    return filename.replace(
        /\.[^/.]+$/,
        ""
    );
}


function dateName() {

    const date =
        new Date();

    const pad =
        value =>
            String(value)
                .padStart(2,"0");

    return [
        date.getFullYear(),
        pad(
            date.getMonth() + 1
        ),
        pad(
            date.getDate()
        ),
        "_",
        pad(
            date.getHours()
        ),
        pad(
            date.getMinutes()
        )
    ].join("");
}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const darkToggle =
        $("darkModeToggle");

    const notificationToggle =
        $("notificationToggle");


    /* DARK MODE */

    const savedTheme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        );

    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

        if (darkToggle) {
            darkToggle.checked = false;
        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );

        if (darkToggle) {
            darkToggle.checked = true;
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


    /* NOTIFICATIONS */

    const notificationState =
        localStorage.getItem(
            STORAGE_KEYS.notifications
        );

    if (
        notificationToggle &&
        notificationState === "false"
    ) {

        notificationToggle.checked =
            false;
    }


    if (notificationToggle) {

        notificationToggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    STORAGE_KEYS.notifications,
                    String(
                        notificationToggle.checked
                    )
                );

                showToast(
                    notificationToggle.checked
                        ? "Notifications enabled"
                        : "Notifications disabled",
                    "success"
                );
            }
        );
    }
}


/* =========================================================
   LOGO
========================================================= */

function setupLogo() {

    all("img").forEach(image => {

        image.addEventListener(
            "error",
            () => {

                if (
                    image.id === "splashLogo"
                ) {

                    image.style.display =
                        "none";

                    const fallback =
                        $("logoFallback");

                    if (fallback) {
                        fallback.style.display =
                            "flex";
                    }

                } else {

                    image.style.display =
                        "none";
                }
            }
        );

    });
}


/* =========================================================
   MODAL KEYBOARD
========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeTool();
            }

        }
    );
}


/* =========================================================
   DRAG & DROP
========================================================= */

function setupDragDrop() {

    const modal =
        $("toolModal");

    if (!modal) {
        return;
    }

    modal.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

        }
    );

    modal.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            if (!currentTool) {
                return;
            }

            const files =
                Array.from(
                    event.dataTransfer.files || []
                );

            if (!files.length) {
                return;
            }

            if (
                currentTool === "imageToPdf"
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
                    TOOL_CONFIG[currentTool]
                        .multiple
                        ? files
                        : files.slice(0,1);
            }

            renderSelectedFiles();
        }
    );
}


/* =========================================================
   START APP
========================================================= */

function startApp() {

    setupLogo();

    setupNavigation();

    setupToolCards();

    setupFileInput();

    setupButtons();

    setupSettings();

    setupKeyboard();

    setupDragDrop();

    renderRecentFiles();

    renderFilesPage();


    /* SPLASH */

    const splash =
        $("splashScreen");

    const app =
        $("app");

    if (app) {
        app.style.display =
            "block";
    }

    setTimeout(
        () => {

            if (splash) {

                splash.classList.add(
                    "hide"
                );

                setTimeout(
                    () => {

                        splash.style.display =
                            "none";

                    },
                    550
                );
            }

        },
        2200
    );
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    startApp
);


/* =========================================================
   GLOBAL ERROR LOG
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

    }
);
