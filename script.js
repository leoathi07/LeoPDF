/* =========================================================
   LeoPDF — COMPLETE SCRIPT
   ========================================================= */

"use strict";


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let selectedImages = [];
let recentFiles = [];

const LOGO_FILE =
    "file_00000000db748208ae0361855c0a94b9.png";


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeLogo();

    initializeSplash();

    initializeNavigation();

    initializeTools();

    initializeImageToPdf();

    initializeSettings();

    initializeHeader();

    loadRecentFiles();

});


/* =========================================================
   LOGO
   ========================================================= */

function initializeLogo() {

    const splashLogo =
        document.getElementById("splashLogo");

    const logoFallback =
        document.getElementById("logoFallback");


    if (!splashLogo) {
        return;
    }


    splashLogo.addEventListener("load", () => {

        splashLogo.style.display = "block";

        if (logoFallback) {
            logoFallback.style.display = "none";
        }

    });


    splashLogo.addEventListener("error", () => {

        console.warn(
            "LeoPDF logo could not be loaded:",
            LOGO_FILE
        );

        splashLogo.style.display = "none";

        if (logoFallback) {
            logoFallback.style.display = "flex";
        }

    });


    /*
       Check if browser already loaded the image
    */

    if (splashLogo.complete) {

        if (splashLogo.naturalWidth > 0) {

            splashLogo.style.display = "block";

            if (logoFallback) {
                logoFallback.style.display = "none";
            }

        }

    }

}


/* =========================================================
   SPLASH SCREEN
   ========================================================= */

function initializeSplash() {

    const splashScreen =
        document.getElementById("splashScreen");

    const app =
        document.getElementById("app");


    if (!splashScreen || !app) {
        return;
    }


    app.style.display = "none";


    setTimeout(() => {

        splashScreen.classList.add("hide");

        setTimeout(() => {

            splashScreen.style.display = "none";

            app.style.display = "block";

            document.body.classList.add("app-ready");

        }, 500);

    }, 2200);

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item");

    const pages =
        document.querySelectorAll(".page");


    navItems.forEach((item) => {

        item.addEventListener("click", () => {

            const targetPage =
                item.getAttribute("data-page");


            if (!targetPage) {
                return;
            }


            navItems.forEach((nav) => {
                nav.classList.remove("active");
            });


            item.classList.add("active");


            pages.forEach((page) => {

                page.classList.remove("active-page");

            });


            const target =
                document.getElementById(targetPage);


            if (target) {

                target.classList.add("active-page");

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }

        });

    });


    const viewAllTools =
        document.getElementById("viewAllTools");


    if (viewAllTools) {

        viewAllTools.addEventListener("click", () => {

            navigateTo("toolsPage");

        });

    }


    const viewFilesButton =
        document.getElementById("viewFilesButton");


    if (viewFilesButton) {

        viewFilesButton.addEventListener("click", () => {

            navigateTo("filesPage");

        });

    }


    const startButton =
        document.getElementById("startButton");


    if (startButton) {

        startButton.addEventListener("click", () => {

            openImagePdfModal();

        });

    }

}


/* =========================================================
   CHANGE PAGE
   ========================================================= */

