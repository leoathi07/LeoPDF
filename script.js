/* =========================================================
   LeoPDF — COMPLETE SCRIPT.JS
   Convert. Compress. Simplify.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const LOGO_FILE =
    "file_00000000db748208ae0361855c0a94b9";

const STORAGE_KEYS = {
    recentFiles: "leopdf_recent_files",
    theme: "leopdf_theme"
};

let currentTool = null;
let selectedImages = [];
let genericFiles = [];

let pdfJsPromise = null;
let jsZipPromise = null;
let toastTimer = null;


/* =========================================================
   DOM HELPERS
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

    toast.className = "toast show";

    if (icon) {
        icon.textContent =
            type === "error" ? "!" :
            type === "success" ? "✓" :
            "i";
    }

    const textElement =
        toast.querySelector(".toast-message");

    if (textElement) {
        textElement.textContent = message;
    } else {
        toast.textContent = message;
    }

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
   DOWNLOAD
========================================================= */

function downloadBlob(blob, filename) {

    if (!blob) {
        showToast("Nothing to download", "error");
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

        console.error(
            "Download error:",
            error
        );

        showToast(
            "Download failed",
            "error"
        );
    }
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
            Math.log(bytes) /
            Math.log(1024)
        ),
        units.length - 1
    );

    const value =
        bytes /
        Math.pow(1024, index);

    return `${value.toFixed(
        index === 0 ? 0 : 2
    )} ${units[index]}`;
}


/* =========================================================
   DATE
========================================================= */

function formatDateForFilename(date) {

    const pad = number =>
        String(number).padStart(2, "0");

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-");
}


/* =========================================================
   REMOVE EXTENSION
========================================================= */

