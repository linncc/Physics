// ========== 全局变量 ==========
window.questionBank = window.questionBank || {};
const imagePath = "data/images/";

questionBank["中考"] = {
    "chapters": {
        "声学": {
            "name": "声学专题",
            "中考标记": ["声学"],
            "sections": {
                "专题训练": []
            }
        },
        "光学": {
            "name": "光学专题",
            "中考标记": ["光学"],
            "sections": {
                "专题训练": []
            }
        },
        "热学": {
            "name": "热学专题",
            "中考标记": ["热学"],
            "sections": {
                "专题训练": []
            }
        },
        "力学": {
            "name": "力学专题",
            "中考标记": ["力学"],
            "sections": {
                "专题训练": []
            }
        },
        "电学": {
            "name": "电学专题",
            "中考标记": ["电学"],
            "sections": {
                "专题训练": []
            }
        }
    }
};

// 游戏状态变量
let questions = [];
let index = 0;
let score = 0;
let combo = 0;
let maxCombo = 0;
let correctAnswers = 0;
let currentGrade = '';
let currentVolume = '';
let currentChapter = '';
let currentSection = '';
let currentMode = '';
let currentPath = [];
let timerInterval = null;
let timeLeft = 45;
let earnedBadges = [];
let wrongList = [];
let confirmCallback = null;
let gameSettings = {
    questionCount: 10,
    comboBonus: true,
    timeLimit: 45,
    theme: 'light',
    soundEffects: true,
    volume: 50,
    questionFontSize: 20,
    optionFontSize: 18,
    optionHeight: 'auto'
};
let currentReviewIndex = 0;
let audioContext = null;
let audioContextUnlocked = false;

// ========== 新增：异步加载题库相关变量 ==========
let questionBankLoaded = false;
let pendingActions = [];

// ========== 函数定义 ==========
function loadQuestionBankFiles() {
    const baseUrl = 'https://raw.githubusercontent.com/linncc/Physics/refs/heads/main/data/';
    const files = [
        'grade8_1.min.js',
        'grade8_2.min.js',
        'grade9_1.min.js',
        'grade9_2.min.js'
    ];
    const promises = files.map(file => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = baseUrl + file;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`加载失败: ${baseUrl + file}`));
            document.head.appendChild(script);
        });
    });
    return Promise.all(promises);
}

// ------- 题库处理 -------
function processQuestionImages() {
    for (let grade in questionBank) {
        if (grade === "中考") continue;
        if (!questionBank[grade].chapters) continue;
        for (let chapterKey in questionBank[grade].chapters) {
            const chapter = questionBank[grade].chapters[chapterKey];
            for (let sectionKey in chapter.sections) {
                const questions = chapter.sections[sectionKey];
                for (let i = 0; i < questions.length; i++) {
                    const question = questions[i];
                    if (question.img) {
                        if (!question.img.startsWith(imagePath) && !question.img.includes('://')) {
                            question.img = imagePath + question.img;
                        }
                    }
                }
            }
        }
    }
    
    if (questionBank.中考 && questionBank.中考.chapters) {
        for (let topicKey in questionBank.中考.chapters) {
            const topic = questionBank.中考.chapters[topicKey];
            for (let sectionKey in topic.sections) {
                const questions = topic.sections[sectionKey];
                for (let i = 0; i < questions.length; i++) {
                    const question = questions[i];
                    if (question.img) {
                        if (!question.img.startsWith(imagePath) && !question.img.includes('://')) {
                            question.img = imagePath + question.img;
                        }
                    }
                }
            }
        }
    }
}

function initQuestionBank() {
    processQuestionImages();
    initChapterTests();
    initFinalExams();
    initZhongkaoTopics();
}

function getAllQuestionsFromChapter(grade, chapterNum) {
    let allQuestions = [];
    if (!questionBank[grade] || !questionBank[grade].chapters[chapterNum]) {
        return allQuestions;
    }
    
    const chapter = questionBank[grade].chapters[chapterNum];
    for (let sectionKey in chapter.sections) {
        if (chapterNum === "期末测试") {
            const sectionQuestions = chapter.sections[sectionKey];
            if (sectionQuestions && sectionQuestions.length > 0) {
                allQuestions = allQuestions.concat(sectionQuestions);
            }
            break;
        }
        if (sectionKey === "章末测试") continue;
        const sectionQuestions = chapter.sections[sectionKey];
        if (sectionQuestions && sectionQuestions.length > 0) {
            allQuestions = allQuestions.concat(sectionQuestions);
        }
    }
    return allQuestions;
}

function initChapterTests() {
    for (let chapterKey in questionBank["八年级上册"].chapters) {
        const chapter = questionBank["八年级上册"].chapters[chapterKey];
        const allQuestions = getAllQuestionsFromChapter("八年级上册", chapterKey);
        if (allQuestions.length > 0) {
            chapter.sections["章末测试"] = shuffleArray([...allQuestions]);
        }
    }
    
    for (let chapterKey in questionBank["八年级下册"].chapters) {
        const chapter = questionBank["八年级下册"].chapters[chapterKey];
        const allQuestions = getAllQuestionsFromChapter("八年级下册", chapterKey);
        if (allQuestions.length > 0) {
            chapter.sections["章末测试"] = shuffleArray([...allQuestions]);
        }
    }
    
    for (let chapterKey in questionBank["九年级上册"].chapters) {
        const chapter = questionBank["九年级上册"].chapters[chapterKey];
        const allQuestions = getAllQuestionsFromChapter("九年级上册", chapterKey);
        if (allQuestions.length > 0) {
            chapter.sections["章末测试"] = shuffleArray([...allQuestions]);
        }
    }
    
    for (let chapterKey in questionBank["九年级下册"].chapters) {
        const chapter = questionBank["九年级下册"].chapters[chapterKey];
        const allQuestions = getAllQuestionsFromChapter("九年级下册", chapterKey);
        if (allQuestions.length > 0) {
            chapter.sections["章末测试"] = shuffleArray([...allQuestions]);
        }
    }
}

function initFinalExams() {
    initGradeFinalExam("八年级上册");
    initGradeFinalExam("八年级下册");
    initGradeFinalExam("九年级上册");
    initGradeFinalExam("九年级下册");
}