function navigateTo(pageId) {

    const navItems =
        document.querySelectorAll(".nav-item");

    const pages =
        document.querySelectorAll(".page");


    pages.forEach((page) => {

        page.classList.remove("active-page");

    });


    navItems.forEach((nav) => {

        nav.classList.remove("active");

    });


    const page =
        document.getElementById(pageId);


    if (page) {

        page.classList.add("active-page");

    }


    const nav =
        document.querySelector(
            `.nav-item[data-page="${pageId}"]`
        );


    if (nav) {

        nav.classList.add("active");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   TOOLS
   ========================================================= */

function initializeTools() {

    const toolCards =
        document.querySelectorAll("[data-tool]");


    toolCards.forEach((card) => {

        card.addEventListener("click", () => {

            const tool =
                card.getAttribute("data-tool");


            handleTool(tool);

        });

    });

}


/* =========================================================
   TOOL HANDLER
   ========================================================= */

function handleTool(tool) {

    switch (tool) {

        case "imageToPdf":

            openImagePdfModal();

            break;


        case "pdfToImage":

            showToast(
                "PDF to Image will be available soon.",
                "ℹ"
            );

            break;


        case "mergePdf":

            showToast(
                "Merge PDF will be available soon.",
                "ℹ"
            );

            break;


        case "splitPdf":

            showToast(
                "Split PDF will be available soon.",
                "ℹ"
            );

            break;


        case "compressPdf":

            showToast(
                "Compress PDF will be available soon.",
                "ℹ"
            );

            break;


        case "moreTools":

            navigateTo("toolsPage");

            showToast(
                "More PDF tools coming soon.",
                "✨"
            );

            break;


        default:

            showToast(
                "Tool not available.",
                "!"
            );

    }

}


/* =========================================================
   IMAGE TO PDF
   ========================================================= */

function initializeImageToPdf() {

    const imageInput =
        document.getElementById("imageInput");

    const selectImagesButton =
        document.getElementById("selectImagesButton");

    const createPdfButton =
        document.getElementById("createPdfButton");

    const closeModalButton =
        document.getElementById("closeModal");

    const modalOverlay =
        document.getElementById("modalOverlay");


    if (
        !imageInput ||
        !selectImagesButton ||
        !createPdfButton
    ) {
        return;
    }


    selectImagesButton.addEventListener(
        "click",
        () => {

            imageInput.click();

        }
    );


    imageInput.addEventListener(
        "change",
        (event) => {

            const files =
                Array.from(event.target.files || []);

            if (!files.length) {
                return;
            }


            selectedImages = files;


            renderSelectedImages();


            createPdfButton.disabled =
                selectedImages.length === 0;

        }
    );


    createPdfButton.addEventListener(
        "click",
        () => {

            createPdfFromImages();

        }
    );


    if (closeModalButton) {

        closeModalButton.addEventListener(
            "click",
            closeImagePdfModal
        );

    }


    if (modalOverlay) {

        modalOverlay.addEventListener(
            "click",
            closeImagePdfModal
        );

    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeImagePdfModal();

            }

        }
    );

}


/* =========================================================
   OPEN MODAL
   ========================================================= */

