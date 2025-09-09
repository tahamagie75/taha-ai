// --- الجزء 1: تعريف العناصر الأساسية من الصفحة ---
const userInput = document.getElementById('user-input');
const executeBtn = document.getElementById('execute-btn');
const resultArea = document.getElementById('result-area');
const taskSelect = document.getElementById('task-select');
const micButton = document.getElementById('micButton');
const statusElement = document.getElementById('status');

// --- الجزء 2: إعداد مفتاح و رابط Gemini API ---
// !!! مهم: استبدل "YOUR_API_KEY" بمفتاحك الحقيقي
const API_KEY = "YOUR_API_KEY"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

// --- الجزء 3: وظيفة التواصل مع الذكاء الاصطناعي ---
async function getAiResponse(task, text ) {
    const fullPrompt = `${task} "${text}"`;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            // محاولة قراءة رسالة الخطأ من الخادم
            const errorBody = await response.json();
            const errorMessage = errorBody.error?.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        // التحقق من وجود البيانات قبل محاولة الوصول إليها
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "لم يتمكن الذكاء الاصطناعي من تكوين رد. قد تكون الاستجابة فارغة.";
        }

    } catch (error) {
        console.error("Error fetching AI response:", error);
        return `حدث خطأ أثناء التواصل مع الذكاء الاصطناعي: ${error.message}`;
    }
}

// --- الجزء 4: ربط زر "نفّذ" بالوظيفة ---
if (executeBtn) {
    executeBtn.addEventListener('click', async () => {
        const task = taskSelect.value;
        const text = userInput.value;

        if (text.trim() === "") {
            resultArea.innerText = "الرجاء إدخال نص أولاً.";
            return;
        }

        resultArea.innerText = "جاري التفكير...";
        executeBtn.disabled = true;
        if (micButton) micButton.disabled = true;

        const aiResult = await getAiResponse(task, text);
        resultArea.innerText = aiResult;

        executeBtn.disabled = false;
        if (micButton) micButton.disabled = false;
    });
}

// --- الجزء 5: وظيفة الميكروفون والتعرف على الصوت ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA'; // تحديد اللغة العربية (المملكة العربية السعودية)
    recognition.interimResults = false;
    recognition.continuous = false;

    if (micButton) {
        micButton.addEventListener('click', () => {
            try {
                recognition.start();
            } catch(e) {
                console.error("لا يمكن بدء التسجيل الآن، ربما هو يعمل بالفعل.", e);
                if (statusElement) statusElement.textContent = 'خطأ: لا يمكن بدء التسجيل الآن.';
            }
        });

        recognition.onstart = () => {
            if (statusElement) statusElement.textContent = '🎤 جارٍ الاستماع...';
            micButton.style.backgroundColor = 'red';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (userInput) userInput.value = transcript;
        };

        recognition.onerror = (event) => {
            console.error('خطأ في التعرف على الصوت: ', event.error);
            if (statusElement) statusElement.textContent = 'حدث خطأ: ' + event.error;
        };

        recognition.onend = () => {
            if (statusElement) statusElement.textContent = ''; // مسح الحالة عند الانتهاء
            micButton.style.backgroundColor = '#6c757d'; // إعادة اللون الأصلي
        };
    }

} else {
    console.log("متصفحك لا يدعم ميزة التعرف على الصوت.");
    if (micButton) micButton.style.display = 'none'; // إخفاء الزر إذا كانت الميزة غير مدعومة
}
