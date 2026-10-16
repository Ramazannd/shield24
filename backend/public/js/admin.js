function setMessage(element, type, text) {
    if (!element) return;

    element.className = `message ${type}`;
    element.textContent = text;
    element.style.display = 'block';
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatDate(value) {
    return new Date(value).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const statuses = {
        all: 'Все',
        new: 'Новая',
        in_progress: 'В работе',
        completed: 'Завершена',
        rejected: 'Отклонена'
    };

    return statuses[status] || status;
}

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('loginMessage');

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                window.location.href = '/admin-dashboard.html';
            } else {
                setMessage(messageDiv, 'error', data.error || 'Не удалось выполнить вход.');
            }
        } catch (error) {
            setMessage(messageDiv, 'error', 'Ошибка соединения с сервером. Попробуйте еще раз.');
        }
    });
}

if (document.getElementById('applicationsContainer')) {
    const token = localStorage.getItem('adminToken');
    const applicationsContainer = document.getElementById('applicationsContainer');
    const applicationsMeta = document.getElementById('applicationsMeta');
    const blacklistContainer = document.getElementById('blacklistContainer');
    const blacklistMeta = document.getElementById('blacklistMeta');
    const blacklistForm = document.getElementById('blacklistForm');
    const blacklistMessage = document.getElementById('blacklistMessage');
    let currentFilter = 'all';

    async function authorizedFetch(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin.html';
            throw new Error('Unauthorized');
        }

        return response;
    }

    async function loadApplications(status = 'all') {
        const url = status && status !== 'all'
            ? `/api/admin/applications?status=${status}`
            : '/api/admin/applications';

        applicationsMeta.textContent = 'Обновляем список...';

        try {
            const response = await authorizedFetch(url);
            const data = await response.json();

            updateSummary(data.applications || []);
            displayApplications(data.applications || []);

            applicationsMeta.textContent = status === 'all'
                ? `Всего заявок: ${data.total || 0}`
                : `Показан статус: ${getStatusText(status)} · ${data.total || 0}`;
        } catch (error) {
            if (error.message === 'Unauthorized') return;

            applicationsContainer.innerHTML = '<p class="empty-state">Не удалось загрузить заявки. Проверьте сервер и повторите попытку.</p>';
            applicationsMeta.textContent = 'Ошибка загрузки';
        }
    }

    function updateSummary(applications) {
        const counts = applications.reduce((accumulator, application) => {
            accumulator.total += 1;
            accumulator[application.status] = (accumulator[application.status] || 0) + 1;
            return accumulator;
        }, {
            total: 0,
            new: 0,
            in_progress: 0,
            completed: 0,
            rejected: 0
        });

        document.getElementById('statTotal').textContent = counts.total;
        document.getElementById('statNew').textContent = counts.new;
        document.getElementById('statInProgress').textContent = counts.in_progress;
        document.getElementById('statCompleted').textContent = counts.completed;
    }

    function displayApplications(applications) {
        if (!applications.length) {
            applicationsContainer.innerHTML = '<p class="empty-state">По выбранному фильтру заявок пока нет.</p>';
            return;
        }

        applicationsContainer.innerHTML = applications.map((application) => `
            <article class="application-card">
                <div class="application-top">
                    <div class="application-main">
                        <h3>${escapeHtml(application.name)}</h3>
                        <p class="application-service">${escapeHtml(application.service)}</p>
                    </div>
                    <span class="status-badge status-${application.status}">
                        ${getStatusText(application.status)}
                    </span>
                </div>

                <div class="application-grid">
                    <div class="application-field">
                        <span class="application-label">Компания</span>
                        <span class="application-value">${application.company ? escapeHtml(application.company) : 'Не указана'}</span>
                    </div>
                    <div class="application-field">
                        <span class="application-label">Телефон</span>
                        <span class="application-value">${escapeHtml(application.phone)}</span>
                    </div>
                    <div class="application-field">
                        <span class="application-label">Email</span>
                        <span class="application-value">${application.email ? escapeHtml(application.email) : 'Не указан'}</span>
                    </div>
                    <div class="application-field">
                        <span class="application-label">Получена</span>
                        <span class="application-value">${formatDate(application.created_at)}</span>
                    </div>
                    <div class="application-field wide">
                        <span class="application-label">Комментарий</span>
                        <span class="application-value application-message">${application.message ? escapeHtml(application.message) : 'Без комментария'}</span>
                    </div>
                </div>

                <div class="application-actions">
                    <button class="action-btn progress" onclick="updateStatus(${application.id}, 'in_progress')">В работу</button>
                    <button class="action-btn complete" onclick="updateStatus(${application.id}, 'completed')">Завершить</button>
                    <button class="action-btn reject" onclick="updateStatus(${application.id}, 'rejected')">Отклонить</button>
                    <button class="action-btn delete" onclick="deleteApplication(${application.id})">Удалить</button>
                </div>
            </article>
        `).join('');
    }

    async function loadBlacklist() {
        blacklistMeta.textContent = 'Обновляем список...';

        try {
            const response = await authorizedFetch('/api/admin/blacklist');
            const data = await response.json();
            renderBlacklist(data.companies || []);
            blacklistMeta.textContent = `Компаний в списке: ${(data.companies || []).length}`;
        } catch (error) {
            if (error.message === 'Unauthorized') return;

            blacklistContainer.innerHTML = '<p class="empty-state">Не удалось загрузить черный список.</p>';
            blacklistMeta.textContent = 'Ошибка загрузки';
        }
    }

    function renderBlacklist(companies) {
        if (!companies.length) {
            blacklistContainer.innerHTML = '<p class="empty-state">Черный список пока пуст.</p>';
            return;
        }

        blacklistContainer.innerHTML = companies.map((company) => `
            <article class="blacklist-card">
                <div class="blacklist-card-head">
                    <div>
                        <h4>${escapeHtml(company.company_name)}</h4>
                        <p class="blacklist-meta">Добавлена: ${formatDate(company.created_at)}</p>
                    </div>
                    <button class="action-btn delete" onclick="deleteBlacklistCompany(${company.id})">Убрать</button>
                </div>
                <p class="blacklist-reason">${company.reason ? escapeHtml(company.reason) : 'Причина не указана.'}</p>
            </article>
        `).join('');
    }

    window.updateStatus = async (id, status) => {
        try {
            const response = await authorizedFetch(`/api/admin/applications/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                loadApplications(currentFilter);
            } else {
                alert('Не удалось обновить статус заявки.');
            }
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                alert('Ошибка при обновлении статуса.');
            }
        }
    };

    window.deleteApplication = async (id) => {
        if (!confirm('Удалить заявку? Это действие нельзя отменить.')) return;

        try {
            const response = await authorizedFetch(`/api/admin/applications/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadApplications(currentFilter);
            } else {
                alert('Не удалось удалить заявку.');
            }
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                alert('Ошибка при удалении заявки.');
            }
        }
    };

    window.deleteBlacklistCompany = async (id) => {
        if (!confirm('Удалить компанию из черного списка?')) return;

        try {
            const response = await authorizedFetch(`/api/admin/blacklist/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadBlacklist();
            } else {
                alert('Не удалось удалить компанию из черного списка.');
            }
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                alert('Ошибка при удалении компании.');
            }
        }
    };

    document.querySelectorAll('.filter-btn').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.status;
            loadApplications(currentFilter);
        });
    });

    if (blacklistForm) {
        blacklistForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const companyName = document.getElementById('blacklistCompanyName').value;
            const reason = document.getElementById('blacklistReason').value;

            try {
                const response = await authorizedFetch('/api/admin/blacklist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ companyName, reason })
                });

                const data = await response.json();

                if (response.ok) {
                    blacklistForm.reset();
                    setMessage(blacklistMessage, 'success', data.message || 'Компания добавлена.');
                    loadBlacklist();
                } else {
                    setMessage(blacklistMessage, 'error', data.error || 'Не удалось сохранить компанию.');
                }
            } catch (error) {
                if (error.message !== 'Unauthorized') {
                    setMessage(blacklistMessage, 'error', 'Ошибка соединения с сервером.');
                }
            }
        });
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin.html';
    });

    loadApplications();
    loadBlacklist();
}
