/* =========================================================
   LeoPDF — COMPLETE SCRIPT.JS
   Convert. Compress. Simplify.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const LOGO_FILE = "file_00000000db748208ae0361855c0a94b9";

const STORAGE_KEYS = {
    recentFiles: "leopdf_recent_files",
    theme: "leopdf_theme"
};

let currentTool = null;
let selectedImages = [];
let genericFiles = [];
let pdfJsPromise = null;

/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function showToast(message, type = "normal") {
    const toast = $("#toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;
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
   DOWNLOAD
   ========================================================= */

function downloadBlob(blob, filename) {
    try {
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    } catch (error) {
        console.error(error);
        showToast("Download failed", "error");
    }
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

    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

/* =========================================================
   RECENT FILES
   ========================================================= */

function getRecentFiles() {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEYS.recentFiles) || "[]"
        );
    } catch {
        return [];
    }
}

function saveRecentFile(name, type, size = 0) {
    try {
        const files = getRecentFiles();

        files.unshift({
            name,
            type,
            size,
            date: new Date().toISOString()
        });

        const unique = [];

        for (const file of files) {
            const exists = unique.some(
                item => item.name === file.name && item.type === file.type
            );

            if (!exists) {
                unique.push(file);
            }
        }

        localStorage.setItem(
            STORAGE_KEYS.recentFiles,
            JSON.stringify(unique.slice(0, 20))
        );

        renderRecentFiles();

    } catch (error) {
        console.error("Recent file error:", error);
    }
}

function renderRecentFiles() {
    const container = $("#recentFiles");

    if (!container) {
        return;
    }

    const files = getRecentFiles();

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

    container.innerHTML = files.map(file => {
        const date = new Date(file.date);

        return `
            <div class="recent-file">
                <div class="recent-file-icon">📄</div>

                <div class="recent-file-info">
                    <strong>${escapeHTML(file.name)}</strong>
                    <span>
                        ${escapeHTML(file.type || "PDF")}
                        ${file.size ? " • " + formatFileSize(file.size) : ""}
                    </span>
                </div>

                <div class="recent-file-date">
                    ${date.toLocaleDateString()}
                </div>
            </div>
        `;
    }).join("");
}

function clearRecentFiles() {
    localStorage.removeItem(STORAGE_KEYS.recentFiles);
    renderRecentFiles();
    showToast("Recent files cleared", "success");
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
   SPLASH SCREEN
   ========================================================= */

function setupSplash() {
    const splash = $(".splash-screen");
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

    setTimeout(() => {
        if (splash) {
            splash.classList.add("hide");

            setTimeout(() => {
                splash.style.display = "none";
            }, 500);
        }
    }, 2200);
}

/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageName) {

    const pages = {
        home: $("#homePage"),
        files: $("#filesPage"),
        tools: $("#toolsPage"),
        settings: $("#settingsPage")
    };

    Object.values(pages).forEach(page => {
        if (page) {
            page.style.display = "none";
        }
    });

    if (pages[pageName]) {
        pages[pageName].style.display = "block";
    }

    $$(".bottom-nav-item, .nav-item").forEach(item => {
        item.classList.remove("active");

        if (
            item.dataset.page === pageName ||
            item.dataset.nav === pageName
        ) {
            item.classList.add("active");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function setupNavigation() {

    $$(".bottom-nav-item, .nav-item").forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.dataset.page ||
                item.dataset.nav;

            if (page) {
                showPage(page);
            }
        });
    });

    showPage("home");
}

/* =========================================================
   IMAGE → PDF MODAL
   ========================================================= */

function openImagePDFModal() {

    const modal = $("#imagePdfModal");

    if (!modal) {
        showToast("Image to PDF screen not found", "error");
        return;
    }

    selectedImages = [];

    const input = $("#imageInput");

    if (input) {
        input.value = "";
    }

    renderSelectedImages();

    modal.classList.add("active");
}

function closeImagePDFModal() {

    const modal = $("#imagePdfModal");

    if (modal) {
        modal.classList.remove("active");
    }

    selectedImages = [];
}

/* =========================================================
   GENERIC TOOL MODAL
   ========================================================= */