function openImagePdfModal() {

    const modal =
        document.getElementById("imagePdfModal");


    if (!modal) {
        return;
    }


    modal.classList.add("show");

    document.body.classList.add("modal-open");

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeImagePdfModal() {

    const modal =
        document.getElementById("imagePdfModal");


    if (!modal) {
        return;
    }


    modal.classList.remove("show");

    document.body.classList.remove("modal-open");

}


/* =========================================================
   SELECTED IMAGE PREVIEW
   ========================================================= */

function renderSelectedImages() {

    const container =
        document.getElementById("selectedImages");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    selectedImages.forEach((file, index) => {

        const reader =
            new FileReader();


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

                <span class="selected-image-number">
                    ${index + 1}
                </span>

            `;


            container.appendChild(item);

        };


        reader.readAsDataURL(file);

    });

}


/* =========================================================
   CREATE PDF
   ========================================================= */

async function createPdfFromImages() {

    if (!selectedImages.length) {

        showToast(
            "Please select at least one image.",
            "!"
        );

        return;

    }


    const button =
        document.getElementById("createPdfButton");


    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <span>⏳ Creating PDF...</span>
        `;

    }


    try {

        /*
           Browser-native PDF creation fallback.

           This creates a printable PDF through the browser.
           For advanced PDF generation, jsPDF can be added later.
        */


        const printWindow =
            window.open("", "_blank");


        if (!printWindow) {

            throw new Error(
                "Popup blocked by browser."
            );

        }


        const imageHTML =
            await createPrintImages();


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <title>LeoPDF Document</title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }

                    .page {
                        width: 100%;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        page-break-after: always;
                        padding: 20px;
                    }

                    .page img {
                        max-width: 100%;
                        max-height: 95vh;
                        object-fit: contain;
                    }

                    @media print {

                        .page {
                            height: 100vh;
                            min-height: 100vh;
                            padding: 0;
                        }

                    }

                </style>

            </head>

            <body>

                ${imageHTML}

            </body>

            </html>

        `);


        printWindow.document.close();


        setTimeout(() => {

            printWindow.focus();

            printWindow.print();


            saveRecentFile(
                `LeoPDF-${formatDateFileName()}.pdf`,
                selectedImages.length
            );


            showToast(
                "PDF ready. Choose Save as PDF.",
                "✓"
            );


            closeImagePdfModal();


            selectedImages = [];


            const input =
                document.getElementById("imageInput");


            if (input) {
                input.value = "";
            }


            const preview =
                document.getElementById("selectedImages");


            if (preview) {
                preview.innerHTML = "";
            }


            if (button) {

                button.disabled = true;

                button.innerHTML = `
                    <span>📄 Create PDF</span>
                    <span>→</span>
                `;

            }


        }, 600);


    } catch (error) {

        console.error(
            "PDF creation error:",
            error
        );


        showToast(
            "Unable to create PDF.",
            "!"
        );


        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <span>📄 Create PDF</span>
                <span>→</span>
            `;

        }

    }

}


/* =========================================================
   CREATE PRINT HTML
   ========================================================= */

function createPrintImages() {

    return Promise.all(

        selectedImages.map((file) => {

            return new Promise((resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload = (event) => {

                    resolve(`

                        <div class="page">

                            <img
                                src="${event.target.result}"
                                alt="PDF page"
                            >

                        </div>

                    `);

                };


                reader.onerror = reject;


                reader.readAsDataURL(file);

            });

        })

    ).then((pages) => pages.join(""));

}


/* =========================================================
   SETTINGS
   ========================================================= */

function initializeSettings() {

    const darkModeToggle =
        document.getElementById("darkModeToggle");


    if (darkModeToggle) {

        const savedDarkMode =
            localStorage.getItem("leoPdfDarkMode");


        if (savedDarkMode !== null) {

            darkModeToggle.checked =
                savedDarkMode === "true";

        }


        darkModeToggle.addEventListener(
            "change",
            () => {

                const enabled =
                    darkModeToggle.checked;


                localStorage.setItem(
                    "leoPdfDarkMode",
                    String(enabled)
                );


                document.body.classList.toggle(
                    "light-mode",
                    !enabled
                );


                showToast(
                    enabled
                        ? "Dark mode enabled."
                        : "Light mode enabled.",
                    "✓"
                );

            }
        );


        document.body.classList.toggle(
            "light-mode",
            !darkModeToggle.checked
        );

    }


    const notificationToggle =
        document.getElementById(
            "notificationToggle"
        );


    if (notificationToggle) {

        const savedNotifications =
            localStorage.getItem(
                "leoPdfNotifications"
            );


        if (savedNotifications !== null) {

            notificationToggle.checked =
                savedNotifications === "true";

        }


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

    }


    const clearHistoryButton =
        document.getElementById(
            "clearHistoryButton"
        );


    if (clearHistoryButton) {

        clearHistoryButton.addEventListener(
            "click",
            clearRecentFiles
        );

    }

}


/* =========================================================
   HEADER
   ========================================================= */

function initializeHeader() {

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                showToast(
                    "You're all caught up.",
                    "🔔"
                );

            }
        );

    }

}


/* =========================================================
   RECENT FILES
   ========================================================= */

