const applicationForm = document.getElementById('applicationForm');
const messageDiv = document.getElementById('formMessage');

function initCountUp() {
    const counters = document.querySelectorAll('.count-up');

    if (!counters.length) return;

    const animateCounter = (element) => {
        const target = Number(element.dataset.target || 0);
        const duration = 1400;
        const startTime = performance.now();

        const step = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.floor(target * eased).toLocaleString('ru-RU');

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = target.toLocaleString('ru-RU');
            }
        };

        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            currentObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.45
    });

    counters.forEach((counter) => observer.observe(counter));
}

if (applicationForm && messageDiv) {
    applicationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            company: document.getElementById('company').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            service: document.getElementById('service').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.className = 'form-message success';
                messageDiv.style.display = 'block';
                messageDiv.textContent = data.message;
                applicationForm.reset();
            } else {
                messageDiv.className = 'form-message error';
                messageDiv.style.display = 'block';
                messageDiv.textContent = data.error || 'Не удалось отправить заявку. Попробуйте еще раз.';
            }
        } catch (error) {
            messageDiv.className = 'form-message error';
            messageDiv.style.display = 'block';
            messageDiv.textContent = 'Не удалось связаться с сервером. Проверьте подключение и повторите попытку.';
        }

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    });
}

initCountUp();
