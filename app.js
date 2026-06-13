/**
 * Pattern Adventure - Grade 3 Math Educational Website
 * Application Logic & Interactive Features
 * 
 * Developed by: Antigravity
 * Target: Grade 3 Students (ป.3)
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================================
    // 1. STATE & GLOBAL CONFIGURATION
    // ==========================================================================
    const state = {
        currentSection: "home-section",
        currentLessonTab: "lesson-basic",
        soundEnabled: true,
        unlockedLevel: 1, // Max unlocked quiz level (1-6)
        activeQuizLevel: 1, // Quiz level currently viewed (1-6)
        userBadges: {
            remembering: false,
            understanding: false,
            applying: false,
            analyzing: false,
            evaluating: false,
            creating: false
        },
        sandboxItems: [], // Items in the custom pattern creator [{type: 'shape'|'number', val: 'circle'|'5'..., color: 'pink'}]
        sandboxType: 'shapes', // 'shapes' | 'numbers'
        activePastelColor: 'pink',
        activeShapeToPlace: 'circle',
        audioCtx: null
    };

    // Synthesized Audio Cache / Settings
    const audioSettings = {
        volume: 0.15
    };

    // Colors mapping for styles
    const pastelColorMap = {
        pink: '#FF8A9A',
        blue: '#64B5F6',
        yellow: '#FFF176',
        green: '#81C784',
        purple: '#BA68C8'
    };

    // ==========================================================================
    // 2. AUDIO SYNTHESIZER (Web Audio API)
    // ==========================================================================
    const initAudio = () => {
        if (!state.audioCtx) {
            state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume();
        }
    };

    const playTone = (freq, duration, type = 'sine', delay = 0) => {
        if (!state.soundEnabled) return;
        try {
            initAudio();
            const ctx = state.audioCtx;
            
            // Create oscillators
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            
            // Envelope for click-less audio
            gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
            gainNode.gain.linearRampToValueAtTime(audioSettings.volume, ctx.currentTime + delay + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + duration);
        } catch (e) {
            console.error("Audio Synthesis error: ", e);
        }
    };

    const playClickSound = () => {
        playTone(600, 0.08, 'sine');
    };

    const playJumpSound = () => {
        // Sliding pitch for jumping sound (like "boing")
        if (!state.soundEnabled) return;
        try {
            initAudio();
            const ctx = state.audioCtx;
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.18);
            
            gainNode.gain.setValueAtTime(audioSettings.volume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {}
    };

    const playSuccessSound = () => {
        // Happy major chord arpeggio
        const tempo = 0.08;
        playTone(523.25, 0.25, 'sine', 0); // C5
        playTone(659.25, 0.25, 'sine', tempo); // E5
        playTone(783.99, 0.25, 'sine', tempo * 2); // G5
        playTone(1046.50, 0.4, 'sine', tempo * 3); // C6
    };

    const playErrorSound = () => {
        // Disappointed descending buzz
        const tempo = 0.12;
        playTone(220, 0.2, 'sawtooth', 0); // A3
        playTone(165, 0.35, 'sawtooth', tempo); // E3
    };

    const playVictorySound = () => {
        // Triumphant Fanfare
        const tempo = 0.15;
        playTone(261.63, 0.15, 'triangle', 0); // C4
        playTone(329.63, 0.15, 'triangle', tempo); // E4
        playTone(392.00, 0.15, 'triangle', tempo * 2); // G4
        playTone(523.25, 0.3, 'triangle', tempo * 3); // C5
        playTone(392.00, 0.15, 'triangle', tempo * 5); // G4
        playTone(523.25, 0.5, 'triangle', tempo * 6); // C5
    };

    // ==========================================================================
    // 3. PAGE NAVIGATION & TABS
    // ==========================================================================
    const showSection = (sectionId) => {
        // Close sidebar on mobile
        document.getElementById("appSidebar").classList.remove("active");
        
        // Update menu active buttons
        document.querySelectorAll(".menu-btn").forEach(btn => {
            if (btn.getAttribute("data-target") === sectionId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Hide all sections, show active
        document.querySelectorAll(".content-section").forEach(sec => {
            if (sec.id === sectionId) {
                sec.classList.add("active");
            } else {
                sec.classList.remove("active");
            }
        });

        state.currentSection = sectionId;
        playClickSound();

        // Custom action for entering specific screens
        if (sectionId === 'lessons-section') {
            // Re-render canvas in tab 2 just in case
            setTimeout(drawNumberLine, 100);
        }
    };

    const showLessonTab = (tabId) => {
        // Update tab buttons
        document.querySelectorAll(".tab-btn").forEach(btn => {
            if (btn.getAttribute("data-tab") === tabId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Update tab contents
        document.querySelectorAll(".tab-content").forEach(content => {
            if (content.id === tabId) {
                content.classList.add("active");
            } else {
                content.classList.remove("active");
            }
        });

        state.currentLessonTab = tabId;
        playClickSound();

        if (tabId === 'lesson-numbers') {
            setTimeout(drawNumberLine, 50);
        }
    };

    // Setup Navigation Handlers
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const target = btn.getAttribute("data-target");
            showSection(target);
        });
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-tab");
            showLessonTab(tab);
        });
    });

    // Mobile menu toggle
    document.getElementById("menuToggle").addEventListener("click", () => {
        document.getElementById("appSidebar").classList.toggle("active");
        playClickSound();
    });

    // Landing screen CTA button
    document.getElementById("startJourneyBtn").addEventListener("click", () => {
        showSection("lessons-section");
    });

    // Sound toggle listener
    document.getElementById("soundToggle").addEventListener("change", (e) => {
        state.soundEnabled = e.target.checked;
        if (state.soundEnabled) {
            initAudio();
            playClickSound();
        }
    });

    // ==========================================================================
    // 4. TOAST NOTIFICATION SYSTEM
    // ==========================================================================
    const showToast = (message, type = 'success') => {
        const container = document.getElementById("toastContainer");
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '🎉' : '❌';
        toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
        
        container.appendChild(toast);

        // Slide out after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInLeft 0.3s reverse forwards';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 2700);
    };

    // ==========================================================================
    // 5. LESSON 1: BASIC CONCEPT PATTERN REVEAL
    // ==========================================================================
    let isBasicRevealed = false;
    document.getElementById("revealBasicBtn").addEventListener("click", () => {
        const blankNode = document.getElementById("basicPatternBlank");
        const expNode = document.getElementById("basicPatternExplanation");
        const btn = document.getElementById("revealBasicBtn");
        
        if (!isBasicRevealed) {
            blankNode.innerHTML = '○<span class="sub">วงกลม</span>';
            blankNode.classList.remove("next-item");
            expNode.style.display = 'block';
            btn.innerText = 'ซ่อนเฉลย';
            playSuccessSound();
            isBasicRevealed = true;
        } else {
            blankNode.innerHTML = '? <span class="sub">ตัวถัดไปคือ?</span>';
            blankNode.classList.add("next-item");
            expNode.style.display = 'none';
            btn.innerText = 'เฉลยตัวถัดไป';
            playClickSound();
            isBasicRevealed = false;
        }
    });

    // ==========================================================================
    // 6. LESSON 2: INTERACTIVE CANVASES (NUMBER LINE HOP)
    // ==========================================================================
    const canvas = document.getElementById("numberLineCanvas");
    const ctx = canvas.getContext("2d");
    let animationFrameId = null;

    const drawNumberLine = () => {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Styling constants
        const marginX = 40;
        const lineY = height - 70;
        const numRange = 20; // Show numbers 0 to 20
        const stepWidth = (width - marginX * 2) / numRange;

        // Draw Line
        ctx.beginPath();
        ctx.moveTo(marginX, lineY);
        ctx.lineTo(width - marginX, lineY);
        ctx.strokeStyle = '#8E9F94';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw ticks and numbers
        ctx.font = 'bold 15px Itim, Kanit';
        ctx.fillStyle = '#2E7D32';
        ctx.textAlign = 'center';

        for (let i = 0; i <= numRange; i++) {
            const x = marginX + i * stepWidth;
            
            // Tick mark
            ctx.beginPath();
            ctx.moveTo(x, lineY - 8);
            ctx.lineTo(x, lineY + 8);
            ctx.strokeStyle = '#8E9F94';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Label
            ctx.fillText(i, x, lineY + 28);
        }
    };

    const animateFrogHop = (rule) => {
        const width = canvas.width;
        const height = canvas.height;
        const marginX = 40;
        const lineY = height - 70;
        const numRange = 20;
        const stepWidth = (width - marginX * 2) / numRange;

        // Determine hop sequence depending on rule
        let startVal, interval, direction;
        if (rule === 'plus2') {
            startVal = 2;
            interval = 2;
            direction = 1;
        } else if (rule === 'plus5') {
            startVal = 0;
            interval = 5;
            direction = 1;
        } else if (rule === 'minus3') {
            startVal = 17;
            interval = 3;
            direction = -1;
        }

        const maxHops = 4;
        let currentHop = 0;
        let t = 0; // Animation timer for current hop (0 to 1)

        // Cancel previous anims
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Output text setup
        const resultText = document.getElementById("hopResultText");
        let numbersList = [startVal];
        resultText.innerHTML = `แบบรูปจำนวนเริ่มต้นคือ: <strong>${startVal}</strong>`;

        const drawFrame = () => {
            drawNumberLine();

            // Draw completed hop curves
            ctx.strokeStyle = '#BA68C8';
            ctx.lineWidth = 3.5;
            ctx.setLineDash([4, 4]);

            for (let i = 0; i < currentHop; i++) {
                const fromVal = startVal + i * interval * direction;
                const toVal = fromVal + interval * direction;
                const x1 = marginX + fromVal * stepWidth;
                const x2 = marginX + toVal * stepWidth;

                // Draw arc
                ctx.beginPath();
                ctx.moveTo(x1, lineY);
                // Control point for quadratic curve
                const cpX = (x1 + x2) / 2;
                const cpY = lineY - 60;
                ctx.quadraticCurveTo(cpX, cpY, x2, lineY);
                ctx.stroke();
            }

            ctx.setLineDash([]); // Reset dash

            // Draw current active hop
            if (currentHop < maxHops) {
                const fromVal = startVal + currentHop * interval * direction;
                const toVal = fromVal + interval * direction;
                const x1 = marginX + fromVal * stepWidth;
                const x2 = marginX + toVal * stepWidth;

                // Current coordinates of the frog
                const currX = x1 + (x2 - x1) * t;
                // Parabola equation for height
                const heightOffset = 60 * Math.sin(t * Math.PI);
                const currY = lineY - heightOffset;

                // Draw curve path up to current t
                ctx.beginPath();
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 4;
                ctx.moveTo(x1, lineY);
                const cpX = x1 + (x2 - x1) * t / 2;
                const cpY = lineY - (60 * Math.sin(t/2 * Math.PI)) * 1.5;
                ctx.quadraticCurveTo(cpX, cpY, currX, currY);
                ctx.stroke();

                // Draw Hopping Frog Mascot
                drawFrogIcon(currX, currY);

                // Increment t
                t += 0.04;
                if (t >= 1) {
                    t = 0;
                    currentHop++;
                    const nextNum = startVal + currentHop * interval * direction;
                    numbersList.push(nextNum);
                    resultText.innerHTML = `น้องกบกระโดดทีละ ${direction > 0 ? '+' : '-'}${interval}: <strong>${numbersList.join(', ')}</strong>`;
                    playJumpSound();
                }
                animationFrameId = requestAnimationFrame(drawFrame);
            } else {
                // Hops completed, draw frog at final resting spot
                const finalVal = startVal + maxHops * interval * direction;
                const finalX = marginX + finalVal * stepWidth;
                drawFrogIcon(finalX, lineY);
                
                resultText.innerHTML = `แบบรูปจำนวน: <strong>${numbersList.join(', ')}, ...</strong> มีกฎคือ <strong>"${direction > 0 ? 'เพิ่มขึ้น' : 'ลดลง'}ทีละ ${interval}"</strong> จ้า! อ๊บ! 🐸💚`;
            }
        };

        const drawFrogIcon = (x, y) => {
            ctx.save();
            ctx.translate(x, y - 20); // Center frog above line
            
            // Frog Body
            ctx.fillStyle = '#81C784';
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 12, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Frog eyes
            ctx.fillStyle = '#81C784';
            ctx.beginPath();
            ctx.arc(-8, -8, 6, 0, 2 * Math.PI);
            ctx.arc(8, -8, 6, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-8, -8, 4, 0, 2 * Math.PI);
            ctx.arc(8, -8, 4, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(-7, -8, 2, 0, 2 * Math.PI);
            ctx.arc(7, -8, 2, 0, 2 * Math.PI);
            ctx.fill();

            // Cheek blush
            ctx.fillStyle = '#FF8A9A';
            ctx.beginPath();
            ctx.arc(-10, 2, 2.5, 0, 2 * Math.PI);
            ctx.arc(10, 2, 2.5, 0, 2 * Math.PI);
            ctx.fill();

            // Smile
            ctx.beginPath();
            ctx.arc(0, 2, 4, 0, Math.PI);
            ctx.strokeStyle = '#1B5E20';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();
        };

        playJumpSound();
        drawFrame();
    };

    document.getElementById("startHopBtn").addEventListener("click", () => {
        const rule = document.getElementById("hopRuleSelect").value;
        animateFrogHop(rule);
    });

    // ==========================================================================
    // 7. LESSON 3: MINI QUIZ SHAPES
    // ==========================================================================
    const registerLessonShapeQuiz = () => {
        const handleOptionClick = (e) => {
            const btn = e.currentTarget;
            const val = btn.getAttribute("data-val");
            const feedback = document.getElementById("lessonShapeFeedback");
            
            playClickSound();
            
            // Remove previous selections
            document.querySelectorAll(".shape-opt-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");

            if (val === 'square') {
                feedback.innerText = "เก่งมากเลยอ๊บ! 🍊 สี่เหลี่ยมสีส้มคือคำตอบที่ถูกต้อง (เพราะเรียงสลับ วงกลมน้ำเงิน, สี่เหลี่ยมส้ม)";
                feedback.className = "feedback-text correct text-center";
                playSuccessSound();
            } else {
                feedback.innerText = "ยังไม่ถูกน้าอ๊บ ลองดูใหม่อีกครั้งซิว่ารูปถัดไปต้องเป็นสี่เหลี่ยมสีส้มหรือเปล่า?";
                feedback.className = "feedback-text incorrect text-center";
                playErrorSound();
            }
        };

        document.getElementById("shapeOpt1").addEventListener("click", handleOptionClick);
        document.getElementById("shapeOpt2").addEventListener("click", handleOptionClick);
    };
    registerLessonShapeQuiz();

    // ==========================================================================
    // 8. BLOOM'S TAXONOMY QUIZ CONTROLLER
    // ==========================================================================
    const badgeElements = {
        remembering: document.getElementById("badge-remembering"),
        understanding: document.getElementById("badge-understanding"),
        applying: document.getElementById("badge-applying"),
        analyzing: document.getElementById("badge-analyzing"),
        evaluating: document.getElementById("badge-evaluating"),
        creating: document.getElementById("badge-creating")
    };

    const mapNodes = [
        document.getElementById("level1Node"),
        document.getElementById("level2Node"),
        document.getElementById("level3Node"),
        document.getElementById("level4Node"),
        document.getElementById("level5Node"),
        document.getElementById("level6Node")
    ];

    const unlockBadge = (badgeKey) => {
        if (!state.userBadges[badgeKey]) {
            state.userBadges[badgeKey] = true;
            const el = badgeElements[badgeKey];
            if (el) {
                el.classList.remove("locked");
                el.classList.add("unlocked");
            }
            showToast(`ปลดล็อกเหรียญตรา: ${badgeKey.toUpperCase()} สำเร็จ!`, 'success');
        }
    };

    const unlockNextLevel = (completedLevelNum) => {
        if (state.unlockedLevel === completedLevelNum) {
            state.unlockedLevel = completedLevelNum + 1;
        }
        
        // Update nodes in map
        mapNodes.forEach((node, idx) => {
            const lvl = idx + 1;
            if (lvl <= state.unlockedLevel) {
                node.classList.remove("disabled");
            }
            if (lvl < state.unlockedLevel) {
                node.classList.add("completed");
            }
        });

        // Switch to the next node automatically
        if (completedLevelNum < 6) {
            setTimeout(() => {
                selectQuizLevel(completedLevelNum + 1);
            }, 1800);
        }
    };

    const selectQuizLevel = (levelNum) => {
        if (levelNum > state.unlockedLevel) {
            showToast("น้องต้องปลดล็อกด่านก่อนหน้านี้ให้สำเร็จก่อนนะอ๊บ!", "error");
            playErrorSound();
            return;
        }

        state.activeQuizLevel = levelNum;
        playClickSound();

        // Update map active class
        mapNodes.forEach((node, idx) => {
            if (idx + 1 === levelNum) {
                node.classList.add("active");
            } else {
                node.classList.remove("active");
            }
        });

        // Toggle active content card
        document.querySelectorAll(".level-content").forEach((content, idx) => {
            if (idx + 1 === levelNum) {
                content.classList.add("active");
            } else {
                content.classList.remove("active");
            }
        });
    };

    // Map Nodes Click Handlers
    mapNodes.forEach((node, idx) => {
        node.addEventListener("click", () => {
            selectQuizLevel(idx + 1);
        });
    });

    // --- LEVEL 1: Remembering ---
    document.getElementById("level1SubmitBtn").addEventListener("click", () => {
        const inputVal = document.getElementById("level1Answer").value.trim();
        const fb = document.getElementById("level1Feedback");
        
        if (inputVal === "") {
            showToast("กรุณาพิมพ์ตัวเลขคำตอบก่อนนะอ๊บ!", "error");
            playErrorSound();
            return;
        }

        if (parseInt(inputVal) === 8) {
            fb.innerText = "ถูกต้องแล้วอ๊บ! 2, 4, 6 ถัดไปคือ 8 (เพิ่มขึ้นทีละ 2)";
            fb.className = "feedback-area correct";
            playSuccessSound();
            unlockBadge("remembering");
            unlockNextLevel(1);
        } else {
            fb.innerText = "ยังไม่ถูกน้าอ๊บ ลองบวกเพิ่มทีละ 2 จากเลข 6 ดูอีกทีสิ!";
            fb.className = "feedback-area incorrect";
            playErrorSound();
        }
    });

    // --- LEVEL 2: Understanding ---
    document.getElementById("level2SubmitBtn").addEventListener("click", () => {
        const selected = document.querySelector('input[name="level2Answer"]:checked');
        const fb = document.getElementById("level2Feedback");

        if (!selected) {
            showToast("กรุณาเลือกคำตอบข้อใดข้อหนึ่งก่อนนะอ๊บ!", "error");
            playErrorSound();
            return;
        }

        // Check if selected options styling
        document.querySelectorAll("#level-content-2 .choice-item").forEach(item => {
            item.classList.remove("selected");
        });
        selected.closest(".choice-item").classList.add("selected");

        if (selected.value === 'B') {
            fb.innerText = "ถูกต้อง! แบบรูป 10, 20, 30, 40 เป็นการเพิ่มขึ้นทีละ 10";
            fb.className = "feedback-area correct";
            playSuccessSound();
            unlockBadge("understanding");
            unlockNextLevel(2);
        } else {
            fb.innerText = "ยังไม่ถูกจ้า 10 ไป 20 ไป 30 ค่ามันเพิ่มขึ้นหรือลดลงทีละเท่าไหร่กันแน่นะ?";
            fb.className = "feedback-area incorrect";
            playErrorSound();
        }
    });

    // Highlight choices on click for MCQ
    document.querySelectorAll(".choice-item input").forEach(input => {
        input.addEventListener("click", (e) => {
            const parent = e.currentTarget.closest(".choice-item");
            const siblings = parent.parentElement.querySelectorAll(".choice-item");
            siblings.forEach(s => s.classList.remove("selected"));
            parent.classList.add("selected");
            playClickSound();
        });
    });

    // --- LEVEL 3: Applying ---
    let l3SelectedVal = null;
    const l3Btns = [
        document.getElementById("l3OptCircle"),
        document.getElementById("l3OptSquare")
    ];
    l3Btns.forEach(btn => {
        btn.addEventListener("click", () => {
            l3SelectedVal = btn.getAttribute("data-val");
            l3Btns.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            playClickSound();
        });
    });

    document.getElementById("level3SubmitBtn").addEventListener("click", () => {
        const fb = document.getElementById("level3Feedback");
        if (!l3SelectedVal) {
            showToast("เลือกรูปภาพด้านล่างเพื่อตอบคำถามก่อนอ๊บ!", "error");
            playErrorSound();
            return;
        }

        if (l3SelectedVal === 'circle') {
            fb.innerText = "สุดยอดเลยอ๊บ! ตัวถัดไปก็คือ วงกลมสีชมพู (เพราะรูปจัดเรียงสลับสิบ วงกลม-สี่เหลี่ยม)";
            fb.className = "feedback-area correct";
            playSuccessSound();
            unlockBadge("applying");
            unlockNextLevel(3);
        } else {
            fb.innerText = "อ๊ะ! แบบรูปสลับ วงกลมชมพู กับสี่เหลี่ยมฟ้า ดูกล่องก่อนหน้าเป็นสี่เหลี่ยมแล้วนะ ลองดูใหม่!";
            fb.className = "feedback-area incorrect";
            playErrorSound();
        }
    });

    // --- LEVEL 4: Analyzing ---
    document.getElementById("level4SubmitBtn").addEventListener("click", () => {
        const selected = document.querySelector('input[name="level4Answer"]:checked');
        const fb = document.getElementById("level4Feedback");

        if (!selected) {
            showToast("วิเคราะห์แล้วเลือกคำตอบก่อนส่งนะอ๊บ!", "error");
            playErrorSound();
            return;
        }

        if (selected.value === 'B') {
            fb.innerHTML = "ยอดเยี่ยมมาก! อนุกรมคือ 3, 6, 9, 12 ซึ่งเพิ่มขึ้นทีละ 3<br>ตัวถัดไปสองตัวคือ 15 และ 18 (15 + 18 = 33) วิเคราะห์ได้เก่งมาก!";
            fb.className = "feedback-area correct";
            playSuccessSound();
            unlockBadge("analyzing");
            unlockNextLevel(4);
        } else {
            fb.innerText = "ยังไม่ถูกต้องจ้า ลองเขียนลำดับตัวเลขเพิ่มทีละ 3 ต่อจาก 12 ไปอีกสองตัวดูสิ แล้วเอามาบวกกัน!";
            fb.className = "feedback-area incorrect";
            playErrorSound();
        }
    });

    // --- LEVEL 5: Evaluating ---
    document.getElementById("level5SubmitBtn").addEventListener("click", () => {
        const selected = document.querySelector('input[name="level5Answer"]:checked');
        const fb = document.getElementById("level5Feedback");

        if (!selected) {
            showToast("กรุณาเลือกประเมินคำตอบก่อนอ๊บ!", "error");
            playErrorSound();
            return;
        }

        if (selected.value === 'B') {
            fb.innerText = "เก่งมาก! ลิลลี่ตอบผิดจริงๆ ด้วย เพราะความสัมพันธ์คือเพิ่มทีละ 3 (+3) ลำดับตัวเลขต้องเป็น 5, 8, 11, 14, 17 ไม่ใช่ 18";
            fb.className = "feedback-area correct";
            playSuccessSound();
            unlockBadge("evaluating");
            unlockNextLevel(5);
        } else if (selected.value === 'A') {
            fb.innerText = "เอ๋! ลิลลี่คำนวณถูกหรอ? ลองนับเพิ่มจาก 14 ไปอีก 3 ดูนะอ๊บ!";
            fb.className = "feedback-area incorrect";
            playErrorSound();
        } else {
            fb.innerText = "เกือบแล้วอ๊บ! กฎคือเพิ่มทีละ 3 นะไม่ใช่ 4 สังเกต 5 ไป 8 หรือ 8 ไป 11 ให้ดีจ้า";
            fb.className = "feedback-area incorrect";
            playErrorSound();
        }
    });

    // --- LEVEL 6: Creating Jump ---
    document.getElementById("goToCreatorBtn").addEventListener("click", () => {
        showSection("creator-section");
    });

    // ==========================================================================
    // 9. PATTERN CREATOR / SANDBOX LOGIC
    // ==========================================================================
    const sandboxCanvas = document.getElementById("sandboxCanvas");
    const shapeConfigPanel = document.getElementById("creatorShapeConfig");
    const numberConfigPanel = document.getElementById("creatorNumberConfig");
    const currentRuleText = document.getElementById("currentRuleText");

    // Toggle Type shapes or numbers
    document.getElementById("creatorTypeShape").addEventListener("click", () => {
        document.getElementById("creatorTypeShape").classList.add("active");
        document.getElementById("creatorTypeNumber").classList.remove("active");
        shapeConfigPanel.style.display = "block";
        numberConfigPanel.style.display = "none";
        state.sandboxType = "shapes";
        clearSandbox();
        playClickSound();
    });

    document.getElementById("creatorTypeNumber").addEventListener("click", () => {
        document.getElementById("creatorTypeShape").classList.remove("active");
        document.getElementById("creatorTypeNumber").classList.add("active");
        shapeConfigPanel.style.display = "none";
        numberConfigPanel.style.display = "block";
        state.sandboxType = "numbers";
        clearSandbox();
        playClickSound();
    });

    // Select shape from palette
    document.querySelectorAll(".palette-item").forEach(btn => {
        btn.addEventListener("click", () => {
            const shape = btn.getAttribute("data-shape");
            state.activeShapeToPlace = shape;
            
            // Add item to sandbox
            if (state.sandboxItems.length >= 8) {
                showToast("ใส่ลวดลายได้สูงสุด 8 ชิ้นนะอ๊บ เพื่อความสวยงาม!", "error");
                playErrorSound();
                return;
            }
            
            state.sandboxItems.push({
                type: 'shape',
                val: shape,
                color: state.activePastelColor
            });

            playClickSound();
            renderSandbox();
        });
    });

    // Select color from palette
    document.querySelectorAll(".color-item").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".color-item").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.activePastelColor = btn.getAttribute("data-color");
            playClickSound();
        });
    });

    // Clear Sandbox
    const clearSandbox = () => {
        state.sandboxItems = [];
        document.getElementById("creatorRuleInput").value = "";
        currentRuleText.innerText = "ยังไม่ได้กำหนดกฎ";
        renderSandbox();
    };
    document.getElementById("clearCreatorBtn").addEventListener("click", () => {
        clearSandbox();
        playClickSound();
    });

    // Render elements inside sandbox preview
    const renderSandbox = () => {
        sandboxCanvas.innerHTML = "";
        
        if (state.sandboxItems.length === 0) {
            sandboxCanvas.innerHTML = '<p class="placeholder-text" id="sandboxPlaceholder">ยังไม่มีลายแบบรูป ลองคลิกเลือกรูปแบบหรือสีด้านซ้ายเพื่อแต่งเติมนะอ๊บ!</p>';
            return;
        }

        state.sandboxItems.forEach((item, index) => {
            const div = document.createElement("div");
            div.className = `sandbox-item color-${item.color}`;
            
            if (item.type === 'shape') {
                if (item.val === 'circle') div.innerHTML = '●';
                else if (item.val === 'square') div.innerHTML = '■';
                else if (item.val === 'triangle') div.innerHTML = '▲';
                else if (item.val === 'star') div.innerHTML = '★';
                else if (item.val === 'heart') div.innerHTML = '❤';
            } else {
                // Numbers
                div.classList.add("item-number");
                div.innerText = item.val;
            }

            // Remove click
            div.addEventListener("click", () => {
                state.sandboxItems.splice(index, 1);
                playErrorSound();
                renderSandbox();
            });

            sandboxCanvas.appendChild(div);
        });

        // Trigger dynamic certificate unlock eligibility
        checkCreatingEligibility();
    };

    // Numbers Generation logic
    document.getElementById("generateNumPatternBtn").addEventListener("click", () => {
        const start = parseInt(document.getElementById("numStart").value) || 0;
        const interval = parseInt(document.getElementById("numInterval").value) || 0;
        const dir = document.getElementById("numDirection").value;

        if (interval <= 0) {
            showToast("กฎการกระโดดต้องมากกว่า 0 นะอ๊บ!", "error");
            playErrorSound();
            return;
        }

        // Generate 6 numbers
        state.sandboxItems = [];
        for (let i = 0; i < 6; i++) {
            const val = dir === 'up' ? start + i * interval : start - i * interval;
            state.sandboxItems.push({
                type: 'number',
                val: val,
                color: 'green' // Default green for numbers
            });
        }

        // Set rule text automatically
        const autoRule = `${dir === 'up' ? 'เพิ่มขึ้น' : 'ลดลง'}ทีละ ${interval}`;
        document.getElementById("creatorRuleInput").value = autoRule;
        currentRuleText.innerText = autoRule;

        playSuccessSound();
        renderSandbox();
    });

    // Rule input changes
    document.getElementById("creatorRuleInput").addEventListener("input", (e) => {
        const ruleVal = e.target.value.trim();
        currentRuleText.innerText = ruleVal !== "" ? ruleVal : "ยังไม่ได้กำหนดกฎ";
    });

    // Verify if player has built enough patterns to unlock creating badge (at least 5 elements)
    const checkCreatingEligibility = () => {
        const ruleVal = document.getElementById("creatorRuleInput").value.trim();
        const alertBox = document.getElementById("creatingBadgeAlert");
        
        if (state.sandboxItems.length >= 5 && ruleVal !== "") {
            alertBox.style.display = "flex";
            unlockBadge("creating");
            // Mark node completed
            mapNodes[5].classList.add("completed");
        } else {
            alertBox.style.display = "none";
        }
    };

    // Watch rule changes to update eligibility
    document.getElementById("creatorRuleInput").addEventListener("blur", checkCreatingEligibility);

    // ==========================================================================
    // 10. CERTIFICATE RENDER & GENERATION (HTML5 Canvas)
    // ==========================================================================
    const certCanvas = document.getElementById("certCanvas");
    const certCtx = certCanvas.getContext("2d");

    const renderCertificate = (studentName, patternItems, patternRule) => {
        const w = certCanvas.width;
        const h = certCanvas.height;

        // Clear
        certCtx.clearRect(0, 0, w, h);

        // 1. Draw Background (Pastel Creamy White)
        certCtx.fillStyle = '#FAFDFC';
        certCtx.fillRect(0, 0, w, h);

        // 2. Draw Borders
        // Outer pastel green border
        certCtx.strokeStyle = '#A5D6A7';
        certCtx.lineWidth = 14;
        certCtx.strokeRect(10, 10, w - 20, h - 20);

        // Inner golden border dashed/dotted
        certCtx.strokeStyle = '#FFF176';
        certCtx.lineWidth = 3;
        certCtx.setLineDash([8, 6]);
        certCtx.strokeRect(22, 22, w - 44, h - 44);
        certCtx.setLineDash([]); // reset

        // Decorative corner leaf structures
        drawCornerDeco(certCtx, 30, 30, 0);
        drawCornerDeco(certCtx, w - 30, 30, Math.PI / 2);
        drawCornerDeco(certCtx, 30, h - 30, -Math.PI / 2);
        drawCornerDeco(certCtx, w - 30, h - 30, Math.PI);

        // 3. Draw Title (Ribbon banner)
        certCtx.fillStyle = '#E8F5E9';
        certCtx.beginPath();
        certCtx.roundRect(w/2 - 180, 40, 360, 45, 12);
        certCtx.fill();
        certCtx.strokeStyle = '#A5D6A7';
        certCtx.lineWidth = 2.5;
        certCtx.stroke();

        certCtx.font = 'bold 22px Itim, Kanit';
        certCtx.fillStyle = '#1B5E20';
        certCtx.textAlign = 'center';
        certCtx.fillText('🏆 เกียรติบัตรยอดนักคิดคณิตศาสตร์', w/2, 70);

        // 4. Content Text
        certCtx.font = '16px Kanit';
        certCtx.fillStyle = '#5C7063';
        certCtx.fillText('เกียรติบัตรฉบับนี้มอบให้เพื่อแสดงว่า', w/2, 132);

        // Student Name (Thick Green font)
        certCtx.font = 'bold 28px Itim, Kanit';
        certCtx.fillStyle = '#2E7D32';
        certCtx.fillText(studentName || 'เด็กชาย / เด็กหญิง คู่คิดคณิตศาสตร์', w/2, 175);

        // Divider
        certCtx.strokeStyle = '#E2ECE5';
        certCtx.lineWidth = 1.5;
        certCtx.beginPath();
        certCtx.moveTo(w/2 - 120, 195);
        certCtx.lineTo(w/2 + 120, 195);
        certCtx.stroke();

        // achievement statement
        certCtx.font = '14px Kanit';
        certCtx.fillStyle = '#5C7063';
        certCtx.fillText('ได้เรียนรู้และฝึกทักษะคณิตศาสตร์ ป.3 เรื่อง "แบบรูป (Patterns)" ครบทั้ง 6 ด่าน', w/2, 222);
        certCtx.fillText('ตามอนุกรมวิธานของบลูม (Bloom’s Taxonomy) และออกแบบสร้างสรรค์ผลงานได้สำเร็จ', w/2, 243);

        // 5. Render Placed Pattern
        certCtx.font = 'bold 12px Kanit';
        certCtx.fillStyle = '#8E9F94';
        certCtx.fillText('🎨 ผลงานแบบรูปฝีมือของฉัน:', w/2 - 120, 276);

        // Draw Pattern Items on Canvas
        const itemWidth = 32;
        const spacing = 12;
        const totalItems = patternItems.length;
        const totalPatternWidth = totalItems * itemWidth + (totalItems - 1) * spacing;
        const startX = w/2 - totalPatternWidth / 2;
        const itemY = 300;

        patternItems.forEach((item, index) => {
            const x = startX + index * (itemWidth + spacing);
            
            // Draw shape/bubble container
            certCtx.fillStyle = pastelColorMap[item.color] || '#A5D6A7';
            certCtx.beginPath();
            certCtx.roundRect(x - itemWidth/2, itemY - itemWidth/2, itemWidth, itemWidth, 6);
            certCtx.fill();
            certCtx.strokeStyle = '#FFFFFF';
            certCtx.lineWidth = 1.5;
            certCtx.stroke();

            // Text content inside bubble
            certCtx.font = 'bold 18px Itim, Kanit';
            certCtx.fillStyle = item.color === 'yellow' ? '#2E3E33' : '#FFFFFF';
            certCtx.textAlign = 'center';
            certCtx.textBaseline = 'middle';

            let symbol = '';
            if (item.type === 'shape') {
                if (item.val === 'circle') symbol = '●';
                else if (item.val === 'square') symbol = '■';
                else if (item.val === 'triangle') symbol = '▲';
                else if (item.val === 'star') symbol = '★';
                else if (item.val === 'heart') symbol = '❤';
            } else {
                symbol = item.val;
            }
            certCtx.fillText(symbol, x, itemY);
        });
        certCtx.textBaseline = 'alphabetic'; // reset

        // Draw Rule Text
        certCtx.font = 'italic 13px Kanit';
        certCtx.fillStyle = '#2E7D32';
        certCtx.textAlign = 'center';
        certCtx.fillText(`(กฎความสัมพันธ์: ${patternRule || 'แบบรูปส่วนตัว'})`, w/2, 342);

        // 6. Signatures
        // Left signature: Mascot "กบอ๊บอ๊บ"
        certCtx.font = '13px Kanit';
        certCtx.fillStyle = '#8E9F94';
        certCtx.fillText('ครูอ๊บอ๊บ 🐸', w/2 - 130, 395);
        certCtx.font = '11px Kanit';
        certCtx.fillText('ผู้ชี้นำความสนุก', w/2 - 130, 410);

        // Right signature: Date stamp
        const today = new Date();
        const dateStr = `${today.getDate()} ม.ย. ${today.getFullYear() + 543}`;
        certCtx.font = '13px Kanit';
        certCtx.fillStyle = '#8E9F94';
        certCtx.fillText(dateStr, w/2 + 130, 395);
        certCtx.font = '11px Kanit';
        certCtx.fillText('วันที่ผจญภัยสำเร็จ', w/2 + 130, 410);
    };

    // Helper to draw decorative flowers/leaves at corners
    const drawCornerDeco = (ctx, x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        
        ctx.fillStyle = '#81C784';
        // Draw 3 small leaf shapes
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 5, Math.PI / 4, 0, 2 * Math.PI);
        ctx.ellipse(0, 0, 14, 5, -Math.PI / 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#FFF176';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    };

    // Action button generate certificate
    document.getElementById("generateCertBtn").addEventListener("click", () => {
        const ruleVal = document.getElementById("creatorRuleInput").value.trim();
        const studentName = document.getElementById("studentNameInput").value.trim();

        if (state.sandboxItems.length < 5) {
            showToast("แบบรูปต้องมีความยาวอย่างน้อย 5 ชิ้นก่อนอ๊บ!", "error");
            playErrorSound();
            return;
        }

        if (ruleVal === "") {
            showToast("กรุณาเขียนคำอธิบายกฎของแบบรูปก่อนนะอ๊บ!", "error");
            playErrorSound();
            return;
        }

        // Verify if unlocked level 6
        if (!state.userBadges.creating) {
            showToast("ด่านขั้นสร้างสรรค์ต้องปลดล็อกก่อนน้าอ๊บ!", "error");
            playErrorSound();
            return;
        }

        if (studentName === "") {
            showToast("กรุณาพิมพ์ชื่อของน้องๆ ก่อนรับใบประกาศนียบัตรอ๊บ!", "error");
            playErrorSound();
            return;
        }

        // Render certificate on canvas
        renderCertificate(studentName, state.sandboxItems, ruleVal);
        
        // Show modal
        const certModal = document.getElementById("certModal");
        certModal.classList.add("active");
        playVictorySound();
    });

    // Close modal
    document.getElementById("closeCertModal").addEventListener("click", () => {
        document.getElementById("certModal").classList.remove("active");
        playClickSound();
    });

    // Print certificate
    document.getElementById("printCertBtn").addEventListener("click", () => {
        // Create an iframe to print the canvas content cleanly
        const dataUrl = certCanvas.toDataURL();
        const windowContent = '<!DOCTYPE html><html><head><title>Print Certificate</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="' + dataUrl + '" style="max-width:100%;height:auto;" onload="window.print();window.close();" /></body></html>';
        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(windowContent);
        printWindow.document.close();
        playClickSound();
    });

    // Download certificate image
    document.getElementById("downloadCertBtn").addEventListener("click", () => {
        const link = document.createElement('a');
        link.download = 'young_thinker_pattern_certificate.png';
        link.href = certCanvas.toDataURL();
        link.click();
        showToast("ดาวน์โหลดภาพใบประกาศสำเร็จแล้วอ๊บ! 💚🏆", "success");
        playSuccessSound();
    });

    // ==========================================================================
    // 11. INITIALIZATION ACTIONS
    // ==========================================================================
    
    // Initial draw on line canvas
    drawNumberLine();

    // Map lock states synchronization
    const syncLevelMapLockStates = () => {
        mapNodes.forEach((node, idx) => {
            const lvl = idx + 1;
            if (lvl <= state.unlockedLevel) {
                node.classList.remove("disabled");
            } else {
                node.classList.add("disabled");
            }
        });
    };
    syncLevelMapLockStates();

    // Prompt user to click landing screen to start sound engine
    document.body.addEventListener('click', () => {
        initAudio();
    }, { once: true });

});
