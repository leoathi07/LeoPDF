/* =========================================================
   LeoPDF — COMPLETE SCRIPT.JS
   Convert. Compress. Simplify.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE = {
    recentFiles: "leopdf_recent_files",
    theme: "leopdf_theme",
    notifications: "leopdf_notifications"
};

const LOGO_FILE =
    "file_00000000db748208ae0361855c0a94b9.png";

let currentTool = null;
let selectedFiles = [];
let pdfJsReady = false;
let jsZipPromise = null;
let jsPdfPromise = null;
let toastTimer = null;


/* =========================================================
   DOM
   ========================================================= */

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
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
    const messageBox = $("#toastMessage");

    toast.classList.remove(
        "show",
        "success",
        "error"
    );

    if (type === "success") {
        toast.classList.add("success");
    }

    if (type === "error") {
        toast.classList.add("error");
    }

    if (icon) {
        icon.textContent =
            type === "success"
                ? "✓"
                : type === "error"
                    ? "!"
                    : "i";
    }

    if (messageBox) {
        messageBox.textContent = message;
    } else {
        toast.textContent = message;
    }

    void toast.offsetWidth;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
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

    bytes = Number(bytes);

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


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadBlob(blob, filename) {

    if (!blob) {
        throw new Error("File is empty");
    }

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
}


/* =========================================================
   DATE
   ========================================================= */

function getDateName() {

    const now = new Date();

    const pad = number =>
        String(number).padStart(2, "0");

    return (
        now.getFullYear() +
        "-" +
        pad(now.getMonth() + 1) +
        "-" +
        pad(now.getDate()) +
        "_" +
        pad(now.getHours()) +
        "-" +
        pad(now.getMinutes()) +
        "-" +
        pad(now.getSeconds())
    );
}


/* =========================================================
   REMOVE EXTENSION
   ========================================================= */

function removeExtension(name) {

    return String(name)
        .replace(/\.[^/.]+$/, "");
}


/* =========================================================
   RECENT FILE STORAGE
   ========================================================= */

function getRecentFiles() {

    try {

        const data =
            localStorage.getItem(
                STORAGE.recentFiles
            );

        if (!data) {
            return [];
        }

        const files =
            JSON.parse(data);

        return Array.isArray(files)
            ? files
            : [];

    } catch (error) {

        console.error(
            "Recent files error:",
            error
        );

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
            name: name,
            type: type,
            size: size || 0,
            date:
                new Date().toISOString()
        });

        const unique = [];

        files.forEach(file => {

            const exists =
                unique.some(item =>
                    item.name === file.name &&
                    item.type === file.type
                );

            if (!exists) {
                unique.push(file);
            }
        });

        localStorage.setItem(
            STORAGE.recentFiles,
            JSON.stringify(
                unique.slice(0, 20)
            )
        );

        renderRecentFiles();

    } catch (error) {

        console.error(
            "Save recent file error:",
            error
        );
    }
}


/* =========================================================
   RENDER RECENT FILES
   ========================================================= */