function initGradeFinalExam(gradeKey) {
    let allSectionQuestions = [];
    for (let chapterKey in questionBank[gradeKey].chapters) {
        const chapter = questionBank[gradeKey].chapters[chapterKey];
        for (let sectionKey in chapter.sections) {
            if (sectionKey === "章末测试") continue;
            const sectionQuestions = chapter.sections[sectionKey];
            if (sectionQuestions && sectionQuestions.length > 0) {
                const labeledQuestions = sectionQuestions.map(q => ({
                    ...q,
                    source: `${gradeKey} ${chapterKey} ${sectionKey}`
                }));
                allSectionQuestions = allSectionQuestions.concat(labeledQuestions);
            }
        }
    }
    
    if (allSectionQuestions.length > 0) {
        questionBank[gradeKey].chapters["期末测试"] = {
            "name": "期末测试",
            "中考标记": getGradeZhongkaoMark(gradeKey),
            "sections": {
                "期末测试": shuffleArray([...allSectionQuestions])
            }
        };
    }
}

function getGradeZhongkaoMark(gradeKey) {
    switch (gradeKey) {
        case "八年级上册": return ["声学", "光学", "热学", "力学"];
        case "八年级下册": return ["力学"];
        case "九年级上册": return ["热学", "电学"];
        case "九年级下册": return ["电学"];
        default: return [];
    }
}

function initZhongkaoTopics() {
    const soundQuestions = getAllQuestionsFromChapter("八年级上册", "第三章");
    if (soundQuestions.length > 0) {
        questionBank.中考.chapters.声学.sections.专题训练 = shuffleArray([...soundQuestions]);
    }
    
    const lightQuestions = getAllQuestionsFromChapter("八年级上册", "第四章");
    if (lightQuestions.length > 0) {
        questionBank.中考.chapters.光学.sections.专题训练 = shuffleArray([...lightQuestions]);
    }
    
    let heatQuestions = [];
    const grade5Questions = getAllQuestionsFromChapter("八年级上册", "第五章");
    if (grade5Questions.length > 0) {
        heatQuestions = heatQuestions.concat(grade5Questions);
    }
    const grade1Questions = getAllQuestionsFromChapter("九年级上册", "第一章");
    if (grade1Questions.length > 0) {
        heatQuestions = heatQuestions.concat(grade1Questions);
    }
    const grade2Questions = getAllQuestionsFromChapter("九年级上册", "第二章");
    if (grade2Questions.length > 0) {
        heatQuestions = heatQuestions.concat(grade2Questions);
    }
    if (heatQuestions.length > 0) {
        questionBank.中考.chapters.热学.sections.专题训练 = shuffleArray([...heatQuestions]);
    }
    
    let mechanicsQuestions = [];
    const grade2ch2Questions = getAllQuestionsFromChapter("八年级上册", "第二章");
    if (grade2ch2Questions.length > 0) {
        mechanicsQuestions = mechanicsQuestions.concat(grade2ch2Questions);
    }
    const grade2ch6Questions = getAllQuestionsFromChapter("八年级上册", "第六章");
    if (grade2ch6Questions.length > 0) {
        mechanicsQuestions = mechanicsQuestions.concat(grade2ch6Questions);
    }
    for (let chapterKey in questionBank["八年级下册"].chapters) {
        if (chapterKey === "期末测试") continue;
        const chapterQuestions = getAllQuestionsFromChapter("八年级下册", chapterKey);
        if (chapterQuestions.length > 0) {
            mechanicsQuestions = mechanicsQuestions.concat(chapterQuestions);
        }
    }
    if (mechanicsQuestions.length > 0) {
        questionBank.中考.chapters.力学.sections.专题训练 = shuffleArray([...mechanicsQuestions]);
    }
    
    let electricityQuestions = [];
    const chapterNumbers = ["三", "四", "五", "六", "七", "八"];
    for (let i = 0; i < chapterNumbers.length; i++) {
        let chapterKey = "第" + chapterNumbers[i] + "章";
        const chapterQuestions = getAllQuestionsFromChapter("九年级上册", chapterKey);
        if (chapterQuestions && chapterQuestions.length > 0) {
            electricityQuestions = electricityQuestions.concat(chapterQuestions);
        }
    }
    for (let chapterKey in questionBank["九年级下册"].chapters) {
        if (chapterKey === "期末测试") continue;
        const chapterQuestions = getAllQuestionsFromChapter("九年级下册", chapterKey);
        if (chapterQuestions && chapterQuestions.length > 0) {
            electricityQuestions = electricityQuestions.concat(chapterQuestions);
        }
    }
    if (electricityQuestions.length > 0) {
        questionBank.中考.chapters.电学.sections.专题训练 = shuffleArray([...electricityQuestions]);
    }
}

function shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

/**
 * 确保题库已加载，否则将操作放入等待队列
 * @param {Function} callback 需要执行的操作（通常包含对题库的访问）
 */
function ensureQuestionBankLoaded(callback) {
    if (questionBankLoaded) {
        callback();
    } else {
        pendingActions.push(callback);
        showToast('题库加载中，请稍候...');
    }
}

