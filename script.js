// ========== 原始开场动画（包豪斯风格） ==========
document.addEventListener('DOMContentLoaded', () => {
    const tl = anime.timeline({
        easing: 'easeOutExpo',
        complete: () => {
            anime({
                targets: '#intro-overlay',
                opacity: 0,
                duration: 800,
                easing: 'easeInOutQuad',
                complete: () => {
                    document.getElementById('intro-overlay').style.display = 'none';
                }
            });
        }
    });

    // 水平网格线从左侧飞入
    tl.add({
        targets: '.grid-line-h',
        opacity: 1,
        left: '0%',
        width: '100%',
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutCubic'
    }, '-=200');

    // 垂直网格线从上方飞入
    tl.add({
        targets: '.grid-line-v',
        opacity: 1,
        top: '0%',
        height: '100%',
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutCubic'
    }, '-=400');

    // 装饰线条
    tl.add({
        targets: '#bl1, #bl2',
        opacity: [0, 0.6],
        duration: 600,
        easing: 'easeInOutQuad'
    }, '-=300');

    // 中心圆形
    tl.add({
        targets: '#bc1',
        opacity: 1,
        scale: [0.5, 1],
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
    }, '-=400');

    // 中心方形
    tl.add({
        targets: '#bs1',
        opacity: 1,
        scale: [0.3, 1],
        rotate: [45, 45],
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
    }, '-=600');

    // 进度条加载动画
    tl.add({
        targets: '#progress-bar',
        width: '100%',
        duration: 1800,
        easing: 'easeInOutQuad'
    }, '-=1200');
});

// ========== 波浪效果组件 ==========
var PerlinNoise = function (seed) {
    if (seed === undefined) seed = Math.random();
    this.seed = seed;
    this.p = [];
    for (var i = 0; i < 256; i++) {
        this.p[i] = Math.floor(Math.random() * 256);
    }
    for (i = 0; i < 256; i++) {
        this.p[256 + i] = this.p[i];
    }
};

PerlinNoise.prototype.fade = function (t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
};

PerlinNoise.prototype.lerp = function (a, b, t) {
    return a + t * (b - a);
};

PerlinNoise.prototype.grad = function (hash, x, y, z) {
    var h = hash & 15;
    var u = h < 8 ? x : y,
        v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
};

PerlinNoise.prototype.perlin2 = function (x, y) {
    var X = Math.floor(x) & 255,
        Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    var u = this.fade(x),
        v = this.fade(y);
    var A = this.p[X] + Y,
        AA = this.p[A],
        AB = this.p[A + 1],
        B = this.p[X + 1] + Y,
        BA = this.p[B],
        BB = this.p[B + 1];

    return this.lerp(
        this.lerp(this.grad(this.p[AA], x, y, 0), this.grad(this.p[BA], x - 1, y, 0), u),
        this.lerp(this.grad(this.p[AB], x, y - 1, 0), this.grad(this.p[BB], x - 1, y - 1, 0), u),
        v
    );
};

