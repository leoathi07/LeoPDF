"use strict";

/* =========================================================
   LeoPDF — COMPLETE WORKING JAVASCRIPT
========================================================= */


/* =========================================================
   PDF.JS WORKER
========================================================= */

if (window.pdfjsLib) {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

}


/* =========================================================
   STATE
========================================================= */

let currentTool = null;

let selectedFiles = [];

let recentFiles =
    JSON.parse(
        localStorage.getItem("leoPdfRecentFiles") || "[]"
    );


/* =========================================================
   DOM
========================================================= */

const splashScreen =
    document.getElementById("splashScreen");

const splashLogo =
    document.getElementById("splashLogo");

const logoFallback =
    document.getElementById("logoFallback");

const app =
    document.getElementById("app");

const toolModal =
    document.getElementById("toolModal");

const modalOverlay =
    document.getElementById("modalOverlay");

const modalClose =
    document.getElementById("modalClose");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const modalIcon =
    document.getElementById("modalIcon");

const modalActionButton =
    document.getElementById("modalActionButton");

const fileInput =
    document.getElementById("fileInput");

const fileOptions =
    document.getElementById("fileOptions");

const selectedFilesBox =
    document.getElementById("selectedFiles");

const splitOptions =
    document.getElementById("splitOptions");

const pageNumbers =
    document.getElementById("pageNumbers");


/* =========================================================
   LOGO FALLBACK
========================================================= */

if (splashLogo) {

    splashLogo.addEventListener(
        "error",
        () => {

            splashLogo.style.display = "none";

            if (logoFallback) {

                logoFallback.style.display =
                    "flex";

            }

        }
    );

}


/* =========================================================
   SPLASH
========================================================= */

window.addEventListener(
    "load",
    () => {

        setTimeout(
            () => {

                splashScreen.classList.add("hide");

                setTimeout(
                    () => {

                        splashScreen.style.display =
                            "none";

                        app.style.display =
                            "block";

                    },
                    500
                );

            },
            2200
        );

    }
);


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-item")
    .forEach(
        (item) => {

            item.addEventListener(
                "click",
                () => {

                    navigateTo(
                        item.dataset.page
                    );

                }
            );

        }
    );


function navigateTo(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(
            (page) => {

                page.classList.remove(
                    "active-page"
                );

            }
        );


    document
        .querySelectorAll(".nav-item")
        .forEach(
            (nav) => {

                nav.classList.remove(
                    "active"
                );

            }
        );


    const page =
        document.getElementById(pageId);


    const nav =
        document.querySelector(
            `.nav-item[data-page="${pageId}"]`
        );


    if (page) {

        page.classList.add(
            "active-page"
        );

    }


    if (nav) {

        nav.classList.add(
            "active"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   HOME FILES BUTTON
========================================================= */

document
    .getElementById("openFilesButton")
    .addEventListener(
        "click",
        () => {

            navigateTo("filesPage");

        }
    );


/* =========================================================
   HERO BUTTON
========================================================= */

document
    .getElementById("heroCreateButton")
    .addEventListener(
        "click",
        () => {

            openTool("imageToPdf");

        }
    );


/* =========================================================
   TOOL BUTTONS
========================================================= */

document
    .querySelectorAll("[data-tool]")
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    openTool(
                        button.dataset.tool
                    );

                }
            );

        }
    );


/* =========================================================
   TOOL CONFIG
========================================================= */

const toolConfig = {

    imageToPdf: {

        title: "Image → PDF",

        description:
            "Select one or more images and create a PDF.",

        icon: "🖼️",

        accept:
            "image/*",

        multiple:
            true,

        action:
            "Create PDF"

    },


    pdfToImage: {

        title: "PDF → Image",

        description:
            "Select a PDF and export its pages as PNG images.",

        icon: "📄",

        accept:
            "application/pdf",

        multiple:
            false,

        action:
            "Convert to Images"

    },


    mergePdf: {

        title: "Merge PDF",

        description:
            "Select multiple PDF files and combine them.",

        icon: "🔗",

        accept:
            "application/pdf",

        multiple:
            true,

        action:
            "Merge PDFs"

    },


    splitPdf: {

        title: "Split PDF",

        description:
            "Select a PDF and choose pages to extract.",

        icon: "✂️",

        accept:
            "application/pdf",

        multiple:
            false,

        action:
            "Split PDF"

    },


    compressPdf: {

        title: "Compress PDF",

        description:
            "Optimize and re-save your PDF document.",

        icon: "🗜️",

        accept:
            "application/pdf",

        multiple:
            false,

        action:
            "Optimize PDF"

    }

};


/* =========================================================
   OPEN TOOL
========================================================= */