// 简单的 Toast 提示
function showToast(msg) {
    let toast = document.getElementById('loadingToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'loadingToast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 14px;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
}

function hideToast() {
    const toast = document.getElementById('loadingToast');
    if (toast) toast.style.display = 'none';
}

// ========== 路径导航 ==========
function updatePath() {
    const pages = ['homePage', 'volumePage', 'modePage', 'chapterPage', 'sectionPage', 'finishPage', 'reviewPage', 'settingsPage'];
    pages.forEach(page => {
        const pathDisplay = document.getElementById(page + 'PathDisplay');
        if (pathDisplay) {
            pathDisplay.innerHTML = '';
            const homePath = document.createElement('span');
            homePath.className = 'path-segment';
            homePath.textContent = '首页';
            homePath.onclick = showHome;
            pathDisplay.appendChild(homePath);
            
            for (let i = 0; i < currentPath.length; i++) {
                const separator = document.createElement('span');
                separator.className = 'path-separator';
                separator.textContent = '›';
                pathDisplay.appendChild(separator);
                
                const pathItem = document.createElement('span');
                pathItem.className = 'path-segment';
                pathItem.textContent = currentPath[i].name;
                pathItem.onclick = (function(index) {
                    return function() {
                        navigateToPath(index);
                    };
                })(i);
                pathDisplay.appendChild(pathItem);
            }
        }
    });
}

function addToPath(name, pageId, data = null) {
    currentPath.push({ name, pageId, data });
    updatePath();
}

function removeFromPath(index) {
    currentPath.splice(index + 1);
    updatePath();
}

function navigateToPath(index) {
    if (index < 0) {
        showHome();
        return;
    }
    removeFromPath(index);
    const target = currentPath[index];
    if (target.pageId === 'volumePage') {
        showVolumePage(target.data);
    } else if (target.pageId === 'modePage') {
        showModePage(target.data);
    } else if (target.pageId === 'chapterPage') {
        showChapterPage(target.data);
    } else if (target.pageId === 'sectionPage') {
        showSectionPage(target.data);
    }
}

// ========== 页面控制 ==========
function showPage(pageId) {
    const pages = ['homePage', 'volumePage', 'modePage', 'chapterPage', 'sectionPage', 'gamePage', 'finishPage', 'reviewPage', 'settingsPage'];
    pages.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
    
    const exitBtn = document.querySelector('.game-exit-btn');
    if (exitBtn) {
        exitBtn.style.display = pageId === 'gamePage' ? 'block' : 'none';
    }
    
    if (pageId !== 'gamePage' && pageId !== 'reviewPage' && pageId !== 'finishPage') {
        resetGameState();
    }
    
    updatePath();
    forceRemoveHover();
}

function forceRemoveHover() {
    document.body.classList.add('no-hover');
    setTimeout(() => {
        document.body.classList.remove('no-hover');
    }, 10);

    const allButtons = document.querySelectorAll('.option-btn, .nav-btn, .option, .grade-card');
    allButtons.forEach(btn => {
        btn.classList.remove('hover', 'hover-active');
        btn.blur();
    });
}

function getCurrentPage() {
    const pages = ['homePage', 'volumePage', 'modePage', 'chapterPage', 'sectionPage', 'gamePage', 'finishPage', 'reviewPage', 'settingsPage'];
    for (let pageId of pages) {
        if (!document.getElementById(pageId).classList.contains('hidden')) {
            return pageId;
        }
    }
    return 'homePage';
}

function goBack() {
    if (!document.getElementById('gamePage').classList.contains('hidden')) {
        showExitConfirm();
        return;
    }
    if (currentPath.length > 1) {
        navigateToPath(currentPath.length - 2);
    } else {
        showHome();
    }
}

function showHome() {
    const currentPage = getCurrentPage();
    if (currentPage !== 'finishPage' && currentPage !== 'reviewPage') {
        resetGameState();
    }
    
    showPage('homePage');
    loadLeaderboard();
    currentPath = [];
    updatePath();
}

// ------- 年级/模式选择（已用 ensureQuestionBankLoaded 包装）-------
function selectGrade(grade) {
    ensureQuestionBankLoaded(() => {
        currentGrade = grade;
        if (grade === '八年级') {
            showVolumePage(grade);
        } else if (grade === '九年级') {
            showVolumePage(grade);
        } else if (grade === '中考') {
            showModePage({ grade: grade });
        }
    });
}

function showVolumePage(grade) {
    currentGrade = grade;
    document.getElementById('volumePageTitle').textContent = grade;
    document.getElementById('volumePageSubtitle').textContent = grade === '九年级' ? '九年级分为上下两册，请选择' : '请选择上册或下册';
    
    if (currentPath.length === 0 || currentPath[0].name !== grade) {
        addToPath(grade, 'volumePage', grade);
    }
    showPage('volumePage');
}

function selectVolume(volume) {
    ensureQuestionBankLoaded(() => {
        currentVolume = volume;
        let gradeKey = currentGrade + volume;
        showChapterPage({ grade: gradeKey, volume: volume });
    });
}

function showModePage(data) {
    currentGrade = '中考';
    document.getElementById('modePageTitle').textContent = '中考专题';
    document.getElementById('modePageSubtitle').textContent = '请选择练习模式';
    
    if (currentPath.length === 0 || currentPath[0].name !== '中考') {
        addToPath('中考', 'modePage', data);
    }
    showPage('modePage');
}

function selectMode(mode) {
    ensureQuestionBankLoaded(() => {
        currentMode = mode;
        if (mode === '板块练习') {
            showChapterPage({ grade: '中考', mode: '板块练习' });
        } else if (mode === '随机练习') {
            startRandomExam();
        }
    });
}

function showChapterPage(data) {
    const gradeKey = data.grade;
    const volume = data.volume;
    const mode = data.mode;
    
    let title = '';
    let subtitle = '';
    if (gradeKey === '中考') {
        title = '中考专题';
        if (mode === '板块练习') {
            subtitle = '请选择专题板块';
        } else {
            subtitle = '请选择专题';
        }
    } else {
        if (gradeKey.startsWith('八年级')) {
            title = `八年级${volume}`;
        } else if (gradeKey.startsWith('九年级')) {
            title = `九年级${volume}`;
        }
        subtitle = '请选择章节';
    }
    
    document.getElementById('chapterPageTitle').textContent = title;
    document.getElementById('chapterPageSubtitle').textContent = subtitle;
    
    if (currentPath.length === 1) {
        if (mode) {
            addToPath(mode === '板块练习' ? '板块练习' : '专题', 'chapterPage', data);
        } else if (volume) {
            addToPath(volume, 'chapterPage', data);
        } else {
            addToPath(title, 'chapterPage', data);
        }
    }
    
    let chaptersData;
    if (gradeKey === '中考') {
        chaptersData = questionBank.中考.chapters;
    } else if (gradeKey === '九年级上册') {
        chaptersData = questionBank["九年级上册"]?.chapters;
    } else if (gradeKey === '九年级下册') {
        chaptersData = questionBank["九年级下册"]?.chapters;
    } else {
        chaptersData = questionBank[gradeKey]?.chapters;
    }
    
    if (!chaptersData) {
        alert("该教材暂无题目");
        showHome();
        return;
    }
    
    const chapterListDiv = document.getElementById('chapterList');
    chapterListDiv.innerHTML = '';
    
    for (let chapterKey in chaptersData) {
        const chapter = chaptersData[chapterKey];
        const button = document.createElement('div');
        button.className = 'option-btn';
        
        if (gradeKey === '中考') {
            let questionCount = 0;
            if (chapter.sections && chapter.sections['专题训练']) {
                questionCount = chapter.sections['专题训练'].length;
            }
            button.innerHTML = `${chapter.name}<br><small>${chapter.中考标记.join('、')}板块 · ${questionCount}题</small>`;
        } else {
            button.innerHTML = `${chapterKey}<br><small>${chapter.name}</small>`;
        }
        
        button.onclick = () => selectChapter(chapterKey, chapter.name, data);
        chapterListDiv.appendChild(button);
    }
    
    showPage('chapterPage');
}

function selectChapter(chapterKey, chapterName, data) {
    ensureQuestionBankLoaded(() => {
        currentChapter = chapterKey;
        if (data.grade === '中考' && data.mode === '板块练习') {
            currentSection = '专题训练';
            startChapterGame({ ...data, chapter: chapterKey });
            return;
        }
        const pathName = `${chapterKey} ${chapterName}`;
        addToPath(pathName, 'sectionPage', { ...data, chapter: chapterKey, chapterName: chapterName });
        showSectionPage({ ...data, chapter: chapterKey, chapterName: chapterName });
    });
}

function showSectionPage(data) {
    const gradeKey = data.grade;
    const chapterKey = data.chapter;
    const chapterName = data.chapterName;
    
    if (gradeKey === '中考' && chapterKey === '随机练习') {
        showModePage({ grade: '中考' });
        return;
    }
    
    document.getElementById('sectionPageTitle').textContent = `${data.volume || ''} ${chapterKey}`.trim();
    document.getElementById('sectionPageSubtitle').textContent = chapterName;
    
    let chapterData;
    if (gradeKey === '中考') {
        chapterData = questionBank.中考.chapters[chapterKey];
    } else if (gradeKey === '九年级上册') {
        chapterData = questionBank["九年级上册"]?.chapters?.[chapterKey];
    } else if (gradeKey === '九年级下册') {
        chapterData = questionBank["九年级下册"]?.chapters?.[chapterKey];
    } else {
        chapterData = questionBank[gradeKey]?.chapters?.[chapterKey];
    }
    
    if (!chapterData || !chapterData.sections) {
        alert("该章节暂无题目");
        return;
    }
    
    const sectionListDiv = document.getElementById('sectionList');
    sectionListDiv.innerHTML = '';
    
    for (let sectionKey in chapterData.sections) {
        const questions = chapterData.sections[sectionKey];
        const button = document.createElement('div');
        button.className = 'option-btn';
        button.innerHTML = `${sectionKey}<br><small>${questions.length}题</small>`;
        button.onclick = () => selectSection(sectionKey, data);
        sectionListDiv.appendChild(button);
    }
    
    showPage('sectionPage');
}

function selectSection(sectionKey, data) {
    currentSection = sectionKey;
    startChapterGame(data);
}

// ------- 游戏核心 -------
function startChapterGame(data) {
    const gradeKey = data.grade;
    const chapterKey = data.chapter;
    const sectionKey = currentSection;
    
    let sectionQuestions = [];
    if (gradeKey === '中考') {
        const chapterData = questionBank.中考.chapters[chapterKey];
        if (chapterData && chapterData.sections[sectionKey]) {
            sectionQuestions = chapterData.sections[sectionKey];
        }
    } else if (gradeKey === '九年级上册') {
        const gradeData = questionBank["九年级上册"];
        if (gradeData && gradeData.chapters && gradeData.chapters[chapterKey]) {
            const chapterData = gradeData.chapters[chapterKey];
            if (chapterData.sections && chapterData.sections[sectionKey]) {
                sectionQuestions = chapterData.sections[sectionKey];
            }
        }
    } else if (gradeKey === '九年级下册') {
        const gradeData = questionBank["九年级下册"];
        if (gradeData && gradeData.chapters && gradeData.chapters[chapterKey]) {
            const chapterData = gradeData.chapters[chapterKey];
            if (chapterData.sections && chapterData.sections[sectionKey]) {
                sectionQuestions = chapterData.sections[sectionKey];
            }
        }
    } else {
        const gradeData = questionBank[gradeKey];
        if (gradeData && gradeData.chapters && gradeData.chapters[chapterKey]) {
            const chapterData = gradeData.chapters[chapterKey];
            if (chapterData.sections && chapterData.sections[sectionKey]) {
                sectionQuestions = chapterData.sections[sectionKey];
            }
        }
    }
    
    if (sectionQuestions.length === 0) {
        alert("该小节暂无题目，请选择其他小节");
        return;
    }
    
    const questionCount = gameSettings.questionCount;
    let selectedQuestions = [...sectionQuestions];
    if (selectedQuestions.length > questionCount) {
        selectedQuestions = shuffleArray(selectedQuestions).slice(0, questionCount);
    }
    
    questions = shuffleArray([...selectedQuestions]);
    index = 0;
    score = 0;
    combo = 0;
    maxCombo = 0;
    correctAnswers = 0;
    earnedBadges = [];
    wrongList = [];
    timeLeft = gameSettings.timeLimit;
    
    document.getElementById('timerText').textContent = timeLeft;
    document.getElementById('timeLimitDisplay').textContent = timeLeft;
    if (timerInterval) clearInterval(timerInterval);
    
    updateBadgesDisplay();
    updateUI();
    showPage('gamePage');
    setTimeout(loadQuestion, 500);
    
    if (gameSettings.timeLimit > 0) {
        startTimer();
    }
}

function startRandomExam() {
    let allQuestions = [];
    for (let chapterKey in questionBank.中考.chapters) {
        const chapter = questionBank.中考.chapters[chapterKey];
        const sectionKey = '专题训练';
        if (chapter.sections && chapter.sections[sectionKey]) {
            const questions = chapter.sections[sectionKey];
            allQuestions = allQuestions.concat(questions);
        }
    }
    
    if (allQuestions.length === 0) {
        alert("中考专题暂无题目，请选择其他练习模式");
        return;
    }
    
    const questionCount = gameSettings.questionCount;
    let selectedQuestions = [...allQuestions];
    if (selectedQuestions.length > questionCount) {
        selectedQuestions = shuffleArray(selectedQuestions).slice(0, questionCount);
    }
    
    questions = shuffleArray([...selectedQuestions]);
    index = 0;
    score = 0;
    combo = 0;
    maxCombo = 0;
    correctAnswers = 0;
    earnedBadges = [];
    wrongList = [];
    
    addToPath('随机练习', 'gamePage');
    currentGrade = '中考';
    currentChapter = '随机练习';
    currentSection = '综合练习';
    currentMode = '随机练习';
    
    timeLeft = gameSettings.timeLimit;
    document.getElementById('timerText').textContent = timeLeft;
    document.getElementById('timeLimitDisplay').textContent = timeLeft;
    if (timerInterval) clearInterval(timerInterval);
    
    updateBadgesDisplay();
    updateUI();
    showPage('gamePage');
    setTimeout(loadQuestion, 500);
    
    if (gameSettings.timeLimit > 0) {
        startTimer();
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = gameSettings.timeLimit;
    document.getElementById('timerText').textContent = timeLeft;
    document.getElementById('timerText').style.color = 'var(--primary-color)';
    
    timerInterval = setInterval(function() {
        if (document.getElementById('gamePage').classList.contains('hidden')) {
            clearInterval(timerInterval);
            timerInterval = null;
            return;
        }
        
        timeLeft--;
        document.getElementById('timerText').textContent = timeLeft;
        
        const timerText = document.getElementById('timerText');
        if (timeLeft <= 10) {
            timerText.style.color = '#ff3333';
        } else if (timeLeft <= 20) {
            timerText.style.color = '#ff9900';
        } else {
            timerText.style.color = 'var(--primary-color)';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timeUp();
        }
    }, 1000);
}

function timeUp() {
    if (document.getElementById('gamePage').classList.contains('hidden')) {
        return;
    }
    
    document.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
    
    const currentQ = questions[index];
    const shuffledOptions = currentQ.shuffledOptions;
    let correctAnswerIndexInShuffled = -1;
    for (let i = 0; i < shuffledOptions.length; i++) {
        if (shuffledOptions[i].correct) {
            correctAnswerIndexInShuffled = i;
            break;
        }
    }
    
    wrongList.push({
        questionObj: currentQ,
        userAnswer: null,
        userSelectedIndex: -1,
        correctAnswerIndexInShuffled: correctAnswerIndexInShuffled,
        shuffledOptions: shuffledOptions,
        questionIndex: index,
        noAnswer: true
    });
    
    setTimeout(() => {
        index++;
        if (index < questions.length) {
            loadQuestion();
        } else {
            showFinishPage();
        }
    }, 1000);
}

function loadQuestion() {
    if (document.getElementById('gamePage').classList.contains('hidden')) {
        return;
    }
    
    if (index >= questions.length) {
        showFinishPage();
        return;
    }
    
    let q = questions[index];
    let questionContainer = document.getElementById("question");
    questionContainer.innerHTML = "";
    
    let questionText = document.createElement("div");
    questionText.innerText = `${index + 1}. ${q.q}`;
    questionContainer.appendChild(questionText);
    
    if (q.img) {
        let imgContainer = document.createElement("div");
        imgContainer.className = "question-image";
        let img = document.createElement("img");
        img.src = q.img;
        img.alt = "题目配图";
        img.onload = function() {};
        img.onerror = function() {
            img.style.display = "none";
            let fallbackText = document.createElement("div");
            fallbackText.className = "image-fallback";
            fallbackText.innerText = "[图片加载失败]";
            imgContainer.appendChild(fallbackText);
        };
        imgContainer.appendChild(img);
        questionContainer.appendChild(imgContainer);
    }
    
    let options = q.opts.map((opt, i) => ({
        text: opt,
        correct: i === q.ans
    }));
    
    options = shuffleArray(options);
    let optDiv = document.getElementById("options");
    optDiv.innerHTML = "";
    
    const letters = ['A', 'B', 'C', 'D'];
    options.forEach((opt, i) => {
        let div = document.createElement("div");
        div.className = "option";
        div.innerText = `${letters[i]}. ${opt.text}`;
        div.setAttribute('data-index', i);
        div.onclick = () => selectAnswer(div, opt.correct, options);
        optDiv.appendChild(div);
    });
    
    questions[index].shuffledOptions = options;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timeLeft = gameSettings.timeLimit;
    document.getElementById('timerText').textContent = timeLeft;
    document.getElementById('timerText').style.color = 'var(--primary-color)';
    
    if (gameSettings.timeLimit > 0) {
        startTimer();
    }
    
    updateProgress();
    updateRank();
    checkAndAddBadges();
}

function selectAnswer(div, isCorrect, shuffledOptions) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const currentQ = questions[index];
    const userSelectedIndex = parseInt(div.getAttribute('data-index'));
    const userAnswerText = div.innerText;
    
    if (isCorrect) {
        playSound('correct');
        div.classList.add("correct");
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        correctAnswers++;
        
        if (gameSettings.comboBonus) {
            score += 10 + combo * 2;
        } else {
            score += 10;
        }
    } else {
        playSound('wrong');
        div.classList.add("wrong");
        combo = 0;
        
        let correctAnswerIndexInShuffled = -1;
        for (let i = 0; i < shuffledOptions.length; i++) {
            if (shuffledOptions[i].correct) {
                correctAnswerIndexInShuffled = i;
                break;
            }
        }
        
        wrongList.push({
            questionObj: currentQ,
            userAnswer: userAnswerText,
            userSelectedIndex: userSelectedIndex,
            correctAnswerIndexInShuffled: correctAnswerIndexInShuffled,
            shuffledOptions: shuffledOptions,
            questionIndex: index,
            noAnswer: false
        });
    }
    
    updateUI();
    document.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
    
    setTimeout(() => {
        index++;
        if (index < questions.length) {
            loadQuestion();
        } else {
            showFinishPage();
        }
    }, 800);
}

function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("combo").innerText = combo;
    document.getElementById("fire").innerHTML = combo >= 3 ? "🔥" : "";
    updateRank();
    checkAndAddBadges();
}