class AWaves extends HTMLElement {
    connectedCallback() {
        this.svg = this.querySelector('svg')
        this.mouse = {
            x: 0, y: 0, lx: 0, ly: 0,
            sx: 0, sy: 0, v: 0, vs: 0, a: 0,
        }
        this.lines = []
        this.paths = []
        this.noise = new PerlinNoise(Math.random())

        this.bindEvents()
        this.setSize()
        this.setLines()

        requestAnimationFrame(this.tick.bind(this))
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.setSize()
            this.setLines()
        })
        window.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e.pageX, e.pageY)
        })
        this.addEventListener('touchmove', (e) => {
            e.preventDefault()
            this.updateMousePosition(e.touches[0].clientX, e.touches[0].clientY)
        })
    }

    setSize() {
        this.parentBounding = this.parentElement.getBoundingClientRect();
        this.bounding = this.parentBounding;
        this.svg.style.width = `${this.bounding.width}px`;
        this.svg.style.height = `${this.bounding.height}px`;
    }

    setLines() {
        const { width, height } = this.bounding

        this.lines = []
        this.paths.forEach((path) => path.remove())
        this.paths = []

        const xGap = 8
        const yGap = 2

        const oWidth = width + 200
        const oHeight = height + 50

        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)

        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        for (let i = 0; i <= totalLines; i++) {
            const points = []
            for (let j = 0; j <= totalPoints; j++) {
                const point = {
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                    wave: { x: 0, y: 0 }
                }
                points.push(point)
            }
            this.lines.push(points)

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            this.svg.appendChild(path)
            this.paths.push(path)
        }
    }

    updateMousePosition(x, y) {
        const { mouse } = this
        mouse.x = x - this.parentBounding.left;
        mouse.y = y - this.parentBounding.top + window.scrollY;
    }

    movePoints(time) {
        const { lines, mouse } = this

        lines.forEach((points) => {
            points.forEach((p) => {
                const move = this.noise.perlin2(
                    (p.x + time * 0.008) * 0.0015,
                    (p.y + time * 0.004) * 0.001
                ) * 42
                p.wave.x = Math.cos(move) * 10
                p.wave.y = Math.sin(move) * 10

                const dx = p.x - mouse.sx
                const dy = p.y - mouse.sy
                const d = Math.hypot(dx, dy)
                const l = Math.max(170, mouse.vs)

                if (d < l) {
                    const f = 1 - d / l
                    p.cursor.vx += Math.cos(mouse.a) * f * mouse.vs * 0.08
                    p.cursor.vy += Math.sin(mouse.a) * f * mouse.vs * 0.08
                }

                p.cursor.vx += (0 - p.cursor.x) * 0.003
                p.cursor.vy += (0 - p.cursor.y) * 0.003

                p.cursor.vx *= 0.95
                p.cursor.vy *= 0.95

                p.cursor.x += p.cursor.vx * 1.5
                p.cursor.y += p.cursor.vy * 1.5

                p.cursor.x = Math.min(80, Math.max(-80, p.cursor.x))
                p.cursor.y = Math.min(80, Math.max(-80, p.cursor.y))
            })
        })
    }

    moved(point, withCursorForce = true) {
        const coords = {
            x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
            y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
        }
        coords.x = Math.round(coords.x * 10) / 10
        coords.y = Math.round(coords.y * 10) / 10
        return coords
    }

    drawLines() {
        const { lines, moved, paths } = this
        lines.forEach((points, lIndex) => {
            let p1 = moved(points[0], false)
            let d = `M ${p1.x} ${p1.y}`
            points.forEach((p, pIndex) => {
                const isLast = pIndex === points.length - 1
                p = moved(p, !isLast)
                d += `L ${p.x} ${p.y}`
})
            paths[lIndex].setAttribute('d', d)
        })
    }

    tick(time) {
        const { mouse } = this

        mouse.sx += (mouse.x - mouse.sx) * 0.1
        mouse.sy += (mouse.y - mouse.sy) * 0.1

        const dx = mouse.x - mouse.lx
        const dy = mouse.y - mouse.ly
        const d = Math.hypot(dx, dy)

        mouse.v = d
        mouse.vs += (d - mouse.vs) * 0.1
        mouse.vs = Math.min(100, mouse.vs)

        mouse.lx = mouse.x
        mouse.ly = mouse.y

        mouse.a = Math.atan2(dy, dx)

        this.movePoints(time)
        this.drawLines()

        requestAnimationFrame(this.tick.bind(this))
    }
}

customElements.define('a-waves', AWaves);

// ========== 小球跟随效果 ==========
const container = document.getElementById('container');
const ball = document.getElementById('ball');
if (container && ball) {
    const ballRadius = ball.offsetWidth / 2;
    let currentX = ball.offsetLeft;
    let currentY = ball.offsetTop;
    let targetX = currentX;
    let targetY = currentY;
    const ease = 0.1;

    container.addEventListener('mousemove', (e) => {
        ball.style.opacity = 1;
        const rect = container.getBoundingClientRect();
        const mouseXInContainer = e.clientX - rect.left;
        const mouseYInContainer = e.clientY - rect.top;
        targetX = mouseXInContainer - ballRadius;
        targetY = mouseYInContainer - ballRadius;
    });

    container.addEventListener('mouseleave', () => {
        ball.style.opacity = 0;
    });

    function animateBall() {
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;
        ball.style.left = `${currentX}px`;
        ball.style.top = `${currentY}px`;
        requestAnimationFrame(animateBall);
    }
    animateBall();
}

