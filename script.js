/* =========================================================
   LeoPDF — COMPLETE SCRIPT.JS
   Convert. Compress. Simplify.
   FINAL FIXED VERSION
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
let genericFiles = [];
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
    const messageBox = $("#toastMessage");

    if (messageBox) {
        messageBox.textContent = message;
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
        link.style.display = "none";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

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

    const value =
        bytes / Math.pow(1024, index);

    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
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
   RECENT FILES
   ========================================================= */

function getRecentFiles() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE_KEYS.recentFiles
            ) || "[]"
        );

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
            "Save recent file error:",
            error
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
                        ${
                            isNaN(date.getTime())
                                ? ""
                                : date.toLocaleDateString()
                        }
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
                <p>Your converted PDF files will appear here.</p>
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
                        ${
                            isNaN(date.getTime())
                                ? ""
                                : date.toLocaleDateString()
                        }
                    </div>

                </div>
            `;

        }).join("");
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
        "Recent files cleared",
        "success"
    );
}


/* =========================================================
   SPLASH SCREEN
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


    /* -----------------------------------------------------
       LOGO
       ----------------------------------------------------- */

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

                console.warn(
                    "Splash logo could not be loaded."
                );

                logo.style.display =
                    "none";

                if (fallback) {
                    fallback.style.display =
                        "flex";
                }
            }
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


    /* -----------------------------------------------------
       IMPORTANT APP FIX
       ----------------------------------------------------- */

    if (app) {

        /*
         * CSS has:
         * .app { display:none; }
         *
         * We keep it hidden until splash finishes.
         */
        app.style.display = "none";
    }


    /* -----------------------------------------------------
       SPLASH END
       ----------------------------------------------------- */

    setTimeout(() => {

        if (splash) {
            splash.classList.add("hide");
        }

        setTimeout(() => {

            if (splash) {
                splash.style.display =
                    "none";
            }

            /*
             * THIS FIXES THE BLACK SCREEN
             */
            if (app) {

                app.style.display =
                    "block";

                app.classList.add(
                    "app-ready"
                );
            }

            showPage("homePage");

        }, 550);

    }, 2200);
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {

    const pages = $$(".page");

    pages.forEach(page => {

        page.classList.remove(
            "active-page"
        );

        page.style.display = "none";
    });


    const selectedPage =
        document.getElementById(pageId);

    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

        selectedPage.style.display =
            "block";
    }


    /* -----------------------------------------------------
       BOTTOM NAV ACTIVE
       ----------------------------------------------------- */

    $$(".bottom-nav-item").forEach(item => {

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
   NAVIGATION EVENTS
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

                    if (!page) {
                        return;
                    }

                    showPage(page);
                }
            );
        }
    );


    /*
     * IMPORTANT:
     * Do NOT use "home".
     * HTML uses "homePage".
     */
}


/* =========================================================
   TOOL CONFIG
   ========================================================= */

function getToolConfig(tool) {

    const configs = {

        imageToPdf: {

            title: "Image → PDF",

            description:
                "Convert multiple images into one PDF file.",

            accept:
                "image/*",

            multiple:
                true,

            action:
                "Create PDF",

            icon:
                "🖼️"
        },


        pdfToImage: {

            title: "PDF → Image",

            description:
                "Convert PDF pages into high-quality images.",

            accept:
                ".pdf,application/pdf",

            multiple:
                false,

            action:
                "Convert to Images",

            icon:
                "🖼️"
        },


        mergePdf: {

            title: "Merge PDF",

            description:
                "Combine multiple PDF files into one PDF.",

            accept:
                ".pdf,application/pdf",

            multiple:
                true,

            action:
                "Merge PDFs",

            icon:
                "🔗"
        },


        splitPdf: {

            title: "Split PDF",

            description:
                "Extract selected pages into a new PDF.",

            accept:
                ".pdf,application/pdf",

            multiple:
                false,

            action:
                "Split PDF",

            icon:
                "✂️"
        },


        compressPdf: {

            title: "Compress PDF",

            description:
                "Optimize and re-save your PDF.",

            accept:
                ".pdf,application/pdf",

            multiple:
                false,

            action:
                "Compress PDF",

            icon:
                "📦"
        }

    };

    return configs[tool] || null;
}


/* =========================================================
   TOOL MODAL
   ========================================================= */

function openToolModal(tool) {

    const config =
        getToolConfig(tool);

    if (!config) {

        showToast(
            "Tool not available",
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
    genericFiles = [];


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

    const selectedFiles =
        $("#selectedFiles");

    const splitOptions =
        $("#splitOptions");

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


    /* -----------------------------------------------------
       OPTIONS
       ----------------------------------------------------- */

    if (options) {

        options.innerHTML = "";
    }

    if (splitOptions) {

        splitOptions.classList.remove(
            "show"
        );

        splitOptions.innerHTML = "";
    }


    if (tool === "pdfToImage") {

        if (options) {

            options.innerHTML = `
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


    if (tool === "splitPdf") {

        if (splitOptions) {

            splitOptions.classList.add(
                "show"
            );

            splitOptions.innerHTML = `
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
            `;
        }
    }


    if (tool === "compressPdf") {

        if (options) {

            options.innerHTML = `
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
                        Actual size reduction depends on
                        the original PDF.
                    </small>

                </div>
            `;
        }
    }


    if (selectedFiles) {

        selectedFiles.innerHTML = `
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


    if (action) {

        action.textContent =
            config.action;

        action.disabled = false;
    }


    modal.classList.add(
        "show"
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
    }

    currentTool = null;
    genericFiles = [];

    const input =
        $("#fileInput");

    if (input) {
        input.value = "";
    }
}


/* =========================================================
   TOOL CARD EVENTS
   ========================================================= */

function setupToolCards() {

    $$("[data-tool]").forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const tool =
                        card.dataset.tool;

                    if (!tool) {
                        return;
                    }

                    openToolModal(tool);
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
        event => {

            const files =
                Array.from(
                    event.target.files || []
                );

            if (!files.length) {
                return;
            }

            handleSelectedFiles(files);

            input.value = "";
        }
    );
}


/* =========================================================
   HANDLE SELECTED FILES
   ========================================================= */

function handleSelectedFiles(files) {

    if (!currentTool) {
        return;
    }


    if (currentTool === "imageToPdf") {

        const images =
            files.filter(
                file =>
                    file.type.startsWith(
                        "image/"
                    )
            );

        if (!images.length) {

            showToast(
                "Please select image files",
                "error"
            );

            return;
        }

        genericFiles.push(
            ...images
        );

    } else {

        const pdfs =
            files.filter(
                file =>
                    file.type === "application/pdf" ||
                    file.name
                        .toLowerCase()
                        .endsWith(".pdf")
            );

        if (!pdfs.length) {

            showToast(
                "Please select PDF files",
                "error"
            );

            return;
        }

        if (currentTool === "mergePdf") {

            genericFiles.push(
                ...pdfs
            );

        } else {

            genericFiles =
                [pdfs[0]];
        }
    }


    renderSelectedFiles();
}


/* =========================================================
   SELECTED FILES UI
   ========================================================= */

function renderSelectedFiles() {

    const container =
        $("#selectedFiles");

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
                            class="remove-selected-file"
                            data-index="${index}">
                            ×
                        </button>

                    </div>
                `;
            }
        ).join("");


    $$(".remove-selected-file")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    genericFiles.splice(
                        index,
                        1
                    );

                    renderSelectedFiles();
                }
            );
        });
}