function updateProgress() {
    let percent = (index / questions.length) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

function updateRank() {
    let rank;
    if (score < 50) rank = "🏅青铜";
    else if (score < 100) rank = "🥉白银";
    else if (score < 150) rank = "🥈黄金";
    else if (score < 200) rank = "🥇钻石";
    else rank = "🏆王者";
    
    document.getElementById("rank").innerText = rank;
    return rank;
}

function checkAndAddBadges() {
    const newBadges = [];
    
    if (combo >= 3 && !earnedBadges.includes('连击达人')) {
        newBadges.push({ name: '连击达人', icon: '🔥', desc: '连续答对3题' });
        earnedBadges.push('连击达人');
    }
    if (combo >= 5 && !earnedBadges.includes('连击高手')) {
        newBadges.push({ name: '连击高手', icon: '🔥', desc: '连续答对5题' });
        earnedBadges.push('连击高手');
    }
    if (combo >= 10 && !earnedBadges.includes('连击大师')) {
        newBadges.push({ name: '连击大师', icon: '🔥', desc: '连续答对10题' });
        earnedBadges.push('连击大师');
    }
    if (score >= 100 && !earnedBadges.includes('百分王者')) {
        newBadges.push({ name: '百分王者', icon: '🎯', desc: '得分达到100分' });
        earnedBadges.push('百分王者');
    }
    if (score >= 200 && !earnedBadges.includes('无敌学神')) {
        newBadges.push({ name: '无敌学神', icon: '👑', desc: '得分达到200分' });
        earnedBadges.push('无敌学神');
    }
    
    if (newBadges.length > 0) {
        updateBadgesDisplay();
    }
}

function updateBadgesDisplay() {
    const badgesList = document.getElementById('badgesList');
    if (earnedBadges.length === 0) {
        badgesList.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#999;font-size:14px;">暂无称号<br><small>达成条件后称号将显示在这里</small></div>`;
        return;
    }
    
    badgesList.innerHTML = '';
    const allBadges = [
        { id: '连击达人', name: '连击达人', icon: '🔥', desc: '连续答对3题' },
        { id: '连击高手', name: '连击高手', icon: '🔥', desc: '连续答对5题' },
        { id: '连击大师', name: '连击大师', icon: '🔥', desc: '连续答对10题' },
        { id: '百分王者', name: '百分王者', icon: '🎯', desc: '得分达到100分' },
        { id: '无敌学神', name: '无敌学神', icon: '👑', desc: '得分达到200分' },
        { id: '绝世天才', name: '绝世天才', icon: '🎖️', desc: '全部答对' }
    ];
    
    allBadges.forEach(badge => {
        if (earnedBadges.includes(badge.id)) {
            const badgeItem = document.createElement('div');
            badgeItem.className = 'badge-item active';
            badgeItem.innerHTML = `<span class="badge-icon">${badge.icon}</span><div><div style="font-weight:bold;">${badge.name}</div><small style="font-size:12px;color:#666;">${badge.desc}</small></div>`;
            badgesList.appendChild(badgeItem);
        }
    });
}

function getFinalBadges() {
    let badges = [];
    if (maxCombo >= 3) badges.push("🔥 连击达人");
    if (maxCombo >= 5) badges.push("🔥 连击高手");
    if (maxCombo >= 10) badges.push("🔥 连击大师");
    if (score >= 100) badges.push("🎯 百分王者");
    if (score >= 200) badges.push("👑 无敌学神");
    if (correctAnswers === questions.length && questions.length > 0) {
        badges.push("🎖️ 绝世天才");
        if (!earnedBadges.includes('绝世天才')) {
            earnedBadges.push('绝世天才');
        }
    }
    return badges;
}

function showFinishPage() {
    playSound('complete');
    if (document.getElementById('gamePage').classList.contains('hidden')) {
        return;
    }
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    saveLeaderboard(score);
    
    if (correctAnswers === questions.length && questions.length > 0 && !earnedBadges.includes('绝世天才')) {
        earnedBadges.push('绝世天才');
    }
    
    let rank = updateRank();
    let accuracy = Math.round((correctAnswers / questions.length) * 100);
    let badges = getFinalBadges();
    
    document.getElementById("finalScore").innerText = score;
    document.getElementById("finalCombo").innerText = maxCombo;
    document.getElementById("finalRank").innerText = rank;
    document.getElementById("accuracy").innerText = accuracy + "%";
    
    let badgeHtml = "";
    badges.forEach(badge => {
        badgeHtml += `<span style="display:inline-block; margin:2px; padding:4px 8px; background:linear-gradient(45deg,gold,#ffcc00); color:black; border-radius:6px; font-size:12px;">${badge}</span>`;
    });
    document.getElementById("finalBadges").innerHTML = badgeHtml || "无";
    
    const reviewBtn = document.getElementById('reviewBtn');
    if (wrongList.length > 0) {
        reviewBtn.style.display = 'inline-block';
    } else {
        reviewBtn.style.display = 'none';
    }
    
    if (!(currentGrade === '中考' && currentChapter === '随机练习')) {
        addToPath("完成", 'finishPage');
    } else {
        if (currentPath.length === 0 || currentPath[currentPath.length - 1].name !== '完成') {
            addToPath("完成", 'finishPage');
        }
    }
    
    showPage('finishPage');
}

// ------- 错题回顾 -------
function reviewWrongQuestions() {
    if (!wrongList || wrongList.length === 0) {
        alert("🎉 太棒了！本次没有错题！");
        return;
    }
    
    currentReviewIndex = 0;
    addToPath("错题回顾", 'reviewPage');
    showPage('reviewPage');
    renderReviewQuestion();
}

function goBackFromReview() {
    removeFromPath(currentPath.length - 1);
    showPage('finishPage');
}

function renderReviewQuestion() {
    if (wrongList.length === 0) {
        document.getElementById('reviewContainer').innerHTML = `<div class="no-wrong"><div class="no-wrong-icon">🎉</div><h3>太棒了！没有错题</h3><p>你全部答对了所有题目！</p><div class="review-action"><button class="nav-btn" onclick="goBackFromReview()">⬅️ 返回</button><button class="nav-btn" onclick="restartGame()">🔄 再次挑战</button></div></div>`;
        return;
    }
    
    const wrongItem = wrongList[currentReviewIndex];
    const q = wrongItem.questionObj;
    const letters = ['A', 'B', 'C', 'D'];
    
    document.getElementById('reviewCounter').textContent = `第 ${currentReviewIndex + 1} 题 / 共 ${wrongList.length} 题`;
    let questionText = `${wrongItem.questionIndex + 1}. ${q.q}`;
    if (wrongItem.noAnswer) {
        questionText += '（未作答）';
    }
    document.getElementById('reviewQuestion').textContent = questionText;
    
    const reviewImage = document.getElementById('reviewImage');
    reviewImage.innerHTML = '';
    if (q.img) {
        const img = document.createElement('img');
        img.src = q.img;
        img.alt = "题目配图";
        img.onerror = "this.style.display='none'";
        reviewImage.appendChild(img);
    }
    
    const reviewOptions = document.getElementById('reviewOptions');
    reviewOptions.innerHTML = '';
    
    if (wrongItem.shuffledOptions) {
        wrongItem.shuffledOptions.forEach((opt, i) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'review-option';
            if (i === wrongItem.correctAnswerIndexInShuffled) {
                optionDiv.classList.add('correct');
            } else if (i === wrongItem.userSelectedIndex && !wrongItem.noAnswer) {
                optionDiv.classList.add('wrong');
            }
            
            const optionLetter = document.createElement('div');
            optionLetter.className = 'option-letter';
            optionLetter.textContent = letters[i];
            
            const optionText = document.createElement('div');
            optionText.className = 'option-text';
            optionText.textContent = opt.text;
            
            optionDiv.appendChild(optionLetter);
            optionDiv.appendChild(optionText);
            reviewOptions.appendChild(optionDiv);
        });
    }
    
    document.getElementById('reviewAnswerInfo').style.display = 'none';
    
    document.getElementById('prevBtn').disabled = currentReviewIndex === 0;
    document.getElementById('nextBtn').disabled = currentReviewIndex === wrongList.length - 1;
}