function openGenericModal(tool) {

    currentTool = tool;
    genericFiles = [];

    const modal = $("#toolModal");

    if (!modal) {
        showToast("Tool window not found", "error");
        return;
    }

    const title = $("#toolModalTitle");
    const description = $("#toolModalDescription");
    const input = $("#genericFileInput");
    const options = $("#genericOptions");
    const action = $("#genericActionButton");

    const config = getToolConfig(tool);

    if (title) {
        title.textContent = config.title;
    }

    if (description) {
        description.textContent = config.description;
    }

    if (input) {
        input.value = "";
        input.accept = config.accept;
        input.multiple = !!config.multiple;
    }

    if (options) {
        options.innerHTML = config.options || "";
    }

    if (action) {
        action.textContent = config.action;
    }

    renderGenericFiles();

    modal.classList.add("active");
}

function closeGenericModal() {

    const modal = $("#toolModal");

    if (modal) {
        modal.classList.remove("active");
    }

    currentTool = null;
    genericFiles = [];
}

/* =========================================================
   TOOL CONFIG
   ========================================================= */

function getToolConfig(tool) {

    const configs = {

        "pdf-image": {
            title: "PDF → Image",
            description: "Convert PDF pages into high-quality images.",
            accept: ".pdf,application/pdf",
            multiple: false,
            action: "Convert to Images",

            options: `
                <div class="option-group">
                    <label for="pdfPageRange">
                        Page Range
                    </label>

                    <input
                        id="pdfPageRange"
                        type="text"
                        placeholder="Example: 1-3 or 1,3,5"
                    />

                    <small>
                        Leave empty to convert all pages.
                    </small>
                </div>

                <div class="option-group">
                    <label for="pdfImageFormat">
                        Image Format
                    </label>

                    <select id="pdfImageFormat">
                        <option value="png">PNG</option>
                        <option value="jpeg">JPG</option>
                    </select>
                </div>

                <div class="option-group">
                    <label for="pdfImageScale">
                        Quality
                    </label>

                    <select id="pdfImageScale">
                        <option value="1.5">Standard</option>
                        <option value="2">High</option>
                        <option value="2.5">Very High</option>
                    </select>
                </div>
            `
        },

        "merge": {
            title: "Merge PDF",
            description: "Combine multiple PDF files into one PDF.",
            accept: ".pdf,application/pdf",
            multiple: true,
            action: "Merge PDFs",

            options: `
                <div class="option-group">
                    <small>
                        Select 2 or more PDF files.
                    </small>
                </div>
            `
        },

        "split": {
            title: "Split PDF",
            description: "Extract selected pages into a new PDF.",
            accept: ".pdf,application/pdf",
            multiple: false,
            action: "Split PDF",

            options: `
                <div class="option-group">
                    <label for="splitPageRange">
                        Pages
                    </label>

                    <input
                        id="splitPageRange"
                        type="text"
                        placeholder="Example: 1-3 or 1,4,6"
                    />

                    <small>
                        Example: 1-3 extracts pages 1, 2 and 3.
                    </small>
                </div>
            `
        },

        "compress": {
            title: "Compress PDF",
            description: "Optimize and re-save your PDF to reduce unnecessary file data.",
            accept: ".pdf,application/pdf",
            multiple: false,
            action: "Compress PDF",

            options: `
                <div class="option-group">
                    <label for="compressLevel">
                        Compression Level
                    </label>

                    <select id="compressLevel">
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                    </select>

                    <small>
                        PDF compression depends on the original PDF.
                    </small>
                </div>
            `
        },

        "info": {
            title: "PDF Tools",
            description: "LeoPDF utility information.",
            accept: "",
            multiple: false,
            action: "Close",

            options: `
                <div class="info-box">
                    <h3>LeoPDF</h3>
                    <p>Convert. Compress. Simplify.</p>

                    <ul>
                        <li>Image → PDF</li>
                        <li>PDF → Image</li>
                        <li>Merge PDF</li>
                        <li>Split PDF</li>
                        <li>Compress PDF</li>
                    </ul>

                    <p>
                        Files are processed locally in your browser.
                    </p>
                </div>
            `
        }

    };

    return configs[tool] || configs.info;
}

