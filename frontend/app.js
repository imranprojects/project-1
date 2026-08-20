// TubeMind AI - Enterprise SaaS Frontend Engine
const API_BASE_URL = 'http://127.0.0.1:8000';

// Element Selectors
const summarizeForm = document.getElementById('summarize-form');
const videoUrlInput = document.getElementById('video-url');
const submitBtn = document.getElementById('submit-btn');

const searchSection = document.getElementById('search-section');
const loadingState = document.getElementById('loading-state');
const loaderHeading = document.getElementById('loader-heading');
const loaderSubtext = document.getElementById('loader-subtext');

const errorState = document.getElementById('error-state');
const errorDescription = document.getElementById('error-description');
const retryBtn = document.getElementById('retry-btn');

const emptyState = document.getElementById('empty-state');
const resultsContainer = document.getElementById('results-container');
const newAnalysisBtn = document.getElementById('new-analysis-btn');

// Video Metadata Nodes
const videoThumbnail = document.getElementById('video-thumbnail');
const videoDuration = document.getElementById('video-duration');
const videoTitle = document.getElementById('video-title');
const videoChannel = document.getElementById('video-channel');
const videoViews = document.getElementById('video-views');
const videoDate = document.getElementById('video-date');

// Badge Metrics
const badgeDifficulty = document.getElementById('badge-difficulty');
const badgeReadingTime = document.getElementById('badge-reading-time');
const badgeSource = document.getElementById('badge-source');

// Tab Views Contents
const analysisSummary = document.getElementById('analysis-summary');
const analysisTakeaways = document.getElementById('analysis-takeaways');
const analysisTopics = document.getElementById('analysis-topics');
const analysisTechnologies = document.getElementById('analysis-technologies');
const transcriptText = document.getElementById('transcript-text');

// Document Exports & Utilities
const downloadPDFBtn = document.getElementById('download-pdf-btn');
const downloadTxtBtn = document.getElementById('download-txt-btn');
const copyTranscriptBtn = document.getElementById('copy-transcript-btn');
const toastNotification = document.getElementById('toast');

// History Node
const historyList = document.getElementById('history-list');

// App Global State
let currentData = null;
let searchHistory = [];

// --- Toast Alert Utility ---
const showToast = (message) => {
    toastNotification.textContent = message;
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
        toastNotification.classList.add('hidden');
    }, 2500);
};

// --- LocalStorage History State Managers ---

const saveToLocalStorage = (data) => {
    // Check if report already exists in history
    const exists = searchHistory.some(item => item.video.title === data.video.title);
    if (exists) return;

    searchHistory.unshift(data);
    // Max 10 recent items
    if (searchHistory.length > 10) {
        searchHistory.pop();
    }
    localStorage.setItem('tubemind_history_cache', JSON.stringify(searchHistory));
    renderHistoryList();
};

const loadHistoryFromCache = () => {
    const cached = localStorage.getItem('tubemind_history_cache');
    if (cached) {
        try {
            searchHistory = JSON.parse(cached);
        } catch (e) {
            console.error("Failed to parse history cache:", e);
            searchHistory = [];
        }
    }
    renderHistoryList();
};