function prevWrongQuestion() {
    if (currentReviewIndex > 0) {
        currentReviewIndex--;
        renderReviewQuestion();
    }
}

function nextWrongQuestion() {
    if (currentReviewIndex < wrongList.length - 1) {
        currentReviewIndex++;
        renderReviewQuestion();
    }
}

function restartGame() {
    resetGameState();
    
    if (currentGrade === '中考' && currentChapter === '随机练习') {
        startRandomExam();
    } else if (currentGrade && currentChapter && currentSection) {
        const data = {
            grade: currentGrade === '中考' ? '中考' : (currentVolume ? currentGrade + currentVolume : currentGrade),
            chapter: currentChapter,
            volume: currentVolume
        };
        if (currentSection && currentSection !== '随机练习') {
            selectSection(currentSection, data);
        } else {
            showChapterPage(data);
        }
    } else {
        showHome();
    }
}

// ------- 排行榜 -------
function saveLeaderboard(score) {
    let board = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    let detail = '';
    
    if (currentGrade && currentChapter && currentSection) {
        if (currentGrade === '中考') {
            if (currentChapter === '随机练习') {
                detail = `中考 · 随机练习 · 综合练习`;
            } else {
                detail = `中考 · ${currentChapter} · ${currentSection}`;
            }
        } else if (currentVolume) {
            detail = `${currentGrade}${currentVolume} · ${currentChapter} · ${currentSection}`;
        } else {
            detail = `${currentGrade} · ${currentChapter} · ${currentSection}`;
        }
    }
    
    let record = {
        score: score,
        date: new Date().toLocaleDateString(),
        detail: detail
    };
    
    board.push(record);
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 10);
    localStorage.setItem("leaderboard", JSON.stringify(board));
    loadLeaderboard();
}