// ========== 返回顶部按钮 ==========
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const backToTopButton = document.createElement('button');
backToTopButton.innerHTML = '<i class="fa fa-chevron-up"></i>';
backToTopButton.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 50%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0;
    pointer-events: none;
    z-index: 100;
`;
backToTopButton.onclick = scrollToTop;
document.body.appendChild(backToTopButton);

window.addEventListener('scroll', () => {
    const backToTop = document.querySelector('button[style*="fixed"]');
    if (window.scrollY > 300) {
        backToTop.style.opacity = '1';
        backToTop.style.pointerEvents = 'auto';
    } else {
        backToTop.style.opacity = '0';
        backToTop.style.pointerEvents = 'none';
    }
});

// ========== 平滑滚动到锚点 ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ========== 二维码弹窗功能 ==========
const qrBtn = document.querySelector('.qrcode_placeholder');
const qrContainer = document.getElementById('qrContainer');
const qrClose = document.querySelector('.qr-close');

if (qrBtn && qrContainer && qrClose) {
    qrBtn.addEventListener('click', function () {
        qrContainer.style.display = 'flex';
        setTimeout(() => {
            qrContainer.classList.add('active');
        }, 100);
    });

    qrClose.addEventListener('click', function () {
        qrContainer.classList.remove('active');
        setTimeout(() => {
            qrContainer.style.display = 'none';
        }, 500);
    });

    qrContainer.addEventListener('click', function (e) {
        if (e.target === qrContainer) {
            qrContainer.classList.remove('active');
            setTimeout(() => {
                qrContainer.style.display = 'none';
            }, 500);
        }
    });
}

// ========== 作品详情页面功能 ==========
document.addEventListener('DOMContentLoaded', () => {
    const workItems = document.querySelectorAll('.work_item');
    const detailOverlay = document.getElementById('work-detail-overlay');
    const rectContainer = document.getElementById('rectangles-container');
    const loadingContainer = document.getElementById('work-loading-container');
    const progressBar = document.getElementById('work-progress-bar');
    const workSection = document.getElementById('work');

    // 生成矩形网格
    function generateRectangles() {
        if (!rectContainer) return;
        rectContainer.innerHTML = '';
        const cols = window.innerWidth >= 768 ? 12 : 8;
        const rows = window.innerWidth >= 768 ? 8 : 6;
        const rectWidth = 100 / cols;
        const rectHeight = 100 / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const rect = document.createElement('div');
                rect.classList.add('work-rect');
                rect.style.left = `${col * rectWidth}vw`;
                rect.style.top = `${row * rectHeight}vh`;
                rect.style.width = `${rectWidth}vw`;
                rect.style.height = `${rectHeight}vh`;
                rect.style.transform = 'translateX(100vw)';
                rectContainer.appendChild(rect);
            }
        }
        rectContainer.style.display = 'block';
    }

    // 重置动画状态
    function resetAnimationState() {
        if (progressBar) progressBar.style.width = '0';
        if (loadingContainer) {
            loadingContainer.style.opacity = '0';
            loadingContainer.style.display = '';
        }
        document.querySelectorAll('.detail-content').forEach(content => {
            content.style.display = 'none';
        });
        generateRectangles();
    }

    // 点击作品触发动画
    workItems.forEach(item => {
        item.addEventListener('click', () => {
            const workId = item.getAttribute('data-work-id');
            
            resetAnimationState();
            const rectangles = document.querySelectorAll('.work-rect');
            if (detailOverlay) {
                detailOverlay.style.display = 'flex';
            }

            const tl = anime.timeline({
                duration: 3000,
                begin: () => {
                    document.querySelectorAll('.detail-content').forEach(content => {
                        content.style.display = 'none';
                    });
                },
                complete: () => {
                    const targetContent = document.querySelector(`.detail-content[data-work="${workId}"]`);
                    if (targetContent) {
                        targetContent.style.display = 'block';
                        
                        // 为详情页内容添加逐元素渐入动画
                        const animateElements = targetContent.querySelectorAll('h1, h2, h3, p, .brand_tag, .brand_overview_item, .tech_item, .dashboard_metric_card, .dashboard_chart_card, .art_feature, .todo_feature_item');
                        
                        anime({
                            targets: targetContent,
                            opacity: [0, 1],
                            translateY: [20, 0],
                            duration: 500,
                            easing: 'easeOutCubic'
                        });
                        
                        // 逐元素动画
                        anime({
                            targets: animateElements,
                            opacity: [0, 1],
                            translateY: [30, 0],
                            duration: 800,
                            delay: anime.stagger(100),
                            easing: 'easeOutCubic'
                        });
                        
                        // 为数据看板添加特殊动画
                        if (workId === '2') {
                            const metricValues = targetContent.querySelectorAll('.metric_value');
                            metricValues.forEach((value, index) => {
                                const finalValue = value.textContent;
                                value.textContent = '0';
                                
                                setTimeout(() => {
                                    let currentValue = 0;
                                    const targetValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
                                    const duration = 2000;
                                    const increment = targetValue / (duration / 16);
                                    
                                    const updateValue = () => {
                                        currentValue += increment;
                                        if (currentValue >= targetValue) {
                                            value.textContent = finalValue;
                                            return;
                                        }
                                        
                                        if (finalValue.includes('$')) {
                                            value.textContent = `$${Math.floor(currentValue).toLocaleString()}`;
                                        } else {
                                            value.textContent = `${Math.floor(currentValue).toLocaleString()}`;
                                        }
                                        
                                        requestAnimationFrame(updateValue);
                                    };
                                    
                                    updateValue();
                                }, 500 + index * 200);
                            });
                            
                            // 图表动画
                            const chartBars = targetContent.querySelectorAll('.chart_bar');
                            chartBars.forEach((bar, index) => {
                                const height = bar.style.height;
                                bar.style.height = '0';
                                
                                setTimeout(() => {
                                    bar.style.height = height;
                                }, 1000 + index * 100);
                            });
                        }
                        
                        // 为艺术生成器添加特殊动画
                        if (workId === '3') {
                            setTimeout(generateArt, 1000);
                        }
                    }
                }
            });

            // 矩形右侧滑入
            tl.add({
                targets: rectangles,
                translateX: 0,
                delay: anime.stagger(8),
                duration: 1000,
                easing: 'easeOutCubic'
            }, 0);

            // 矩形停留
            tl.add({
                targets: rectangles,
                translateX: 0,
                duration: 500
            }, 1000);

            // 矩形右侧滑出
            tl.add({
                targets: rectangles,
                translateX: '100vw',
                duration: 600,
                easing: 'easeInCubic',
                delay: anime.stagger(5)
            }, 1500);

            // 显示loading+进度条
            if (loadingContainer) {
                tl.add({
                    targets: loadingContainer,
                    opacity: 1,
                    duration: 300
                }, 2000);
            }

            if (progressBar) {
                tl.add({
                    targets: progressBar,
                    width: '100%',
                    duration: 500,
                    easing: 'easeInOutQuad'
                }, 2200);
            }

            // loading渐隐，详情内容显示
            if (loadingContainer) {
                tl.add({
                    targets: loadingContainer,
                    opacity: 0,
                    duration: 300,
                    complete: () => {
                        loadingContainer.style.display = 'none';
                    }
                }, 2700);
            }
        });
    });

    // 关闭作品详情
    window.closeWorkDetail = function() {
        const detailOverlay = document.getElementById('work-detail-overlay');
        const currentContent = document.querySelector('.detail-content[style*="display: block"]');
        
        if (currentContent) {
            anime({
                targets: currentContent,
                opacity: 0,
                translateY: 20,
                duration: 300,
                easing: 'easeInCubic',
                complete: () => {
                    currentContent.style.display = 'none';
                    
                    if (detailOverlay) {
                        detailOverlay.style.display = 'none';
                    }
                    resetAnimationState();
                    
                    if (workSection) {
                        workSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        } else {
            if (detailOverlay) {
                detailOverlay.style.display = 'none';
            }
            resetAnimationState();
            
            if (workSection) {
                workSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    // 点击遮罩层关闭
    if (detailOverlay) {
        detailOverlay.addEventListener('click', (e) => {
            if (e.target === detailOverlay) {
                closeWorkDetail();
            }
        });
    }

    // 初始化
    generateRectangles();
    window.addEventListener('resize', generateRectangles);
});

// ========== 表单提交功能 ==========
document.addEventListener('DOMContentLoaded', function () {
    const formButton = document.querySelector('.form_button');
    const formInputs = document.querySelectorAll('.form_input, .form_textarea');
    
    // 为输入框添加焦点动画
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'translateY(-2px) scale(1.01)';
            this.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.2)';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        });
        
        // 添加输入时的实时动画效果
        input.addEventListener('input', function() {
            const valueLength = this.value.length;
            const maxLength = this.getAttribute('maxlength') || 500;
            const progress = Math.min(valueLength / maxLength, 1);
            
            // 为输入框添加背景渐变效果
            this.style.background = `linear-gradient(90deg, rgba(102, 126, 234, ${progress * 0.1}) 0%, rgba(102, 126, 234, 0) ${progress * 100}%)`;
        });
    });
    
    if (formButton) {
        formButton.addEventListener('click', function (e) {
            e.preventDefault();
            const nameInput = document.querySelector('.form_input[type="text"]');
            const emailInput = document.querySelector('.form_input[type="email"]');
            const messageInput = document.querySelector('.form_textarea');

            if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
                // 添加错误动画
                formInputs.forEach(input => {
                    if (!input.value.trim()) {
                        input.style.borderColor = '#ef4444';
                        input.style.animation = 'shake 0.5s ease-in-out';
                        setTimeout(() => {
                            input.style.animation = '';
                            input.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                        }, 500);
                    }
                });
                return;
            }

            const originalText = formButton.textContent;
            formButton.textContent = 'Sending...';
            formButton.classList.add('sent');
            
            // 添加发送动画
            formButton.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                formButton.textContent = 'Sent!';
                formButton.style.transform = 'scale(1)';
                
                // 成功动画：清空输入框并添加成功效果
                formInputs.forEach(input => {
                    input.value = '';
                    input.style.background = 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 100%)';
                    input.style.borderColor = '#10b981';
                    setTimeout(() => {
                        input.style.background = '';
                        input.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                    }, 1000);
                });
                
                setTimeout(() => {
                    formButton.textContent = originalText;
                    formButton.classList.remove('sent');
                }, 2000);
            }, 1500);
        });
    }
});



// ========== 艺术生成器功能 ==========
document.addEventListener('DOMContentLoaded', () => {
    const artGenerateBtn = document.querySelector('.art_generate_btn');
    if (artGenerateBtn) {
        artGenerateBtn.addEventListener('click', generateArt);
    }
    
    setTimeout(generateArt, 500);
});

// ========== Loading Text 滚动动画 ==========
document.addEventListener('DOMContentLoaded', () => {
    const loadingItems = document.querySelectorAll('.loading_text_item');
    if (!loadingItems.length) return;
    
    let currentIndex = 0;
    const displayDuration = 3000;
    const transitionDuration = 600;
    
    function animateNextItem() {
        const prevItem = loadingItems[currentIndex];
        
        anime({
            targets: prevItem,
            opacity: 0,
            translateY: -20,
            duration: transitionDuration,
            easing: 'easeOutCubic',
            complete: () => {
                prevItem.classList.remove('active');
                currentIndex = (currentIndex + 1) % loadingItems.length;
                const nextItem = loadingItems[currentIndex];
                
                nextItem.classList.add('active');
                anime({
                    targets: nextItem,
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: transitionDuration,
                    easing: 'easeOutCubic',
                    complete: () => {
                        setTimeout(animateNextItem, displayDuration);
                    }
                });
            }
        });
    }
    
    if (loadingItems[currentIndex]) {
        loadingItems[currentIndex].classList.add('active');
        anime({
            targets: loadingItems[currentIndex],
            opacity: [0, 1],
            translateY: [20, 0],
            duration: transitionDuration,
            easing: 'easeOutCubic',
            complete: () => {
                setTimeout(animateNextItem, displayDuration);
            }
        });
    }
});

function generateArt() {
    const artGroup = document.querySelector('.art_curves');
    if (!artGroup) return;
    
    artGroup.innerHTML = '';
    const numCurves = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numCurves; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let d = 'M 50 200';
        
        const controlPoints = [];
        for (let j = 0; j < 4; j++) {
            controlPoints.push({
                x: 80 + Math.random() * 280,
                y: 50 + Math.random() * 300
            });
        }
        
        d += ` C ${controlPoints[0].x} ${controlPoints[0].y}, ${controlPoints[1].x} ${controlPoints[1].y}, ${controlPoints[2].x} ${controlPoints[2].y}`;
        d += ` S ${controlPoints[3].x} ${controlPoints[3].y}, 350 200`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', `rgba(0, 0, 0, ${0.2 + Math.random() * 0.4})`);
        path.setAttribute('stroke-width', 0.5 + Math.random() * 1.5);
        path.setAttribute('fill', 'none');
        
        path.style.opacity = '0';
        anime({
            targets: path,
            opacity: [0, 0.6],
            duration: 800,
            delay: i * 50,
            easing: 'easeOutCubic'
        });
        
        artGroup.appendChild(path);
    }
}

// ========== 技能条动画 ==========
function animateSkillBars() {
    const skillItems = document.querySelectorAll('.skill_item');
    skillItems.forEach((item, index) => {
        const bar = item.querySelector('.skill_progress');
        const skillName = item.querySelector('.skill_name');
        
        // 获取技能条宽度百分比
        const widthStr = bar.style.width;
        const width = parseInt(widthStr);
        
        // 重置技能条宽度
        bar.style.width = '0';
        
        // 创建数字计数元素
        const countElement = document.createElement('span');
        countElement.classList.add('skill_count');
        countElement.textContent = '0%';
        countElement.style.position = 'absolute';
        countElement.style.right = '10px';
        countElement.style.top = '50%';
        countElement.style.transform = 'translateY(-50%)';
        countElement.style.fontSize = '0.85rem';
        countElement.style.fontWeight = '600';
        countElement.style.color = '#667eea';
        item.style.position = 'relative';
        item.appendChild(countElement);
        
        // 动画延迟，使技能条逐个显示
        setTimeout(() => {
            // 技能条宽度动画
            let currentWidth = 0;
            const interval = setInterval(() => {
                currentWidth += 1;
                bar.style.width = `${currentWidth}%`;
                countElement.textContent = `${currentWidth}%`;
                
                // 颜色变化动画
                const hue = 220 + (currentWidth / 100) * 60; // 从蓝色到紫色的渐变
                bar.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 70%, 50%))`;
                
                if (currentWidth >= width) {
                    clearInterval(interval);
                    countElement.textContent = `${width}%`;
                    
                    // 添加完成后的闪烁效果
                    countElement.style.animation = 'pulse 1s ease-in-out';
                    setTimeout(() => {
                        countElement.style.animation = '';
                    }, 1000);
                }
            }, 20);
        }, index * 300);
    });
}