function loadRecentFiles() {

    try {

        const stored =
            localStorage.getItem(
                "leoPdfRecentFiles"
            );


        if (stored) {

            recentFiles =
                JSON.parse(stored);

        } else {

            recentFiles = [];

        }

    } catch (error) {

        console.error(
            "Could not load recent files:",
            error
        );

        recentFiles = [];

    }


    renderRecentFiles();

}


/* =========================================================
   SAVE RECENT FILE
   ========================================================= */

function saveRecentFile(
    filename,
    imageCount
) {

    const file = {

        id:
            Date.now(),

        name:
            filename,

        type:
            "PDF",

        count:
            imageCount,

        date:
            new Date().toLocaleString()

    };


    recentFiles.unshift(file);


    /*
       Keep only latest 10
    */

    recentFiles =
        recentFiles.slice(0, 10);


    localStorage.setItem(
        "leoPdfRecentFiles",
        JSON.stringify(recentFiles)
    );


    renderRecentFiles();

}


/* =========================================================
   RENDER RECENT FILES
   ========================================================= */

function renderRecentFiles() {

    const container =
        document.getElementById(
            "recentFiles"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    if (!container) {
        return;
    }


    if (!recentFiles.length) {

        container.innerHTML = `

            <div
                class="empty-state"
                id="emptyState"
            >

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

        renderFilesPage();

        return;

    }


    container.innerHTML = "";


    recentFiles.forEach((file) => {

        const item =
            document.createElement("div");


        item.className =
            "recent-file-item";


        item.innerHTML = `

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

            <div class="recent-file-more">
                PDF
            </div>

        `;


        container.appendChild(item);

    });


    renderFilesPage();

}


/* =========================================================
   FILES PAGE
   ========================================================= */

function renderFilesPage() {

    const container =
        document.getElementById(
            "filesList"
        );


    if (!container) {
        return;
    }


    if (!recentFiles.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📁
                </div>

                <h4>
                    No files yet
                </h4>

                <p>
                    Create a PDF to see it here.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    recentFiles.forEach((file) => {

        const item =
            document.createElement("div");


        item.className =
            "recent-file-item";


        item.innerHTML = `

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

            <div class="recent-file-more">
                PDF
            </div>

        `;


        container.appendChild(item);

    });

}


/* =========================================================
   CLEAR HISTORY
   ========================================================= */

function clearRecentFiles() {

    const hasFiles =
        recentFiles.length > 0;


    if (!hasFiles) {

        showToast(
            "There are no recent files.",
            "ℹ"
        );

        return;

    }


    const confirmed =
        window.confirm(
            "Clear all recent LeoPDF files?"
        );


    if (!confirmed) {
        return;
    }


    recentFiles = [];


    localStorage.removeItem(
        "leoPdfRecentFiles"
    );


    renderRecentFiles();


    showToast(
        "Recent files cleared.",
        "✓"
    );

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function showToast(
    message,
    icon = "✓"
) {

    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );

    const toastIcon =
        document.getElementById(
            "toastIcon"
        );


    if (!toast) {
        return;
    }


    if (toastMessage) {

        toastMessage.textContent =
            message;

    }


    if (toastIcon) {

        toastIcon.textContent =
            icon;

    }


    toast.classList.add("show");


    if (toastTimer) {

        clearTimeout(toastTimer);

    }


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);

}


/* =========================================================
   DATE
   ========================================================= */

function formatDateFileName() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    return `${year}${month}${day}-${hours}${minutes}`;

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
   PREVENT DOUBLE TAP ZOOM
   ========================================================= */

let lastTouchEnd = 0;


document.addEventListener(
    "touchend",
    (event) => {

        const now =
            Date.now();


        if (
            now - lastTouchEnd <= 300
        ) {

            event.preventDefault();

        }


        lastTouchEnd = now;

    },
    {
        passive: false
    }
);


/* =========================================================
   GLOBAL ERROR PROTECTION
   ========================================================= */

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "LeoPDF error:",
            event.error || event.message
        );

    }
);


/* =========================================================
   END
   ========================================================= */