function loadLeaderboard() {
    let board = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    let div = document.getElementById("leaderboard");
    div.innerHTML = "";
    
    if (board.length === 0) {
        div.innerHTML = "<p style='text-align:center;color:#aaa;'>暂无记录，成为第一个上榜的玩家吧！</p>";
        return;
    }
    
    board.forEach((item, i) => {
        div.innerHTML += `<p><span style="width:30px;text-align:center;">${i + 1}.</span>${item.score}分<small style="color:#aaa; margin-left:10px;">${item.detail || ''}</small><span style="color:#666;margin-left:auto;font-size:14px;">${item.date}</span></p>`;
    });
}

// ------- 音效 -------
function createSound(frequency, duration, volume = 0.3) {
    return function() {
        if (!gameSettings.soundEffects || gameSettings.volume === 0) return;
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * (gameSettings.volume / 100), audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {}
    };
}

function playSound(soundType) {
    if (!audioContext && gameSettings.soundEffects) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            return;
        }
    }
    
    if (!audioContext || audioContext.state === 'closed') {
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            actuallyPlaySound(soundType);
        }).catch(e => {
            console.warn('Failed to resume AudioContext for sound:', e);
        });
        return;
    }
    
    actuallyPlaySound(soundType);
}

function actuallyPlaySound(soundType) {
    if (!gameSettings.soundEffects || gameSettings.volume === 0 || !audioContext) return;

    const sounds = {
        correct: createSound(523.25, 0.2, 0.3),
        wrong: createSound(349.23, 0.2, 0.3),
        complete: function() {
            if (!gameSettings.soundEffects || gameSettings.volume === 0 || !audioContext) return;
            try {
                const frequencies = [523.25, 659.25, 783.99];
                frequencies.forEach(freq => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3 * (gameSettings.volume / 100), audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                });
            } catch (e) {
                console.warn('Failed to play complete sound:', e);
            }
        }
    };
    
    if (sounds[soundType]) {
        try {
            sounds[soundType]();
        } catch (e) {
            console.warn('Failed to play sound:', soundType, e);
        }
    }
}