/* =========================================================
   IMAGE → PDF
   ========================================================= */

async function createImagePDF() {

    if (!genericFiles.length) {

        showToast(
            "Please select at least one image",
            "error"
        );

        return;
    }


    const images =
        genericFiles.filter(
            file =>
                file.type.startsWith("image/")
        );

    if (!images.length) {

        showToast(
            "Please select image files",
            "error"
        );

        return;
    }


    const jsPDF =
        await getJsPDF();


    const button =
        $("#modalActionButton");

    setButtonLoading(
        button,
        true,
        "Creating..."
    );


    try {

        let pdf = null;


        for (
            let i = 0;
            i < images.length;
            i++
        ) {

            const file =
                images[i];

            const dataUrl =
                await readFileAsDataURL(file);

            const info =
                await getImageInfo(dataUrl);


            const orientation =
                info.width > info.height
                    ? "landscape"
                    : "portrait";


            if (!pdf) {

                pdf =
                    new jsPDF({
                        orientation:
                            orientation,
                        unit:
                            "mm",
                        format:
                            "a4"
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
                    maxWidth /
                        info.width,

                    maxHeight /
                        info.height
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
                file.type ===
                "image/png"
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

    } catch (error) {

        console.error(
            "Image to PDF error:",
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
   PDF.JS
   ========================================================= */

async function getPDFJS() {

    if (window.pdfjsLib) {

        if (
            window.pdfjsLib
                .GlobalWorkerOptions
        ) {

            window.pdfjsLib
                .GlobalWorkerOptions
                .workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }

        return window.pdfjsLib;
    }


    if (!pdfJsPromise) {

        pdfJsPromise =
            new Promise(
                (resolve, reject) => {

                    const script =
                        document.createElement(
                            "script"
                        );

                    script.src =
                        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

                    script.onload =
                        () => {

                            if (
                                window.pdfjsLib
                            ) {

                                window.pdfjsLib
                                    .GlobalWorkerOptions
                                    .workerSrc =
                                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

                                resolve(
                                    window.pdfjsLib
                                );

                            } else {

                                reject(
                                    new Error(
                                        "PDF.js failed to load"
                                    )
                                );
                            }
                        };

                    script.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Could not load PDF.js"
                                )
                            );
                        };

                    document.head.appendChild(
                        script
                    );
                }
            );
    }


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
            "ZIP library unavailable:",
            error
        );
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


        imageFiles.push({
            blob,
            filename
        });
    }


    if (JSZip) {

        const zip =
            new JSZip();


        imageFiles.forEach(
            image => {

                zip.file(
                    image.filename,
                    image.blob
                );
            }
        );


        const zipBlob =
            await zip.generateAsync({
                type:
                    "blob",

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
            const image
            of imageFiles
        ) {

            downloadBlob(
                image.blob,
                image.filename
            );

            await sleep(150);
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


    closeToolModal();
}


/* =========================================================
   MERGE PDF
   ========================================================= */

async function mergePDFs(files) {

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
        const file
        of files
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


    closeToolModal();
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


    const sourcePdf =
        await PDFDocument.load(
            bytes
        );


    const totalPages =
        sourcePdf.getPageCount();


    const rangeInput =
        $("#pageNumbers");


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


    closeToolModal();
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


    if (newSize < originalSize) {

        const percent =
            (
                (
                    (originalSize - newSize) /
                    originalSize
                ) * 100
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


    closeToolModal();
}


/* =========================================================
   GENERIC TOOL ACTION
   ========================================================= */

async function runCurrentTool() {

    if (!currentTool) {
        return;
    }


    if (!genericFiles.length) {

        showToast(
            "Please select a file",
            "error"
        );

        return;
    }


    if (
        currentTool ===
        "mergePdf" &&
        genericFiles.length < 2
    ) {

        showToast(
            "Select at least 2 PDF files",
            "error"
        );

        return;
    }


    const button =
        $("#modalActionButton");


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
                    genericFiles[0]
                );

                break;


            case "mergePdf":

                await mergePDFs(
                    genericFiles
                );

                break;


            case "splitPdf":

                await splitPDF(
                    genericFiles[0]
                );

                break;


            case "compressPdf":

                await compressPDF(
                    genericFiles[0]
                );

                break;


            default:

                throw new Error(
                    "Unknown tool"
                );
        }

    } catch (error) {

        console.error(
            "Tool operation error:",
            error
        );

        showToast(
            error.message ||
            "Operation failed",
            "error"
        );

    } finally {

        /*
         * createImagePDF() and other functions
         * may already close the modal.
         */
        setButtonLoading(
            button,
            false
        );
    }
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


    for (
        const part
        of parts
    ) {

        if (part.includes("-")) {

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


            if (start > end) {

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
                Number.isInteger(page) &&
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
        (a, b) =>
            a - b
    );
}


/* =========================================================
   JS PDF LOADER
   ========================================================= */

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
   JS ZIP LOADER
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

function readFileAsDataURL(file) {

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
   IMAGE INFORMATION
   ========================================================= */

function getImageInfo(dataUrl) {

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
                () => {

                    reject(
                        new Error(
                            "Invalid image"
                        )
                    );
                };


            image.src =
                dataUrl;
        }
    );
}


/* =========================================================
   CANVAS TO BLOB
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
   REMOVE EXTENSION
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


/* =========================================================
   DATE FOR FILE NAME
   ========================================================= */

function formatDateForFilename(
    date
) {

    const pad =
        number =>
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
                    border:2px solid currentColor;
                    border-top-color:transparent;
                    border-radius:50%;
                    animation:leoPdfSpin .7s linear infinite;
                    vertical-align:-3px;
                    margin-right:7px;
                "
            ></span>

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
   SPINNER CSS
   ========================================================= */

function setupSpinnerCSS() {

    if (
        document.getElementById(
            "leoPdfSpinnerCSS"
        )
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

        .app-ready {
            opacity: 1;
        }
    `;


    document.head.appendChild(
        style
    );
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


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeToolModal
        );
    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeToolModal
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


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeToolModal();
            }
        }
    );
}


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

function setupButtons() {

    const actionButton =
        $("#modalActionButton");


    if (actionButton) {

        actionButton.addEventListener(
            "click",
            runCurrentTool
        );
    }


    const heroButton =
        $("#heroCreateButton");


    if (heroButton) {

        heroButton.addEventListener(
            "click",
            () => {

                openToolModal(
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


    const notificationButton =
        $("#notificationButton");


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                showToast(
                    "You're all caught up!",
                    "success"
                );
            }
        );
    }


    const clearHistoryButton =
        $("#clearHistoryButton");


    if (clearHistoryButton) {

        clearHistoryButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "Clear all recent files?"
                    );


                if (confirmed) {
                    clearRecentFiles();
                }
            }
        );
    }
}


/* =========================================================
   TOOL FILE PICKER AREA
   ========================================================= */

function setupFilePickerButtons() {

    const input =
        $("#fileInput");


    if (!input) {
        return;
    }


    document.addEventListener(
        "click",
        event => {

            const target =
                event.target.closest(
                    "[data-open-file-picker]"
                );


            if (!target) {
                return;
            }


            event.preventDefault();

            input.click();
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


    /* -----------------------------------------------------
       DARK MODE
       ----------------------------------------------------- */

    const savedTheme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        );


    if (savedTheme === "light") {

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


    /* -----------------------------------------------------
       NOTIFICATIONS
       ----------------------------------------------------- */

    const savedNotifications =
        localStorage.getItem(
            STORAGE_KEYS.notifications
        );


    if (notificationToggle) {

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
                    event.dataTransfer.files ||
                    []
                );


            if (!files.length) {
                return;
            }


            handleSelectedFiles(
                files
            );
        }
    );
}


/* =========================================================
   PREVENT FORM SUBMIT
   ========================================================= */

function setupForms() {

    document.addEventListener(
        "submit",
        event => {

            event.preventDefault();
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


        setupSpinnerCSS();

        setupSplash();

        setupNavigation();

        setupToolCards();

        setupFileInput();

        setupModalEvents();

        setupButtons();

        setupFilePickerButtons();

        setupSettings();

        setupDragDrop();

        setupForms();

        renderRecentFiles();

        renderFilesPage();


        console.log(
            "LeoPDF ready — Convert. Compress. Simplify."
        );
    }
);
