class Auth {
    static getUser() {
        const userStr = localStorage.getItem('chainly_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static requireAuth() {
        const user = this.getUser();
        const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');

        if (!user && !isAuthPage) {
            window.location.href = 'login.html';
        } else if (user && isAuthPage) {
            window.location.href = 'app.html';
        }
    }

    static logout() {
        localStorage.removeItem('chainly_user');
        window.location.href = 'login.html';
    }
}

// Check auth immediately
Auth.requireAuth();

class ZapStorage {
    static async getZaps() {
        try {
            const response = await fetch('/api/zaps');
            if (!response.ok) throw new Error('Server offline');
            return await response.json();
        } catch (error) {
            console.warn('Server unreachable, using localStorage');
            const zaps = localStorage.getItem('zaps');
            return zaps ? JSON.parse(zaps) : [];
        }
    }

    static async saveZap(zap) {
        try {
            const response = await fetch('/api/zaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(zap)
            });
            if (!response.ok) throw new Error('Server offline');
            return await response.json();
        } catch (error) {
            console.warn('Server unreachable, saving to localStorage');
            const zaps = this.getZapsLocal();
            const existingIndex = zaps.findIndex(z => z.id === zap.id);

            if (existingIndex >= 0) {
                zaps[existingIndex] = zap;
            } else {
                zaps.push(zap);
            }

            localStorage.setItem('zaps', JSON.stringify(zaps));
            return zap;
        }
    }

    static getZapsLocal() {
        const zaps = localStorage.getItem('zaps');
        return zaps ? JSON.parse(zaps) : [];
    }
}

class MockExecutor {
    static async testStep(stepType, config) {
        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stepType, config })
            });
            if (!response.ok) throw new Error('Server offline');
            return await response.json();
        } catch (error) {
            console.warn('Server unreachable, using simulation');
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        message: stepType === 'trigger'
                            ? 'Simulation: Found 3 new emails!'
                            : 'Simulation: Successfully sent message to #general',
                        data: { timestamp: new Date().toISOString() }
                    });
                }, 1500);
            });
        }
    }
}

class Dashboard {
    constructor() {
        this.renderSidebar();
        this.loadZaps();
    }

    renderSidebar() {
        const sidebar = document.getElementById('sidebar-container');
        if (sidebar) {
            sidebar.innerHTML = `
                <aside class="sidebar">
                    <div style="margin-bottom: 32px; display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; background: var(--color-primary); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="zap" style="color: black;"></i>
                        </div>
                        <span style="font-weight: 700; font-size: 20px; letter-spacing: -0.5px;">Chainly</span>
                    </div>
                    <nav class="sidebar-nav">
                        <a href="app.html" class="nav-item active"><i data-lucide="layout-dashboard"></i> Dashboard</a>
                        <a href="#" class="nav-item"><i data-lucide="zap"></i> Zaps</a>
                        <a href="#" class="nav-item"><i data-lucide="history"></i> History</a>
                        <a href="#" class="nav-item"><i data-lucide="settings"></i> Settings</a>
                    </nav>
                    <div style="margin-top: auto;">
                        <button class="btn btn-primary" style="width: 100%;" onclick="window.location.href='editor.html'">
                            <i data-lucide="plus"></i> Create Zap
                        </button>
                    </div>
                </aside>
            `;
            lucide.createIcons();
        }

        // Update user info in header
        const user = Auth.getUser();
        if (user) {
            const avatar = document.getElementById('user-avatar');
            const name = document.getElementById('user-name');
            if (avatar) avatar.innerText = user.name.charAt(0).toUpperCase();
            if (name) name.innerText = user.name;
        }
    }