/* =========================================================
   TOOL CARD EVENTS
   ========================================================= */

function setupToolCards() {

    $$("[data-tool]").forEach(card => {

        card.addEventListener("click", () => {

            const tool = card.dataset.tool;

            if (!tool) {
                return;
            }

            if (tool === "image-pdf") {
                openImagePDFModal();
                return;
            }

            openGenericModal(tool);
        });
    });
}

/* =========================================================
   IMAGE FILE INPUT
   ========================================================= */

function setupImageInput() {

    const input = $("#imageInput");

    if (!input) {
        return;
    }

    input.addEventListener("change", event => {

        const files = Array.from(event.target.files || []);

        if (!files.length) {
            return;
        }

        const validFiles = files.filter(file =>
            file.type.startsWith("image/")
        );

        selectedImages.push(...validFiles);

        renderSelectedImages();

        input.value = "";
    });
}

/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function renderSelectedImages() {

    const container = $("#selectedImages");

    if (!container) {
        return;
    }

    if (!selectedImages.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🖼️</div>
                <p>Select images to create your PDF.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    selectedImages.forEach((file, index) => {

        const wrapper = document.createElement("div");
        wrapper.className = "selected-image";

        const image = document.createElement("img");

        image.alt = file.name;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-image";
        remove.textContent = "×";

        remove.addEventListener("click", () => {
            selectedImages.splice(index, 1);
            renderSelectedImages();
        });

        const reader = new FileReader();

        reader.onload = event => {
            image.src = event.target.result;
        };

        reader.readAsDataURL(file);

        wrapper.appendChild(image);
        wrapper.appendChild(remove);

        container.appendChild(wrapper);
    });
}

/* =========================================================
   IMAGE → PDF
   ========================================================= */

async function createImagePDF() {

    if (!selectedImages.length) {
        showToast("Please select at least one image", "error");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        showToast("PDF library is not loaded", "error");
        return;
    }

    const button = $("#createPdfButton");

    setButtonLoading(button, true, "Creating...");

    try {

        const { jsPDF } = window.jspdf;

        let pdf = null;

        for (let i = 0; i < selectedImages.length; i++) {

            const file = selectedImages[i];

            const dataUrl = await readFileAsDataURL(file);

            const imageInfo = await getImageInfo(dataUrl);

            const orientation =
                imageInfo.width > imageInfo.height
                    ? "landscape"
                    : "portrait";

            if (!pdf) {

                pdf = new jsPDF({
                    orientation,
                    unit: "mm",
                    format: "a4"
                });

            } else {

                pdf.addPage("a4", orientation);
            }

            const pageWidth = orientation === "landscape"
                ? 297
                : 210;

            const pageHeight = orientation === "landscape"
                ? 210
                : 297;

            const margin = 8;

            const maxWidth = pageWidth - margin * 2;
            const maxHeight = pageHeight - margin * 2;

            const ratio = Math.min(
                maxWidth / imageInfo.width,
                maxHeight / imageInfo.height
            );

            const width = imageInfo.width * ratio;
            const height = imageInfo.height * ratio;

            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            const format =
                file.type === "image/png"
                    ? "PNG"
                    : "JPEG";

            pdf.addImage(
                dataUrl,
                format,
                x,
                y,
                width,
                height,
                undefined,
                "FAST"
            );
        }

        const blob = pdf.output("blob");

        const filename =
            `LeoPDF_${formatDateForFilename(new Date())}.pdf`;

        downloadBlob(blob, filename);

        saveRecentFile(
            filename,
            "Image → PDF",
            blob.size
        );

        showToast("PDF created successfully!", "success");

        closeImagePDFModal();

    } catch (error) {

        console.error("Image PDF error:", error);
        showToast(
            error.message || "Failed to create PDF",
            "error"
        );

    } finally {

        setButtonLoading(button, false);
    }
}

/* =========================================================
   GENERIC INPUT
   ========================================================= */

function setupGenericInput() {

    const input = $("#genericFileInput");

    if (!input) {
        return;
    }

    input.addEventListener("change", async event => {

        genericFiles = Array.from(event.target.files || []);

        renderGenericFiles();

        if (
            currentTool === "split" &&
            genericFiles.length
        ) {
            await updateSplitPageCount(genericFiles[0]);
        }
    });
}

/* =========================================================
   GENERIC FILE PREVIEW
   ========================================================= */

function renderGenericFiles() {

    const container = $("#genericFileList");

    if (!container) {
        return;
    }

    if (!genericFiles.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <p>No file selected.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = genericFiles.map((file, index) => `
        <div class="generic-file-item">
            <span>📄</span>

            <div>
                <strong>${escapeHTML(file.name)}</strong>
                <small>${formatFileSize(file.size)}</small>
            </div>

            <button
                type="button"
                class="remove-generic-file"
                data-index="${index}">
                ×
            </button>
        </div>
    `).join("");

    $$(".remove-generic-file").forEach(button => {

        button.addEventListener("click", () => {

            const index = Number(button.dataset.index);

            genericFiles.splice(index, 1);

            renderGenericFiles();
        });
    });
}

/* =========================================================
   GENERIC TOOL ACTION
   ========================================================= */

async function runGenericTool() {

    if (currentTool === "info") {
        closeGenericModal();
        return;
    }

    if (!genericFiles.length) {
        showToast("Please select a file", "error");
        return;
    }

    const button = $("#genericActionButton");

    setButtonLoading(button, true, "Processing...");

    try {

        switch (currentTool) {

            case "pdf-image":
                await convertPDFToImages(genericFiles[0]);
                break;

            case "merge":
                await mergePDFs(genericFiles);
                break;

            case "split":
                await splitPDF(genericFiles[0]);
                break;

            case "compress":
                await compressPDF(genericFiles[0]);
                break;

            default:
                showToast("Unknown tool", "error");
        }

    } catch (error) {

        console.error("Tool error:", error);

        showToast(
            error.message || "Operation failed",
            "error"
        );

    } finally {

        setButtonLoading(button, false);
    }
}

/* =========================================================
   LOAD PDF.JS
   ========================================================= */

async function getPDFJS() {

    if (window.pdfjsLib) {
        return window.pdfjsLib;
    }

    if (!pdfJsPromise) {

        pdfJsPromise = import(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
        ).then(module => {

            const pdfjs = module;

            if (
                pdfjs.GlobalWorkerOptions
            ) {
                pdfjs.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
            }

            return pdfjs;
        });
    }

    return pdfJsPromise;
}

/* =========================================================
   PDF → IMAGE
   ========================================================= */

async function convertPDFToImages(file) {

    const pdfjsLib = await getPDFJS();

    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: buffer
    }).promise;

    const rangeInput = $("#pdfPageRange");
    const formatInput = $("#pdfImageFormat");
    const scaleInput = $("#pdfImageScale");

    const range = rangeInput
        ? rangeInput.value.trim()
        : "";

    const format = formatInput
        ? formatInput.value
        : "png";

    const scale = scaleInput
        ? Number(scaleInput.value)
        : 1.5;

    const pages = parsePageRange(
        range,
        pdf.numPages
    );

    if (!pages.length) {
        throw new Error("Invalid page range");
    }

    showToast(
        `Converting ${pages.length} page(s)...`
    );

    let zip = null;

    try {

        zip = await getJSZip();

    } catch {

        zip = null;
    }

    const imageFiles = [];

    for (let i = 0; i < pages.length; i++) {

        const pageNumber = pages[i];

        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({
            scale
        });

        const canvas = document.createElement("canvas");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const context = canvas.getContext("2d", {
            alpha: false
        });

        await page.render({
            canvasContext: context,
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

        const blob = await canvasToBlob(
            canvas,
            mime,
            quality
        );

        const extension =
            format === "jpeg"
                ? "jpg"
                : "png";

        const filename =
            `${removeExtension(file.name)}_page_${pageNumber}.${extension}`;

        imageFiles.push({
            blob,
            filename
        });

        if (zip) {
            zip.file(filename, blob);
        }
    }

    if (zip) {

        const zipBlob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 6
            }
        });

        const zipName =
            `${removeExtension(file.name)}_images.zip`;

        downloadBlob(zipBlob, zipName);

        saveRecentFile(
            zipName,
            "PDF → Images",
            zipBlob.size
        );

    } else {

        for (let i = 0; i < imageFiles.length; i++) {

            downloadBlob(
                imageFiles[i].blob,
                imageFiles[i].filename
            );

            await sleep(150);
        }

        saveRecentFile(
            imageFiles[0].filename,
            "PDF → Image",
            imageFiles[0].blob.size
        );
    }

    showToast(
        `${pages.length} image(s) created successfully!`,
        "success"
    );

    closeGenericModal();
}

