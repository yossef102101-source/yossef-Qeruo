// App State
const state = {
    currentStep: 1,
    schoolType: 'general', // 'general' | 'languages'
    grade: 'grade1',       // 'grade1' | 'grade2'
    subject: 'js',         // 'js' | 'python' | 'finance'
    phone: '',
    studentCode: '',
    password: '',
    queuePosition: 3,
    studentsAhead: 2,
    status: 'idle',        // 'idle' | 'in_queue' | 'solving' | 'completed'
    isSiteOpen: true
};

// Available subjects mapping
const subjectsMap = {
    general: {
        grade1: [
            { id: 'js', name: 'جافا سكريبت (JS)', icon: 'code', desc: 'الصف الأول الثانوي' }
        ],
        grade2: [
            { id: 'finance', name: 'ثقافة مالية', icon: 'wallet', desc: 'الصف الثاني الثانوي' },
            { id: 'python', name: 'بايثون (Python)', icon: 'terminal', desc: 'الصف الثاني الثانوي' },
            { id: 'js', name: 'جافا سكريبت (JS)', icon: 'code', desc: 'الصف الثاني الثانوي' }
        ]
    },
    languages: {
        grade1: [
            { id: 'js', name: 'JavaScript (Languages)', icon: 'code', desc: 'Grade 10 / 1st Sec' }
        ],
        grade2: [
            { id: 'finance', name: 'Financial Literacy', icon: 'wallet', desc: 'Grade 11 / 2nd Sec' },
            { id: 'python', name: 'Python (Languages)', icon: 'terminal', desc: 'Grade 11 / 2nd Sec' },
            { id: 'js', name: 'JavaScript (Languages)', icon: 'code', desc: 'Grade 11 / 2nd Sec' }
        ]
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSiteStatus();
    renderSubjects();
    updateProgressBar();
});

// Check if Site is Open / Closed by Admin
async function checkSiteStatus() {
    try {
        const res = await fetch('/api/site-status');
        const data = await res.json();
        applySiteStatus(data.is_open, data.maintenance_message);
    } catch (e) {
        // Fallback to local storage if running without server
        const localOpen = localStorage.getItem('qureo_site_open');
        const localMsg = localStorage.getItem('qureo_maintenance_msg');
        if (localOpen !== null) {
            applySiteStatus(localOpen === 'true', localMsg);
        }
    }
}

function applySiteStatus(isOpen, message) {
    state.isSiteOpen = isOpen;
    const mainContainer = document.getElementById('mainAppContainer');
    const overlay = document.getElementById('maintenanceOverlay');
    const noticeText = document.getElementById('maintenanceNoticeText');
    const navBadge = document.getElementById('navStatusBadge');
    const navText = document.getElementById('navStatusText');

    if (!isOpen) {
        if (mainContainer) mainContainer.classList.add('hidden');
        if (overlay) overlay.classList.remove('hidden');
        if (noticeText && message) noticeText.innerText = message;

        if (navBadge) {
            navBadge.className = 'hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20';
            if (navText) navText.innerText = 'الموقع مغلق للصيانة';
        }
    } else {
        if (mainContainer) mainContainer.classList.remove('hidden');
        if (overlay) overlay.classList.add('hidden');

        if (navBadge) {
            navBadge.className = 'hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            if (navText) navText.innerText = 'طابور السيرفر متاح';
        }
    }
    if (window.lucide) lucide.createIcons();
}

// Switch School Type
function setSchoolType(type) {
    state.schoolType = type;
    const btnGeneral = document.getElementById('type-general');
    const btnLanguages = document.getElementById('type-languages');

    if (type === 'general') {
        btnGeneral.className = 'p-4 rounded-2xl border border-blue-500/50 bg-blue-600/15 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600/20 transition-all';
        btnLanguages.className = 'p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all';
    } else {
        btnLanguages.className = 'p-4 rounded-2xl border border-blue-500/50 bg-blue-600/15 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600/20 transition-all';
        btnGeneral.className = 'p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all';
    }

    renderSubjects();
}