function renderRecentFiles() {

    const recentContainer =
        $("#recentFiles");

    const filesContainer =
        $("#filesList");

    const files =
        getRecentFiles();


    function createHTML(list) {

        if (!list.length) {

            return `
                <div class="empty-state">
                    <div class="empty-icon">📄</div>
                    <h3>No Recent Files</h3>
                    <p>
                        Your converted files
                        will appear here.
                    </p>
                </div>
            `;
        }

        return list.map(file => {

            let dateText = "";

            try {

                const date =
                    new Date(file.date);

                if (!Number.isNaN(date.getTime())) {

                    dateText =
                        date.toLocaleDateString();
                }

            } catch {
                dateText = "";
            }

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
                                      formatFileSize(
                                          file.size
                                      )
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="recent-file-date">
                        ${dateText}
                    </div>

                </div>
            `;

        }).join("");
    }


    if (recentContainer) {
        recentContainer.innerHTML =
            createHTML(
                files.slice(0, 5)
            );
    }


    if (filesContainer) {
        filesContainer.innerHTML =
            createHTML(files);
    }
}


/* =========================================================
   CLEAR HISTORY
   ========================================================= */

function clearHistory() {

    localStorage.removeItem(
        STORAGE.recentFiles
    );

    renderRecentFiles();

    showToast(
        "History cleared successfully",
        "success"
    );
}


/* =========================================================
   SPLASH SCREEN
   ========================================================= */

function setupSplash() {

    const splash =
        $("#splashScreen");

    const logo =
        $("#splashLogo");

    const fallback =
        $("#logoFallback");

    if (logo) {

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

        if (
            logo.complete &&
            logo.naturalWidth === 0
        ) {

            logo.style.display =
                "none";

            if (fallback) {
                fallback.style.display =
                    "flex";
            }
        }
    }


    setTimeout(() => {

        if (!splash) {
            showApp();
            return;
        }

        splash.classList.add("hide");

        setTimeout(() => {

            splash.style.display =
                "none";

            showApp();

        }, 500);

    }, 2200);
}


/* =========================================================
   SHOW APP
   ========================================================= */

function showApp() {

    const app =
        $("#app");

    if (!app) {
        return;
    }

    app.style.display =
        "block";
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {

    const pages = [
        "#homePage",
        "#filesPage",
        "#toolsPage",
        "#settingsPage"
    ];

    pages.forEach(selector => {

        const page =
            $(selector);

        if (!page) {
            return;
        }

        page.classList.remove(
            "active-page"
        );

        page.style.display =
            "none";
    });


    const target =
        $("#" + pageId);

    if (target) {

        target.classList.add(
            "active-page"
        );

        target.style.display =
            "block";
    }


    $$(".bottom-nav-item").forEach(
        item => {

            item.classList.remove(
                "active"
            );

            if (
                item.dataset.page ===
                pageId
            ) {

                item.classList.add(
                    "active"
                );
            }
        }
    );


    if (pageId === "filesPage") {
        renderRecentFiles();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    $$(".bottom-nav-item").forEach(
        item => {

            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const page =
                        item.dataset.page;

                    if (page) {
                        showPage(page);
                    }
                }
            );
        }
    );


    showPage("homePage");
}


/* =========================================================
   TOOL CONFIGURATION
   ========================================================= */

function getToolConfig(tool) {

    const configs = {

        imageToPdf: {

            title:
                "Image → PDF",

            description:
                "Convert multiple images into one PDF.",

            icon:
                "🖼️",

            accept:
                "image/*",

            multiple:
                true,

            action:
                "Create PDF"
        },


        pdfToImage: {

            title:
                "PDF → Image",

            description:
                "Convert PDF pages into high-quality images.",

            icon:
                "📄",

            accept:
                ".pdf,application/pdf",

            multiple:
                false,

            action:
                "Convert to Images"
        },


        mergePdf: {

            title:
                "Merge PDF",

            description:
                "Combine multiple PDF files into one PDF.",

            icon:
                "🔗",

            accept:
                ".pdf,application/pdf",

            multiple:
                true,

            action:
                "Merge PDFs"
        },


        splitPdf: {

            title:
                "Split PDF",

            description:
                "Extract selected pages from a PDF.",

            icon:
                "✂️",

            accept:
                ".pdf,application/pdf",

            multiple:
                false,

            action:
                "Split PDF"
        },


        compressPdf: {

            title:
                "Compress PDF",

            description:
                "Optimize and re-save your PDF.",

            icon:
                "📦",

            accept:
                ".pdf,application/pdf",

            multiple:
                false,

            action:
                "Compress PDF"
        }

    };

    return configs[tool] || null;
}


/* =========================================================
   TOOL MODAL
   ========================================================= */

function openTool(tool) {

    const config =
        getToolConfig(tool);

    const modal =
        $("#toolModal");

    if (!config || !modal) {

        showToast(
            "Tool is not available",
            "error"
        );

        return;
    }


    currentTool =
        tool;

    selectedFiles =
        [];


    const icon =
        $("#modalIcon");

    const title =
        $("#modalTitle");

    const description =
        $("#modalDescription");

    const input =
        $("#fileInput");

    const options =
        $("#fileOptions");

    const selected =
        $("#selectedFiles");

    const splitOptions =
        $("#splitOptions");

    const pageNumbers =
        $("#pageNumbers");

    const action =
        $("#modalActionButton");


    if (icon) {
        icon.textContent =
            config.icon;
    }

    if (title) {
        title.textContent =
            config.title;
    }

    if (description) {
        description.textContent =
            config.description;
    }


    if (input) {

        input.value = "";

        input.accept =
            config.accept;

        input.multiple =
            config.multiple;
    }


    if (options) {
        options.innerHTML = "";
    }


    if (selected) {
        selected.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    📄
                </div>
                <p>
                    No file selected.
                </p>
            </div>
        `;
    }


    if (splitOptions) {

        splitOptions.classList.remove(
            "show"
        );

        splitOptions.style.display =
            "none";
    }


    if (pageNumbers) {
        pageNumbers.value = "";
    }


    if (tool === "pdfToImage") {

        if (options) {

            options.innerHTML = `

                <div class="option-group">

                    <label>
                        Page Range
                    </label>

                    <input
                        id="pdfPageRange"
                        type="text"
                        placeholder="Example: 1-3 or 1,3,5"
                    >

                    <small>
                        Leave empty for all pages.
                    </small>

                </div>


                <div class="option-group">

                    <label>
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

                    <label>
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
    }


    if (tool === "mergePdf") {

        if (options) {

            options.innerHTML = `
                <div class="option-group">
                    <small>
                        Select 2 or more PDF files.
                    </small>
                </div>
            `;
        }
    }


    if (tool === "compressPdf") {

        if (options) {

            options.innerHTML = `

                <div class="option-group">

                    <label>
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
                        Result depends on the
                        original PDF.
                    </small>

                </div>
            `;
        }
    }


    if (tool === "splitPdf") {

        if (splitOptions) {

            splitOptions.style.display =
                "block";

            splitOptions.classList.add(
                "show"
            );
        }
    }


    if (action) {

        action.textContent =
            config.action;

        action.style.display =
            "block";
    }


    modal.classList.add("show");

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeToolModal() {

    const modal =
        $("#toolModal");

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }

    currentTool =
        null;

    selectedFiles =
        [];


    const input =
        $("#fileInput");

    if (input) {
        input.value = "";
    }


    document.body.style.overflow =
        "";
}


/* =========================================================
   TOOL CARD EVENTS
   ========================================================= */

function setupToolCards() {

    $$("[data-tool]").forEach(
        card => {

            card.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const tool =
                        card.dataset.tool;

                    if (tool) {
                        openTool(tool);
                    }
                }
            );
        }
    );
}


/* =========================================================
   FILE INPUT
   ========================================================= */

function setupFileInput() {

    const input =
        $("#fileInput");

    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        async event => {

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

                selectedFiles =
                    files.filter(
                        file =>
                            file.type.startsWith(
                                "image/"
                            )
                    );

            } else {

                selectedFiles =
                    files.filter(
                        file =>
                            file.type ===
                                "application/pdf" ||
                            file.name
                                .toLowerCase()
                                .endsWith(".pdf")
                    );
            }


            renderSelectedFiles();


            if (
                currentTool === "splitPdf" &&
                selectedFiles.length
            ) {

                await showPageCount(
                    selectedFiles[0]
                );
            }


            input.value = "";
        }
    );
}


/* =========================================================
   SELECTED FILES
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


    container.innerHTML =
        selectedFiles.map(
            (file, index) => `

                <div class="selected-file">

                    <div class="selected-file-icon">
                        ${
                            file.type.startsWith(
                                "image/"
                            )
                                ? "🖼️"
                                : "📄"
                        }
                    </div>

                    <div class="selected-file-info">

                        <strong>
                            ${escapeHTML(
                                file.name
                            )}
                        </strong>

                        <span>
                            ${formatFileSize(
                                file.size
                            )}
                        </span>

                    </div>

                    <button
                        type="button"
                        class="remove-file"
                        data-index="${index}"
                        aria-label="Remove file"
                    >
                        ×
                    </button>

                </div>
            `
        ).join("");


    $$(".remove-file").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    if (
                        Number.isInteger(index)
                    ) {

                        selectedFiles.splice(
                            index,
                            1
                        );

                        renderSelectedFiles();
                    }
                }
            );
        }
    );
}


/* =========================================================
   IMAGE → PDF
========================================================= */

async function imageToPDF() {

    if (!selectedFiles.length) {

        throw new Error(
            "Please select at least one image"
        );
    }


    const jsPDF =
        await loadJsPDF();


    const pdf =
        new jsPDF({
            unit: "mm",
            format: "a4"
        });


    for (
        let i = 0;
        i < selectedFiles.length;
        i++
    ) {

        const file =
            selectedFiles[i];

        const dataURL =
            await readAsDataURL(file);

        const image =
            await loadImage(dataURL);


        const orientation =
            image.width >= image.height
                ? "landscape"
                : "portrait";


        if (i > 0) {

            pdf.addPage(
                "a4",
                orientation
            );

        } else {

            pdf.setPage(1);

            pdf.internal.pageSize =
                pdf.internal.getPageSize();

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
                maxWidth / image.width,
                maxHeight / image.height
            );


        const width =
            image.width * ratio;

        const height =
            image.height * ratio;


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
        `LeoPDF_${getDateName()}.pdf`;


    downloadBlob(
        blob,
        filename
    );


    saveRecentFile(
        filename,
        "Image → PDF",
        blob.size
    );
}


/* =========================================================
   PDF → IMAGE
========================================================= */

async function pdfToImage(file) {

    const pdfjs =
        await loadPDFJS();


    const buffer =
        await file.arrayBuffer();


    const pdf =
        await pdfjs.getDocument({
            data: buffer
        }).promise;


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


    const JSZip =
        await loadJSZip();


    const zip =
        new JSZip();


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
                scale: scale
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
            viewport:
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


        zip.file(
            filename,
            blob
        );
    }


    const zipBlob =
        await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
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
}


/* =========================================================
   MERGE PDF
========================================================= */

async function mergePDF(files) {

    if (files.length < 2) {

        throw new Error(
            "Select at least 2 PDF files"
        );
    }


    if (!window.PDFLib) {

        throw new Error(
            "PDF library is not loaded"
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
        `LeoPDF_Merged_${getDateName()}.pdf`;


    downloadBlob(
        blob,
        filename
    );


    saveRecentFile(
        filename,
        "Merge PDF",
        blob.size
    );
}


/* =========================================================
   SPLIT PDF
========================================================= */

async function splitPDF(file) {

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


    const source =
        await PDFDocument.load(
            bytes
        );


    const total =
        source.getPageCount();


    const input =
        $("#pageNumbers");


    const value =
        input
            ? input.value.trim()
            : "";


    const pages =
        parsePageRange(
            value,
            total
        );


    if (!pages.length) {

        throw new Error(
            `Enter valid pages from 1 to ${total}`
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
}


/* =========================================================
   COMPRESS PDF
========================================================= */

async function compressPDF(file) {

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


    const levelInput =
        $("#compressLevel");


    const level =
        levelInput
            ? levelInput.value
            : "normal";


    const output =
        await pdf.save({

            useObjectStreams:
                true,

            addDefaultPage:
                false,

            objectsPerTick:
                level === "high"
                    ? 100
                    : 50
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


    if (
        blob.size <
        originalSize
    ) {

        const percent =
            (
                (
                    (
                        originalSize -
                        blob.size
                    ) /
                    originalSize
                ) *
                100
            ).toFixed(1);


        showToast(
            `Compressed by ${percent}%`,
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
   PAGE RANGE
========================================================= */

function parsePageRange(
    value,
    maxPages
) {

    if (
        !Number.isInteger(maxPages) ||
        maxPages < 1
    ) {
        return [];
    }


    if (
        !value ||
        !value.trim()
    ) {

        return Array.from(
            {
                length:
                    maxPages
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
                part =>
                    part.trim()
            )
            .filter(Boolean);


    for (const part of parts) {

        if (part.includes("-")) {

            const range =
                part
                    .split("-")
                    .map(
                        Number
                    );


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
                Math.min(
                    range[0],
                    range[1]
                );


            let end =
                Math.max(
                    range[0],
                    range[1]
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

                result.add(i);
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
            (a, b) => a - b
        );
}


/* =========================================================
   PDF PAGE COUNT
========================================================= */

async function showPageCount(file) {

    try {

        if (!window.PDFLib) {
            return;
        }


        const bytes =
            await file.arrayBuffer();


        const pdf =
            await window.PDFLib.PDFDocument
                .load(bytes);


        const count =
            pdf.getPageCount();


        const input =
            $("#pageNumbers");


        if (input) {

            input.placeholder =
                `Example: 1-3 or 1,3,${count}`;
        }


        const splitOptions =
            $("#splitOptions");


        if (splitOptions) {

            const small =
                splitOptions.querySelector(
                    "small"
                );


            if (small) {

                small.textContent =
                    `This PDF has ${count} page(s).`;
            }
        }

    } catch (error) {

        console.error(
            "Page count error:",
            error
        );
    }
}


/* =========================================================
   PDF.JS
========================================================= */

async function loadPDFJS() {

    if (
        window.pdfjsLib &&
        window.pdfjsLib.getDocument
    ) {

        if (!pdfJsReady) {

            window.pdfjsLib
                .GlobalWorkerOptions
                .workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

            pdfJsReady = true;
        }

        return window.pdfjsLib;
    }


    throw new Error(
        "PDF.js library is not loaded"
    );
}


/* =========================================================
   JSZIP
========================================================= */

function loadJSZip() {

    if (window.JSZip) {
        return Promise.resolve(
            window.JSZip
        );
    }


    if (jsZipPromise) {
        return jsZipPromise;
    }


    jsZipPromise =
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
                                    "JSZip failed"
                                )
                            );
                        }
                    };


                script.onerror =
                    () => {

                        reject(
                            new Error(
                                "Could not load ZIP library"
                            )
                        );
                    };


                document.head.appendChild(
                    script
                );
            }
        );


    return jsZipPromise;
}


/* =========================================================
   JSPDF
========================================================= */

function loadJsPDF() {

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
        new Promise(
            (resolve, reject) => {

                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


                script.onload =
                    () => {

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
                                    "jsPDF failed to load"
                                )
                            );
                        }
                    };


                script.onerror =
                    () => {

                        reject(
                            new Error(
                                "Could not load jsPDF"
                            )
                        );
                    };


                document.head.appendChild(
                    script
                );
            }
        );


    return jsPdfPromise;
}


/* =========================================================
   FILE → DATA URL
========================================================= */

function readAsDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );
                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Could not read file"
                        )
                    );
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadImage(dataURL) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                () => {

                    resolve(image);
                };


            image.onerror =
                () => {

                    reject(
                        new Error(
                            "Invalid image"
                        )
                    );
                };


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
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.dataset.originalText =
            button.textContent;


        button.disabled =
            true;


        button.innerHTML = `
            <span
                style="
                    display:inline-block;
                    width:16px;
                    height:16px;
                    border:2px solid rgba(255,255,255,.35);
                    border-top-color:#ffffff;
                    border-radius:50%;
                    animation:leoPdfSpin .7s linear infinite;
                    vertical-align:middle;
                    margin-right:7px;
                "
            ></span>
            ${escapeHTML(
                text || "Processing..."
            )}
        `;

    } else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            "Done";


        delete button.dataset
            .originalText;
    }
}


/* =========================================================
   SPINNER CSS
========================================================= */

function addSpinnerCSS() {

    if (
        $("#leoPdfSpinnerCSS")
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "leoPdfSpinnerCSS";


    style.textContent = `
        @keyframes leoPdfSpin {
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
   MAIN TOOL ACTION
========================================================= */

async function executeTool() {

    const button =
        $("#modalActionButton");


    if (!currentTool) {
        return;
    }


    if (!selectedFiles.length) {

        showToast(
            "Please select a file",
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


    setButtonLoading(
        button,
        true,
        "Processing..."
    );


    try {

        switch (currentTool) {

            case "imageToPdf":

                await imageToPDF();

                showToast(
                    "PDF created successfully!",
                    "success"
                );

                break;


            case "pdfToImage":

                await pdfToImage(
                    selectedFiles[0]
                );

                showToast(
                    "Images created successfully!",
                    "success"
                );

                break;


            case "mergePdf":

                await mergePDF(
                    selectedFiles
                );

                showToast(
                    "PDFs merged successfully!",
                    "success"
                );

                break;


            case "splitPdf":

                await splitPDF(
                    selectedFiles[0]
                );

                showToast(
                    "PDF split successfully!",
                    "success"
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
   MODAL EVENTS
========================================================= */

function setupModal() {

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
            event => {

                event.preventDefault();

                closeToolModal();
            }
        );
    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            event => {

                event.preventDefault();

                closeToolModal();
            }
        );
    }


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
            executeTool
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
   HOME BUTTONS
========================================================= */

function setupHomeButtons() {

    const heroButton =
        $("#heroCreateButton");

    if (heroButton) {

        heroButton.addEventListener(
            "click",
            () => {

                openTool(
                    "imageToPdf"
                );
            }
        );
    }


    const filesButton =
        $("#openFilesButton");

    if (filesButton) {

        filesButton.addEventListener(
            "click",
            () => {

                showPage(
                    "filesPage"
                );
            }
        );
    }
}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const themeToggle =
        $("#darkModeToggle");

    const notificationToggle =
        $("#notificationToggle");

    const clearButton =
        $("#clearHistoryButton");


    /* -------------------------
       THEME
    ------------------------- */

    const savedTheme =
        localStorage.getItem(
            STORAGE.theme
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

        if (themeToggle) {
            themeToggle.checked =
                false;
        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );

        if (themeToggle) {
            themeToggle.checked =
                true;
        }
    }


    if (themeToggle) {

        themeToggle.addEventListener(
            "change",
            () => {

                const dark =
                    themeToggle.checked;


                document.body.classList.toggle(
                    "light-mode",
                    !dark
                );


                localStorage.setItem(
                    STORAGE.theme,
                    dark
                        ? "dark"
                        : "light"
                );
            }
        );
    }


    /* -------------------------
       NOTIFICATIONS
    ------------------------- */

    const savedNotifications =
        localStorage.getItem(
            STORAGE.notifications
        );


    if (notificationToggle) {

        notificationToggle.checked =
            savedNotifications !== "false";


        notificationToggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    STORAGE.notifications,
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


    /* -------------------------
       CLEAR HISTORY
    ------------------------- */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearHistory
        );
    }
}


/* =========================================================
   NOTIFICATION BUTTON
========================================================= */

function setupNotification() {

    const button =
        $("#notificationButton");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            showToast(
                "You're all caught up!",
                "success"
            );
        }
    );
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
        }
    );


    modal.addEventListener(
        "drop",
        async event => {

            event.preventDefault();


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

                selectedFiles =
                    files.filter(
                        file =>
                            file.type.startsWith(
                                "image/"
                            )
                    );

            } else {

                selectedFiles =
                    files.filter(
                        file =>
                            file.type ===
                                "application/pdf" ||
                            file.name
                                .toLowerCase()
                                .endsWith(".pdf")
                    );


                if (
                    currentTool !==
                    "mergePdf"
                ) {

                    selectedFiles =
                        selectedFiles.slice(
                            0,
                            1
                        );
                }
            }


            renderSelectedFiles();


            if (
                currentTool === "splitPdf" &&
                selectedFiles.length
            ) {

                await showPageCount(
                    selectedFiles[0]
                );
            }
        }
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
            event.error ||
            event.message
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
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "LeoPDF starting..."
        );


        addSpinnerCSS();


        setupSplash();


        setupNavigation();


        setupToolCards();


        setupFileInput();


        setupModal();


        setupHomeButtons();


        setupSettings();


        setupNotification();


        setupDragDrop();


        renderRecentFiles();


        console.log(
            "LeoPDF ready — Convert. Compress. Simplify."
        );
    }
);