function openTool(tool) {

    const config =
        toolConfig[tool];


    if (!config) {
        return;
    }


    currentTool =
        tool;


    selectedFiles =
        [];


    fileInput.value =
        "";


    selectedFilesBox.innerHTML =
        "";


    pageNumbers.value =
        "";


    modalTitle.textContent =
        config.title;


    modalDescription.textContent =
        config.description;


    modalIcon.textContent =
        config.icon;


    modalActionButton.innerHTML = `
        <span>${config.action}</span>
        <span>→</span>
    `;


    fileInput.accept =
        config.accept;


    fileInput.multiple =
        config.multiple;


    splitOptions.classList.toggle(
        "show",
        tool === "splitPdf"
    );


    fileOptions.innerHTML = `

        <button
            class="file-option"
            id="chooseFilesButton"
            type="button"
        >
            📁 Select File${config.multiple ? "s" : ""}
        </button>

    `;


    document
        .getElementById("chooseFilesButton")
        .addEventListener(
            "click",
            () => {

                fileInput.click();

            }
        );


    toolModal.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE TOOL
========================================================= */

function closeTool() {

    toolModal.classList.remove(
        "show"
    );

    selectedFiles =
        [];

    currentTool =
        null;

}


modalClose.addEventListener(
    "click",
    closeTool
);


modalOverlay.addEventListener(
    "click",
    closeTool
);


document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            closeTool();

        }

    }
);


/* =========================================================
   FILE SELECT
========================================================= */

fileInput.addEventListener(
    "change",
    () => {

        selectedFiles =
            Array.from(
                fileInput.files || []
            );


        renderSelectedFiles();

    }
);


/* =========================================================
   RENDER SELECTED FILES
========================================================= */

