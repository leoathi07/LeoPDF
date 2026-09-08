// Splash Screen & Initialization
window.addEventListener('load', () => {
    updateStreak();
    loadHistory();
    
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const mainApp = document.getElementById('main-app');
        
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.classList.add('hidden');
            mainApp.classList.remove('hidden');
        }, 800);
    }, 2200);
});

// Gamification: Daily Streak Logic
function updateStreak() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('leo_last_visit');
    let streak = parseInt(localStorage.getItem('leo_streak') || '0');

    if (lastVisit !== today) {
        streak += 1;
        localStorage.setItem('leo_streak', streak);
        localStorage.setItem('leo_last_visit', today);
    }
    document.getElementById('streakCount').textContent = streak || 1;
}

// Theme Switcher
function toggleTheme() {
    document.body.classList.toggle('light-theme');
}

// Tab Switcher
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// History Tracker
function addHistory(fileName) {
    let history = JSON.parse(localStorage.getItem('leo_history') || '[]');
    history.unshift({ name: fileName, time: new Date().toLocaleTimeString() });
    if (history.length > 5) history.pop();
    localStorage.setItem('leo_history', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    let history = JSON.parse(localStorage.getItem('leo_history') || '[]');
    
    if (history.length === 0) return;
    historyList.innerHTML = history.map(item => `<li>📄 ${item.name} <small>(${item.time})</small></li>`).join('');
}

// Global Variables
let selectedImages = [];
let selectedPDFs = [];
let capturedImages = [];

// 1. IMAGE TO PDF
function handleImageSelect(event) {
    const files = Array.from(event.target.files);
    const container = document.getElementById('imagePreviewContainer');
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            selectedImages.push(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
    if (selectedImages.length > 0) document.getElementById('convertImgBtn').disabled = false;
}

async function convertImagesToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    for (let i = 0; i < selectedImages.length; i++) {
        const imageData = await readFileAsDataURL(selectedImages[i]);
        if (i > 0) doc.addPage();
        doc.addImage(imageData, 'JPEG', 10, 10, 190, 270);
    }
    const name = 'LeoPDF_Images.pdf';
    doc.save(name);
    addHistory(name);
}

// 2. MERGE PDF
function handlePDFSelect(event) {
    const files = Array.from(event.target.files);
    const list = document.getElementById('pdfFileList');

    files.forEach(file => {
        if (file.type === 'application/pdf') {
            selectedPDFs.push(file);
            const li = document.createElement('li');
            li.textContent = `📄 ${file.name}`;
            list.appendChild(li);
        }
    });
    if (selectedPDFs.length > 1) document.getElementById('mergeBtn').disabled = false;
}

async function mergePDFFiles() {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of selectedPDFs) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const name = 'LeoPDF_Merged.pdf';
    link.download = name;
    link.click();
    addHistory(name);
}

// 3. LIVE CAMERA SCANNER
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById('webcam').srcObject = stream;
    } catch (err) {
        alert('Camera access denied or unavailable!');
    }
}

function captureDocument() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('camCanvas');
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL('image/jpeg');
    capturedImages.push(imgData);

    const img = document.createElement('img');
    img.src = imgData;
    document.getElementById('scannedPreviewGrid').appendChild(img);
    document.getElementById('saveCamPdfBtn').disabled = false;
}

function saveCapturedToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    capturedImages.forEach((img, i) => {
        if (i > 0) doc.addPage();
        doc.addImage(img, 'JPEG', 10, 10, 190, 270);
    });

    const name = 'LeoPDF_ScannedDoc.pdf';
    doc.save(name);
    addHistory(name);
}

// 4. WATERMARK PDF
function generateWatermarkedPDF() {
    const watermark = document.getElementById('watermarkText').value || 'LEOPDF CONFIDENTIAL';
    const content = document.getElementById('watermarkDocContent').value;

    if (!content.trim()) return alert('Please enter text content!');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add Light Watermark in background
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(40);
    doc.text(watermark, 35, 150, { angle: 45 });

    // Add Document Text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(content, 180);
    doc.text(splitText, 14, 20);

    const name = 'LeoPDF_Watermarked.pdf';
    doc.save(name);
    addHistory(name);
}

// 5. TEXT TO PDF
function convertTextToPDF() {
    const title = document.getElementById('pdfDocTitle').value || 'LeoPDF Document';
    const content = document.getElementById('pdfTextContent').value;

    if (!content.trim()) return alert('Type text content first!');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 20);

    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(content, 180);
    doc.text(splitText, 14, 30);

    const name = `${title.replace(/\s+/g, '_')}.pdf`;
    doc.save(name);
    addHistory(name);
}

// File Read Helper
function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}