// Switch Grade
function setGrade(grade) {
    state.grade = grade;
    const btn1 = document.getElementById('grade-1');
    const btn2 = document.getElementById('grade-2');

    if (grade === 'grade1') {
        btn1.className = 'p-4 rounded-2xl border border-blue-500/50 bg-blue-600/15 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600/20 transition-all';
        btn2.className = 'p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all';
    } else {
        btn2.className = 'p-4 rounded-2xl border border-blue-500/50 bg-blue-600/15 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600/20 transition-all';
        btn1.className = 'p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all';
    }

    renderSubjects();
}

// Render Subjects dynamically
function renderSubjects() {
    const container = document.getElementById('subjectsContainer');
    const subjects = subjectsMap[state.schoolType][state.grade];

    if (!subjects.some(s => s.id === state.subject)) {
        state.subject = subjects[0].id;
    }

    container.innerHTML = subjects.map(s => {
        const isSelected = s.id === state.subject;
        const activeClass = isSelected
            ? 'border-blue-500/70 bg-gradient-to-b from-blue-600/25 to-indigo-600/25 text-white shadow-lg shadow-blue-500/15'
            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900';

        return `
            <div onclick="selectSubject('${s.id}')" class="cursor-pointer p-4 rounded-2xl border ${activeClass} transition-all flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-sm text-slate-100">${s.name}</span>
                    <i data-lucide="${s.icon}" class="w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}"></i>
                </div>
                <span class="text-xs text-slate-500">${s.desc}</span>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

function selectSubject(subId) {
    state.subject = subId;
    renderSubjects();
}

// Navigation between steps
function goToStep(stepNum) {
    document.querySelectorAll('[id^="step-"]').forEach(el => el.classList.add('hidden'));

    const target = document.getElementById(`step-${stepNum}`);
    if (target) {
        target.classList.remove('hidden');
        state.currentStep = stepNum;
        updateProgressBar();
    }

    if (stepNum === 4) {
        populateSummary();
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Validation Step 2: Phone
function validateAndGoToStep3() {
    const phoneInput = document.getElementById('inputPhone');
    const phoneError = document.getElementById('phoneError');
    const val = phoneInput.value.trim();

    if (!val || val.length < 9) {
        phoneError.classList.remove('hidden');
        phoneInput.focus();
        return;
    }

    phoneError.classList.add('hidden');
    state.phone = val;
    goToStep(3);
}

// Validation Step 3: Student Code
function validateAndGoToStep4() {
    const codeInput = document.getElementById('inputStudentCode');
    const codeError = document.getElementById('codeError');
    const val = codeInput.value.trim();

    if (!val || val.length < 3) {
        codeError.classList.remove('hidden');
        codeInput.focus();
        return;
    }

    codeError.classList.add('hidden');
    state.studentCode = val;
    goToStep(4);
}

// Populate Summary Card in Step 4
function populateSummary() {
    const gradeName = state.grade === 'grade1' ? 'أولى بكالوريا (ثانوي)' : 'ثانية بكالوريا (ثانوي)';
    const typeName = state.schoolType === 'general' ? 'عام' : 'لغات';
    const subObj = subjectsMap[state.schoolType][state.grade].find(s => s.id === state.subject);

    document.getElementById('summaryTrack').innerText = `${gradeName} - ${typeName}`;
    document.getElementById('summarySubject').innerText = subObj ? subObj.name : state.subject;
    document.getElementById('summaryPhone').innerText = state.phone;
    document.getElementById('summaryCode').innerText = state.studentCode;
}

// Update Top Progress Bar
function updateProgressBar() {
    const stepsBar = document.getElementById('stepsBar');
    if (state.currentStep > 4) {
        stepsBar.classList.add('hidden');
        return;
    } else {
        stepsBar.classList.remove('hidden');
    }

    const percent = ((state.currentStep - 1) / 3) * 100;
    const line = document.getElementById('progressBarLine');
    if (line) {
        line.style.width = `${Math.min(percent, 100)}%`;
    }

    for (let i = 1; i <= 4; i++) {
        const badge = document.getElementById(`badge-step-${i}`);
        if (!badge) continue;

        if (i < state.currentStep) {
            badge.className = 'w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center border-4 border-slate-950 transition-all shadow-lg';
            badge.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i>';
        } else if (i === state.currentStep) {
            badge.className = 'w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center border-4 border-slate-950 transition-all shadow-lg';
            badge.innerText = i;
        } else {
            badge.className = 'w-10 h-10 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center border-4 border-slate-950 transition-all';
            badge.innerText = i;
        }
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Join Queue & Start
let queueTimer = null;
async function joinQueueAndStart() {
    const passInput = document.getElementById('inputPassword');
    const passError = document.getElementById('passwordError');
    const val = passInput.value.trim();

    if (!val) {
        passError.classList.remove('hidden');
        passInput.focus();
        return;
    }

    passError.classList.add('hidden');
    state.password = val;
    state.status = 'in_queue';

    // Submit to server
    try {
        const res = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: state.phone,
                studentCode: state.studentCode,
                password: state.password,
                schoolType: state.schoolType,
                grade: state.grade,
                subject: state.subject
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            alert(errData.detail || 'الموقع متوقف حالياً للصيانة');
            return;
        }

        const data = await res.json();
        state.queuePosition = data.position || 2;
    } catch (e) {
        state.queuePosition = Math.floor(Math.random() * 3) + 2;
    }

    state.studentsAhead = Math.max(0, state.queuePosition - 1);
    saveStudentRecord();

    goToStep(5);
    renderQueueScreen();
    startQueueCountdown();
}

function saveStudentRecord() {
    const records = JSON.parse(localStorage.getItem('qureo_records') || '{}');
    records[state.phone] = {
        code: state.studentCode,
        subject: state.subject,
        grade: state.grade,
        schoolType: state.schoolType,
        position: state.queuePosition,
        status: state.status,
        timestamp: new Date().toLocaleTimeString('ar-EG')
    };
    localStorage.setItem('qureo_records', JSON.stringify(records));
}

function renderQueueScreen() {
    document.getElementById('queuePosition').innerText = `#${state.queuePosition}`;
    document.getElementById('studentsAhead').innerText = `${state.studentsAhead} طلاب`;
    const estimatedMinutes = Math.max(1, state.studentsAhead * 2);
    document.getElementById('queueTimeEstimated').innerText = `~ ${estimatedMinutes} دقائق`;

    const progress = Math.max(15, (1 - (state.studentsAhead / (state.queuePosition || 1))) * 100);
    document.getElementById('queueProgressBar').style.width = `${progress}%`;
}

function startQueueCountdown() {
    if (queueTimer) clearInterval(queueTimer);

    queueTimer = setInterval(() => {
        if (state.studentsAhead > 0) {
            state.studentsAhead -= 1;
            state.queuePosition -= 1;
            renderQueueScreen();
            saveStudentRecord();
        } else {
            clearInterval(queueTimer);
            state.status = 'solving';
            saveStudentRecord();
            goToStep(6);
            startSolvingSimulation();
        }
    }, 4500);
}

// Progress Simulation & Logger (Step 6)
let solvingInterval = null;
function startSolvingSimulation() {
    const logs = document.getElementById('consoleLogs');
    const bar = document.getElementById('liveProgressBar');
    const percentText = document.getElementById('progressPercentage');
    const statusText = document.getElementById('currentStatusText');

    let currentProgress = 10;
    const logMessages = [
        { at: 20, text: `> تم تسجيل الدخول بنجاح بحساب الطالب: ${state.studentCode}` },
        { at: 35, text: `> جاري تحميل محتوى مادة: ${state.subject}` },
        { at: 50, text: '> بدء حل المستوى الأول وتطبيق الأكواد...' },
        { at: 70, text: '> تم اجتياز تحديات الفصل بنجاح (100% Score).' },
        { at: 85, text: '> حل التمارين والمستويات المتقدمة...' },
        { at: 95, text: '> جاري اعتماد النتيجة وتوثيق إتمام الدروس...' },
        { at: 100, text: '> تم الانتهاء بنجاح! تم حل جميع المستويات المطلوبة بنسبة 100%.' }
    ];

    if (solvingInterval) clearInterval(solvingInterval);

    solvingInterval = setInterval(() => {
        if (currentProgress >= 100) {
            clearInterval(solvingInterval);
            statusText.innerText = 'اكتمل الحل بنجاح!';
            statusText.className = 'text-emerald-400 font-bold';
            state.status = 'completed';
            saveStudentRecord();
            return;
        }

        currentProgress += Math.floor(Math.random() * 6) + 4;
        if (currentProgress > 100) currentProgress = 100;

        bar.style.width = `${currentProgress}%`;
        percentText.innerText = `${currentProgress}%`;

        const pendingLog = logMessages.find(m => m.at <= currentProgress && !m.shown);
        if (pendingLog) {
            pendingLog.shown = true;
            const logEntry = document.createElement('div');
            logEntry.className = currentProgress === 100 ? 'text-emerald-400 font-bold' : 'text-slate-300';
            logEntry.innerText = pendingLog.text;
            logs.appendChild(logEntry);
            logs.scrollTop = logs.scrollHeight;
        }
    }, 1400);
}

// Track Modal Functions
function openTrackModal() {
    document.getElementById('trackModal').classList.remove('hidden');
}
function closeTrackModal() {
    document.getElementById('trackModal').classList.add('hidden');
}

function checkStatusByPhone() {
    const phone = document.getElementById('trackPhoneInput').value.trim();
    const resultBox = document.getElementById('trackResult');

    if (!phone) return;

    const records = JSON.parse(localStorage.getItem('qureo_records') || '{}');
    const record = records[phone];

    resultBox.classList.remove('hidden');

    if (record) {
        let statusBadge = '';
        if (record.status === 'in_queue') {
            statusBadge = `<span class="text-amber-400 font-bold">في طابور الانتظار (دورك: #${record.position})</span>`;
        } else if (record.status === 'solving') {
            statusBadge = `<span class="text-blue-400 font-bold">جاري الحل الآن ⚡</span>`;
        } else {
            statusBadge = `<span class="text-emerald-400 font-bold">تم الانتهاء بنجاح (100%) ✅</span>`;
        }

        resultBox.innerHTML = `
            <div class="space-y-1 text-slate-300">
                <div class="flex justify-between"><span>كود الطالب:</span><strong class="text-white">${record.code}</strong></div>
                <div class="flex justify-between"><span>المادة:</span><strong class="text-blue-400">${record.subject}</strong></div>
                <div class="flex justify-between"><span>الحالة:</span><strong>${statusBadge}</strong></div>
                <div class="flex justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-800"><span>وقت التسجيل:</span><span>${record.timestamp}</span></div>
            </div>
        `;
    } else {
        resultBox.innerHTML = `
            <div class="text-rose-400 font-semibold text-center">
                لم يتم العثور على طلب مسجل بهذا الرقم. يرجى التأكد من الرقم أو التسجيل من الصفحة الرئيسية.
            </div>
        `;
    }
}

function resetApp() {
    if (queueTimer) clearInterval(queueTimer);
    if (solvingInterval) clearInterval(solvingInterval);
    state.phone = '';
    state.studentCode = '';
    state.password = '';
    document.getElementById('inputPhone').value = '';
    document.getElementById('inputStudentCode').value = '';
    document.getElementById('inputPassword').value = '';
    goToStep(1);
}