function renderSelectedFiles() {

    selectedFilesBox.innerHTML =
        "";


    selectedFiles.forEach(
        (file, index) => {

            const item =
                document.createElement("div");


            item.className =
                "selected-file";


            item.innerHTML = `

                <div class="selected-file-icon">
                    ${file.type === "application/pdf"
                        ? "📄"
                        : "🖼️"}
                </div>

                <div class="selected-file-name">
                    ${escapeHTML(file.name)}
                </div>

                <span>
                    ${formatSize(file.size)}
                </span>

            `;


            selectedFilesBox.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   ACTION BUTTON
========================================================= */

modalActionButton.addEventListener(
    "click",
    async () => {

        if (!selectedFiles.length) {

            showToast(
                "Please select a file first.",
                "!"
            );

            fileInput.click();

            return;

        }


        modalActionButton.disabled =
            true;


        try {

            switch (currentTool) {

                case "imageToPdf":

                    await imageToPdf();

                    break;


                case "pdfToImage":

                    await pdfToImages();

                    break;


                case "mergePdf":

                    await mergePdfs();

                    break;


                case "splitPdf":

                    await splitPdf();

                    break;


                case "compressPdf":

                    await compressPdf();

                    break;

            }

        } catch (error) {

            console.error(error);

            showToast(
                "Something went wrong.",
                "!"
            );

        }


        modalActionButton.disabled =
            false;

    }
);


/* =========================================================
   IMAGE → PDF
========================================================= */

async function imageToPdf() {

    const pdfDoc =
        await PDFLib.PDFDocument.create();


    for (const file of selectedFiles) {

        const bytes =
            await file.arrayBuffer();


        let image;


        if (
            file.type ===
            "image/png"
        ) {

            image =
                await pdfDoc.embedPng(
                    bytes
                );

        } else {

            image =
                await pdfDoc.embedJpg(
                    bytes
                );

        }


        const width =
            image.width;

        const height =
            image.height;


        const maxWidth =
            560;

        const maxHeight =
            780;


        const scale =
            Math.min(
                maxWidth / width,
                maxHeight / height,
                1
            );


        const drawWidth =
            width * scale;

        const drawHeight =
            height * scale;


        const page =
            pdfDoc.addPage(
                [595, 842]
            );


        page.drawImage(
            image,
            {

                x:
                    (595 - drawWidth) / 2,

                y:
                    (842 - drawHeight) / 2,

                width:
                    drawWidth,

                height:
                    drawHeight

            }
        );

    }


    const pdfBytes =
        await pdfDoc.save();


    downloadBlob(
        new Blob(
            [pdfBytes],
            {
                type:
                    "application/pdf"
            }
        ),
        `LeoPDF-${timestamp()}.pdf`
    );


    saveRecentFile(
        `LeoPDF-${timestamp()}.pdf`
    );


    showToast(
        "PDF created successfully.",
        "✓"
    );


    closeTool();

}


/* =========================================================
   PDF → IMAGE
========================================================= */

async function pdfToImages() {

    const file =
        selectedFiles[0];


    const data =
        await file.arrayBuffer();


    const pdf =
        await pdfjsLib.getDocument({
            data
        }).promise;


    showToast(
        `${pdf.numPages} page(s) found.`,
        "✓"
    );


    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {

        const page =
            await pdf.getPage(
                pageNumber
            );


        const viewport =
            page.getViewport({
                scale: 2
            });


        const canvas =
            document.createElement(
                "canvas"
            );


        const context =
            canvas.getContext(
                "2d"
            );


        canvas.width =
            viewport.width;

        canvas.height =
            viewport.height;


        await page.render({
            canvasContext:
                context,
            viewport
        }).promise;


        const blob =
            await new Promise(
                (resolve) => {

                    canvas.toBlob(
                        resolve,
                        "image/png"
                    );

                }
            );


        downloadBlob(
            blob,
            `LeoPDF-page-${pageNumber}.png`
        );

    }


    saveRecentFile(
        `PDF-to-Images-${timestamp()}`
    );


    closeTool();


    showToast(
        "PDF pages exported.",
        "✓"
    );

}


/* =========================================================
   MERGE PDF
========================================================= */

async function mergePdfs() {

    if (
        selectedFiles.length < 2
    ) {

        showToast(
            "Select at least 2 PDF files.",
            "!"
        );

        return;

    }


    const mergedPdf =
        await PDFLib.PDFDocument.create();


    for (
        const file of selectedFiles
    ) {

        const bytes =
            await file.arrayBuffer();


        const sourcePdf =
            await PDFLib.PDFDocument.load(
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
        await mergedPdf.save();


    downloadBlob(
        new Blob(
            [output],
            {
                type:
                    "application/pdf"
            }
        ),
        `LeoPDF-Merged-${timestamp()}.pdf`
    );


    saveRecentFile(
        `LeoPDF-Merged-${timestamp()}.pdf`
    );


    closeTool();


    showToast(
        "PDFs merged successfully.",
        "✓"
    );

}


/* =========================================================
   SPLIT PDF
========================================================= */

async function splitPdf() {

    const file =
        selectedFiles[0];


    const value =
        pageNumbers.value.trim();


    if (!value) {

        showToast(
            "Enter page numbers.",
            "!"
        );

        return;

    }


    const pages =
        value
            .split(",")
            .map(
                (number) =>
                    parseInt(
                        number.trim(),
                        10
                    )
            )
            .filter(
                (number) =>
                    Number.isInteger(number) &&
                    number > 0
            );


    if (!pages.length) {

        showToast(
            "Invalid page numbers.",
            "!"
        );

        return;

    }


    const sourceBytes =
        await file.arrayBuffer();


    const sourcePdf =
        await PDFLib.PDFDocument.load(
            sourceBytes
        );


    const totalPages =
        sourcePdf.getPageCount();


    const validPages =
        pages.filter(
            (page) =>
                page <= totalPages
        );


    if (!validPages.length) {

        showToast(
            "Page number is outside the PDF.",
            "!"
        );

        return;

    }


    const newPdf =
        await PDFLib.PDFDocument.create();


    const copiedPages =
        await newPdf.copyPages(
            sourcePdf,
            validPages.map(
                (page) =>
                    page - 1
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
        await newPdf.save();


    downloadBlob(
        new Blob(
            [output],
            {
                type:
                    "application/pdf"
            }
        ),
        `LeoPDF-Split-${timestamp()}.pdf`
    );


    saveRecentFile(
        `LeoPDF-Split-${timestamp()}.pdf`
    );


    closeTool();


    showToast(
        "PDF split successfully.",
        "✓"
    );

}


/* =========================================================
   COMPRESS / OPTIMIZE PDF
========================================================= */

async function compressPdf() {

    const file =
        selectedFiles[0];


    const bytes =
        await file.arrayBuffer();


    const pdf =
        await PDFLib.PDFDocument.load(
            bytes
        );


    /*
       Re-save the PDF with pdf-lib.
       This performs a client-side optimization/rewrite.
    */

    const output =
        await pdf.save({
            useObjectStreams: true,
            addDefaultPage: false
        });


    const oldSize =
        file.size;


    const newSize =
        output.length;


    downloadBlob(
        new Blob(
            [output],
            {
                type:
                    "application/pdf"
            }
        ),
        `LeoPDF-Optimized-${timestamp()}.pdf`
    );


    saveRecentFile(
        `LeoPDF-Optimized-${timestamp()}.pdf`
    );


    closeTool();


    showToast(
        `PDF optimized • ${formatSize(oldSize)} → ${formatSize(newSize)}`,
        "✓"
    );

}


/* =========================================================
   RECENT FILES
========================================================= */

function saveRecentFile(name) {

    recentFiles.unshift({

        name,

        date:
            new Date().toLocaleString(),

        type:
            "PDF"

    });


    recentFiles =
        recentFiles.slice(
            0,
            20
        );


    localStorage.setItem(
        "leoPdfRecentFiles",
        JSON.stringify(
            recentFiles
        )
    );


    renderRecentFiles();

}


/* =========================================================
   RENDER RECENT
========================================================= */

function renderRecentFiles() {

    const container =
        document.getElementById(
            "recentFiles"
        );


    const filesContainer =
        document.getElementById(
            "filesList"
        );


    if (!recentFiles.length) {

        const empty = `

            <div class="empty-state">

                <div class="empty-icon">
                    📂
                </div>

                <h4>
                    No recent files
                </h4>

                <p>
                    Your created PDFs will appear here.
                </p>

            </div>

        `;


        if (container) {
            container.innerHTML =
                empty;
        }


        if (filesContainer) {
            filesContainer.innerHTML =
                empty;
        }


        return;

    }


    const html =
        recentFiles
            .map(
                (file) => `

                    <div class="recent-file-item">

                        <div class="recent-file-icon">
                            📄
                        </div>

                        <div class="recent-file-info">

                            <strong>
                                ${escapeHTML(file.name)}
                            </strong>

                            <span>
                                ${escapeHTML(file.date)}
                            </span>

                        </div>

                        <span class="recent-file-type">
                            PDF
                        </span>

                    </div>

                `
            )
            .join("");


    if (container) {

        container.innerHTML =
            html;

    }


    if (filesContainer) {

        filesContainer.innerHTML =
            html;

    }

}


/* =========================================================
   CLEAR HISTORY
========================================================= */

document
    .getElementById("clearHistoryButton")
    .addEventListener(
        "click",
        () => {

            if (!recentFiles.length) {

                showToast(
                    "No recent files to clear.",
                    "ℹ"
                );

                return;

            }


            const confirmClear =
                confirm(
                    "Clear all LeoPDF recent files?"
                );


            if (!confirmClear) {
                return;
            }


            recentFiles =
                [];


            localStorage.removeItem(
                "leoPdfRecentFiles"
            );


            renderRecentFiles();


            showToast(
                "Recent files cleared.",
                "✓"
            );

        }
    );


/* =========================================================
   DARK MODE
========================================================= */

const darkModeToggle =
    document.getElementById(
        "darkModeToggle"
    );


const savedDarkMode =
    localStorage.getItem(
        "leoPdfDarkMode"
    );


if (
    savedDarkMode !== null
) {

    darkModeToggle.checked =
        savedDarkMode === "true";

}


applyDarkMode();


darkModeToggle.addEventListener(
    "change",
    () => {

        localStorage.setItem(
            "leoPdfDarkMode",
            String(
                darkModeToggle.checked
            )
        );


        applyDarkMode();

    }
);


function applyDarkMode() {

    document.body.classList.toggle(
        "light-mode",
        !darkModeToggle.checked
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

document
    .getElementById(
        "notificationButton"
    )
    .addEventListener(
        "click",
        () => {

            showToast(
                "You're all caught up.",
                "🔔"
            );

        }
    );


const notificationToggle =
    document.getElementById(
        "notificationToggle"
    );


notificationToggle.addEventListener(
    "change",
    () => {

        localStorage.setItem(
            "leoPdfNotifications",
            String(
                notificationToggle.checked
            )
        );


        showToast(
            notificationToggle.checked
                ? "Notifications enabled."
                : "Notifications disabled.",
            "🔔"
        );

    }
);


/* =========================================================
   DOWNLOAD
========================================================= */

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}


/* =========================================================
   HELPERS
========================================================= */

function timestamp() {

    const now =
        new Date();


    const y =
        now.getFullYear();


    const m =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const d =
        String(
            now.getDate()
        ).padStart(2, "0");


    const h =
        String(
            now.getHours()
        ).padStart(2, "0");


    const min =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    const s =
        String(
            now.getSeconds()
        ).padStart(2, "0");


    return `${y}${m}${d}-${h}${min}${s}`;

}


function formatSize(bytes) {

    if (!bytes) {
        return "0 B";
    }


    const units =
        [
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
        bytes /
        Math.pow(
            1024,
            index
        )
    ).toFixed(
        index === 0
            ? 0
            : 1
    ) +
    " " +
    units[index];

}


function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(
    message,
    icon = "✓"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    const toastIcon =
        document.getElementById(
            "toastIcon"
        );


    toastMessage.textContent =
        message;


    toastIcon.textContent =
        icon;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   INITIAL RENDER
========================================================= */

renderRecentFiles();