// ========== 元素进入动画 ==========
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 根据元素类型应用不同的动画效果
                if (entry.target.classList.contains('work_item')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) rotateY(0)';
                } else if (entry.target.classList.contains('skill_item')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                } else if (entry.target.classList.contains('section_title')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                } else if (entry.target.classList.contains('hero_subtitle') || entry.target.classList.contains('hero_description') || entry.target.classList.contains('hero_contact')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                } else if (entry.target.classList.contains('work_title')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                } else if (entry.target.classList.contains('contact_form') || entry.target.classList.contains('contact_info')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                } else {
                    // 默认动画
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            }
        });
    }, observerOptions);

    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.about-me, .work_item, .skill_item, .contact_section, .section_title, .hero_subtitle, .hero_description, .hero_contact, .work_title, .contact_form, .contact_info');
    
    animateElements.forEach(el => {
        if (el.classList.contains('work_item')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px) rotateY(15deg)';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        } else if (el.classList.contains('skill_item')) {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        } else if (el.classList.contains('section_title')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-30px) scale(0.9)';
            el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        } else if (el.classList.contains('contact_form')) {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-30px)';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        } else if (el.classList.contains('contact_info')) {
            el.style.opacity = '0';
            el.style.transform = 'translateX(30px)';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        } else {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }
        observer.observe(el);
    });
    
    // 添加滚动时的视差效果
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // 为hero区域添加视差效果
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.backgroundPositionY = `${scrollY * 0.5}px`;
        }
        
        // 为wave容器添加视差效果
        const waveContainer = document.querySelector('.wave');
        if (waveContainer) {
            waveContainer.style.transform = `translateY(${scrollY * 0.1}px)`;
        }
        
        // 为导航栏添加滚动效果
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (scrollY > 50) {
                navbar.style.background = 'rgba(17, 17, 17, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
                navbar.style.padding = '10px 20px';
            } else {
                navbar.style.background = 'transparent';
                navbar.style.backdropFilter = 'none';
                navbar.style.boxShadow = 'none';
                navbar.style.padding = '20px';
            }
        }
    });
}