const renderHistoryList = () => {
    historyList.innerHTML = '';
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<li class="history-empty">No reports saved locally</li>';
        return;
    }

    searchHistory.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        if (currentData && currentData.video.title === item.video.title) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <div class="history-item-title">${item.video.title || 'Report'}</div>
            <div class="history-item-meta">
                <span>${item.video.channel || 'Video'}</span>
                <span>${item.video.duration || '0:00'}</span>
            </div>
        `;
        
        li.addEventListener('click', () => {
            loadCachedReport(index);
        });
        
        historyList.appendChild(li);
    });
};

const loadCachedReport = (index) => {
    const data = searchHistory[index];
    if (data) {
        renderResults(data);
        showSection(resultsContainer);
        renderHistoryList(); // Re-render to update the active item class
        showToast("Report loaded from cache");
    }
};

// --- Helper Functions ---

// Rotate loading status messages to engage user
let loadingInterval = null;
const startLoadingStatusRotation = () => {
    const statuses = [
        { title: "Analyzing YouTube Link...", sub: "Validating API payloads & checking metadata cache." },
        { title: "Retrieving Captions...", sub: "Attempting high-speed retrieval of standard subtitle tracks." },
        { title: "Parsing Audio...", sub: "Captions unavailable; downloading audio stream fallback via yt-dlp." },
        { title: "Assembling Transcript...", sub: "Processing sound stream through OpenAI Whisper model." },
        { title: "AI Report Synthesis...", sub: "Prompting Gemini 3.5 Flash to summarize context and extract core concepts." },
        { title: "Compiling Metrics...", sub: "Calculating reading times, audience complexity index, and technology stack." }
    ];
    
    let index = 0;
    const updateStatus = () => {
        loaderHeading.textContent = statuses[index].title;
        loaderSubtext.textContent = statuses[index].sub;
        index = (index + 1) % statuses.length;
    };
    
    updateStatus();
    loadingInterval = setInterval(updateStatus, 3200);
};

const stopLoadingStatusRotation = () => {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
};

// Toggle Main Panels
const showSection = (sectionToShow) => {
    const sections = [emptyState, loadingState, errorState, resultsContainer];
    sections.forEach(sec => {
        if (sec === sectionToShow) {
            sec.classList.remove('hidden');
        } else {
            sec.classList.add('hidden');
        }
    });
};

// Format Dates
const formatUploadDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr || 'N/A';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
};

// --- API Pipeline Calls ---

const fetchVideoAnalysis = async (url) => {
    try {
        startLoadingStatusRotation();
        showSection(loadingState);
        submitBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ video_url: url })
        });

        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Pipeline execution failed.');
        }

        renderResults(data);
        saveToLocalStorage(data);
        showSection(resultsContainer);
    } catch (err) {
        console.error(err);
        errorDescription.textContent = err.message || 'An unexpected error occurred during summarization.';
        showSection(errorState);
    } finally {
        stopLoadingStatusRotation();
        submitBtn.disabled = false;
    }
};

// --- UI Rendering ---

const renderResults = (data) => {
    currentData = data;
    const { video, source, analysis, transcript } = data;

    // 1. Video Meta Panel
    videoTitle.textContent = video.title || 'Untitled Video';
    videoChannel.textContent = video.channel || 'Unknown Uploader';
    videoThumbnail.src = video.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format&fit=crop';
    videoDuration.textContent = video.duration || '0:00';
    videoViews.textContent = video.views ? Number(video.views).toLocaleString() : 'N/A';
    videoDate.textContent = formatUploadDate(video.upload_date);

    // 2. Metrics Block
    badgeDifficulty.textContent = analysis.difficulty || 'Beginner';
    // Style difficulty value class dynamically
    badgeDifficulty.className = 'metric-value';
    const diffClass = (analysis.difficulty || 'Beginner').toLowerCase();
    badgeDifficulty.classList.add(diffClass);
    
    badgeReadingTime.textContent = analysis.reading_time || '1 min';
    badgeSource.textContent = source || 'youtube_captions';

    // 3. Tab 1: Executive Summary & Takeaways
    analysisSummary.textContent = analysis.summary || 'No summary generated.';

    analysisTakeaways.innerHTML = '';
    const takeaways = analysis.key_takeaways || [];
    if (takeaways.length > 0) {
        takeaways.forEach(takeaway => {
            const li = document.createElement('li');
            li.textContent = takeaway;
            analysisTakeaways.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No takeaways generated.';
        analysisTakeaways.appendChild(li);
    }

    // 4. Tab 2: Topics & Technologies
    analysisTopics.innerHTML = '';
    const topics = analysis.topics || [];
    if (topics.length > 0) {
        topics.forEach(topic => {
            const span = document.createElement('span');
            span.className = 'badge-tag topic';
            span.textContent = topic;
            analysisTopics.appendChild(span);
        });
    } else {
        analysisTopics.innerHTML = '<span class="no-tags">No core topics detected</span>';
    }

    analysisTechnologies.innerHTML = '';
    const technologies = analysis.technologies || [];
    if (technologies.length > 0) {
        technologies.forEach(tech => {
            const span = document.createElement('span');
            span.className = 'badge-tag tech';
            span.textContent = tech;
            analysisTechnologies.appendChild(span);
        });
    } else {
        analysisTechnologies.innerHTML = '<span class="no-tags">No specific tech tags identified</span>';
    }

    // 5. Tab 3: Transcript Viewport
    transcriptText.textContent = transcript || 'Transcript content is empty.';
    
    // Default to the first tab (Overview)
    switchTab('tab-overview');
};

// --- Tabs Manager ---

const switchTab = (tabId) => {
    // Update active state in nav buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-target') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update active state in panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        if (panel.id === tabId) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
};

// --- Export Document Generators ---

// Assemble formatted PDF client-side
const exportToPDF = () => {
    if (!currentData) return;
    const { video, source, analysis } = currentData;
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    
    // Page Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39); 
    doc.text("TubeMind AI - Intelligence Report", margin, 22);
    
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, 26, pageWidth - margin, 26);
    
    // Video Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229); // Accent
    doc.text("VIDEO METADATA", margin, 34);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(75, 85, 99);
    
    const splitTitle = doc.splitTextToSize(`Title: ${video.title || 'Untitled'}`, contentWidth);
    doc.text(splitTitle, margin, 40);
    
    let currentY = 40 + (splitTitle.length * 4.5);
    doc.text(`Channel: ${video.channel || 'Unknown'}`, margin, currentY);
    currentY += 5;
    
    const uploadReadable = formatUploadDate(video.upload_date);
    doc.text(`Duration: ${video.duration || '0:00'}   |   Views: ${video.views ? Number(video.views).toLocaleString() : 'N/A'}   |   Published: ${uploadReadable}`, margin, currentY);
    currentY += 7;
    
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
    
    // Metrics Row
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`COMPLEXITY: ${analysis.difficulty || 'Beginner'}`, margin, currentY);
    doc.text(`EST. STUDY TIME: ${analysis.reading_time || '1 min'}`, margin + 60, currentY);
    doc.text(`TRANSCRIPT PATH: ${source || 'youtube_captions'}`, margin + 115, currentY);
    currentY += 7;
    
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    // Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text("EXECUTIVE SUMMARY", margin, currentY);
    currentY += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    
    const summaryText = analysis.summary || 'No summary generated.';
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(splitSummary, margin, currentY);
    
    currentY += (splitSummary.length * 5) + 6;
    
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    // Takeaways
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text("KEY TAKEAWAYS", margin, currentY);
    currentY += 7;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    
    const takeaways = analysis.key_takeaways || [];
    if (takeaways.length > 0) {
        takeaways.forEach((takeaway) => {
            if (currentY > 265) {
                doc.addPage();
                currentY = 25;
            }
            const bulletText = `•  ${takeaway}`;
            const splitBullet = doc.splitTextToSize(bulletText, contentWidth - 4);
            doc.text(splitBullet, margin + 2, currentY);
            currentY += (splitBullet.length * 5) + 1.5;
        });
    } else {
        doc.text("No specific key takeaways generated.", margin, currentY);
        currentY += 8;
    }
    
    currentY += 4;
    
    // Core Concepts
    if (currentY > 245) {
        doc.addPage();
        currentY = 25;
    }
    
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 9;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Core Topics: ", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const topicsStr = (analysis.topics || []).join(", ") || "None";
    const splitTopics = doc.splitTextToSize(topicsStr, contentWidth - 30);
    doc.text(splitTopics, margin + 28, currentY);
    
    currentY += (splitTopics.length * 4.5) + 2.5;
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("Technologies: ", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const techStr = (analysis.technologies || []).join(", ") || "None";
    const splitTech = doc.splitTextToSize(techStr, contentWidth - 30);
    doc.text(splitTech, margin + 28, currentY);
    
    // Footers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("TubeMind AI Report Panel", margin, 287);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, 287);
    }
    
    const sanitizedTitle = (video.title || 'summary').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 45);
    doc.save(`${sanitizedTitle}-summary.pdf`);
    showToast("PDF document downloaded");
};

// Export to Markdown formatting
const exportToMarkdown = () => {
    if (!currentData) return;
    const { video, source, analysis } = currentData;
    
    let md = `# ${video.title || 'Report'}\n\n`;
    md += `**Channel:** ${video.channel || 'Unknown'}\n`;
    md += `**Duration:** ${video.duration || '0:00'} | **Views:** ${video.views ? Number(video.views).toLocaleString() : 'N/A'} | **Published:** ${formatUploadDate(video.upload_date)}\n\n`;
    md += `## Analytics Overview\n`;
    md += `- **Complexity Rating:** ${analysis.difficulty || 'Beginner'}\n`;
    md += `- **Estimated Study Duration:** ${analysis.reading_time || '1 min'}\n`;
    md += `- **Transcription Method:** ${source || 'youtube_captions'}\n\n`;
    md += `## Executive Summary\n`;
    md += `${analysis.summary || 'No summary available.'}\n\n`;
    md += `## Key Takeaways\n`;
    
    const takeaways = analysis.key_takeaways || [];
    if (takeaways.length > 0) {
        takeaways.forEach(takeaway => {
            md += `- ${takeaway}\n`;
        });
    } else {
        md += `*No key takeaways identified.*\n`;
    }
    
    md += `\n## Concepts & Tools\n`;
    md += `- **Topics:** ${(analysis.topics || []).join(", ") || 'None'}\n`;
    md += `- **Technologies:** ${(analysis.technologies || []).join(", ") || 'None'}\n\n`;
    md += `---\n*Generated by TubeMind AI*`;
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const sanitizedTitle = (video.title || 'summary').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 45);
    link.setAttribute("download", `${sanitizedTitle}-summary.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Markdown report exported");
};

// --- Event Listeners ---

// Form Submission
summarizeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = videoUrlInput.value.trim();
    if (url) {
        fetchVideoAnalysis(url);
    }
});

// Sidebar tab click handler
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-target');
        switchTab(targetTab);
    });
});

// New Analysis Button
newAnalysisBtn.addEventListener('click', () => {
    currentData = null;
    videoUrlInput.value = '';
    showSection(emptyState);
    renderHistoryList();
    videoUrlInput.focus();
});

// PDF download handler
downloadPDFBtn.addEventListener('click', exportToPDF);

// Markdown export handler
downloadTxtBtn.addEventListener('click', exportToMarkdown);

// Copy raw transcript
copyTranscriptBtn.addEventListener('click', async () => {
    const text = transcriptText.textContent;
    try {
        await navigator.clipboard.writeText(text);
        showToast("Transcript copied to clipboard!");
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
});

// Error Retry Trigger
retryBtn.addEventListener('click', () => {
    errorState.classList.add('hidden');
    videoUrlInput.value = '';
    showSection(emptyState);
    videoUrlInput.focus();
});

// App Startup Initializers
loadHistoryFromCache();