function removeExtension(filename) {

    return String(filename)
        .replace(/\.[^/.]+$/, "");
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
    type = "PDF",
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
                unique.some(item =>
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

    } catch (error) {

        console.error(
            "Recent file save error:",
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

        showToast(
            "Recent files cleared",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Could not clear recent files",
            "error"
        );
    }
}


function renderRecentFiles() {

    const containers = [
        $("#recentFiles"),
        $("#filesList"),
        $(".files-list")
    ].filter(Boolean);

    if (!containers.length) {
        return;
    }

    const files =
        getRecentFiles();

    containers.forEach(container => {

        if (!files.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📄</div>
                    <h4>No Recent Files</h4>
                    <p>
                        Your converted files
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

                const validDate =
                    !Number.isNaN(
                        date.getTime()
                    );

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

                        <div class="recent-file-type">
                            ${
                                validDate
                                    ? date.toLocaleDateString()
                                    : "PDF"
                            }
                        </div>

                    </div>
                `;

            }).join("");
    });
}


/* =========================================================
   SPLASH
========================================================= */

function setupSplash() {

    const splash =
        $(".splash-screen");

    const logo =
        $("#splashLogo");

    const fallback =
        $("#logoFallback");

    const headerLogos =
        $(
            ".small-logo"
        );

    if (logo) {

        if (
            !logo.getAttribute("src") ||
            logo.getAttribute("src") !== LOGO_FILE
        ) {
            logo.src = LOGO_FILE;
        }

        logo.addEventListener(
            "load",
            () => {

                logo.style.display =
                    "block";

                if (fallback) {
                    fallback.style.display =
                        "none";
                }
            },
            { once: true }
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
            },
            { once: true }
        );

        if (
            logo.complete &&
            logo.naturalWidth > 0
        ) {

            logo.style.display =
                "block";

            if (fallback) {
                fallback.style.display =
                    "none";
            }
        }
    }

    headerLogos.forEach(headerLogo => {

        if (
            !headerLogo.getAttribute("src")
        ) {
            headerLogo.src =
                LOGO_FILE;
        }
    });

    setTimeout(() => {

        if (!splash) {
            return;
        }

        splash.classList.add("hide");

        setTimeout(() => {

            splash.style.display =
                "none";

            const app =
                $(".app");

            if (app) {
                app.style.display =
                    "block";
            }

        }, 550);

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

    Object.entries(pages).forEach(
        ([name, page]) => {

            if (!page) {
                return;
            }

            page.classList.toggle(
                "active-page",
                name === pageName
            );
        }
    );

    $$(".nav-item, .bottom-nav-item")
        .forEach(item => {

            const target =
                item.dataset.page ||
                item.dataset.nav;

            item.classList.toggle(
                "active",
                target === pageName
            );
        });

    if (
        pageName === "files"
    ) {
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

    $$(".nav-item, .bottom-nav-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const page =
                        item.dataset.page ||
                        item.dataset.nav;

                    if (page) {
                        showPage(page);
                    }
                }
            );
        });

    showPage("home");
}


/* =========================================================
   IMAGE PDF MODAL
========================================================= */

function openImagePDFModal() {

    const modal =
        $("#imagePdfModal");

    if (!modal) {
        showToast(
            "Image to PDF window not found",
            "error"
        );
        return;
    }

    currentTool = "image-pdf";

    selectedImages = [];

    const input =
        $("#imageInput");

    if (input) {
        input.value = "";
    }

    renderSelectedImages();

    openModal(modal);
}


function closeImagePDFModal() {

    const modal =
        $("#imagePdfModal");

    if (modal) {
        closeModal(modal);
    }

    selectedImages = [];

    const input =
        $("#imageInput");

    if (input) {
        input.value = "";
    }

    if (currentTool === "image-pdf") {
        currentTool = null;
    }
}


/* =========================================================
   GENERIC MODAL
========================================================= */

function openGenericModal(tool) {

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
    genericFiles = [];

    const config =
        getToolConfig(tool);

    const title =
        $("#toolModalTitle");

    const description =
        $("#toolModalDescription");

    const input =
        $("#genericFileInput");

    const options =
        $("#genericOptions");

    const action =
        $("#genericActionButton");

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
            config.accept || "";

        input.multiple =
            Boolean(config.multiple);

        input.style.display =
            config.hideInput
                ? "none"
                : "";
    }

    if (options) {
        options.innerHTML =
            config.options || "";
    }

    if (action) {

        action.textContent =
            config.action;

        action.style.display =
            config.hideAction
                ? "none"
                : "";
    }

    renderGenericFiles();

    openModal(modal);
}


function closeGenericModal() {

    const modal =
        $("#toolModal");

    if (modal) {
        closeModal(modal);
    }

    genericFiles = [];

    currentTool = null;

    const input =
        $("#genericFileInput");

    if (input) {
        input.value = "";
    }
}


/* =========================================================
   MODAL HELPERS
========================================================= */

function openModal(modal) {

    modal.classList.add("show");

    /* Compatibility with older HTML */
    modal.classList.add("active");

    document.body.style.overflow =
        "hidden";
}


function closeModal(modal) {

    modal.classList.remove("show");

    modal.classList.remove("active");

    if (
        !document.querySelector(
            ".modal.show, .modal.active"
        )
    ) {
        document.body.style.overflow =
            "";
    }
}


/* =========================================================
   TOOL CONFIG
========================================================= */

function getToolConfig(tool) {

    const configs = {

        "pdf-image": {

            title: "PDF → Image",

            description:
                "Convert PDF pages into high-quality images.",

            accept:
                ".pdf,application/pdf",

            multiple: false,

            action:
                "Convert to Images",

            options: `

                <div class="file-options">

                    <label>
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

                    <label>
                        Image Format
                    </label>

                    <select
                        id="pdfImageFormat"
                        class="file-option"
                    >
                        <option value="png">
                            PNG
                        </option>

                        <option value="jpeg">
                            JPG
                        </option>
                    </select>

                    <label>
                        Quality
                    </label>

                    <select
                        id="pdfImageScale"
                        class="file-option"
                    >
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


        "merge": {

            title:
                "Merge PDF",

            description:
                "Combine multiple PDF files into one PDF.",

            accept:
                ".pdf,application/pdf",

            multiple: true,

            action:
                "Merge PDFs",

            options: `

                <div class="file-options">

                    <small>
                        Select 2 or more PDF files.
                    </small>

                </div>
            `
        },


        "split": {

            title:
                "Split PDF",

            description:
                "Extract selected pages into a new PDF.",

            accept:
                ".pdf,application/pdf",

            multiple: false,

            action:
                "Split PDF",

            options: `

                <div class="split-options show">

                    <label
                        for="splitPageRange"
                    >
                        Pages
                    </label>

                    <input
                        id="splitPageRange"
                        type="text"
                        placeholder="Example: 1-3 or 1,4,6"
                    >

                    <small>
                        Example:
                        1-3 extracts pages
                        1, 2 and 3.
                    </small>

                </div>
            `
        },


        "compress": {

            title:
                "Compress PDF",

            description:
                "Optimize and re-save your PDF to reduce unnecessary data.",

            accept:
                ".pdf,application/pdf",

            multiple: false,

            action:
                "Compress PDF",

            options: `

                <div class="file-options">

                    <label>
                        Compression Level
                    </label>

                    <select
                        id="compressLevel"
                        class="file-option"
                    >

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
            `
        },


        "info": {

            title:
                "LeoPDF Tools",

            description:
                "Convert. Compress. Simplify.",

            accept: "",

            multiple: false,

            action:
                "Close",

            hideInput: true,

            options: `

                <div class="about-card">

                    <div
                        style="
                            font-size:48px;
                            margin-bottom:12px;
                        "
                    >
                        📄
                    </div>

                    <h3>
                        LeoPDF
                    </h3>

                    <p>
                        Convert. Compress. Simplify.
                    </p>

                    <span>
                        All processing happens
                        locally in your browser.
                    </span>

                </div>
            `
        }

    };

    return configs[tool] ||
        configs.info;
}


/* =========================================================
   TOOL CARDS
========================================================= */

function setupToolCards() {

    $$("[data-tool]")
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const tool =
                        card.dataset.tool;

                    if (!tool) {
                        return;
                    }

                    if (
                        tool === "image-pdf"
                    ) {

                        openImagePDFModal();

                    } else {

                        openGenericModal(
                            tool
                        );
                    }
                }
            );
        });
}