/* =========================================================
   MERGE PDF
   ========================================================= */

async function mergePDFs(files) {

    if (!window.PDFLib) {
        throw new Error("PDF library is not loaded");
    }

    if (files.length < 2) {
        throw new Error("Select at least 2 PDF files");
    }

    const {
        PDFDocument
    } = window.PDFLib;

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {

        const bytes = await file.arrayBuffer();

        const sourcePdf =
            await PDFDocument.load(bytes);

        const pages = await mergedPdf.copyPages(
            sourcePdf,
            sourcePdf.getPageIndices()
        );

        pages.forEach(page => {
            mergedPdf.addPage(page);
        });
    }

    const output = await mergedPdf.save({
        useObjectStreams: true
    });

    const blob = new Blob(
        [output],
        { type: "application/pdf" }
    );

    const filename =
        `LeoPDF_Merged_${formatDateForFilename(new Date())}.pdf`;

    downloadBlob(blob, filename);

    saveRecentFile(
        filename,
        "Merge PDF",
        blob.size
    );

    showToast(
        `${files.length} PDFs merged successfully!`,
        "success"
    );

    closeGenericModal();
}

/* =========================================================
   SPLIT PDF
   ========================================================= */

async function splitPDF(file) {

    if (!window.PDFLib) {
        throw new Error("PDF library is not loaded");
    }

    const {
        PDFDocument
    } = window.PDFLib;

    const bytes = await file.arrayBuffer();

    const sourcePdf =
        await PDFDocument.load(bytes);

    const totalPages =
        sourcePdf.getPageCount();

    const rangeInput = $("#splitPageRange");

    const range = rangeInput
        ? rangeInput.value.trim()
        : "";

    const pages = parsePageRange(
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
            pages.map(page => page - 1)
        );

    copiedPages.forEach(page => {
        newPdf.addPage(page);
    });

    const output =
        await newPdf.save({
            useObjectStreams: true
        });

    const blob = new Blob(
        [output],
        { type: "application/pdf" }
    );

    const filename =
        `${removeExtension(file.name)}_split.pdf`;

    downloadBlob(blob, filename);

    saveRecentFile(
        filename,
        "Split PDF",
        blob.size
    );

    showToast(
        `${pages.length} page(s) extracted successfully!`,
        "success"
    );

    closeGenericModal();
}