// ------- 退出确认 -------
function showExitConfirm() {
    if (confirmCallback) {
        confirmCallback = null;
    }
    const modal = document.getElementById('customConfirmModal');
    modal.classList.remove('hidden');
    confirmCallback = function(confirmed) {
        modal.classList.add('hidden');
        if (confirmed) {
            exitToSectionPage();
        }
        confirmCallback = null;
    };
}

function exitToSectionPage() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    resetGameState();

    if (currentGrade === '中考') {
        if (currentMode === '随机练习') {
            let index = currentPath.findIndex(item => item.name === '中考');
            if (index !== -1) {
                removeFromPath(index);
            } else {
                currentPath = [];
                updatePath();
            }
            showModePage({ grade: '中考' });
        } else if (currentMode === '板块练习') {
            let index = currentPath.findIndex(item => item.name === '板块练习');
            if (index !== -1) {
                removeFromPath(index);
            } else {
                index = currentPath.findIndex(item => item.name === '中考');
                if (index !== -1) {
                    removeFromPath(index);
                } else {
                    currentPath = [];
                    updatePath();
                }
            }
            showChapterPage({ grade: '中考', mode: '板块练习' });
        } else {
            showHome();
        }
    } else {
        if (currentPath.length >= 2) {
            let targetIndex = currentPath.length - 2;
            if (targetIndex >= 0) {
                removeFromPath(targetIndex);
            } else {
                showHome();
                return;
            }
        } else {
            showHome();
            return;
        }
        const gradeKey = currentGrade + (currentVolume || '');
        showSectionPage({
            grade: gradeKey,
            chapter: currentChapter,
            volume: currentVolume,
            chapterName: currentChapter
        });
    }
}