    async loadZaps() {
        const container = document.getElementById('page-content');
        if (!container) return;

        container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading Zaps...</div>';

        const zaps = await ZapStorage.getZaps();

        if (zaps.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i data-lucide="zap-off" style="width: 32px; height: 32px; color: var(--color-text-subtle);"></i>
                    </div>
                    <h3 style="margin-bottom: 8px;">No Zaps yet</h3>
                    <p style="margin-bottom: 24px;">Create your first automated workflow to get started.</p>
                    <a href="editor.html" class="btn btn-primary">Create Zap</a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
                    ${zaps.map(zap => `
                        <div class="card">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="zap" style="color: var(--color-primary);"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 600;">${zap.name}</div>
                                        <div style="font-size: 12px; color: var(--color-text-subtle);">${zap.steps ? zap.steps.length : 0} steps</div>
                                    </div>
                                </div>
                                <div class="switch" style="width: 36px; height: 20px; background: var(--color-success); border-radius: 10px; position: relative;">
                                    <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px;"></div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 16px;">
                                <button class="btn btn-ghost btn-sm" style="flex: 1;">Edit</button>
                                <button class="btn btn-ghost btn-sm" style="flex: 1;">History</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        lucide.createIcons();
    }
}

class ZapEditor {
    constructor() {
        this.steps = [
            { id: 'trigger', type: 'trigger', name: 'Gmail: New Email', config: {} },
            { id: 'action', type: 'action', name: 'Slack: Send Channel Message', config: {} }
        ];
        this.currentStepId = 'trigger';
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderSteps();
        this.renderConfig();
    }

    bindEvents() {
        document.getElementById('add-step-btn')?.addEventListener('click', () => this.addStep());
        document.querySelector('.publish-btn')?.addEventListener('click', () => this.publishZap());
    }

    renderSteps() {
        const container = document.getElementById('steps-container');
        if (!container) return;

        container.innerHTML = this.steps.map((step, index) => `
            <div class="step-connector"></div>
            <div class="step-card ${step.id === this.currentStepId ? 'active' : ''}" id="step-${step.id}" data-step-id="${step.id}">
                <div class="step-icon ${step.type}">
                    <i data-lucide="${step.type === 'trigger' ? 'zap' : 'play'}"></i>
                </div>
                <div class="step-content">
                    <div class="step-title">${index + 1}. ${step.type === 'trigger' ? 'Trigger' : 'Action'}</div>
                    <div class="step-desc">${step.name}</div>
                </div>
            </div>
        `).join('');

        // Re-bind click events for steps
        container.querySelectorAll('.step-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const stepId = e.currentTarget.dataset.stepId;
                this.selectStep(stepId);
            });
        });

        lucide.createIcons();
    }

    addStep() {
        const newStep = {
            id: `action-${Date.now()}`,
            type: 'action',
            name: 'Select App & Event',
            config: {}
        };
        this.steps.push(newStep);
        this.selectStep(newStep.id);
    }

    selectStep(stepId) {
        this.currentStepId = stepId;
        this.renderSteps(); // Re-render to update active state
        this.renderConfig();
    }

    renderConfig() {
        const container = document.getElementById('config-container');
        if (!container) return;

        const step = this.steps.find(s => s.id === this.currentStepId);
        if (!step) return;

        container.innerHTML = `
            <h2 style="margin-bottom: 24px;">Configure ${step.type === 'trigger' ? 'Trigger' : 'Action'}</h2>
            <div class="card">
                <div class="input-group">
                    <label class="label">App & Event</label>
                    <input type="text" class="input" value="${step.name}" onchange="window.editor.updateStepName(this.value)">
                </div>
                
                <div class="input-group">
                    <label class="label">Account</label>
                    <select class="input" style="width: 100%;">
                        <option>Select Account...</option>
                        <option selected>My Account (baron@example.com)</option>
                    </select>
                </div>

                <div style="margin-top: 24px;">
                    <button class="btn btn-secondary" onclick="window.editor.testStep('${step.type}')">
                        <i data-lucide="play"></i> Test ${step.type}
                    </button>
                </div>
                
                <div id="test-result" style="margin-top: 16px; display: none;"></div>
            </div>
        `;
        lucide.createIcons();
    }

    updateStepName(newName) {
        const step = this.steps.find(s => s.id === this.currentStepId);
        if (step) {
            step.name = newName;
            this.renderSteps();
        }
    }

    async testStep(stepType) {
        const resultDiv = document.getElementById('test-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div style="color: var(--color-text-subtle);">Testing...</div>';
        }

        const result = await MockExecutor.testStep(stepType, {});

        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: rgba(0, 255, 157, 0.1); border: 1px solid var(--color-success); padding: 12px; border-radius: 6px; color: var(--color-success);">
                    <div style="font-weight: 600; margin-bottom: 4px;">Test Successful</div>
                    <div style="font-size: 14px;">${result.message}</div>
                </div>
            `;
        }
    }

    async publishZap() {
        const zap = {
            id: Date.now().toString(),
            name: 'Untitled Zap',
            steps: this.steps,
            active: true
        };

        await ZapStorage.saveZap(zap);
        alert('Zap published successfully!');
        window.location.href = 'app.html';
    }


}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Page Specific Logic
    if (document.getElementById('config-container')) {
        window.editor = new ZapEditor();
    } else if (document.getElementById('page-content')) {
        new Dashboard();
    }
});