/* =========================================================
   COMPRESS PDF
   ========================================================= */

async function compressPDF(file) {

    if (!window.PDFLib) {
        throw new Error("PDF library is not loaded");
    }

    const {
        PDFDocument
    } = window.PDFLib;

    const bytes = await file.arrayBuffer();

    const originalSize = bytes.byteLength;

    const pdf =
        await PDFDocument.load(bytes, {
            ignoreEncryption: false
        });

    const output =
        await pdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50
        });

    const blob = new Blob(
        [output],
        { type: "application/pdf" }
    );

    const newSize = blob.size;

    const filename =
        `${removeExtension(file.name)}_compressed.pdf`;

    downloadBlob(blob, filename);

    saveRecentFile(
        filename,
        "Compress PDF",
        newSize
    );

    const difference =
        originalSize - newSize;

    if (difference > 0) {

        const percent =
            ((difference / originalSize) * 100).toFixed(1);

        showToast(
            `Compressed by ${percent}%`,
            "success"
        );

    } else {

        showToast(
            "PDF optimized successfully. Original was already highly compressed.",
            "success"
        );
    }

    closeGenericModal();
}

/* =========================================================
   PAGE RANGE PARSER
   ========================================================= */

function parsePageRange(value, maxPages) {

    if (!value || !value.trim()) {

        return Array.from(
            { length: maxPages },
            (_, index) => index + 1
        );
    }

    const result = new Set();

    const parts = value
        .split(",")
        .map(part => part.trim())
        .filter(Boolean);

    for (const part of parts) {

        if (part.includes("-")) {

            const range = part
                .split("-")
                .map(Number);

            if (
                range.length !== 2 ||
                !Number.isInteger(range[0]) ||
                !Number.isInteger(range[1])
            ) {
                continue;
            }

            let start = range[0];
            let end = range[1];

            if (start > end) {
                [start, end] = [end, start];
            }

            start = Math.max(1, start);
            end = Math.min(maxPages, end);

            for (let i = start; i <= end; i++) {
                result.add(i);
            }

        } else {

            const page = Number(part);

            if (
                Number.isInteger(page) &&
                page >= 1 &&
                page <= maxPages
            ) {
                result.add(page);
            }
        }
    }

    return Array.from(result).sort(
        (a, b) => a - b
    );
}