function resetGameState() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    questions = [];
    index = 0;
    score = 0;
    combo = 0;
    maxCombo = 0;
    correctAnswers = 0;
    earnedBadges = [];
    wrongList = [];
    timeLeft = gameSettings.timeLimit;
    document.getElementById("timerText").textContent = timeLeft;
    document.getElementById("timerText").style.color = 'var(--primary-color)';
    document.getElementById("progressBar").style.width = "0%";
}

function initCustomConfirm() {
    const modal = document.getElementById('customConfirmModal');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    
    confirmOkBtn.addEventListener('click', function() {
        if (confirmCallback) {
            confirmCallback(true);
        }
    });
    
    confirmCancelBtn.addEventListener('click', function() {
        if (confirmCallback) {
            confirmCallback(false);
        }
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal && confirmCallback) {
            confirmCallback(false);
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden') && confirmCallback) {
            confirmCallback(false);
        }
    });
}

// ------- 设置 -------
function showSettings() {
    showPage('settingsPage');
    addToPath("设置", 'settingsPage');
}

function loadSettings() {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        gameSettings = { ...gameSettings, ...parsedSettings };
    }
    applySettings();
}

function applySettings() {
    document.getElementById('themeToggle').checked = gameSettings.theme === 'dark';
    updateTheme();
    
    document.getElementById('questionCount').value = gameSettings.questionCount;
    document.getElementById('comboBonusToggle').checked = gameSettings.comboBonus;
    document.getElementById('comboBonusLabel').textContent = gameSettings.comboBonus ? '开启' : '关闭';
    document.getElementById('timeLimit').value = gameSettings.timeLimit;
    
    document.getElementById('soundEffectToggle').checked = gameSettings.soundEffects;
    document.getElementById('soundEffectLabel').textContent = gameSettings.soundEffects ? '开启' : '关闭';
    document.getElementById('volumeSlider').value = gameSettings.volume;
    document.getElementById('volumeValue').textContent = gameSettings.volume + '%';

    document.getElementById('questionFontSizeSlider').value = gameSettings.questionFontSize;
    document.getElementById('questionFontSizeValue').textContent = gameSettings.questionFontSize + 'px';
    document.getElementById('optionFontSizeSlider').value = gameSettings.optionFontSize;
    document.getElementById('optionFontSizeValue').textContent = gameSettings.optionFontSize + 'px';
    document.getElementById('optionHeightSelect').value = gameSettings.optionHeight;

    applyStyleSettings();
}

function updateTheme() {
    if (gameSettings.theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        document.getElementById('themeLabel').textContent = '深色主题';
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        document.getElementById('themeLabel').textContent = '浅色主题';
    }
}

function applyStyleSettings() {
    document.documentElement.style.setProperty('--question-font-size', gameSettings.questionFontSize + 'px');
    document.documentElement.style.setProperty('--option-font-size', gameSettings.optionFontSize + 'px');
    document.documentElement.style.setProperty('--option-height', gameSettings.optionHeight);
}

function saveSettings() {
    gameSettings = {
        theme: document.getElementById('themeToggle').checked ? 'dark' : 'light',
        questionCount: parseInt(document.getElementById('questionCount').value),
        comboBonus: document.getElementById('comboBonusToggle').checked,
        timeLimit: parseInt(document.getElementById('timeLimit').value),
        soundEffects: document.getElementById('soundEffectToggle').checked,
        volume: parseInt(document.getElementById('volumeSlider').value),
        questionFontSize: parseInt(document.getElementById('questionFontSizeSlider').value),
        optionFontSize: parseInt(document.getElementById('optionFontSizeSlider').value),
        optionHeight: document.getElementById('optionHeightSelect').value
    };

    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    applySettings();
    goBackFromSettings();
}

function resetSettings() {
    if (confirm('确定要重置所有设置吗？')) {
        gameSettings = {
            questionCount: 10,
            comboBonus: true,
            timeLimit: 45,
            theme: 'light',
            soundEffects: true,
            volume: 50,
            questionFontSize: 20,
            optionFontSize: 18,
            optionHeight: 'auto'
        };
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
        applySettings();
    }
}

function clearLeaderboard() {
    if (confirm('确定要清除所有排行榜数据吗？')) {
        localStorage.removeItem('leaderboard');
        loadLeaderboard();
    }
}

function initSettingsEvents() {
    document.getElementById('themeToggle').addEventListener('change', function() {
        document.getElementById('themeLabel').textContent = this.checked ? '深色主题' : '浅色主题';
    });
    
    document.getElementById('comboBonusToggle').addEventListener('change', function() {
        document.getElementById('comboBonusLabel').textContent = this.checked ? '开启' : '关闭';
    });
    
    document.getElementById('soundEffectToggle').addEventListener('change', function() {
        document.getElementById('soundEffectLabel').textContent = this.checked ? '开启' : '关闭';
    });
    
    document.getElementById('volumeSlider').addEventListener('input', function() {
        document.getElementById('volumeValue').textContent = this.value + '%';
    });
    
    document.getElementById('questionFontSizeSlider').addEventListener('input', function() {
        document.getElementById('questionFontSizeValue').textContent = this.value + 'px';
    });

    document.getElementById('optionFontSizeSlider').addEventListener('input', function() {
        document.getElementById('optionFontSizeValue').textContent = this.value + 'px';
    });
}

// ------- 音频解锁 -------
function unlockAudioContext() {
    if (audioContextUnlocked) return;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
        if (audioContext.state === 'suspended') {
            console.log('AudioContext created but suspended, waiting for user gesture');
        } else {
            audioContextUnlocked = true;
        }
    } catch (e) {
        console.warn('Web Audio API not supported:', e);
    }
}

// ========== 从设置页返回上一页 ==========
function goBackFromSettings() {
    if (currentPath.length >= 2) {
        navigateToPath(currentPath.length - 2);
    } else {
        showHome();
    }
}

// ========== DOM 加载完成后执行 ==========
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    initSettingsEvents();
    loadLeaderboard();
    updatePath();
    initCustomConfirm();
    unlockAudioContext();
    loadQuestionBankFiles()
        .then(() => {
            questionBankLoaded = true;
            hideToast();
            pendingActions.forEach(fn => fn());
            pendingActions = [];
            initQuestionBank();
        })
        .catch(err => {
            console.error('题库加载失败', err);
            alert('题库加载失败，请刷新页面重试');
        });
});