/* =========================================================
   IMAGE INPUT
========================================================= */

function setupImageInput() {

    const input =
        $("#imageInput");

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

            const valid =
                files.filter(
                    file =>
                        file.type.startsWith(
                            "image/"
                        )
                );

            if (!valid.length) {

                showToast(
                    "Please select image files",
                    "error"
                );

                return;
            }

            selectedImages.push(
                ...valid
            );

            renderSelectedImages();

            input.value = "";
        }
    );
}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function renderSelectedImages() {

    const container =
        $("#selectedImages");

    if (!container) {
        return;
    }

    if (!selectedImages.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🖼️
                </div>

                <p>
                    Select images to create your PDF.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = "";

    selectedImages.forEach(
        (file, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "selected-file";

            const icon =
                document.createElement(
                    "div"
                );

            icon.className =
                "selected-file-icon";

            icon.textContent =
                "🖼️";

            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "selected-file-name";

            name.textContent =
                file.name;

            const remove =
                document.createElement(
                    "button"
                );

            remove.type = "button";

            remove.className =
                "modal-close";

            remove.style.position =
                "static";

            remove.style.width =
                "30px";

            remove.style.height =
                "30px";

            remove.textContent =
                "×";

            remove.addEventListener(
                "click",
                () => {

                    selectedImages.splice(
                        index,
                        1
                    );

                    renderSelectedImages();
                }
            );

            wrapper.appendChild(icon);
            wrapper.appendChild(name);
            wrapper.appendChild(remove);

            container.appendChild(
                wrapper
            );
        }
    );
}


/* =========================================================
   CREATE IMAGE PDF
========================================================= */

async function createImagePDF() {

    if (!selectedImages.length) {

        showToast(
            "Please select at least one image",
            "error"
        );

        return;
    }

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        showToast(
            "jsPDF library is not loaded",
            "error"
        );

        return;
    }

    const button =
        $("#createPdfButton");

    setButtonLoading(
        button,
        true,
        "Creating..."
    );

    try {

        const {
            jsPDF
        } = window.jspdf;

        let pdf = null;

        for (
            let i = 0;
            i < selectedImages.length;
            i++
        ) {

            const file =
                selectedImages[i];

            const dataUrl =
                await readFileAsDataURL(
                    file
                );

            const info =
                await getImageInfo(
                    dataUrl
                );

            const orientation =
                info.width >= info.height
                    ? "landscape"
                    : "portrait";

            if (!pdf) {

                pdf = new jsPDF({
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
                dataUrl,
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

        closeImagePDFModal();

    } catch (error) {

        console.error(
            "Image → PDF:",
            error
        );

        showToast(
            error.message ||
            "Failed to create PDF",
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
   GENERIC INPUT
========================================================= */

function setupGenericInput() {

    const input =
        $("#genericFileInput");

    if (!input) {
        return;
    }

    input.addEventListener(
        "change",
        async event => {

            genericFiles =
                Array.from(
                    event.target.files || []
                );

            renderGenericFiles();

            if (
                currentTool === "split" &&
                genericFiles.length
            ) {

                await updateSplitPageCount(
                    genericFiles[0]
                );
            }
        }
    );
}


/* =========================================================
   GENERIC FILE LIST
========================================================= */

function renderGenericFiles() {

    const container =
        $("#genericFileList");

    if (!container) {
        return;
    }

    if (!genericFiles.length) {

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
        genericFiles.map(
            (file, index) => `

                <div class="selected-file">

                    <div
                        class="selected-file-icon"
                    >
                        📄
                    </div>

                    <div
                        class="selected-file-name"
                    >
                        ${escapeHTML(
                            file.name
                        )}
                    </div>

                    <span>
                        ${formatFileSize(
                            file.size
                        )}
                    </span>

                    <button
                        type="button"
                        class="modal-close remove-generic-file"
                        data-index="${index}"
                        style="
                            position:static;
                            width:30px;
                            height:30px;
                        "
                    >
                        ×
                    </button>

                </div>
            `
        ).join("");

    $$(".remove-generic-file")
        .forEach(button => {

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

                        genericFiles.splice(
                            index,
                            1
                        );

                        renderGenericFiles();
                    }
                }
            );
        });
}


/* =========================================================
   RUN GENERIC TOOL
========================================================= */

async function runGenericTool() {

    if (currentTool === "info") {

        closeGenericModal();

        return;
    }

    if (!genericFiles.length) {

        showToast(
            "Please select a file",
            "error"
        );

        return;
    }

    const button =
        $("#genericActionButton");

    setButtonLoading(
        button,
        true,
        "Processing..."
    );

    try {

        switch (currentTool) {

            case "pdf-image":

                await convertPDFToImages(
                    genericFiles[0]
                );

                break;

            case "merge":

                await mergePDFs(
                    genericFiles
                );

                break;

            case "split":

                await splitPDF(
                    genericFiles[0]
                );

                break;

            case "compress":

                await compressPDF(
                    genericFiles[0]
                );

                break;

            default:

                throw new Error(
                    "Unknown PDF tool"
                );
        }

    } catch (error) {

        console.error(
            "Generic tool error:",
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
   LOAD PDF.JS
========================================================= */

async function getPDFJS() {

    if (
        window.pdfjsLib &&
        window.pdfjsLib.getDocument
    ) {
        return window.pdfjsLib;
    }

    if (pdfJsPromise) {
        return pdfJsPromise;
    }

    pdfJsPromise =
        import(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
        )
        .then(module => {

            const pdfjs =
                module;

            if (
                pdfjs.GlobalWorkerOptions
            ) {

                pdfjs.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
            }

            return pdfjs;
        })
        .catch(error => {

            pdfJsPromise = null;

            throw new Error(
                "PDF.js could not be loaded"
            );
        });

    return pdfJsPromise;
}


/* =========================================================
   PDF → IMAGE
========================================================= */

async function convertPDFToImages(file) {

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
              ) || 1.5
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
    } catch {
        JSZip = null;
    }

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

        imageFiles.push({
            blob,
            filename
        });

        if (JSZip) {
            JSZip.file(
                filename,
                blob
            );
        }
    }

    if (JSZip) {

        const zipBlob =
            await JSZip.generateAsync({
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

        for (
            let i = 0;
            i < imageFiles.length;
            i++
        ) {

            downloadBlob(
                imageFiles[i].blob,
                imageFiles[i].filename
            );

            await sleep(180);
        }

        if (imageFiles.length) {

            saveRecentFile(
                imageFiles[0].filename,
                "PDF → Image",
                imageFiles[0].blob.size
            );
        }
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

        throw new Error(
            "pdf-lib library is not loaded"
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

    for (const file of files) {

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

        pages.forEach(page => {
            mergedPdf.addPage(page);
        });
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

    closeGenericModal();
}


/* =========================================================
   SPLIT PDF
========================================================= */

async function splitPDF(file) {

    if (!window.PDFLib) {

        throw new Error(
            "pdf-lib library is not loaded"
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

    const rangeInput =
        $("#splitPageRange");

    const range =
        rangeInput
            ? rangeInput.value.trim()
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
                page => page - 1
            )
        );

    copiedPages.forEach(page => {
        newPdf.addPage(page);
    });

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

    closeGenericModal();
}


/* =========================================================
   COMPRESS PDF
========================================================= */

async function compressPDF(file) {

    if (!window.PDFLib) {

        throw new Error(
            "pdf-lib library is not loaded"
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

    if (newSize < originalSize) {

        const percent =
            (
                (
                    (originalSize - newSize) /
                    originalSize
                ) * 100
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

    closeGenericModal();
}


/* =========================================================
   PAGE RANGE PARSER
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

            const values =
                part
                    .split("-")
                    .map(
                        value =>
                            Number(
                                value.trim()
                            )
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
                Number(
                    part
                );

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
            (a, b) =>
                a - b
        );
}


/* =========================================================
   SPLIT PAGE COUNT
========================================================= */

async function updateSplitPageCount(
    file
) {

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
            $("#splitPageRange");

        if (input) {

            input.placeholder =
                `1-${count} or 1,3,${count}`;

            const small =
                input.parentElement
                    ?.querySelector("small");

            if (small) {

                small.textContent =
                    `This PDF has ${count} page(s).`;
            }
        }

    } catch (error) {

        console.error(
            "PDF page count error:",
            error
        );
    }
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
                                    "JSZip failed to load"
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
   FILE READER
========================================================= */

function readFileAsDataURL(
    file
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () =>
                    resolve(
                        reader.result
                    );

            reader.onerror =
                () =>
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
   IMAGE INFORMATION
========================================================= */

function getImageInfo(
    dataUrl
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
                () =>
                    reject(
                        new Error(
                            "Invalid image"
                        )
                    );

            image.src =
                dataUrl;
        }
    );
}


/* =========================================================
   CANVAS → BLOB
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
   SLEEP
========================================================= */

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

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
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
                    border:2px solid rgba(255,255,255,.35);
                    border-top-color:white;
                    border-radius:50%;
                    animation:
                        leoSpin .7s linear infinite;
                    vertical-align:middle;
                    margin-right:7px;
                "
            ></span>
            ${escapeHTML(text)}
        `;

    } else {

        button.disabled =
            false;

        if (
            button.dataset.originalText
        ) {

            button.textContent =
                button.dataset.originalText;

            delete button.dataset
                .originalText;
        }
    }
}


/* =========================================================
   BUTTON SPINNER
========================================================= */

(function addSpinnerAnimation() {

    if (
        document.getElementById(
            "leo-pdf-spinner-style"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "leo-pdf-spinner-style";

    style.textContent = `
        @keyframes leoSpin {
            to {
                transform: rotate(360deg);
            }
        }
    `;

    document.head.appendChild(
        style
    );

})();


/* =========================================================
   MODAL EVENTS
========================================================= */

function setupModalEvents() {

    const imageModal =
        $("#imagePdfModal");

    const genericModal =
        $("#toolModal");

    $(
        ".modal-close:not(#genericActionButton), " +
        ".close-modal, " +
        "[data-close-modal]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                if (
                    imageModal &&
                    (
                        imageModal.classList.contains(
                            "show"
                        ) ||
                        imageModal.classList.contains(
                            "active"
                        )
                    )
                ) {
                    closeImagePDFModal();
                }

                if (
                    genericModal &&
                    (
                        genericModal.classList.contains(
                            "show"
                        ) ||
                        genericModal.classList.contains(
                            "active"
                        )
                    )
                ) {
                    closeGenericModal();
                }
            }
        );
    });

    [
        imageModal,
        genericModal
    ]
    .filter(Boolean)
    .forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal ||
                    event.target.classList.contains(
                        "modal-overlay"
                    )
                ) {

                    if (
                        modal === imageModal
                    ) {

                        closeImagePDFModal();

                    } else {

                        closeGenericModal();
                    }
                }
            }
        );
    });

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
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

    const createPdfButton =
        $("#createPdfButton");

    if (createPdfButton) {

        createPdfButton.addEventListener(
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


    const clearRecentButton =
        $("#clearRecentButton");

    if (clearRecentButton) {

        clearRecentButton.addEventListener(
            "click",
            clearRecentFiles
        );
    }


    $$("[data-open-image-picker]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const input =
                        $("#imageInput");

                    if (input) {
                        input.click();
                    }
                }
            );
        });


    $$("[data-open-generic-picker]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const input =
                        $("#genericFileInput");

                    if (input) {
                        input.click();
                    }
                }
            );
        });
}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const themeToggle =
        $("#themeToggle");

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

        if (themeToggle) {
            themeToggle.checked =
                true;
        }
    }


    if (!themeToggle) {
        return;
    }

    themeToggle.addEventListener(
        "change",
        () => {

            const light =
                themeToggle.checked;

            document.body.classList.toggle(
                "light-mode",
                light
            );

            localStorage.setItem(
                STORAGE_KEYS.theme,
                light
                    ? "light"
                    : "dark"
            );
        }
    );
}


/* =========================================================
   DEDUPLICATE CARDS
========================================================= */

function removeDuplicateToolCards() {

    $$(".tools-grid")
        .forEach(grid => {

            const seen =
                new Set();

            Array.from(
                grid.querySelectorAll(
                    "[data-tool]"
                )
            ).forEach(card => {

                const tool =
                    card.dataset.tool;

                if (!tool) {
                    return;
                }

                if (
                    seen.has(tool)
                ) {

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

    const imageModal =
        $("#imagePdfModal");

    const genericModal =
        $("#toolModal");


    if (imageModal) {

        setupDropZone(
            imageModal,
            "image"
        );
    }


    if (genericModal) {

        setupDropZone(
            genericModal,
            "pdf"
        );
    }
}


function setupDropZone(
    zone,
    type
) {

    zone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            zone.classList.add(
                "dragging"
            );
        }
    );


    zone.addEventListener(
        "dragleave",
        event => {

            if (
                event.target === zone
            ) {

                zone.classList.remove(
                    "dragging"
                );
            }
        }
    );


    zone.addEventListener(
        "drop",
        async event => {

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
                type === "image"
            ) {

                const images =
                    files.filter(
                        file =>
                            file.type.startsWith(
                                "image/"
                            )
                    );

                if (!images.length) {

                    showToast(
                        "Drop image files only",
                        "error"
                    );

                    return;
                }

                selectedImages.push(
                    ...images
                );

                renderSelectedImages();

            } else {

                const pdfs =
                    files.filter(
                        file =>
                            file.type ===
                            "application/pdf" ||
                            file.name
                                .toLowerCase()
                                .endsWith(
                                    ".pdf"
                                )
                    );

                if (!pdfs.length) {

                    showToast(
                        "Drop PDF files only",
                        "error"
                    );

                    return;
                }

                genericFiles =
                    currentTool === "merge"
                        ? pdfs
                        : [pdfs[0]];

                renderGenericFiles();

                if (
                    currentTool === "split" &&
                    genericFiles.length
                ) {

                    await updateSplitPageCount(
                        genericFiles[0]
                    );
                }
            }
        }
    );
}


/* =========================================================
   LOGO FALLBACK
========================================================= */

function setupLogoFallback() {

    const logo =
        $("#splashLogo");

    const fallback =
        $("#logoFallback");

    if (!logo) {
        return;
    }

    logo.onerror =
        () => {

            logo.style.display =
                "none";

            if (fallback) {

                fallback.style.display =
                    "flex";
            }
        };

    logo.onload =
        () => {

            logo.style.display =
                "block";

            if (fallback) {

                fallback.style.display =
                    "none";
            }
        };
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
            "LeoPDF initializing..."
        );

        setupSplash();

        setupLogoFallback();

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
            "LeoPDF ready."
        );
    }
);