/* =========================================================
   SPLIT PAGE COUNT
   ========================================================= */

async function updateSplitPageCount(file) {

    try {

        if (!window.PDFLib) {
            return;
        }

        const bytes = await file.arrayBuffer();

        const pdf =
            await window.PDFLib.PDFDocument.load(bytes);

        const pageCount =
            pdf.getPageCount();

        const rangeInput = $("#splitPageRange");

        if (rangeInput) {
            rangeInput.placeholder =
                `1-${pageCount} or 1,3,${pageCount}`;
        }

    } catch (error) {

        console.error(
            "Could not read PDF pages:",
            error
        );
    }
}

/* =========================================================
   JSZIP LOADER
   ========================================================= */

let jsZipPromise = null;

function getJSZip() {

    if (window.JSZip) {
        return Promise.resolve(window.JSZip);
    }

    if (jsZipPromise) {
        return jsZipPromise;
    }

    jsZipPromise = new Promise((resolve, reject) => {

        const script =
            document.createElement("script");

        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";

        script.onload = () => {

            if (window.JSZip) {
                resolve(window.JSZip);
            } else {
                reject(
                    new Error("JSZip failed to load")
                );
            }
        };

        script.onerror = () => {
            reject(
                new Error("Could not load ZIP library")
            );
        };

        document.head.appendChild(script);
    });

    return jsZipPromise;
}

/* =========================================================
   FILE READER
   ========================================================= */

function readFileAsDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(
                new Error("Could not read image")
            );
        };

        reader.readAsDataURL(file);
    });
}

/* =========================================================
   IMAGE INFORMATION
   ========================================================= */

function getImageInfo(dataUrl) {

    return new Promise((resolve, reject) => {

        const image = new Image();

        image.onload = () => {

            resolve({
                width: image.naturalWidth,
                height: image.naturalHeight
            });
        };

        image.onerror = () => {
            reject(
                new Error("Invalid image")
            );
        };

        image.src = dataUrl;
    });
}

/* =========================================================
   CANVAS → BLOB
   ========================================================= */

function canvasToBlob(
    canvas,
    type = "image/png",
    quality
) {

    return new Promise((resolve, reject) => {

        canvas.toBlob(
            blob => {

                if (blob) {
                    resolve(blob);
                } else {
                    reject(
                        new Error("Image conversion failed")
                    );
                }
            },
            type,
            quality
        );
    });
}

/* =========================================================
   UTILITY
   ========================================================= */

function removeExtension(filename) {

    return filename.replace(
        /\.[^/.]+$/,
        ""
    );
}

function formatDateForFilename(date) {

    const pad = number =>
        String(number).padStart(2, "0");

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-");
}

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
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

        button.dataset.originalText =
            button.textContent;

        button.disabled = true;

        button.innerHTML = `
            <span class="button-spinner"></span>
            ${text}
        `;

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            button.textContent;
    }
}

/* =========================================================
   MODAL CLOSE EVENTS
   ========================================================= */