// ========== 增强波浪效果 ==========
function enhanceWaveEffect() {
    const waveContainer = document.querySelector('.wave_svg');
    if (waveContainer) {
        waveContainer.addEventListener('mousemove', (e) => {
            const rect = waveContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const distanceX = (x - centerX) / centerX;
            const distanceY = (y - centerY) / centerY;
            
            // 添加轻微的视差效果
            waveContainer.style.transform = `perspective(1000px) rotateX(${distanceY * -2}deg) rotateY(${distanceX * 2}deg)`;
        });
        
        waveContainer.addEventListener('mouseleave', () => {
            waveContainer.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    }
}

// ========== 作品卡片悬停效果增强 ==========
function enhanceWorkItemEffects() {
    const workItems = document.querySelectorAll('.work_item');
    workItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            // 添加更多的动画效果
            const info = item.querySelector('.work_info');
            info.style.transform = 'translateY(-5px)';
            info.style.transition = 'transform 0.3s ease';
        });
        
        item.addEventListener('mouseleave', () => {
            const info = item.querySelector('.work_info');
            info.style.transform = 'translateY(0)';
        });
    });
}

// ========== Hero标题动画 ==========
function animateHeroTitle() {
    const heroWords = document.querySelectorAll('.hero-word');
    heroWords.forEach((word, index) => {
        // 拆分单词为单个字符
        const text = word.textContent;
        word.textContent = '';
        for (let i = 0; i < text.length; i++) {
            const char = document.createElement('span');
            char.textContent = text[i];
            char.style.display = 'inline-block';
            char.style.opacity = '0';
            char.style.transform = 'translateY(20px)';
            char.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            char.style.transitionDelay = `${index * 0.3 + i * 0.1}s`;
            word.appendChild(char);
        }
        
        // 触发动画
        setTimeout(() => {
            const chars = word.querySelectorAll('span');
            chars.forEach(char => {
                char.style.opacity = '1';
                char.style.transform = 'translateY(0)';
            });
        }, 1000);
    });
    
    // 为分隔符添加动画
    const separator = document.querySelector('.separator');
    if (separator) {
        separator.style.opacity = '0';
        separator.style.transform = 'scale(0)';
        separator.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        setTimeout(() => {
            separator.style.opacity = '1';
            separator.style.transform = 'scale(1)';
        }, 1800);
    }
    
    // 添加颜色渐变动画
    const heroTitle = document.querySelector('.hero_title h1');
    if (heroTitle) {
        let hue = 0;
        setInterval(() => {
            hue = (hue + 1) % 360;
            heroTitle.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 60) % 360}, 70%, 50%))`;
            heroTitle.style.webkitBackgroundClip = 'text';
            heroTitle.style.webkitTextFillColor = 'transparent';
            heroTitle.style.backgroundClip = 'text';
        }, 200);
    }
}

// ========== 二进制文本动画 ==========
function animateBinaryText() {
    const binaryChars = document.querySelectorAll('.binary-char');
    
    // 字符闪烁效果
    binaryChars.forEach((char, index) => {
        setInterval(() => {
            if (Math.random() > 0.95) {
                char.style.opacity = '0.3';
                setTimeout(() => {
                    char.style.opacity = '1';
                }, 200);
            }
        }, 500 + index * 50);
    });
    
    // 字符颜色变化效果
    let hue = 0;
    setInterval(() => {
        hue = (hue + 1) % 360;
        binaryChars.forEach((char, index) => {
            if (Math.random() > 0.7) {
                char.style.color = `hsl(${hue}, 70%, 50%)`;
                setTimeout(() => {
                    char.style.color = 'rgba(102, 126, 234, 0.6)';
                }, 300);
            }
        });
    }, 1000);
}

// ========== 导航栏滚动效果 ==========
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 80) {
            navbar.style.padding = '0.5rem calc(2vw + 1rem)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.padding = '1rem calc(2vw + 1rem)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
        }
        lastScrollY = currentScrollY;
    }, { passive: true });
}

// ========== 窗口加载完成 ==========
window.addEventListener('load', () => {
    window.dispatchEvent(new Event('scroll'));
    animateSkillBars();
    initScrollAnimations();
    initNavbarScroll();
    enhanceWaveEffect();
    enhanceWorkItemEffects();
    animateHeroTitle();
    animateBinaryText();
    initContactForm();
});

// ========== 联系表单处理 ==========
function initContactForm() {
    const form = document.getElementById('contactForm');
    const statusElement = document.getElementById('formStatus');
    
    if (!form || !statusElement) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 获取表单数据
        const formData = new FormData(form);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const message = formData.get('message').trim();
        
        // 验证输入
        if (!validateEmail(email)) {
            showStatus('请输入有效的邮箱地址', 'error');
            return;
        }
        
        if (!name || !message) {
            showStatus('请填写完整的信息', 'error');
            return;
        }
        
        // 构建邮件内容
        const subject = encodeURIComponent(`【合作咨询】来自 ${name}`);
        const body = encodeURIComponent(`
姓名：${name}
邮箱：${email}

需求描述：
${message}

---
此邮件来自个人作品集网站
        `.trim());
        
        // 构建 mailto 链接
        const mailtoLink = `mailto:etta120913@gmail.com?subject=${subject}&body=${body}`;
        
        // 创建临时链接并点击
        const link = document.createElement('a');
        link.href = mailtoLink;
        link.target = '_blank';
        
        // 显示发送中状态
        showStatus('正在打开邮件客户端...', 'loading');
        
        // 尝试打开邮件客户端
        setTimeout(() => {
            try {
                link.click();
                
                // 延迟检查是否成功
                setTimeout(() => {
                    showStatus('邮件客户端已打开，请发送邮件', 'success');
                    form.reset();
                }, 1500);
            } catch (error) {
                showStatus('邮件发送失败，请手动发送邮件至 etta120913@gmail.com', 'error');
                console.error('邮件发送失败:', error);
            }
        }, 500);
    });
    
    // 邮箱验证函数
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 显示状态信息
    function showStatus(message, type) {
        statusElement.textContent = message;
        statusElement.className = `form_status form_status--${type}`;
        
        // 3秒后自动隐藏错误和成功状态
        if (type !== 'loading') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'form_status';
            }, 3000);
        }
    }
}