function setupModalEvents() {

    const imageModal = $("#imagePdfModal");
    const genericModal = $("#toolModal");

    $$(".modal-close, .close-modal, [data-close-modal]").forEach(
        button => {

            button.addEventListener("click", () => {

                if (
                    imageModal &&
                    imageModal.classList.contains("active")
                ) {
                    closeImagePDFModal();
                }

                if (
                    genericModal &&
                    genericModal.classList.contains("active")
                ) {
                    closeGenericModal();
                }
            });
        }
    );

    if (imageModal) {

        imageModal.addEventListener(
            "click",
            event => {

                if (event.target === imageModal) {
                    closeImagePDFModal();
                }
            }
        );
    }

    if (genericModal) {

        genericModal.addEventListener(
            "click",
            event => {

                if (event.target === genericModal) {
                    closeGenericModal();
                }
            }
        );
    }

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            closeImagePDFModal();
            closeGenericModal();
        }
    );
}

/* =========================================================
   BUTTON EVENTS
   ========================================================= */

function setupButtons() {

    const imagePdfButton =
        $("#createPdfButton");

    if (imagePdfButton) {

        imagePdfButton.addEventListener(
            "click",
            createImagePDF
        );
    }

    const genericActionButton =
        $("#genericActionButton");

    if (genericActionButton) {

        genericActionButton.addEventListener(
            "click",
            runGenericTool
        );
    }

    const clearButton =
        $("#clearRecentButton");

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearRecentFiles
        );
    }

    $("[data-open-image-picker]")?.addEventListener(
        "click",
        () => $("#imageInput")?.click()
    );

    $("[data-open-generic-picker]")?.addEventListener(
        "click",
        () => $("#genericFileInput")?.click()
    );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    const themeToggle =
        $("#themeToggle");

    if (themeToggle) {

        const savedTheme =
            localStorage.getItem(
                STORAGE_KEYS.theme
            );

        if (savedTheme === "light") {
            document.body.classList.add("light-theme");
            themeToggle.checked = true;
        }

        themeToggle.addEventListener(
            "change",
            () => {

                if (themeToggle.checked) {

                    document.body.classList.add(
                        "light-theme"
                    );

                    localStorage.setItem(
                        STORAGE_KEYS.theme,
                        "light"
                    );

                } else {

                    document.body.classList.remove(
                        "light-theme"
                    );

                    localStorage.setItem(
                        STORAGE_KEYS.theme,
                        "dark"
                    );
                }
            }
        );
    }
}

/* =========================================================
   DEDUPLICATE TOOL CARDS
   ========================================================= */

function removeDuplicateToolCards() {

    $$(".tools-grid").forEach(grid => {

        const seen = new Set();

        Array.from(
            grid.querySelectorAll("[data-tool]")
        ).forEach(card => {

            const tool =
                card.dataset.tool;

            if (!tool) {
                return;
            }

            if (seen.has(tool)) {
                card.remove();
            } else {
                seen.add(tool);
            }
        });
    });
}

/* =========================================================
   DRAG & DROP
   ========================================================= */

function setupDragDrop() {

    const zones = [
        $("#imagePdfModal"),
        $("#toolModal")
    ].filter(Boolean);

    zones.forEach(zone => {

        zone.addEventListener(
            "dragover",
            event => {
                event.preventDefault();
                zone.classList.add("dragging");
            }
        );

        zone.addEventListener(
            "dragleave",
            () => {
                zone.classList.remove("dragging");
            }
        );

        zone.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                zone.classList.remove(
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
                    zone.id === "imagePdfModal"
                ) {

                    const images =
                        files.filter(file =>
                            file.type.startsWith("image/")
                        );

                    selectedImages.push(
                        ...images
                    );

                    renderSelectedImages();

                } else {

                    genericFiles = files;

                    renderGenericFiles();
                }
            }
        );
    });
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

        showToast(
            "Something went wrong. Please try again.",
            "error"
        );
    }
);

/* =========================================================
   INITIALIZE APP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "LeoPDF initializing..."
        );

        setupSplash();

        setupNavigation();

        setupToolCards();

        setupImageInput();

        setupGenericInput();

        setupModalEvents();

        setupButtons();

        setupSettings();

        setupDragDrop();

        removeDuplicateToolCards();

        renderRecentFiles();

        console.log(
            "LeoPDF ready — Convert. Compress. Simplify."
        );
    }
);
